const TYPE_SPEED_MS = 35;
const STORY_ADVANCE_DELAY = 1800;
const HERO_REGEN = 3;
const BOSS_REGEN = 4;
const SINGLE_HEAL_RATIO = 0.38;
const GROUP_HEAL_RATIO = 0.24;

const DIFFICULTIES = {
  easy: { bossHp: 0.8, bossAtk: 0.9, heroHp: 1.2 },
  normal: { bossHp: 1.0, bossAtk: 1.0, heroHp: 1.0 },
  hard: { bossHp: 1.3, bossAtk: 1.15, heroHp: 0.95 },
};

const STORY_SCENES = [
  {
    speaker: "Narrator",
    charId: null,
    text: "On the peak of Celestia, an ancient dragon awakens from its slumber...",
  },
  {
    speaker: "Soldier",
    charId: "soldier",
    text: "We have no choice. If this dragon escapes, the city below is doomed.",
  },
  {
    speaker: "Mage",
    charId: "mage",
    text: "I can bend its flames, but I need time. Protect me.",
  },
  {
    speaker: "Healer",
    charId: "healer",
    text: "Do not die for nothing. As long as I stand, you will keep breathing.",
  },
  {
    speaker: "Tank",
    charId: "tank",
    text: "Let it focus on me. You finish it from a safe distance.",
  },
  {
    speaker: "Dragon",
    charId: "dragon",
    text: "You dare challenge the keeper of the skies...",
  },
];

const heroConfigs = [
  {
    id: "soldier",
    name: "Soldier",
    role: "Physical DPS",
    maxHp: 150,
    maxMp: 60,
    atk: 34,
    def: 14,
    mag: 6,
    spd: 12,
    skills: [
      {
        id: "basicSlash",
        name: "Basic Attack",
        cost: 0,
        target: "enemy",
        type: "physical",
        power: 0.9,
        description: "Reliable strike when MP is low.",
      },
      {
        id: "powerSlash",
        name: "Power Slash",
        cost: 14,
        target: "enemy",
        type: "physical",
        power: 1.4,
        description: "Heavy physical blow dealing strong damage.",
      },
      {
        id: "armorBreak",
        name: "Armor Break",
        cost: 16,
        target: "enemy",
        type: "physical",
        power: 1.1,
        debuff: { defDown: 0.2, duration: 2 },
        description: "Strike that reduces the dragon's defense for 2 turns.",
      },
      {
        id: "rally",
        name: "Rally",
        cost: 10,
        target: "allies",
        type: "buff",
        buff: { atkUp: 0.2, duration: 2 },
        description: "Encourage allies, boosting attack for 2 turns.",
      },
    ],
  },
  {
    id: "mage",
    name: "Mage",
    role: "Magic DPS",
    maxHp: 110,
    maxMp: 120,
    atk: 10,
    def: 10,
    mag: 40,
    spd: 14,
    skills: [
      {
        id: "arcaneBolt",
        name: "Arcane Bolt",
        cost: 12,
        target: "enemy",
        type: "magic",
        power: 1.3,
        description: "Precise arcane shot of pure energy.",
      },
      {
        id: "firestorm",
        name: "Firestorm",
        cost: 22,
        target: "all-enemies",
        type: "magic",
        power: 1.1,
        description:
          "AoE inferno that scorches the dragon and leaves burning embers.",
        dot: { amount: 6, duration: 2 },
      },
      {
        id: "manaSurge",
        name: "Mana Surge",
        cost: 18,
        target: "self",
        type: "buff",
        buff: { magUp: 0.3, duration: 2 },
        description: "Channel energy to boost magic for 2 turns.",
      },
      {
        id: "weakSpark",
        name: "Weak Spark",
        cost: 6,
        target: "enemy",
        type: "magic",
        power: 0.8,
        description: "Low-cost spark to conserve mana.",
      },
    ],
  },
  {
    id: "healer",
    name: "Healer",
    role: "Support",
    maxHp: 140,
    maxMp: 90,
    atk: 12,
    def: 16,
    mag: 24,
    spd: 10,
    skills: [
      {
        id: "singleHeal",
        name: "Single Heal",
        cost: 14,
        target: "ally",
        type: "heal",
        healRatio: SINGLE_HEAL_RATIO,
        description: "Restore a large amount of HP to one ally.",
      },
      {
        id: "groupHeal",
        name: "Group Heal",
        cost: 18,
        target: "allies",
        type: "heal",
        healRatio: GROUP_HEAL_RATIO,
        description: "Restore moderate HP to all allies.",
      },
      {
        id: "cleanse",
        name: "Cleanse",
        cost: 12,
        target: "ally",
        type: "cleanse",
        description: "Remove harmful debuffs from one ally.",
      },
      {
        id: "lightStrike",
        name: "Light Strike",
        cost: 4,
        target: "enemy",
        type: "magic",
        power: 0.6,
        description: "Gentle strike of light magic.",
      },
    ],
  },
  {
    id: "tank",
    name: "Tank",
    role: "Defender",
    maxHp: 220,
    maxMp: 60,
    atk: 18,
    def: 28,
    mag: 8,
    spd: 8,
    skills: [
      {
        id: "bash",
        name: "Bash",
        cost: 8,
        target: "enemy",
        type: "physical",
        power: 1.0,
        description: "Shield bash with chance to shake the dragon.",
        debuff: { dmgDown: 0.15, duration: 1 },
      },
      {
        id: "guard",
        name: "Guard",
        cost: 10,
        target: "self",
        type: "buff",
        buff: { guard: 0.4, duration: 1 },
        description: "Brace for impact, cutting incoming damage this turn.",
      },
      {
        id: "taunt",
        name: "Provoke",
        cost: 12,
        target: "self",
        type: "taunt",
        duration: 2,
        description: "Draw the dragon's focus for 2 turns.",
      },
      {
        id: "shieldWall",
        name: "Shield Wall",
        cost: 16,
        target: "allies",
        type: "buff",
        buff: { guardTeam: 0.2, duration: 2 },
        description:
          "Raise shields for the whole squad, reducing damage for 2 turns.",
      },
    ],
  },
];

const bossConfig = {
  id: "boss",
  name: "Obsidian Dragon",
  maxHp: 2200,
  maxMp: 200,
  atk: 42,
  def: 24,
  mag: 36,
  spd: 11,
  status: {},
  skills: [
    {
      id: "crushingClaw",
      name: "Crushing Claw",
      cost: 0,
      type: "physical",
      power: 1.1,
      pattern: "single",
      weight: 4,
    },
    {
      id: "fieryRend",
      name: "Fiery Rend",
      cost: 22,
      type: "magic",
      power: 1.8,
      splashPower: 0.7,
      pattern: "single-splash",
      weight: 3,
    },
    {
      id: "cinderWave",
      name: "Cinder Wave",
      cost: 18,
      type: "magic",
      power: 1.15,
      pattern: "aoe",
      weight: 3,
    },
    {
      id: "obliterate",
      name: "Obliterate",
      cost: 32,
      type: "physical",
      power: 2.4,
      pattern: "single",
      weight: 1,
    },
  ],
};

class Game {
  constructor() {
    this.heroRow = document.getElementById("heroRow");
    this.skillButtons = document.getElementById("skillButtons");
    this.skillInfo = document.getElementById("skillInfo");
    this.skillBar = document.getElementById("skillBar");
    this.waitingText = document.getElementById("waitingText");
    this.targetLayer = document.getElementById("targetLayer");
    this.targetOptions = document.getElementById("targetOptions");
    this.targetCancel = document.getElementById("targetCancel");
    this.turnNodes = document.getElementById("turnNodes");
    this.logEl = document.getElementById("logBody");
    this.startScreen = document.getElementById("startScreen");
    this.storyScreen = document.getElementById("storyScreen");
    this.battleScreen = document.getElementById("battleScreen");
    this.storyName = document.getElementById("storyName");
    this.storyText = document.getElementById("storyText");
    this.storyPortrait = document.getElementById("storyPortrait");
    this.storyPauseBtn = document.getElementById("storyPause");
    this.storySkipBtn = document.getElementById("storySkip");

    this.difficulty = "normal";
    this.state = "start";
    this.pendingSkill = null;
    this.bossEnragedNotified = false;
    this.bossEnraged = false;
    this.bossWindupSkill = null;
    this.targeting = false;
    this.currentSceneIndex = 0;
    this.currentCharIndex = 0;
    this.typingInterval = null;
    this.autoAdvanceTimeout = null;
    this.isTyping = false;
    this.isPaused = false;

    this.bindDifficultyControls();
    this.bindMenu();
    this.prepareNewRun();
    this.showScreen("start");
  }

  bindDifficultyControls() {
    const options = document.querySelectorAll(
      "#difficultyOptions .option-button"
    );
    options.forEach((btn) => {
      btn.addEventListener("click", () => {
        options.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.difficulty = btn.dataset.difficulty;
      });
    });
  }

  bindMenu() {
    document.getElementById("startButton").addEventListener("click", () => {
      this.prepareNewRun();
      this.startStory();
    });

    this.storyPauseBtn.addEventListener("click", () => this.toggleStoryPause());
    this.storySkipBtn.addEventListener("click", () => this.skipStory());

    document.getElementById("restart").addEventListener("click", () => {
      this.prepareNewRun();
      this.showScreen("start");
    });

    this.targetCancel.addEventListener("click", () => {
      this.cancelTargetSelection();
    });
  }

  showScreen(screen) {
    this.startScreen.classList.toggle("hidden", screen !== "start");
    this.storyScreen.classList.toggle("hidden", screen !== "story");
    this.battleScreen.classList.toggle("hidden", screen !== "battle");
  }

  prepareNewRun() {
    this.heroes = this.buildHeroes();
    this.boss = this.buildBoss();
    this.turnOrder = [];
    this.turnIndex = 0;
    this.state = "start";
    this.pendingSkill = null;
    this.bossEnragedNotified = false;
    this.bossEnraged = false;
    this.bossWindupSkill = null;
    this.targeting = false;
    this.closeTargetSelect();
    document.getElementById("gameOver").style.display = "none";
    this.logEl.innerHTML = "";
    this.renderHeroes();
    this.rebuildTurnOrder();
    this.updateUI();
  }

  buildHeroes() {
    const diff = DIFFICULTIES[this.difficulty] || DIFFICULTIES.normal;
    return heroConfigs.map((h) => {
      const maxHp = Math.round(h.maxHp * diff.heroHp);
      return {
        ...h,
        maxHp,
        hp: maxHp,
        mp: h.maxMp,
        status: {},
      };
    });
  }

  buildBoss() {
    const diff = DIFFICULTIES[this.difficulty] || DIFFICULTIES.normal;
    const maxHp = Math.round(bossConfig.maxHp * diff.bossHp);
    return {
      ...bossConfig,
      maxHp,
      hp: maxHp,
      atk: Math.round(bossConfig.atk * diff.bossAtk),
      mp: bossConfig.maxMp,
      status: {},
    };
  }

  startStory() {
    this.state = "story";
    this.showScreen("story");
    this.resetStoryState();
    this.showScene(0);
  }

  resetStoryState() {
    this.currentSceneIndex = 0;
    this.currentCharIndex = 0;
    this.isTyping = false;
    this.isPaused = false;
    this.storyPauseBtn.textContent = "Pause";
    this.clearStoryTimers();
  }

  clearStoryTimers() {
    if (this.typingInterval) clearInterval(this.typingInterval);
    if (this.autoAdvanceTimeout) clearTimeout(this.autoAdvanceTimeout);
    this.typingInterval = null;
    this.autoAdvanceTimeout = null;
  }

  showScene(index) {
    this.clearStoryTimers();
    this.currentSceneIndex = index;
    const scene = STORY_SCENES[index];
    this.storyName.textContent = scene.speaker;
    if (scene.charId) {
      this.storyPortrait.src = `gif/${scene.charId}.gif`;
      this.storyPortrait.style.display = "block";
    } else {
      this.storyPortrait.style.display = "none";
    }

    this.storyText.textContent = "";
    this.currentCharIndex = 0;
    this.isTyping = true;

    this.typingInterval = setInterval(() => {
      if (this.currentCharIndex < scene.text.length) {
        this.storyText.textContent += scene.text[this.currentCharIndex];
        this.currentCharIndex += 1;
      } else {
        clearInterval(this.typingInterval);
        this.isTyping = false;
        if (!this.isPaused) {
          this.autoAdvanceTimeout = setTimeout(
            () => this.nextScene(),
            STORY_ADVANCE_DELAY
          );
        }
      }
    }, TYPE_SPEED_MS);
  }

  nextScene() {
    if (this.currentSceneIndex < STORY_SCENES.length - 1) {
      this.showScene(this.currentSceneIndex + 1);
    } else {
      this.endStoryAndStartBattle();
    }
  }

  toggleStoryPause() {
    this.isPaused = !this.isPaused;
    this.storyPauseBtn.textContent = this.isPaused ? "Resume" : "Pause";
    if (!this.isPaused && !this.isTyping && !this.autoAdvanceTimeout) {
      this.autoAdvanceTimeout = setTimeout(
        () => this.nextScene(),
        STORY_ADVANCE_DELAY
      );
    } else if (this.isPaused && this.autoAdvanceTimeout) {
      clearTimeout(this.autoAdvanceTimeout);
      this.autoAdvanceTimeout = null;
    }
  }

  skipStory() {
    this.endStoryAndStartBattle();
  }

  endStoryAndStartBattle() {
    this.clearStoryTimers();
    this.state = "playing";
    this.showScreen("battle");
    this.log(
      "Tip: Armor Break lowers the dragon's DEF—pile on physical strikes while it's weakened."
    );
    this.log(
      "Tip: Burning ticks after actions. Keep the flames alive for sustained damage."
    );
    this.log(
      "Tip: Guard and Shield Wall blunt heavy blows; use them before big attacks."
    );
    this.startTurn();
  }

  renderHeroes() {
    this.heroRow.innerHTML = "";
    this.heroes.forEach((hero) => {
      const card = document.createElement("div");
      card.className = "hero-card";
      card.id = `${hero.id}Card`;
      card.innerHTML = `
        <div class="hero-top">
          <div class="hero-avatar"><img src="gif/${hero.id}.gif" alt="${hero.name}" /></div>
          <div>
            <div class="hero-name">${hero.name}</div>
            <div class="hero-role">${hero.role}</div>
            <div class="status-tag" id="${hero.id}Status" style="display:none"></div>
          </div>
        </div>
        <div class="meter" style="margin-top:10px;">
          <div class="meter-label"><span>HP</span><span id="${hero.id}HpText"></span></div>
          <div class="meter-bar"><div class="meter-fill hp-fill" id="${hero.id}HpBar"></div></div>
        </div>
        <div class="meter" style="margin-top:8px;">
          <div class="meter-label"><span>MP</span><span id="${hero.id}MpText"></span></div>
          <div class="meter-bar"><div class="meter-fill mp-fill" id="${hero.id}MpBar"></div></div>
        </div>
        <div class="stat-grid">
          <div class="stat-chip">ATK<strong>${hero.atk}</strong></div>
          <div class="stat-chip">DEF<strong>${hero.def}</strong></div>
          <div class="stat-chip">MAG<strong>${hero.mag}</strong></div>
          <div class="stat-chip">SPD<strong>${hero.spd}</strong></div>
        </div>
      `;
      this.heroRow.appendChild(card);
    });
  }

  log(message) {
    const entry = document.createElement("div");
    entry.className = "log-line";
    entry.textContent = message;
    this.logEl.prepend(entry);
    const maxEntries = 6;
    while (this.logEl.children.length > maxEntries) {
      this.logEl.removeChild(this.logEl.lastElementChild);
    }
  }

  getHero(id) {
    return this.heroes.find((h) => h.id === id);
  }

  startTurn() {
    if (this.state !== "playing") return;
    this.applyDurations();
    const current = this.turnOrder[this.turnIndex];
    this.highlightTurn();
    if (current === "boss") {
      this.waitingText.textContent = "Dragon is acting...";
      this.skillButtons.innerHTML = "";
      this.skillInfo.style.display = "none";
      setTimeout(() => this.dragonAct(), 700);
    } else {
      const hero = this.getHero(current);
      if (!hero || hero.hp <= 0) {
        this.advanceTurn();
        return;
      }
      this.waitingText.textContent = `${hero.name}'s turn`;
      this.renderSkillBar(hero);
    }
  }

  highlightTurn() {
    this.heroes.forEach((hero) => {
      const card = document.getElementById(`${hero.id}Card`);
      if (this.turnOrder[this.turnIndex] === hero.id && hero.hp > 0) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    });
    this.renderTurnNodes();
  }

  rebuildTurnOrder() {
    const livingUnits = [...this.heroes, this.boss].filter((u) => u.hp > 0);
    livingUnits.sort((a, b) => (b.spd || 10) - (a.spd || 10));
    this.turnOrder = livingUnits.map((u) => u.id);
    this.turnIndex = 0;
    this.renderTurnNodes();
  }

  renderTurnNodes() {
    this.turnNodes.innerHTML = "";
    for (let i = 0; i < this.turnOrder.length; i++) {
      const idx = (this.turnIndex + i) % this.turnOrder.length;
      const id = this.turnOrder[idx];
      const node = document.createElement("div");
      node.className = "turn-node" + (i === 0 ? " active" : "");
      const img = document.createElement("img");
      const src = id === "boss" ? "gif/dragon.gif" : `gif/${id}.gif`;
      img.src = src;
      img.alt = id;
      node.appendChild(img);
      this.turnNodes.appendChild(node);
    }
  }

  renderSkillBar(hero) {
    this.skillButtons.innerHTML = "";
    this.skillInfo.style.display = "none";
    hero.skills.forEach((skill) => {
      const btn = document.createElement("button");
      btn.className = "skill-button";
      btn.innerHTML = `<div><strong>${skill.name}</strong></div>
        <div class="skill-meta"><span>${skill.target}</span><span>MP ${skill.cost}</span></div>`;
      btn.disabled = hero.mp < skill.cost || hero.hp <= 0;
      btn.addEventListener("mouseenter", () => {
        this.showSkillInfo(skill, btn);
      });
      btn.addEventListener("mouseleave", () => {
        this.hideSkillInfo();
      });
      btn.addEventListener("click", () => {
        this.pendingSkill = { hero, skill };
        this.prepareTargeting(hero, skill);
      });
      this.skillButtons.appendChild(btn);
    });
  }

  showSkillInfo(skill, button) {
    const targetLabel =
      skill.target === "enemy"
        ? "Single Target"
        : skill.target === "all-enemies"
        ? "AoE Enemy"
        : skill.target === "ally"
        ? "Ally"
        : skill.target === "allies"
        ? "All Allies"
        : "Self";
    this.skillInfo.innerHTML = `
      <div class="skill-tooltip-title">${skill.name}</div>
      <div class="skill-tooltip-meta">${targetLabel} · MP ${skill.cost}</div>
      <div class="skill-tooltip-text">${skill.description}</div>
    `;
    this.skillInfo.style.display = "block";
    const btnRect = button.getBoundingClientRect();
    const barRect = this.skillBar.getBoundingClientRect();
    const tooltipWidth = this.skillInfo.offsetWidth;
    const left = Math.min(
      Math.max(
        btnRect.left - barRect.left + btnRect.width / 2 - tooltipWidth / 2,
        8
      ),
      barRect.width - tooltipWidth - 8
    );
    const top = btnRect.top - barRect.top - this.skillInfo.offsetHeight - 12;

    this.skillInfo.style.left = `${left}px`;
    this.skillInfo.style.top = `${top}px`;
  }

  hideSkillInfo() {
    this.skillInfo.style.display = "none";
  }

  prepareTargeting(hero, skill) {
    if (["self", "allies", "all-enemies"].includes(skill.target)) {
      this.executeSkill(hero, skill);
    } else if (skill.target === "enemy") {
      this.executeSkill(hero, skill, this.boss);
    } else {
      this.openTargetSelect(
        skill.target === "ally"
          ? this.heroes.filter((h) => h.hp > 0)
          : this.heroes
      );
    }
  }

  openTargetSelect(targets) {
    this.targeting = true;
    this.targetOptions.innerHTML = "";
    targets.forEach((t) => {
      const btn = document.createElement("button");
      btn.textContent = `${t.name} (${t.hp}/${t.maxHp})`;
      btn.addEventListener("click", () => {
        this.executeSkill(this.pendingSkill.hero, this.pendingSkill.skill, t);
        this.closeTargetSelect();
      });
      this.targetOptions.appendChild(btn);
    });
    this.targetLayer.style.display = "flex";
    this.highlightTargets(targets);
  }

  closeTargetSelect() {
    this.targeting = false;
    this.targetLayer.style.display = "none";
    this.clearTargetHighlights();
  }

  highlightTargets(targets) {
    this.clearTargetHighlights();
    targets.forEach((t) => {
      if (t.id === "boss") {
        const bossCard = document.getElementById("bossCard");
        bossCard.classList.add("targetable");
      } else {
        const card = document.getElementById(`${t.id}Card`);
        if (card) card.classList.add("targetable");
      }
    });
  }

  clearTargetHighlights() {
    document
      .querySelectorAll(".targetable")
      .forEach((el) => el.classList.remove("targetable"));
  }

  cancelTargetSelection() {
    if (!this.targeting) return;
    const current = this.turnOrder[this.turnIndex];
    if (current !== "boss") {
      const hero = this.getHero(current);
      if (hero) this.waitingText.textContent = `${hero.name}'s turn`;
    }
    this.pendingSkill = null;
    this.skillInfo.style.display = "none";
    this.closeTargetSelect();
  }

  applyDurations() {
    const decay = (status) => {
      Object.keys(status).forEach((k) => {
        if (k === "dot") return;
        if (status[k] && typeof status[k].duration === "number") {
          status[k].duration -= 1;
          if (status[k].duration <= 0) delete status[k];
        }
      });
    };
    this.heroes.forEach((h) => decay(h.status || {}));
    decay(this.boss.status || {});
  }

  applyEndOfTurnRegen() {
    this.heroes.forEach((h) => {
      if (h.hp > 0) {
        h.mp = Math.min(h.maxMp, h.mp + HERO_REGEN);
      }
    });
    this.boss.mp = Math.min(this.boss.maxMp, this.boss.mp + BOSS_REGEN);
  }

  computeDefense(target) {
    const baseDef = target.id === "boss" ? this.boss.def : target.def;
    let modifier = 1;

    if (target.status?.defDown) {
      modifier -= target.status.defDown.amount;
    }

    return Math.max(1, Math.round(baseDef * modifier));
  }

  applyDamage(source, target, skill) {
    const isMagic = skill.type === "magic";
    const attackStat = isMagic ? source.mag : source.atk;
    const defense = this.computeDefense(target);
    let base = Math.max(0, attackStat - defense * 0.5);
    const power = skill.power || 1;
    let buffMulti = 1;
    if (source.status?.atkUp && !isMagic) buffMulti += source.status.atkUp.amount;
    if (source.status?.magUp && isMagic) buffMulti += source.status.magUp.amount;
    if (target.status?.dmgDown) buffMulti -= target.status.dmgDown.amount;
    const guardCut = target.status?.guard?.amount || 0;
    const guardTeam = target.status?.guardTeam?.amount || 0;
    let synergyMulti = 1;
    if (!isMagic && target.status?.defDown) synergyMulti += 0.15;
    if (source.id === "tank" && this.boss.status?.dot && target.id === "boss") {
      synergyMulti += 0.1;
    }
    const enrageMultiplier =
      source.id === "boss" && this.isDragonEnraged() ? 2 : 1;
    const damage = Math.max(
      8,
      Math.round(base * power * buffMulti * synergyMulti * (1 - guardCut - guardTeam))
    );
    const finalDamage = Math.max(8, Math.round(damage * enrageMultiplier));
    target.hp = Math.max(0, target.hp - finalDamage);
    if (skill.debuff) {
      target.status = target.status || {};
      Object.keys(skill.debuff).forEach((key) => {
        if (key !== "duration") {
          target.status[key] = {
            amount: skill.debuff[key],
            duration: skill.debuff.duration,
          };
        }
      });
    }
    if (skill.dot) {
      target.status = target.status || {};
      target.status.dot = {
        amount: skill.dot.amount,
        duration: skill.dot.duration,
      };
    }
    return finalDamage;
  }

  applyHeal(source, target, skill) {
    const ratio = skill.healRatio || SINGLE_HEAL_RATIO;
    const amount = Math.round(target.maxHp * ratio);
    target.hp = Math.min(target.maxHp, target.hp + amount);
    return amount;
  }

  executeSkill(user, skill, target = null) {
    if (user.mp < skill.cost) return;
    user.mp -= skill.cost;
    if (!target) target = skill.target === "self" ? user : null;

    if (skill.type === "physical" || skill.type === "magic") {
      const tgt = target || this.boss;
      const dmg = this.applyDamage(user, tgt, skill);
      const name = tgt.id === "boss" ? this.boss.name : tgt.name;
      this.log(`${user.name} used ${skill.name} on ${name} for ${dmg} damage.`);
      if (skill.execute && tgt.hp / tgt.maxHp < skill.execute) {
        tgt.hp = Math.max(0, tgt.hp - 40);
        this.log(`${skill.name} bites harder against weakened foes!`);
      }
    } else if (skill.type === "heal") {
      if (skill.target === "allies") {
        this.heroes.forEach((h) => {
          if (h.hp > 0) {
            const healed = this.applyHeal(user, h, skill);
            this.log(`${user.name} heals ${h.name} for ${healed}.`);
          }
        });
      } else if (target) {
        const healed = this.applyHeal(user, target, skill);
        this.log(`${user.name} heals ${target.name} for ${healed}.`);
      }
    } else if (skill.type === "buff") {
      const applyBuff = (t) => {
        t.status = t.status || {};
        Object.keys(skill.buff).forEach((key) => {
          if (key !== "duration") {
            t.status[key] = {
              amount: skill.buff[key],
              duration: skill.buff.duration,
            };
          }
        });
      };
      if (skill.target === "allies") this.heroes.forEach(applyBuff);
      else applyBuff(target || user);
      this.log(`${user.name} uses ${skill.name} to empower allies.`);
    } else if (skill.type === "cleanse" && target) {
      target.status = {};
      this.log(`${user.name} cleansed ${target.name}.`);
    } else if (skill.type === "taunt") {
      this.boss.status.taunt = {
        amount: 1,
        duration: skill.duration,
        target: user.id,
      };
      this.log(`${user.name} provokes the dragon!`);
    }

    this.resolveDot();
    this.updateUI();
    this.checkEnd();
    if (this.state === "playing") {
      this.advanceTurn();
    }
  }

  resolveDot() {
    const targets = [...this.heroes, this.boss];
    targets.forEach((unit) => {
      if (unit.status?.dot) {
        const dot = unit.status.dot;
        unit.hp = Math.max(0, unit.hp - dot.amount);
        const name = unit.id === "boss" ? this.boss.name : unit.name;
        this.log(`Burning embers scorch ${name} for ${dot.amount}.`);
        dot.duration -= 1;
        if (dot.duration <= 0) {
          delete unit.status.dot;
          if (unit.id === "boss") {
            this.log("The flames die down around the dragon.");
          }
        }
      }
    });
  }

  dragonAct() {
    const boss = this.boss;
    const aliveHeroes = this.heroes.filter((h) => h.hp > 0);
    if (!aliveHeroes.length) {
      this.checkEnd();
      return;
    }

    this.isDragonEnraged();
    let choice = this.bossWindupSkill;

    if (!choice) {
      choice = this.chooseDragonSkill();
      if (this.bossEnraged && choice.pattern === "aoe") {
        this.log("The dragon inhales sharply, flames gathering in its throat!");
        this.bossWindupSkill = choice;
        this.advanceTurn();
        return;
      }
    } else {
      this.log("The dragon unleashes its stored power in a blazing roar!");
      this.bossWindupSkill = null;
    }

    boss.mp = Math.max(0, boss.mp - choice.cost);

    if (choice.pattern === "aoe") {
      aliveHeroes.forEach((hero) => {
        if (hero.hp > 0) {
          const dmg = this.applyDamage(boss, hero, choice);
          this.log(`Dragon scorched ${hero.name} for ${dmg} damage.`);
        }
      });
    } else if (choice.pattern === "single-splash") {
      const targetHero = this.selectDragonTarget(aliveHeroes) || aliveHeroes[0];
      const mainDmg = this.applyDamage(boss, targetHero, choice);
      this.log(
        `Dragon unleashed a fiery blast on ${targetHero.name} for ${mainDmg} damage.`
      );
      aliveHeroes
        .filter((h) => h.id !== targetHero.id)
        .forEach((hero) => {
          const splashSkill = { ...choice, power: choice.splashPower };
          const splashDmg = this.applyDamage(boss, hero, splashSkill);
          this.log(`Splash fire singed ${hero.name} for ${splashDmg} damage.`);
        });
    } else {
      const targetHero = this.selectDragonTarget(aliveHeroes) || aliveHeroes[0];
      const dmg = this.applyDamage(boss, targetHero, choice);
      if (choice.id === "obliterate") {
        this.log(
          `Dragon used a devastating attack on ${targetHero.name} for ${dmg} damage.`
        );
      } else {
        this.log(
          `Dragon attacked ${targetHero.name} with a basic strike for ${dmg} damage.`
        );
      }
    }

    this.resolveDot();
    this.updateUI();
    this.checkEnd();
    if (this.state === "playing") this.advanceTurn();
  }

  chooseDragonSkill() {
    const enraged = this.isDragonEnraged() || this.bossEnraged;
    const weightedSkills = (
      enraged
        ? this.boss.skills.map((s) => ({
            ...s,
            weight:
              s.id === "cinderWave"
                ? (s.weight || 1) + 2
                : s.id === "fieryRend"
                ? (s.weight || 1) + 1
                : s.id === "obliterate"
                ? (s.weight || 1) + 1
                : s.weight || 1,
          }))
        : this.boss.skills
    ).filter((s) => s.cost === 0 || this.boss.mp >= s.cost);

    const pool = weightedSkills.length ? weightedSkills : [this.boss.skills[0]];
    const weighted = [];
    pool.forEach((skill) => {
      const weight = skill.weight || 1;
      for (let i = 0; i < weight; i++) weighted.push(skill);
    });
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  selectDragonTarget(aliveHeroes) {
    if (!aliveHeroes.length) return null;
    const tauntTarget =
      this.boss.status.taunt && this.getHero(this.boss.status.taunt.target);
    if (tauntTarget && tauntTarget.hp > 0 && Math.random() < 0.7) {
      this.log(`Dragon is provoked and focuses the ${tauntTarget.name}!`);
      return tauntTarget;
    }
    return aliveHeroes.reduce((lowest, hero) => {
      return hero.hp / hero.maxHp < lowest.hp / lowest.maxHp ? hero : lowest;
    }, aliveHeroes[0]);
  }

  isDragonEnraged() {
    const enraged = this.boss.hp <= this.boss.maxHp * 0.5;
    if (enraged && !this.bossEnragedNotified) {
      this.log(`${this.boss.name} is enraged! Its damage surges.`);
      this.bossEnragedNotified = true;
    }
    if (enraged) this.bossEnraged = true;
    return enraged;
  }

  advanceTurn() {
    const nextIndex = (this.turnIndex + 1) % this.turnOrder.length;
    this.applyEndOfTurnRegen();
    if (nextIndex === 0) {
      this.rebuildTurnOrder();
    } else {
      this.turnIndex = nextIndex;
    }
    this.updateUI();
    setTimeout(() => this.startTurn(), 600);
  }

  updateUI() {
    const bossHpPct = (this.boss.hp / this.boss.maxHp) * 100;
    const bossMpPct = (this.boss.mp / this.boss.maxMp) * 100;
    document.getElementById("bossHpBar").style.width = `${bossHpPct}%`;
    document.getElementById("bossMpBar").style.width = `${bossMpPct}%`;
    document.getElementById("bossHpText").textContent = `${this.boss.hp}/${this.boss.maxHp}`;
    document.getElementById("bossMpText").textContent = `${this.boss.mp}/${this.boss.maxMp}`;
    const bossStatus = document.getElementById("bossStatus");
    const bossLabels = [];
    if (this.boss.status?.dot) bossLabels.push(`Burning (${this.boss.status.dot.duration})`);
    if (this.boss.status?.defDown)
      bossLabels.push(`DEF↓ (${this.boss.status.defDown.duration})`);
    if (this.boss.status?.taunt)
      bossLabels.push(`Provoked (${this.boss.status.taunt.duration})`);
    bossStatus.style.display = bossLabels.length ? "inline-block" : "none";
    bossStatus.textContent = bossLabels.join(" · ");

    this.heroes.forEach((h) => {
      const hpPct = (h.hp / h.maxHp) * 100;
      const mpPct = (h.mp / h.maxMp) * 100;
      document.getElementById(`${h.id}HpBar`).style.width = `${hpPct}%`;
      document.getElementById(`${h.id}MpBar`).style.width = `${mpPct}%`;
      document.getElementById(`${h.id}HpText`).textContent = `${h.hp}/${h.maxHp}`;
      document.getElementById(`${h.id}MpText`).textContent = `${h.mp}/${h.maxMp}`;
      const status = document.getElementById(`${h.id}Status`);
      const format = (label, effect) => {
        if (!effect) return null;
        const duration = typeof effect.duration === "number" ? ` (${effect.duration})` : "";
        return `${label}${duration}`;
      };
      const labels = [
        format("ATK↑", h.status.atkUp),
        format("MAG↑", h.status.magUp),
        format("Guard", h.status.guard),
        format("Shielded", h.status.guardTeam),
        format("ATK↓", h.status.atkDown),
        format("DEF↓", h.status.defDown),
      ].filter(Boolean);
      status.textContent = labels.join(" · ");
      status.style.display = labels.length ? "inline-block" : "none";
    });
  }

  checkEnd() {
    const heroesAlive = this.heroes.some((h) => h.hp > 0);
    if (this.boss.hp <= 0) {
      this.state = "victory";
      document.getElementById("gameOver").style.display = "flex";
      document.getElementById("gameOverTitle").textContent = "Victory";
      document.getElementById("gameOverTitle").className = "victory";
      document.getElementById("gameOverText").textContent =
        "The dragon collapses under your tactics.";
    } else if (!heroesAlive) {
      this.state = "defeat";
      document.getElementById("gameOver").style.display = "flex";
      document.getElementById("gameOverTitle").textContent = "Defeat";
      document.getElementById("gameOverTitle").className = "defeat";
      document.getElementById("gameOverText").textContent =
        "Your party falls to the dragon's rage.";
    }
  }
}

new Game();
