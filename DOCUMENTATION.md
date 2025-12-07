# Simple Turnbase Game Kampar Clash — Dokumentasi Lengkap

Game turn-based RPG Kampar Clash berbasis web yang menampilkan pertempuran taktis antara empat hero melawan naga kampar. Sistem menggunakan mekanik giliran berbasis kecepatan, manajemen MP/HP, sistem limit break, dan berbagai status efek.

## Daftar Isi

- [Ringkasan](#ringkasan)
- [Struktur Folder](#struktur-folder)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Berkas Utama](#berkas-utama)
  - [index.html](#indexhtml)
  - [game_config.js](#game_configjs)
  - [game.js](#gamejs)
  - [styles.css](#stylescss)
- [Mekanik Game](#mekanik-game)
  - [Sistem Turn Order](#sistem-turn-order)
  - [Sistem Combat](#sistem-combat)
  - [Sistem Status Effect](#sistem-status-effect)
  - [Sistem Limit Break](#sistem-limit-break)
  - [AI Boss](#ai-boss)
- [CSS Classes & Styling](#css-classes--styling)
- [Alur Gameplay](#alur-gameplay)
- [Data Structure](#data-structure)
- [Tips Pengembangan](#tips-pengembangan)

---

## Ringkasan

- **4 Hero dengan peran berbeda:** aruna (Physical DPS), meer (Magic DPS), khade (Support), zabx (Defender)
- **Boss Dragon dinamis:** 3 fase pertempuran dengan AI yang menyesuaikan strategi
- **Sistem Kesulitan:** Easy, Normal, Hard (mengubah HP dan damage)
- **Efek Status:** Buff/debuff seperti ATK↑, DEF↓, Guard, Burning (DOT), Silence, dll
- **Limit Break:** Setiap hero memiliki ultimate skill yang diisi melalui combat
- **Story Mode:** Cutscene singkat dengan animasi typing sebelum battle
- **Pelacakan Rekor Terbaik:** Menyimpan rekor tercepat per tingkat kesulitan di localStorage

---

## Struktur Folder

```text
simple-turnbase-game/
├── index.html          # Template HTML utama
├── game_config.js      # Konfigurasi data (hero, boss, skills, messages)
├── game.js             # Logika game & state management
├── styles.css          # Styling komprehensif
├── gif/                # Sprite animasi karakter
│   ├── soldier.gif
│   ├── mage.gif
│   ├── healer.gif
│   ├── tank.gif
│   └── dragon.gif
└── fonts/              # Font Monocraft
    ├── Monocraft.otf
    └── Monocraft.ttf
```

---

## Arsitektur Sistem

### Pola Desain

- **Single Class Architecture:** Semua logika terpusat dalam class `Game`
- **Berbasis Konfigurasi:** Data terpisah di `GAME_CONFIG` untuk kemudahan penyeimbangan
- **Manipulasi DOM:** Vanilla JavaScript tanpa framework
- **Event-Driven:** UI updates berdasarkan state changes

### State Management

Game menggunakan property `this.state` dengan nilai:

- `"start"` - Menu utama
- `"story"` - Cutscene mode
- `"playing"` - Combat aktif
- `"victory"` - Menang
- `"defeat"` - Kalah

---

## Berkas Utama

### index.html

**Path:** `index.html`  
**Ukuran:** ~4KB  
**Fungsi:** Shell HTML yang menyediakan struktur DOM untuk semua layar game.

#### Struktur Layar

**1. Start Screen** (`#startScreen`)

```html
<div class="start-panel">
  <h1>Simple Turnbase Game</h1>
  <div id="difficultyOptions">...</div>
  <div id="bestRunDisplay">...</div>
  <button id="startButton">Start</button>
</div>
```

- Difficulty selector (3 tombol: Easy/Normal/Hard)
- Tampilkan rekor terbaik (muncul jika ada record)
- Tombol Start untuk mulai game

**2. Story Screen** (`#storyScreen`)

```html
<div class="story-panel">
  <img id="storyPortrait" />
  <div id="storyName">...</div>
  <div id="storyText">...</div>
  <button id="storyPause">Pause</button>
  <button id="storySkip">Skip</button>
</div>
```

- Portrait karakter yang sedang bicara
- Dialog dengan animasi typing
- Kontrol pause/resume/skip

**3. Battle Screen** (`#battleScreen`)

```html
<div class="battle-layer">
  <!-- Turn Order Track -->
  <div class="turn-nodes" id="turnNodes"></div>

  <!-- Boss Card -->
  <div class="boss-card" id="bossCard">
    <div id="bossHpBar"></div>
    <div id="bossMpBar"></div>
    <div id="bossStatus"></div>
  </div>

  <!-- Battle Log -->
  <div class="log-body" id="logBody"></div>

  <!-- Hero Cards -->
  <div class="hero-row" id="heroRow"></div>

  <!-- Skill Bar -->
  <div class="skill-buttons" id="skillButtons"></div>
  <div class="skill-info" id="skillInfo"></div>
</div>
```

**4. Target Selection Layer** (`#targetLayer`)

- Modal overlay untuk memilih target skill
- Muncul untuk skill single-target yang memerlukan pilihan manual

**5. Game Over Screen** (`#gameOver`)

- Tampilan Victory/Defeat
- Summary statistik run (turns, damage, healing)
- Tombol restart

---

### game_config.js

**Path:** `game_config.js`  
**Ukuran:** ~8KB  
**Fungsi:** Database statis untuk semua data game.

#### Ringkasan Struktur

```javascript
window.GAME_CONFIG = {
  constants: {...},      // Konstanta gameplay
  difficulties: {...},   // Preset difficulty
  storyScenes: [...],    // Dialog cutscene
  characters: {...},     // Data hero & dragon
  boss: {...},           // Data boss & skills
  messages: {...}        // Template pesan log
}
```

#### 1. Constants

```javascript
constants: {
  TYPE_SPEED_MS: 35,           // Kecepatan typing dialog (ms/karakter)
  STORY_ADVANCE_DELAY: 1800,   // Delay auto-advance scene (ms)
  HERO_REGEN: 3,               // MP regen per turn untuk hero
  BOSS_REGEN: 4,               // MP regen per turn untuk boss
  SINGLE_HEAL_RATIO: 0.38,     // Heal 38% max HP (default)
  GROUP_HEAL_RATIO: 0.24,      // Heal 24% max HP untuk AoE
  LIMIT_GAIN_TAKEN: 10,        // Limit gain saat terkena damage
  LIMIT_GAIN_DEALT: 5          // Limit gain saat memberikan damage
}
```

**Penggunaan:**

- `TYPE_SPEED_MS`: Mengontrol kecepatan narasi terasa. Nilai lebih kecil = lebih cepat.
- Heal ratios: Balance antara single-target vs group healing.
- Limit gains: Menentukan seberapa cepat ultimate skill tersedia.

#### 2. Difficulties

```javascript
difficulties: {
  easy: {
    bossHp: 0.8,    // Boss HP 80% dari base
    bossAtk: 0.9,   // Boss damage 90%
    heroHp: 1.2     // Hero HP 120%
  },
  normal: { bossHp: 1.0, bossAtk: 1.0, heroHp: 1.0 },
  hard: {
    bossHp: 1.3,    // Boss HP 130%
    bossAtk: 1.15,  // Boss damage 115%
    heroHp: 0.95    // Hero HP 95%
  }
}
```

**Contoh Perhitungan:**

```javascript
// Normal mode
const baseBossHp = 2200;
const actualHp = Math.round(baseBossHp * 1.0); // 2200

// Hard mode
const hardHp = Math.round(baseBossHp * 1.3); // 2860
```

#### 3. Story Scenes

Array berisi 6 adegan untuk cutscene pembuka:

```javascript
storyScenes: [
  {
    speakerId: null, // null = Narrator
    text: "Pada puncak Kampar, naga kuno bangun dari tidurnya...",
  },
  {
    speakerId: "aruna",
    text: "Kami tidak punya pilihan. Jika naga ini lolos, koto kampar di bawah ini akan runtuh.",
  },
  {
    speakerId: "meer",
    text: "Aku bisa membengkokkan api naga ini, tapi aku butuh waktu. Lindungi aku.",
  },
  {
    speakerId: "khade",
    text: "Jangan mati tanpa alasan. Selama aku berdiri, kamu akan tetap bernafas.",
  },
  {
    speakerId: "zabx",
    text: "Biarkan dia fokus padaku. Kamu selesaikan dia dari jarak aman.",
  },
  {
    speakerId: "naga kampar",
    text: "Kau berani menantang pemelihara langit...",
  },
];
```

**Resolusi Speaker:**

- Jika `speakerId` null → tampil sebagai "Narrator", tanpa portrait
- Jika ada → map speakerId ke character key, lalu ambil nama & gif dari `CONFIG.characters[charKey]`
- Mapping: "aruna" → "soldier", "meer" → "mage", "khade" → "healer", "zabx" → "tank", "naga kampar" → "dragon"

#### 4. Characters

**Soldier (Aruna) - Physical DPS**

```javascript
soldier: {
  id: "soldier",
  name: "Aruna",
  role: "Physical DPS",
  maxHp: 150,
  maxMp: 60,
  atk: 34,   // Physical attack stat
  def: 14,   // Defense
  mag: 6,    // Magic power (rendah)
  spd: 12,   // Speed (urutan turn)
  skills: [
    {
      id: "basicSlash",
      name: "Basic Attack",
      cost: 0,              // Gratis, always available
      target: "enemy",      // Auto-target boss
      type: "physical",
      power: 0.9,           // Multiplier damage
      description: "..."
    },
    {
      id: "armorBreak",
      name: "Armor Break",
      cost: 16,
      cooldown: 3,
      target: "enemy",
      type: "physical",
      power: 1.1,
      debuff: {
        defDown: 0.2,      // Kurangi DEF 20%
        duration: 2        // Bertahan 2 turn
      },
      description: "Serangan yang mengurangi pertahanan..."
    },
    {
      id: "skyCleave",
      name: "Sky Cleave",
      cost: 0,
      target: "enemy",
      type: "physical",
      power: 2.2,
      requiresLimit: 100,   // Butuh limit gauge penuh
      cooldown: 0,          // No cooldown (direset via limit)
      description: "Limit: lompatan heroik..."
    }
    // + 3 skill lainnya
  ]
}
```

**Mage (Meer) - Magic DPS**

- High MAG (40), low HP (110)
- Skills: Arcane Bolt, Firestorm (AoE + DOT), Mana Surge (MAG↑), Time Warp (SPD↑)
- Ultimate: Meteor Flare (power 2.6 fire)

**Healer (Febri) - Support**

- Balanced stats, tinggi DEF (16)
- Skills: Single Heal, Group Heal, Cleanse (remove debuff)
- Ultimate: Divine Light (AoE heal 45%)

**Tank (Zabx) - Defender**

- Highest HP (220), DEF (28), lowest SPD (8)
- Skills: Bash (debuff damage+speed), Guard (self 40% damage reduction), Provoke (taunt), Shield Wall (team 20% reduction)
- Ultimate: Stone Bulwark (team 35% reduction)

**Dragon (Naga Kampar)**

- Hanya digunakan untuk story portrait/gif
- Boss actual data ada di `boss` object

#### 5. Boss

```javascript
boss: {
  id: "boss",
  name: "Naga Kampar",
  maxHp: 2200,
  maxMp: 200,
  atk: 42,
  def: 24,
  mag: 36,
  spd: 11,
  skills: [
    {
      id: "crushingClaw",
      name: "Crushing Claw",
      cost: 0,
      type: "physical",
      power: 1.1,
      pattern: "single",    // Target 1 hero
      weight: 4             // Bobot untuk random selection
    },
    {
      id: "fieryRend",
      name: "Fiery Rend",
      cost: 22,
      type: "magic",
      power: 1.8,
      splashPower: 0.7,     // Damage splash ke hero lain
      pattern: "single-splash",
      weight: 3
    },
    {
      id: "cinderWave",
      name: "Cinder Wave",
      cost: 18,
      type: "magic",
      power: 1.15,
      pattern: "aoe",       // Hit semua hero
      weight: 3
    },
    {
      id: "scaleHarden",
      name: "Scale Harden",
      cost: 16,
      type: "buff",
      pattern: "self",
      buff: {
        defUp: 0.3,        // +30% DEF
        duration: 2
      },
      weight: 2
    },
    {
      id: "roaringSilence",
      name: "Roaring Silence",
      cost: 20,
      type: "magic",
      pattern: "silence",   // Silence 2 hero (prioritas mage/healer)
      weight: 2
    },
    {
      id: "recklessFury",
      name: "Reckless Fury",
      cost: 10,
      type: "buff",
      pattern: "berserk",
      buff: {
        atkUp: 0.35,       // +35% ATK
        defDown: 0.2,      // -20% DEF (trade-off)
        duration: 2
      },
      weight: 2
    }
    // + Obliterate (cost 32, power 2.4)
  ]
}
```

**Pola Skill Boss:**

- `single` - Target 1 hero (biasanya HP terendah)
- `single-splash` - Main target + splash damage ke yang lain
- `aoe` - Damage semua hero
- `self` - Buff diri sendiri
- `berserk` - Buff dengan trade-off
- `silence` - Debuff 2 hero (disable magic skills)

#### 6. Messages

Template string untuk log battle. Gunakan placeholder `${variable}` untuk dynamic content:

```javascript
messages: {
  tipArmorBreak: "Tip: Armor Break menurunkan DEF naga—serang dengan serangan fisik saat lemah.",

  heroTurn: "${heroName} giliran",

  skillUsed: "${user} menggunakan ${skill} pada ${target} sebesar ${damage} damage.",

  healed: "${user} menyembuhkan ${target} sebesar ${amount}.",

  dragonEnraged: "${bossName} marah! Damagenya melonjak.",

  dragonPhase2: "Naga mengeraskan sisiknya, mengubah polanya!",

  victory: "Naga runtuh di bawah taktikmu.",
  defeat: "Timmu jatuh oleh amarah naga."
}
```

**Penggunaan:**

```javascript
const msg = CONFIG.messages.skillUsed
  .replace("${user}", "Aruna")
  .replace("${skill}", "Power Slash")
  .replace("${target}", "Naga Kampar")
  .replace("${damage}", "145");
// Output: "Aruna menggunakan Power Slash pada Naga Kampar sebesar 145 damage."
```

---

### game.js

**Path:** `game.js`  
**Ukuran:** ~25KB  
**Fungsi:** Core logic game, state management, combat calculations.

#### Class Game - Overview

```javascript
class Game {
  constructor() {
    // DOM References (15+ properties)
    this.heroRow = document.getElementById("heroRow");
    this.skillButtons = document.getElementById("skillButtons");
    // ... dll

    // Game State
    this.difficulty = "normal";
    this.state = "start";
    this.turnOrder = [];
    this.turnIndex = 0;
    this.turnCount = 0;

    // Combat State
    this.heroes = [];
    this.boss = {};
    this.pendingSkill = null;
    this.targeting = false;

    // Boss State
    this.bossPhase = 1;
    this.bossEnraged = false;
    this.bossWindupSkill = null;

    // Story State
    this.currentSceneIndex = 0;
    this.isTyping = false;
    this.isPaused = false;

    // Statistics
    this.totalDamageByHero = {};
    this.totalHealingByHero = {};
    this.highestHit = 0;

    // Initialization
    this.bindDifficultyControls();
    this.bindMenu();
    this.prepareNewRun();
    this.showScreen("start");
  }
}
```

#### Lifecycle Methods

**1. Initialization Flow**

```
new Game()
  → bindDifficultyControls()
  → bindMenu()
  → prepareNewRun()
    → buildHeroes()
    → buildBoss()
    → renderHeroes()
    → rebuildTurnOrder()
    → updateUI()
  → showScreen("start")
```

**2. Story Flow**

```
startButton.click()
  → startStory()
    → showScene(0)
      → typeText() [interval]
      → autoAdvance [timeout]
    → showScene(1)
    → ...
    → showScene(5)
  → endStoryAndStartBattle()
```

**3. Battle Flow**

```
endStoryAndStartBattle()
  → startTurn()
    → if hero: renderSkillBar()
    → if boss: dragonAct()
  → skill selected
    → prepareTargeting()
    → openTargetSelect() / auto-execute
  → executeSkill()
    → applyDamage() / applyHeal() / apply buff
    → resolveDot()
    → updateUI()
    → checkEnd()
  → advanceTurn()
    → applyEndOfTurnRegen()
    → rebuildTurnOrder() (jika cycle penuh)
  → startTurn() [loop]
```

#### Key Methods - Detailed

**buildHeroes(): Hero[]**

Membuat array 4 hero dengan stats yang disesuaikan difficulty:

```javascript
buildHeroes() {
  const diff = CONFIG.difficulties[this.difficulty] || CONFIG.difficulties.normal;
  const heroList = ["soldier", "mage", "healer", "tank"];

  return heroList.map((heroId) => {
    const h = CONFIG.characters[heroId];
    const maxHp = Math.round(h.maxHp * diff.heroHp);

    return {
      ...h,                              // Spread semua properties
      maxHp,
      hp: maxHp,                         // Full HP saat start
      mp: h.maxMp,                       // Full MP saat start
      status: {},                        // Kosong (no buffs/debuffs)
      limit: 0,                          // Limit gauge mulai 0
      skills: h.skills.map((s) => ({
        ...s,
        currentCd: 0                     // Semua skills ready
      }))
    };
  });
}
```

**Contoh Output:**

```javascript
[
  {
    id: "soldier",
    name: "Aruna",
    maxHp: 150,    // 150 * 1.0 (normal)
    hp: 150,
    mp: 60,
    status: {},
    limit: 0,
    skills: [
      { id: "basicSlash", currentCd: 0, ... },
      { id: "powerSlash", currentCd: 0, ... },
      // ...
    ]
  },
  // mage, healer, tank
]
```

**rebuildTurnOrder(): void**

Mengurutkan unit berdasarkan SPD efektif (dengan buff/debuff):

```javascript
rebuildTurnOrder() {
  const livingUnits = [...this.heroes, this.boss].filter((u) => u.hp > 0);

  livingUnits.sort((a, b) =>
    this.getEffectiveSpd(b) - this.getEffectiveSpd(a)  // Descending
  );

  this.turnOrder = livingUnits.map((u) => u.id);
  this.turnIndex = 0;
  this.renderTurnNodes();
}

getEffectiveSpd(unit) {
  let spd = unit.spd || 10;
  if (unit.status?.spdUp) spd = Math.round(spd * 1.2);    // +20%
  if (unit.status?.spdDown) spd = Math.round(spd * 0.8);  // -20%
  return spd;
}
```

**Example Turn Order:**

```
Initial (no buffs):
  mage(14) → soldier(12) → boss(11) → healer(10) → tank(8)

After Time Warp on healer (SPD↑):
  mage(14) → soldier(12) → healer(12) → boss(11) → tank(8)
```

**applyDamage(source, target, skill): number**

Rumus damage lengkap dengan semua modifiers:

```javascript
applyDamage(source, target, skill) {
  // 1. Base damage
  const isMagic = skill.type === "magic";
  const attackStat = isMagic ? source.mag : source.atk;
  const defense = this.computeDefense(target);
  let base = Math.max(0, attackStat - defense * 0.5);

  // 2. Skill power
  const power = skill.power || 1;

  // 3. Buff multiplier
  let buffMulti = 1;
  if (source.status?.atkUp && !isMagic)
    buffMulti += source.status.atkUp.amount;
  if (source.status?.magUp && isMagic)
    buffMulti += source.status.magUp.amount;
  if (target.status?.dmgDown)
    buffMulti -= target.status.dmgDown.amount;

  // 4. Guard reduction
  const guardCut = target.status?.guard?.amount || 0;
  const guardTeam = target.status?.guardTeam?.amount || 0;

  // 5. Synergy bonuses
  let synergyMulti = 1;
  if (!isMagic && target.status?.defDown)
    synergyMulti += 0.15;  // Physical damage +15% vs DEF↓
  if (target.status?.mark && skill.element === "fire")
    synergyMulti += 0.2;   // Fire damage +20% vs marked
  if (source.id === "tank" && this.boss.status?.dot && target.id === "boss")
    synergyMulti += 0.1;   // Tank +10% vs burning boss

  // 6. Enrage multiplier
  const enrageMultiplier =
    (source.id === "boss" && this.isDragonEnraged()) ? 2 : 1;

  // Final calculation
  const damage = Math.max(8, Math.round(
    base * power * buffMulti * synergyMulti * (1 - guardCut - guardTeam)
  ));

  const finalDamage = Math.max(8, Math.round(damage * enrageMultiplier));

  // Apply damage
  target.hp = Math.max(0, target.hp - finalDamage);

  // Statistics & limit gain
  if (source.id !== "boss") {
    this.totalDamageByHero[source.id] += finalDamage;
    this.highestHit = Math.max(this.highestHit, finalDamage);
    this.gainLimit(source, LIMIT_GAIN_DEALT);
  }
  if (target.id !== "boss") {
    this.gainLimit(target, LIMIT_GAIN_TAKEN);
  }

  // Apply debuffs & DOT
  if (skill.debuff) { /* apply debuff */ }
  if (skill.dot) { /* apply DOT */ }

  return finalDamage;
}
```

**Contoh Perhitungan Damage:**

```javascript
// Mage (MAG 40) dengan Mana Surge (+30% MAG) menyerang boss (DEF 24, DEF↓ 20%)
// Skill: Arcane Bolt (power 1.3)

attackStat = 40
defense = computeDefense(boss) = 24 * (1 - 0.2) = 19.2
base = 40 - 19.2 * 0.5 = 30.4
buffMulti = 1 + 0.3 = 1.3  // Mana Surge
synergyMulti = 1  // No fire/mark synergy for arcane
guardCut = 0  // Boss not guarding

damage = max(8, round(30.4 * 1.3 * 1.3 * 1 * 1))
       = max(8, round(51.376))
       = 51

// Jika boss enraged: 51 * 2 = 102 (tapi boss tidak enrage untuk damage ke boss)
```

**executeSkill(user, skill, target): void**

Handler utama untuk eksekusi skill dengan validasi lengkap:

```javascript
executeSkill(user, skill, target = null) {
  // Validations
  if (skill.currentCd && skill.currentCd > 0) return;  // On cooldown
  if (skill.requiresLimit && (user.limit || 0) < skill.requiresLimit) return;
  if (user.status?.silence && skill.type === "magic") return;
  if (user.mp < skill.cost) return;

  // Consume MP
  user.mp -= skill.cost;

  // Resolve target
  if (!target) target = skill.target === "self" ? user : null;

  // Execute based on type
  if (skill.type === "physical" || skill.type === "magic") {
    const tgt = target || this.boss;
    const dmg = this.applyDamage(user, tgt, skill);
    this.log(/* damage message */);

    // Execute mechanic (low HP bonus)
    if (skill.execute && tgt.hp / tgt.maxHp < skill.execute) {
      tgt.hp = Math.max(0, tgt.hp - 40);
      this.log(CONFIG.messages.executeBonus);
    }
  }
  else if (skill.type === "heal") {
    if (skill.target === "allies") {
      this.heroes.forEach((h) => {
        if (h.hp > 0) {
          const healed = this.applyHeal(user, h, skill);
          this.log(/* heal message */);
        }
      });
    } else if (target) {
      const healed = this.applyHeal(user, target, skill);
      this.log(/* heal message */);
    }
  }
  else if (skill.type === "buff") {
    // Apply buff to target(s)
    const applyBuff = (t) => {
      t.status = t.status || {};
      Object.keys(skill.buff).forEach((key) => {
        if (key !== "duration") {
          t.status[key] = {
            amount: skill.buff[key],
            duration: skill.buff.duration
          };
        }
      });
    };

    if (skill.target === "allies")
      this.heroes.forEach(applyBuff);
    else
      applyBuff(target || user);

    this.log(CONFIG.messages.buffAllies);
  }
  else if (skill.type === "cleanse" && target) {
    target.status = {};
    this.log(CONFIG.messages.cleansed);
  }
  else if (skill.type === "taunt") {
    this.boss.status.taunt = {
      amount: 1,
      duration: skill.duration,
      target: user.id  // Which hero is taunting
    };
    this.log(CONFIG.messages.provoke);
  }

  // Set cooldown
  if (skill.cooldown) {
    skill.currentCd = skill.cooldown;
  }

  // Reset limit if used
  if (skill.requiresLimit) {
    user.limit = 0;
  }

  // Post-skill effects
  this.resolveDot();
  this.updateUI();
  this.checkEnd();

  // Advance turn
  if (this.state === "playing") {
    this.advanceTurn();
  } else {
    this.turnCount += 1;
  }
}
```

**dragonAct(): void**

AI boss dengan decision tree dinamis:

```javascript
dragonAct() {
  const aliveHeroes = this.heroes.filter((h) => h.hp > 0);
  if (!aliveHeroes.length) {
    this.checkEnd();
    return;
  }

  this.updateBossPhase();  // Check for phase transitions
  this.isDragonEnraged();  // Check for enrage

  let choice = this.bossWindupSkill;

  // Windup mechanic for AoE skills during enrage
  if (!choice) {
    choice = this.chooseDragonSkill();

    if (this.bossEnraged && choice.pattern === "aoe") {
      this.log(CONFIG.messages.dragonWindup);
      this.bossWindupSkill = choice;  // Store for next turn
      this.advanceTurn();
      return;  // Skip this turn to "charge up"
    }
  } else {
    this.log(CONFIG.messages.dragonUnleash);
    this.bossWindupSkill = null;  // Clear after use
  }

  boss.mp = Math.max(0, boss.mp - choice.cost);

  // Execute based on pattern
  switch(choice.pattern) {
    case "aoe":
      aliveHeroes.forEach((hero) => {
        const dmg = this.applyDamage(boss, hero, choice);
        this.log(CONFIG.messages.dragonScorched
          .replace("${target}", hero.name)
          .replace("${damage}", dmg));
      });
      break;

    case "single-splash":
      const targetHero = this.selectDragonTarget(aliveHeroes) || aliveHeroes[0];
      const mainDmg = this.applyDamage(boss, targetHero, choice);
      this.log(CONFIG.messages.dragonBlast);

      // Splash to others
      aliveHeroes.filter((h) => h.id !== targetHero.id).forEach((hero) => {
        const splashSkill = { ...choice, power: choice.splashPower };
        const splashDmg = this.applyDamage(boss, hero, splashSkill);
        this.log(CONFIG.messages.dragonSplash);
      });
      break;

    case "self":
      // Apply buffs and remove defDown
      Object.keys(choice.buff || {}).forEach((key) => {
        if (key !== "duration") {
          boss.status[key] = {
            amount: choice.buff[key],
            duration: choice.buff.duration
          };
        }
      });
      if (boss.status.defDown) delete boss.status.defDown;
      this.log(CONFIG.messages.dragonHarden);
      break;

    case "silence":
      const preferredTargets = aliveHeroes.filter(
        (h) => h.id === "mage" || h.id === "healer"
      );
      const silenced = (preferredTargets.length ? preferredTargets : aliveHeroes).slice(0, 2);
      silenced.forEach((hero) => {
        hero.status = hero.status || {};
        hero.status.silence = { amount: 1, duration: 2 };
        this.log(CONFIG.messages.dragonSilence);
      });
      break;

    default:  // single or other patterns
      const target = this.selectDragonTarget(aliveHeroes) || aliveHeroes[0];
      const dmg = this.applyDamage(boss, target, choice);
      this.log(/* appropriate message */);
  }

  this.resolveDot();
  this.updateUI();
  this.checkEnd();
  if (this.state === "playing") this.advanceTurn();
  else this.turnCount += 1;
}
```

**chooseDragonSkill(): Skill**

Weighted random selection dengan adjustment per phase:

```javascript
chooseDragonSkill() {
  const enraged = this.isDragonEnraged() || this.bossEnraged;

  const weightedSkills = this.boss.skills
    .filter((s) => s.cost === 0 || this.boss.mp >= s.cost)  // Can afford
    .map((s) => {
      let weight = s.weight || 1;

      // Phase 1 (HP > 60%)
      if (this.bossPhase === 1) {
        if (s.id === "crushingClaw" || s.id === "fieryRend") weight += 1;
      }
      // Phase 2 (HP 30-60%)
      else if (this.bossPhase === 2) {
        if (s.id === "scaleHarden") weight += 2;
        if (s.id === "roaringSilence") weight += 2;
        if (s.id === "obliterate") weight = Math.max(1, weight - 1);
      }
      // Phase 3 (HP < 30%)
      else {
        if (s.id === "cinderWave" || s.id === "fieryRend") weight += 2;
        if (s.id === "obliterate") weight += 1;
        if (s.id === "recklessFury") weight += 2;
      }

      // Enrage bonus for AoE
      if (enraged && s.pattern === "aoe") weight += 1;

      return { ...s, weight };
    });

  // Flatten weighted array
  const weighted = [];
  weightedSkills.forEach((skill) => {
    const w = skill.weight || 1;
    for (let i = 0; i < w; i++) weighted.push(skill);
  });

  return weighted[Math.floor(Math.random() * weighted.length)];
}
```

**Contoh Bobot Skill:**

```
Phase 1 (HP 100%): [crushingClaw x5, fieryRend x4, cinderWave x3, ...]
Phase 2 (HP 50%):  [scaleHarden x4, roaringSilence x4, crushingClaw x4, ...]
Phase 3 (HP 20%):  [cinderWave x5, recklessFury x4, obliterate x2, ...]
Enraged AoE:       cinderWave weight +1
```

**updateUI(): void**

Sinkronisasi penuh DOM dengan game state:

```javascript
updateUI() {
  // Boss UI
  const bossHpPct = (this.boss.hp / this.boss.maxHp) * 100;
  const bossMpPct = (this.boss.mp / this.boss.maxMp) * 100;
  document.getElementById("bossHpBar").style.width = `${bossHpPct}%`;
  document.getElementById("bossMpBar").style.width = `${bossMpPct}%`;
  document.getElementById("bossHpText").textContent =
    `${this.boss.hp}/${this.boss.maxHp}`;
  document.getElementById("bossMpText").textContent =
    `${this.boss.mp}/${this.boss.maxMp}`;

  // Boss status labels
  const bossStatus = document.getElementById("bossStatus");
  const bossLabels = [];
  if (this.boss.status?.dot)
    bossLabels.push(`Burning (${this.boss.status.dot.duration})`);
  if (this.boss.status?.defDown)
    bossLabels.push(`DEF↓ (${this.boss.status.defDown.duration})`);
  if (this.boss.status?.defUp)
    bossLabels.push(`DEF↑ (${this.boss.status.defUp.duration})`);
  if (this.boss.status?.taunt)
    bossLabels.push(`Provoked (${this.boss.status.taunt.duration})`);
  if (this.boss.status?.mark)
    bossLabels.push(`Marked (${this.boss.status.mark.duration})`);

  bossStatus.style.display = bossLabels.length ? "inline-block" : "none";
  bossStatus.textContent = bossLabels.join(" · ");

  // Heroes UI
  this.heroes.forEach((h) => {
    const hpPct = (h.hp / h.maxHp) * 100;
    const mpPct = (h.mp / h.maxMp) * 100;

    document.getElementById(`${h.id}HpBar`).style.width = `${hpPct}%`;
    document.getElementById(`${h.id}MpBar`).style.width = `${mpPct}%`;
    document.getElementById(`${h.id}HpText`).textContent = `${h.hp}/${h.maxHp}`;
    document.getElementById(`${h.id}MpText`).textContent = `${h.mp}/${h.maxMp}`;

    // Status labels
    const status = document.getElementById(`${h.id}Status`);
    const format = (label, effect) => {
      if (!effect) return null;
      const duration = typeof effect.duration === "number"
        ? ` (${effect.duration})` : "";
      return `${label}${duration}`;
    };

    const labels = [
      format("ATK↑", h.status.atkUp),
      format("MAG↑", h.status.magUp),
      format("Guard", h.status.guard),
      format("Shielded", h.status.guardTeam),
      format("ATK↓", h.status.atkDown),
      format("DEF↓", h.status.defDown),
      format("SPD↑", h.status.spdUp),
      format("SPD↓", h.status.spdDown),
      format("Silenced", h.status.silence)
    ].filter(Boolean);

    status.textContent = labels.join(" · ");
    status.style.display = labels.length ? "inline-block" : "none";

    // Limit gauge
    const limitEl = document.getElementById(`${h.id}Limit`);
    if (limitEl) limitEl.textContent = `Limit: ${Math.round(h.limit)}%`;
  });
}
```

---

### styles.css

**Path:** `styles.css`  
**Ukuran:** ~12KB  
**Fungsi:** Styling komprehensif dengan tema space/neon cyberpunk.

#### CSS Variables

```css
:root {
  --space: #050912; /* Deep space background */
  --panel: rgba(18, 26, 48, 0.92); /* Semi-transparent panels */
  --card: rgba(23, 32, 60, 0.9); /* Card backgrounds */
  --line: rgba(116, 240, 237, 0.3); /* Border accent (cyan) */

  /* Gradients */
  --hp: linear-gradient(90deg, #ff8f70, #ff3d3d); /* Red gradient */
  --mp: linear-gradient(90deg, #74b9ff, #0984e3); /* Blue gradient */

  /* Colors */
  --accent: #ff6b6b; /* Red accent (danger) */
  --primary: #74f0ed; /* Cyan primary (active) */
  --secondary: #ffc857; /* Yellow secondary (highlight) */
  --text: #e3ecff; /* Light text */
  --muted: #9eb0d3; /* Muted text */

  /* Effects */
  --shadow: 0 20px 45px rgba(5, 9, 18, 0.55);
}
```

#### Layout Structure

**1. Global Styles**

```css
body {
  font-family: "Monocraft", monospace; /* Pixel-style font */
  font-size: 15px;
  background: radial-gradient(...),
    /* Multiple radial gradients */ linear-gradient(...); /* for nebula effect */
  color: var(--text);
  min-height: 100vh;
}
```

**2. Grid Layout - Battle Screen**

```css
.battle-layer {
  display: grid;
  grid-template-rows: auto 1fr auto; /* Header / Content / Footer */
  gap: 8px;
  min-height: 86vh;
}

/* Row 1: Turn Order */
.turn-order {
  ...;
}

/* Row 2: Middle Layer (Boss + Log) */
.middle-layer {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.log-panel {
  position: absolute;
  top: 8px;
  left: 18px;
  width: 280px;
}

/* Row 3: Footer (Heroes + Skills) */
.footer-row {
  display: flex;
  flex-direction: column;
  align-items: center;
}
```

---

## Mekanik Game

### Sistem Turn Order

**Konsep:** Initiative-based turn order yang diurutkan berdasarkan SPD stat.

#### Perhitungan Turn Order

1. **Awal Battle:** Semua unit (4 heroes + boss) disortir berdasarkan SPD
2. **Setiap Cycle:** Rebuild order setelah semua unit dapat giliran
3. **Dynamic Adjustment:** Buff/debuff SPD mengubah urutan

**Formula:**

```
Effective SPD = Base SPD × SPD Modifiers

SPD Modifiers:
- SPD↑ buff: ×1.2 (+20%)
- SPD↓ debuff: ×0.8 (-20%)
```

**Contoh Skenario:**

```
Initial state (no buffs):
  Mage (14) → Soldier (12) → Boss (11) → Healer (10) → Tank (8)

Turn 1: Mage casts Time Warp (SPD↑ on all allies for 2 turns)
Turn 2 rebuild:
  Soldier (14.4) → Mage (16.8) → Healer (12) → Boss (11) → Tank (9.6)

After 2 turns, buff expires, back to original order
```

#### Turn Flow

```
┌─────────────────────────────────┐
│   Start Turn (turnIndex)        │
│   - Apply duration decay         │
│   - Highlight active unit        │
└──────────┬──────────────────────┘
           │
    ┌──────▼──────┐
    │ Is Boss?    │
    └──┬───────┬──┘
       │ Yes   │ No
       │       │
  ┌────▼───┐  │  ┌────────────────┐
  │ Boss   │  │  │ Hero Turn      │
  │ Act    │  └──│ - Render skills│
  │        │     │ - Wait input   │
  └────┬───┘     └────┬───────────┘
       │              │
       │         ┌────▼────────┐
       │         │ Skill Select│
       │         └────┬────────┘
       │              │
  ┌────▼──────────────▼────┐
  │   Execute Skill         │
  │   - Apply effects       │
  │   - Resolve DOT         │
  │   - Update UI           │
  │   - Check win/lose      │
  └──────────┬──────────────┘
             │
       ┌─────▼─────────┐
       │ Advance Turn  │
       │ - MP regen    │
       │ - Rebuild if  │
       │   cycle end   │
       └─────┬─────────┘
             │
             └─────► Start Turn (loop)
```

### Sistem Combat

#### Damage Calculation

**Physical Damage:**

```
Base = ATK - (Target DEF × 0.5)
Damage = Base × Skill Power × Buff Multi × Synergy Multi × (1 - Guard)

Where:
  Buff Multi = 1.0 + ATK↑ bonus - Damage↓ debuff
  Synergy Multi = 1.0 + DEF↓ bonus (15%) + Mark bonus (fire, 20%)
  Guard = Guard self (40%) + Shield Wall team (20%)

Minimum damage = 8
```

**Contoh:**

```javascript
// Soldier (ATK 34) with Rally buff (+20% ATK)
// Using Power Slash (power 1.4) on boss with Armor Break (DEF↓ 20%)

Base = 34 - (24 × 0.8 × 0.5) = 34 - 9.6 = 24.4
Buff Multi = 1.0 + 0.2 = 1.2
Synergy Multi = 1.0 + 0.15 = 1.15
Guard = 0

Damage = 24.4 × 1.4 × 1.2 × 1.15 × 1.0
       = 47.18 → 47 damage
```

**Magic Damage:**

```
Base = MAG - (Target DEF × 0.5)
Damage = Base × Skill Power × Buff Multi × Synergy Multi × (1 - Guard)

Buff Multi = 1.0 + MAG↑ bonus - Damage↓ debuff
Synergy Multi = 1.0 + Mark bonus (fire, 20%)
```

**Contoh:**

```javascript
// Mage (MAG 40) with Mana Surge (+30% MAG)
// Using Firestorm (power 1.1, fire) on marked boss

Base = 40 - (24 × 0.5) = 28
Buff Multi = 1.0 + 0.3 = 1.3
Synergy Multi = 1.0 + 0.2 = 1.2  // Marked target vs fire

Damage = 28 × 1.1 × 1.3 × 1.2 × 1.0
       = 48.05 → 48 damage
```

#### Healing Calculation

```
Heal Amount = Target Max HP × Heal Ratio

Default ratios:
- Single Heal: 38% (SINGLE_HEAL_RATIO)
- Group Heal: 24% (GROUP_HEAL_RATIO)
- Divine Light (limit): 45%

Capped at Max HP (no overheal)
```

**Contoh:**

```javascript
// Healer using Single Heal on Tank (Max HP 220)
Heal = 220 × 0.38 = 83.6 → 84 HP

// If Tank at 50/220 HP:
New HP = min(220, 50 + 84) = 134 HP
```

#### Defense Calculation

```
Effective DEF = Base DEF × DEF Modifiers

DEF Modifiers:
- DEF↑ buff: +30%
- DEF↓ debuff: -20%
- Minimum DEF = 1

Example:
Boss base DEF = 24
After Armor Break: 24 × (1 - 0.2) = 19.2
After Scale Harden: 24 × (1 + 0.3) = 31.2
```

### Sistem Status Effect

#### Buff Effects

| Status          | Effect               | Duration | Source              |
| --------------- | -------------------- | -------- | ------------------- |
| **ATK↑**        | +20% Physical damage | 2 turns  | Rally (Soldier)     |
| **MAG↑**        | +30% Magic damage    | 2 turns  | Mana Surge (Mage)   |
| **DEF↑**        | +30% Defense         | 2 turns  | Scale Harden (Boss) |
| **SPD↑**        | +20% Speed           | 2 turns  | Time Warp (Mage)    |
| **Guard**       | -40% Damage taken    | 1 turn   | Guard (Tank)        |
| **Shield Wall** | -20% Team damage     | 2 turns  | Shield Wall (Tank)  |

#### Debuff Effects

| Status      | Effect            | Duration | Source                 |
| ----------- | ----------------- | -------- | ---------------------- |
| **DEF↓**    | -20% Defense      | 2 turns  | Armor Break (Soldier)  |
| **ATK↓**    | -15% Attack       | 2 turns  | Bash (Tank)            |
| **SPD↓**    | -20% Speed        | 2 turns  | Bash (Tank)            |
| **Damage↓** | -15% Damage dealt | 2 turns  | Bash (Tank)            |
| **Silence** | Can't use magic   | 2 turns  | Roaring Silence (Boss) |
| **Marked**  | +20% fire damage  | 3 turns  | Mark Prey (Soldier)    |

#### Damage Over Time

| Status            | Effect        | Duration | Source           |
| ----------------- | ------------- | -------- | ---------------- |
| **Burning (DOT)** | 6 damage/turn | 2 turns  | Firestorm (Mage) |

**DOT Mechanics:**

```javascript
// Applied at skill execution
if (skill.dot) {
  target.status.dot = {
    amount: 6,
    duration: 2
  };
}

// Resolved at end of skill execution & turn start
resolveDot() {
  targets.forEach((unit) => {
    if (unit.status?.dot) {
      unit.hp -= dot.amount;
      dot.duration -= 1;

      if (dot.duration <= 0) {
        delete unit.status.dot;
      }
    }
  });
}
```

#### Duration System

```javascript
applyDurations() {
  const decay = (status) => {
    Object.keys(status).forEach((key) => {
      if (key === "dot") return;  // DOT handled separately

      if (status[key] && typeof status[key].duration === "number") {
        status[key].duration -= 1;

        if (status[key].duration <= 0) {
          delete status[key];  // Remove expired effect
        }
      }
    });
  };

  this.heroes.forEach((h) => decay(h.status || {}));
  decay(this.boss.status || {});
}
```

**Dipanggil:** Di awal setiap giliran (sebelum unit aktif bertindak)

### Sistem Limit Break

#### Limit Gauge Mechanics

**Gain Conditions:**

```javascript
LIMIT_GAIN_TAKEN = 10  // Gain per hit received
LIMIT_GAIN_DEALT = 5   // Gain per hit dealt

gainLimit(hero, amount) {
  if (!hero || hero.id === "boss") return;  // Only heroes have limit
  hero.limit = Math.min(100, (hero.limit || 0) + amount);
}
```

**Example Progression:**

```
Turn 1: Tank takes 50 damage → +10 limit (10%)
Turn 2: Tank uses Bash → +5 limit (15%)
Turn 3: Tank takes 45 damage → +10 limit (25%)
...
Turn 12: Tank at 100% limit → Can use Stone Bulwark
```

#### Limit Break Skills

| Hero        | Skill         | Power | Effect                    |
| ----------- | ------------- | ----- | ------------------------- |
| **Soldier** | Sky Cleave    | 2.2×  | Single target execute     |
| **Mage**    | Meteor Flare  | 2.6×  | Strongest single fire     |
| **Healer**  | Divine Light  | 45%   | AoE heal (best healing)   |
| **Tank**    | Stone Bulwark | —     | Team 35% damage reduction |

**Strategi Penggunaan:**

- **Soldier:** Save for execute at low HP (<30%)
- **Mage:** Combo with Mark Prey for massive damage
- **Healer:** Emergency full heal when team low
- **Tank:** Use before boss AoE (Cinder Wave/Fiery Rend)

### AI Boss

#### Phase System

Boss behavior changes based on HP thresholds:

**Phase 1 (HP > 60%)**

```javascript
Aggressive physical phase
- Crushing Claw weight +1
- Fiery Rend weight +1
Strategy: Focus on dealing consistent damage
```

**Phase 2 (HP 30-60%)**

```javascript
Defensive/disruptive phase
- Scale Harden weight +2 (buff DEF)
- Roaring Silence weight +2 (disable magic)
- Obliterate weight -1 (less risky)
Strategy: Survive and disrupt hero combos
```

**Phase 3 (HP < 30%)**

```javascript
Desperate all-out phase
- Cinder Wave weight +2 (AoE spam)
- Fiery Rend weight +2 (high damage)
- Reckless Fury weight +2 (berserk)
- Obliterate weight +1 (finishing move)
Strategy: Maximum damage before death
```

#### Enrage Mechanic

**Trigger:** Boss HP ≤ 50%

**Effects:**

```javascript
isDragonEnraged() {
  const enraged = this.boss.hp <= this.boss.maxHp * 0.5;

  if (enraged && !this.bossEnragedNotified) {
    this.log(CONFIG.messages.dragonEnraged);
    this.bossEnragedNotified = true;
  }

  if (enraged) this.bossEnraged = true;
  return enraged;
}

// In applyDamage():
const enrageMultiplier =
  (source.id === "boss" && this.isDragonEnraged()) ? 2 : 1;

finalDamage = damage * enrageMultiplier;  // DOUBLE DAMAGE!
```

**Dampak Enrage:**

- All boss damage ×2
- AoE skills get +1 weight (more frequent)
- Windup mechanic for AoE (telegraphed attack)

#### Windup Mechanic

```javascript
// Turn 1: Boss enraged, chooses Cinder Wave
if (this.bossEnraged && choice.pattern === "aoe") {
  this.log("Naga menghirup dalam-dalam, api berkumpul di tenggorokannya!");
  this.bossWindupSkill = choice;
  this.advanceTurn(); // Skip damage, store skill
  return;
}

// Turn 2: Execute stored windup
if (this.bossWindupSkill) {
  this.log("Naga melepaskan kekuatannya dalam auman yang menyala-nyala!");
  choice = this.bossWindupSkill;
  this.bossWindupSkill = null;
  // ... execute AoE with doubled damage
}
```

**Tujuan:** Memberikan peringatan 1 giliran kepada pemain sebelum serangan AoE yang menghancurkan

#### Target Selection

```javascript
selectDragonTarget(aliveHeroes) {
  if (!aliveHeroes.length) return null;

  // 1. Check for taunt (70% chance to follow)
  const tauntTarget = this.boss.status.taunt &&
    this.getHero(this.boss.status.taunt.target);

  if (tauntTarget && tauntTarget.hp > 0 && Math.random() < 0.7) {
    this.log("Naga diprovokasi dan fokus pada ${target}!");
    return tauntTarget;
  }

  // 2. Target lowest HP ratio (finish off weak heroes)
  return aliveHeroes.reduce((lowest, hero) => {
    return hero.hp / hero.maxHp < lowest.hp / lowest.maxHp ? hero : lowest;
  }, aliveHeroes[0]);
}
```

**Prioritas:**

1. Provoked target (70% chance if taunted)
2. Lowest HP% hero (to eliminate quickly)

**Contoh:**

```
Heroes state:
- Soldier: 120/150 (80%)
- Mage: 50/110 (45%)  ← TARGETED
- Healer: 100/140 (71%)
- Tank: 180/220 (82%) + Taunt active

If taunt active: 70% → Tank, 30% → Mage
If no taunt: 100% → Mage
```

---

## CSS Classes & Styling

### Layout Classes

#### Screen Management

```css
.hidden {
  display: none !important; /* Force hide */
}

.game-shell {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Three main screens - only one visible at a time */
.start-screen {
  position: fixed;
  inset: 0;
  z-index: 200;
}
.story-screen {
  position: fixed;
  inset: 0;
  z-index: 150;
}
.battle-field {
  flex: 1;
  position: relative;
}
```

#### Battle Layout

```css
.battle-layer {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-rows:
    auto /* Turn order track */
    1fr /* Boss + log area */
    auto; /* Heroes + skills */
  gap: 8px;
  min-height: 86vh;
}
```

### Component Classes

#### Cards

```css
.hero-card {
  width: 200px;
  background: var(--card);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hero-card.active {
  transform: translateY(-10px) scale(1.03);
  border-color: var(--primary);
  box-shadow: 0 20px 40px rgba(116, 240, 237, 0.28);
}

.boss-card {
  width: 310px;
  background: var(--card);
  border-radius: 16px;
  padding: 12px;
}
```

#### Meters (HP/MP Bars)

```css
.meter {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 7px;
}

.meter-bar {
  width: 100%;
  height: 11px;
  background: rgba(8, 12, 26, 0.7); /* Empty bar */
  border-radius: 9px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  transition: width 0.35s ease; /* Smooth update */
}

.hp-fill {
  background: linear-gradient(90deg, #ff8f70, #ff3d3d);
}

.mp-fill {
  background: linear-gradient(90deg, #74b9ff, #0984e3);
}
```

**Penggunaan:**

```html
<div class="meter">
  <div class="meter-label">
    <span>HP</span>
    <span id="soldierHpText">150/150</span>
  </div>
  <div class="meter-bar">
    <div class="meter-fill hp-fill" style="width: 100%"></div>
  </div>
</div>
```

#### Status Tags

```css
.status-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.07);
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.82rem;
}
```

**Konten Dinamis:**

```javascript
// Menampilkan: "ATK↑ (2) · Guard (1) · DEF↓ (2)"
statusTag.textContent = "ATK↑ (2) · Guard (1) · DEF↓ (2)";
statusTag.style.display = "inline-block";

// Sembunyikan jika tidak ada efek
statusTag.style.display = "none";
```

#### Skills

```css
.skill-button {
  background: linear-gradient(
    135deg,
    rgba(116, 240, 237, 0.2),
    rgba(116, 240, 237, 0.1)
  );
  border: 1px solid rgba(116, 240, 237, 0.4);
  border-radius: 10px;
  padding: 6px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.skill-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(116, 240, 237, 0.25);
}

.skill-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.skill-info {
  /* Tooltip positioned absolutely */
  position: absolute;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px 10px;
  max-width: 220px;
  z-index: 5;
  pointer-events: none; /* Don't block mouse */
}
```

#### Turn Nodes

```css
.turn-node {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--line);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: transform 0.25s ease, border-color 0.25s ease;
}

.turn-node.active {
  transform: scale(1.08) translateY(-6px);
  border-color: var(--primary);
  box-shadow: 0 16px 28px rgba(116, 240, 237, 0.25);
}
```

#### Target Selection

```css
.targetable {
  border-color: var(--secondary) !important;
  box-shadow: 0 16px 30px rgba(255, 200, 87, 0.2);
  animation: targetPulse 1.2s ease-in-out infinite;
}

@keyframes targetPulse {
  0%,
  100% {
    box-shadow: 0 12px 26px rgba(255, 200, 87, 0.08);
  }
  50% {
    box-shadow: 0 14px 30px rgba(255, 200, 87, 0.2);
  }
}
```

### Responsive Design

```css
@media (max-width: 1200px) {
  body {
    font-size: 14px;
  }
}

@media (max-width: 900px) {
  body {
    font-size: 13px;
  }
  .hero-card {
    width: 180px;
  }
  .boss-card {
    width: 290px;
  }
}
```

---

## Alur Gameplay

### 1. Start → Story

```
User clicks "Start" button
  ↓
game.startStory()
  ↓
showScreen("story")
  ↓
showScene(0)
  ├─ Set speaker name & portrait
  ├─ Start typing animation (35ms/char)
  └─ Auto-advance after 1800ms
  ↓
showScene(1) ... showScene(5)
  ↓
endStoryAndStartBattle()
```

### 2. Battle Loop

```
startTurn()
  ├─ applyDurations() (decay buffs/debuffs)
  ├─ highlightTurn()
  └─ Check active unit:
      │
      ├─ If BOSS:
      │   └─ dragonAct()
      │       ├─ updateBossPhase()
      │       ├─ chooseDragonSkill() (weighted)
      │       ├─ Execute pattern (AoE/single/buff/etc)
      │       ├─ resolveDot()
      │       └─ checkEnd()
      │
      └─ If HERO:
          ├─ Reduce skill cooldowns
          ├─ renderSkillBar()
          └─ Wait for user input
              │
              ├─ User clicks skill
              ├─ prepareTargeting()
              │   ├─ If self/allies/all: auto-execute
              │   └─ If single: openTargetSelect()
              │
              └─ executeSkill()
                  ├─ Validate (MP, cooldown, silence)
                  ├─ Apply effect (damage/heal/buff)
                  ├─ Set cooldown & reset limit
                  ├─ resolveDot()
                  ├─ updateUI()
                  └─ checkEnd()
  ↓
advanceTurn()
  ├─ turnCount++
  ├─ applyEndOfTurnRegen() (MP +3/+4)
  ├─ Advance turnIndex
  └─ Rebuild turn order if cycle complete
  ↓
setTimeout(() => startTurn(), 600ms)
```

### 3. End Conditions

```
checkEnd()
  │
  ├─ If boss.hp <= 0:
  │   ├─ state = "victory"
  │   ├─ Show victory screen
  │   ├─ renderRunSummary()
  │   └─ saveBestRun() (if faster than record)
  │
  └─ If all heroes dead:
      ├─ state = "defeat"
      ├─ Show defeat screen
      └─ renderRunSummary()
```

---

## Data Structure

### Unit Interface

```typescript
interface Unit {
  id: string; // "soldier" | "mage" | "healer" | "tank" | "boss"
  name: string; // Display name
  hp: number; // Current HP
  maxHp: number; // Maximum HP
  mp: number; // Current MP
  maxMp: number; // Maximum MP
  atk: number; // Physical attack stat
  def: number; // Defense stat
  mag: number; // Magic attack stat
  spd: number; // Speed (turn order)
  status: StatusMap; // Active buffs/debuffs
}
```

### Hero Interface

```typescript
interface Hero extends Unit {
  role: string; // "Physical DPS" | "Magic DPS" | "Support" | "Defender"
  limit: number; // Limit gauge (0-100)
  skills: Skill[]; // Available skills
}
```

### Boss Interface

```typescript
interface Boss extends Unit {
  skills: BossSkill[]; // Boss-specific skills
}
```

### Skill Interface

```typescript
interface Skill {
  id: string; // Unique identifier
  name: string; // Display name
  cost: number; // MP cost
  cooldown?: number; // Turns before reuse
  currentCd?: number; // Current cooldown counter
  target: TargetType; // "self" | "ally" | "allies" | "enemy" | "all-enemies"
  type: SkillType; // "physical" | "magic" | "heal" | "buff" | "cleanse" | "taunt"
  power?: number; // Damage multiplier
  element?: string; // "fire" (for synergy)
  healRatio?: number; // Heal percentage
  buff?: BuffData; // Buff to apply
  debuff?: DebuffData; // Debuff to apply
  dot?: DotData; // Damage over time
  requiresLimit?: number; // Limit gauge requirement (0-100)
  description: string; // Tooltip text
}
```

### Status Map Interface

```typescript
interface StatusMap {
  // Buffs
  atkUp?: StatusEffect;
  magUp?: StatusEffect;
  defUp?: StatusEffect;
  spdUp?: StatusEffect;
  guard?: StatusEffect;
  guardTeam?: StatusEffect;

  // Debuffs
  atkDown?: StatusEffect;
  defDown?: StatusEffect;
  spdDown?: StatusEffect;
  dmgDown?: StatusEffect;
  silence?: StatusEffect;
  mark?: StatusEffect;

  // Special
  dot?: DotEffect;
  taunt?: TauntEffect;
}

interface StatusEffect {
  amount: number; // Modifier value (e.g., 0.2 for +20%)
  duration: number; // Turns remaining
}

interface DotEffect {
  amount: number; // Damage per turn
  duration: number; // Turns remaining
}

interface TauntEffect {
  amount: number; // Always 1
  duration: number; // Turns remaining
  target: string; // ID of taunting hero
}
```

### Boss Skill Interface

```typescript
interface BossSkill extends Skill {
  pattern: SkillPattern; // "single" | "single-splash" | "aoe" | "self" | "berserk" | "silence"
  weight: number; // Selection weight (higher = more frequent)
  splashPower?: number; // Splash damage multiplier
}
```

---

## Tips Pengembangan

### 1. Menyeimbangkan Damage

**Sesuaikan Pengali Power:**

```javascript
// game_config.js
skills: [
  {
    id: "powerSlash",
    power: 1.4, // Tingkatkan dari 1.2 → lebih banyak damage
  },
];
```

**Sesuaikan Stat:**

```javascript
characters: {
  soldier: {
    atk: 34,  // Tingkatkan untuk lebih banyak damage fisik
    def: 14,  // Tingkatkan untuk lebih banyak daya tahan
  }
}
```

### 2. Menambah Skill Baru

**Contoh: Tambahkan skill AoE "Whirlwind" ke Soldier**

```javascript
// game_config.js - dalam soldier.skills array
{
  id: "whirlwind",
  name: "Whirlwind",
  cost: 20,
  cooldown: 4,
  target: "all-enemies",  // Menyerang semua musuh (hanya boss di sini)
  type: "physical",
  power: 0.8,            // Power lebih rendah untuk AoE
  description: "Serangan berputar yang menghantam semua musuh."
}
```

**Tambah message template:**

```javascript
messages: {
  // ... existing messages
  whirlwindHit: "${user} menggunakan Whirlwind! Semua musuh terkena!";
}
```

### 3. Menambah Hero Baru

**Struktur:**

```javascript
characters: {
  // ... existing heroes
  archer: {
    id: "archer",
    name: "Putri",
    role: "Ranged DPS",
    maxHp: 130,
    maxMp: 80,
    atk: 30,
    def: 12,
    mag: 10,
    spd: 15,  // Fastest hero
    skills: [
      {
        id: "quickShot",
        name: "Quick Shot",
        cost: 8,
        target: "enemy",
        type: "physical",
        power: 1.0,
        description: "Tembakan cepat dengan busur."
      },
      // ... more skills
    ]
  }
}
```

**Perbarui buildHeroes():**

```javascript
buildHeroes() {
  const heroList = ["soldier", "mage", "healer", "tank", "archer"];  // Tambahkan hero baru
  // ... sisa kode
}
```

**Tambahkan GIF:**

```
gif/archer.gif  // Tambahkan sprite untuk hero baru
```

### 4. Memodifikasi Perilaku Boss

**Ubah Ambang Batas Fase:**

```javascript
updateBossPhase() {
  const ratio = this.boss.hp / this.boss.maxHp;
  let newPhase;

  if (ratio > 0.7) newPhase = 1;        // Fase 1: 70-100%
  else if (ratio > 0.4) newPhase = 2;   // Fase 2: 40-70%
  else newPhase = 3;                     // Fase 3: 0-40%

  // ...
}
```

**Tambahkan Skill Boss Baru:**

```javascript
boss: {
  skills: [
    // ... skill yang ada
    {
      id: "meteorStrike",
      name: "Meteor Strike",
      cost: 35,
      type: "magic",
      power: 2.0,
      pattern: "aoe",
      weight: 1, // Langka tapi menghancurkan
    },
  ];
}
```

### 5. Menyesuaikan Kesulitan

**Buat Tingkat Kesulitan Baru:**

```javascript
difficulties: {
  easy: { bossHp: 0.8, bossAtk: 0.9, heroHp: 1.2 },
  normal: { bossHp: 1.0, bossAtk: 1.0, heroHp: 1.0 },
  hard: { bossHp: 1.3, bossAtk: 1.15, heroHp: 0.95 },
  extreme: {  // Kesulitan baru
    bossHp: 1.6,     // 60% lebih banyak HP
    bossAtk: 1.3,    // 30% lebih banyak damage
    heroHp: 0.85     // 15% lebih sedikit HP
  }
}
```

**Perbarui UI:**

```html
<!-- index.html -->
<button class="option-button" data-difficulty="extreme">Extreme</button>
```

### 6. Menambah Efek Suara

**Setup:**

```javascript
// Tambahkan ke konstruktor Game
this.sounds = {
  hit: new Audio("sounds/hit.mp3"),
  heal: new Audio("sounds/heal.mp3"),
  skill: new Audio("sounds/skill.mp3"),
  victory: new Audio("sounds/victory.mp3"),
};
```

**Putar di applyDamage():**

```javascript
applyDamage(source, target, skill) {
  // ... perhitungan damage

  this.sounds.hit.currentTime = 0;  // Reset ke awal
  this.sounds.hit.play();

  return finalDamage;
}
```

### 7. Sistem Simpan/Muat

**Simpan Status Pertempuran Saat Ini:**

```javascript
saveBattleState() {
  const state = {
    heroes: this.heroes,
    boss: this.boss,
    turnOrder: this.turnOrder,
    turnIndex: this.turnIndex,
    turnCount: this.turnCount,
    difficulty: this.difficulty,
  };

  localStorage.setItem('simple_turnbase_save', JSON.stringify(state));
}

loadBattleState() {
  const saved = localStorage.getItem('simple_turnbase_save');
  if (!saved) return false;

  const state = JSON.parse(saved);
  this.heroes = state.heroes;
  this.boss = state.boss;
  this.turnOrder = state.turnOrder;
  this.turnIndex = state.turnIndex;
  this.turnCount = state.turnCount;
  this.difficulty = state.difficulty;

  this.updateUI();
  return true;
}
```

### 8. Mode Debug

**Tambahkan Panel Debug:**

```javascript
// Tambahkan ke bindMenu()
document.getElementById('debugButton').addEventListener('click', () => {
  this.showDebugPanel();
});

showDebugPanel() {
  console.log('=== STATUS GAME ===');
  console.log('Giliran:', this.turnCount);
  console.log('Fase:', this.bossPhase);
  console.log('Marah:', this.bossEnraged);
  console.log('Urutan Giliran:', this.turnOrder);
  console.log('Hero:', this.heroes);
  console.log('Boss:', this.boss);
}

// Menang/kalah cepat untuk pengujian
quickWin() {
  this.boss.hp = 0;
  this.checkEnd();
}

quickLose() {
  this.heroes.forEach(h => h.hp = 0);
  this.checkEnd();
}
```

### 9. Optimasi Performa

**Kurangi Re-render:**

```javascript
updateUI() {
  // Hanya update jika terlihat
  if (document.hidden) return;

  // Batch update DOM
  requestAnimationFrame(() => {
    // ... semua update DOM di sini
  });
}
```

**Optimalkan Render Giliran:**

```javascript
renderTurnNodes() {
  // Gunakan kembali node yang ada daripada membuat ulang
  const existingNodes = this.turnNodes.querySelectorAll('.turn-node');

  if (existingNodes.length === this.turnOrder.length) {
    // Hanya update, jangan buat ulang
    existingNodes.forEach((node, i) => {
      // ... update konten
    });
  } else {
    // Rebuild penuh
    this.turnNodes.innerHTML = '';
    // ... buat node baru
  }
}
```

### 10. Utilitas Pengujian

**Tambahkan Perintah Cheat:**

```javascript
// Tambahkan shortcut keyboard
document.addEventListener("keydown", (e) => {
  if (!e.ctrlKey) return;

  switch (e.key) {
    case "w": // Ctrl+W = menang instan
      this.boss.hp = 0;
      this.checkEnd();
      break;

    case "l": // Ctrl+L = isi semua limit gauge
      this.heroes.forEach((h) => (h.limit = 100));
      this.updateUI();
      break;

    case "m": // Ctrl+M = MP penuh
      this.heroes.forEach((h) => (h.mp = h.maxMp));
      this.boss.mp = this.boss.maxMp;
      this.updateUI();
      break;

    case "h": // Ctrl+H = heal penuh
      this.heroes.forEach((h) => (h.hp = h.maxHp));
      this.updateUI();
      break;
  }
});
```

---

## Pemecahan Masalah

### Masalah Umum

**1. Skill Tidak Muncul**

- Periksa `hero.mp >= skill.cost`
- Periksa `skill.currentCd === 0`
- Periksa tidak ada status silence pada skill sihir

**2. Damage Terlihat Salah**

- Verifikasi buff/debuff tidak duplikat
- Periksa perhitungan pertahanan termasuk modifier
- Pastikan bonus sinergi diterapkan dengan benar

**3. Urutan Giliran Tidak Benar**

- Verifikasi modifier SPD dihitung ulang setiap rebuild
- Periksa filter unit hidup (hp > 0)
- Pastikan pengurutan menurun (SPD tertinggi pertama)

**4. Efek Status Tidak Berakhir**

- Konfirmasi `applyDurations()` dipanggil di awal giliran
- Periksa durasi berkurang dengan benar
- Verifikasi penghapusan saat durasi <= 0

**5. Rekor Terbaik Tidak Tersimpan**

- Periksa localStorage tersedia (bukan mode private)
- Verifikasi serialisasi JSON berhasil
- Konfirmasi penyimpanan hanya saat menang

---

## Kesimpulan

**Simple Turnbase Game** adalah game turn-based RPG yang solid dengan:

- ✅ Sistem combat lengkap (damage, heal, buffs, debuffs, DOT)
- ✅ AI boss dinamis (phases, enrage, weighted skills)
- ✅ Limit break system untuk momen heroik
- ✅ Story mode dengan animasi typing
- ✅ Beberapa tingkat kesulitan
- ✅ Pelacakan rekor terbaik

**Dapat Diperluas untuk:**

- Menambah hero/skill/boss baru
- Memodifikasi keseimbangan dan kesulitan
- Implementasi sistem penyimpanan
- Menambah efek suara & visual
- Kampanye multi-pertempuran

**Stack Teknologi:**

- Vanilla JavaScript (tanpa framework)
- Pure CSS (tanpa preprocessor)
- Hanya manipulasi DOM
- localStorage untuk persistensi

Dokumentasi ini mencakup semua aspek penting untuk memahami, memodifikasi, dan mengembangkan game lebih lanjut
