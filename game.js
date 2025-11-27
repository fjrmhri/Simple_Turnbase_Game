const DIFFICULTIES = {
  easy: { label: 'Easy', heroHp: 1.1, heroAtk: 1.05, bossHp: 0.9, bossAtk: 0.9, mp: 1.05 },
  normal: { label: 'Normal', heroHp: 1, heroAtk: 1, bossHp: 1, bossAtk: 1, mp: 1 },
  hard: { label: 'Hard', heroHp: 0.95, heroAtk: 0.95, bossHp: 1.2, bossAtk: 1.1, mp: 0.9 }
};

const MODIFIERS = [
  { id: 'glass', label: 'Glass Cannon', heroHp: 0.9, heroAtk: 1.15 },
  { id: 'mana', label: 'Mana Drought', mp: 0.75 },
  { id: 'nohealer', label: 'No Healer', disableHero: 'healer' }
];

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const HERO_TEMPLATES = [
  {
    id: 'tank',
    name: 'Aegis',
    maxHp: 520,
    maxMp: 80,
    atk: 46,
    def: 22,
    mag: 16,
    spd: 14,
    skills: [
      { id: 'strike', name: 'Shield Slam', type: 'physical', power: 1, cost: 5, target: 'boss', description: 'Solid blow with shield.' },
      { id: 'guard', name: 'Bulwark', type: 'guard', power: 0.35, cost: 10, target: 'team', duration: 1, description: 'Reduce team damage this turn.' },
      { id: 'break', name: 'Armor Break', type: 'debuff', debuff: { defDown: 0.2, duration: 2 }, power: 0.9, cost: 12, target: 'boss', cooldown: 2, description: 'Lower boss defense.' },
      { id: 'fortify', name: 'Fortify', type: 'buff', buff: { guard: 0.5, duration: 1 }, power: 0, cost: 8, target: 'ally', cooldown: 2, description: 'Guard self strongly.' }
    ]
  },
  {
    id: 'soldier',
    name: 'Vale',
    maxHp: 440,
    maxMp: 90,
    atk: 60,
    def: 16,
    mag: 18,
    spd: 20,
    skills: [
      { id: 'slash', name: 'Quick Slash', type: 'physical', power: 1, cost: 6, target: 'boss' },
      { id: 'lunge', name: 'Piercing Lunge', type: 'physical', power: 1.25, cost: 14, target: 'boss', cooldown: 2, description: 'Higher damage strike.' },
      { id: 'rally', name: 'Rally', type: 'buff', buff: { atkUp: 0.15, duration: 2 }, power: 0, cost: 12, target: 'team', cooldown: 3, description: 'Boost team attack.' }
    ]
  },
  {
    id: 'mage',
    name: 'Lyra',
    maxHp: 360,
    maxMp: 120,
    atk: 28,
    def: 12,
    mag: 70,
    spd: 18,
    skills: [
      { id: 'bolt', name: 'Arcane Bolt', type: 'magic', power: 1.05, cost: 10, target: 'boss' },
      { id: 'nova', name: 'Star Nova', type: 'magic', power: 0.95, cost: 16, target: 'boss', cooldown: 2 },
      { id: 'veil', name: 'Veil', type: 'buff', buff: { dmgDown: 0.2, duration: 2 }, power: 0, cost: 12, target: 'team' }
    ]
  },
  {
    id: 'healer',
    name: 'Seren',
    maxHp: 380,
    maxMp: 140,
    atk: 22,
    def: 14,
    mag: 55,
    spd: 16,
    skills: [
      { id: 'heal', name: 'Radiant Heal', type: 'heal', power: 1.05, cost: 12, target: 'ally' },
      { id: 'groupheal', name: 'Soothing Light', type: 'heal', power: 0.85, cost: 18, target: 'team', cooldown: 2 },
      { id: 'bless', name: 'Blessing', type: 'buff', buff: { atkUp: 0.18, duration: 2 }, power: 0, cost: 12, target: 'team' }
    ]
  }
];

const BOSS_TEMPLATE = {
  id: 'boss',
  name: 'Elder Dragon',
  maxHp: 2600,
  maxMp: 220,
  atk: 68,
  def: 22,
  mag: 52,
  spd: 20,
  phases: [
    { threshold: 0.7, weights: { claw: 3, flame: 2, tail: 1 } },
    { threshold: 0.4, weights: { claw: 2, flame: 3, roar: 2 } },
    { threshold: 0, weights: { flame: 2, roar: 3, crush: 2 } }
  ],
  skills: {
    claw: { id: 'claw', name: 'Rending Claw', type: 'physical', power: 2.4, cost: 12, target: 'random' },
    tail: { id: 'tail', name: 'Tail Swipe', type: 'physical', power: 1.6, cost: 14, target: 'team' },
    flame: { id: 'flame', name: 'Searing Flame', type: 'magic', power: 1.55, cost: 16, target: 'team', dot: { amount: 22, duration: 2 } },
    roar: { id: 'roar', name: 'Tyrant Roar', type: 'debuff', power: 1.35, cost: 18, target: 'team', debuff: { defDown: 0.18, duration: 2 } },
    crush: { id: 'crush', name: 'Crushing Dive', type: 'physical', power: 2.8, cost: 20, target: 'weakest' }
  }
};

const STORY_SCENES = [
  { speaker: 'Narrator', charId: null, text: 'At the peak of Celestia, an ancient dragon awakens from its long slumber...' },
  { speaker: 'Soldier', charId: 'soldier', text: 'We have no other choice. If this dragon escapes, the city below will be destroyed.' },
  { speaker: 'Mage', charId: 'mage', text: 'I can bend its flames, but I need time. Protect me.' },
  { speaker: 'Healer', charId: 'healer', text: 'Do not die for nothing. As long as I stand, you will keep breathing.' },
  { speaker: 'Tank', charId: 'tank', text: 'Let it focus on me. Finish it from a safe distance.' },
  { speaker: 'Dragon', charId: 'dragon', text: 'You dare challenge the guardian of the skies...' },
  { speaker: 'Narrator', charId: null, text: 'Steel meets flame as the battle begins!' }
];

class Game {
  constructor() {
    this.mode = 'setup';
    this.turnOrder = [];
    this.turnIndex = 0;
    this.stats = { turns: 0, damage: {}, healing: {} };
    this.storyIndex = 0;
    this.isTyping = false;
    this.typingInterval = null;
    this.bindUI();
    this.renderOptions();
    this.resetState();
  }

  bindUI() {
    this.heroRoot = document.getElementById('heroes');
    this.bossCard = document.getElementById('boss-card');
    this.skillBar = document.getElementById('skill-bar');
    this.logEl = document.getElementById('log');
    this.bossIntent = document.getElementById('boss-intent');
    document.getElementById('next-turn').addEventListener('click', () => this.endPlayerTurn());
    document.getElementById('restart').addEventListener('click', () => window.location.reload());
    document.getElementById('play-again').addEventListener('click', () => window.location.reload());
    document.getElementById('start-btn').addEventListener('click', () => this.startStory());
    document.getElementById('storyNext').addEventListener('click', () => this.handleNextStory());
    document.getElementById('storySkip').addEventListener('click', () => this.skipStory());
  }

  renderOptions() {
    const diffSelect = document.getElementById('difficulty-select');
    Object.entries(DIFFICULTIES).forEach(([id, diff]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = diff.label;
      diffSelect.appendChild(opt);
    });
    diffSelect.value = 'normal';
    const modWrap = document.getElementById('modifier-container');
    MODIFIERS.forEach((mod) => {
      const label = document.createElement('label');
      label.className = 'modifier-pill';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = mod.id;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + mod.label));
      modWrap.appendChild(label);
    });
  }

  getDifficulty() {
    const select = document.getElementById('difficulty-select');
    return select.value || 'normal';
  }

  getModifiers() {
    const wrap = document.getElementById('modifier-container');
    return Array.from(wrap.querySelectorAll('input:checked')).map((n) => n.value);
  }

  resetState() {
    const diff = DIFFICULTIES[this.getDifficulty()] || DIFFICULTIES.normal;
    const mods = this.getModifiers().map((id) => MODIFIERS.find((m) => m.id === id));
    this.heroes = HERO_TEMPLATES.filter((h) => !mods.some((m) => m?.disableHero === h.id)).map((h) => ({
      ...clone(h),
      hp: Math.round(h.maxHp * diff.heroHp * mods.reduce((m, v) => m * (v?.heroHp || 1), 1)),
      maxHp: Math.round(h.maxHp * diff.heroHp * mods.reduce((m, v) => m * (v?.heroHp || 1), 1)),
      atk: Math.round(h.atk * diff.heroAtk * mods.reduce((m, v) => m * (v?.heroAtk || 1), 1)),
      mp: Math.round(h.maxMp * diff.mp * mods.reduce((m, v) => m * (v?.mp || 1), 1)),
      maxMp: Math.round(h.maxMp * diff.mp * mods.reduce((m, v) => m * (v?.mp || 1), 1)),
      status: {},
      alive: true
    }));
    const boss = BOSS_TEMPLATE;
    this.boss = {
      ...clone(boss),
      hp: Math.round(boss.maxHp * diff.bossHp),
      maxHp: Math.round(boss.maxHp * diff.bossHp),
      atk: Math.round(boss.atk * diff.bossAtk),
      mp: Math.round(boss.maxMp * diff.mp),
      maxMp: Math.round(boss.maxMp * diff.mp),
      status: {},
      phaseIndex: 0,
      telegraph: null
    };
    this.stats = { turns: 0, damage: {}, healing: {} };
    this.turnOrder = [];
    this.turnIndex = 0;
    this.renderParty();
    this.renderBoss();
  }

  startStory() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('battlefield').classList.remove('hidden');
    this.resetState();
    this.mode = 'story';
    this.storyIndex = 0;
    this.showStoryScene();
  }

  showStoryScene() {
    const overlay = document.getElementById('storyOverlay');
    overlay.classList.remove('hidden');
    const scene = STORY_SCENES[this.storyIndex];
    if (!scene) return this.endStoryAndStartBattle();
    const portrait = document.getElementById('storyPortrait');
    if (scene.charId) {
      portrait.src = `gif/${scene.charId}.gif`;
      portrait.classList.remove('hidden');
    } else {
      portrait.classList.add('hidden');
    }
    document.getElementById('storyName').textContent = scene.speaker;
    document.getElementById('storyText').textContent = '';
    this.startTypewriter(scene.text);
  }

  startTypewriter(text) {
    clearInterval(this.typingInterval);
    this.isTyping = true;
    let idx = 0;
    this.typingInterval = setInterval(() => {
      if (idx >= text.length) {
        clearInterval(this.typingInterval);
        this.isTyping = false;
        return;
      }
      document.getElementById('storyText').textContent += text[idx];
      idx += 1;
    }, 20);
  }

  handleNextStory() {
    const scene = STORY_SCENES[this.storyIndex];
    const textEl = document.getElementById('storyText');
    if (this.isTyping) {
      clearInterval(this.typingInterval);
      this.isTyping = false;
      textEl.textContent = scene.text;
      return;
    }
    this.storyIndex += 1;
    if (this.storyIndex >= STORY_SCENES.length) {
      this.endStoryAndStartBattle();
      return;
    }
    this.showStoryScene();
  }

  skipStory() {
    clearInterval(this.typingInterval);
    this.endStoryAndStartBattle();
  }

  endStoryAndStartBattle() {
    document.getElementById('storyOverlay').classList.add('hidden');
    this.mode = 'battle';
    this.buildTurnOrder();
    this.turnIndex = 0;
    this.startTurn();
  }

  buildTurnOrder() {
    const units = [...this.heroes.filter((h) => h.alive), this.boss].sort((a, b) => b.spd - a.spd);
    this.turnOrder = units;
    this.renderTurnTrack();
  }

  renderTurnTrack() {
    const track = document.getElementById('turn-track');
    track.innerHTML = '';
    this.turnOrder.forEach((u, idx) => {
      const div = document.createElement('div');
      div.className = 'turn-node' + (idx === this.turnIndex ? ' active' : '');
      div.textContent = u.name;
      track.appendChild(div);
    });
  }

  startTurn() {
    if (this.mode !== 'battle') return;
    if (this.heroes.every((h) => !h.alive)) return this.finishBattle(false);
    if (this.boss.hp <= 0) return this.finishBattle(true);
    if (this.turnIndex >= this.turnOrder.length) this.turnIndex = 0;
    this.renderTurnTrack();
    const unit = this.turnOrder[this.turnIndex];
    this.applyDurations();
    if (unit.id === 'boss') {
      this.bossAct();
    } else {
      this.prepareHeroTurn(unit);
    }
  }

  prepareHeroTurn(hero) {
    this.activeHero = hero;
    this.renderSkills(hero);
    this.log(`${hero.name}'s turn.`);
  }

  endPlayerTurn() {
    if (this.turnOrder[this.turnIndex]?.id !== this.activeHero?.id) return;
    this.cooldownTick(this.activeHero);
    this.advanceTurn();
  }

  bossAct() {
    const bossSkill = this.chooseBossSkill();
    this.useSkill(this.boss, bossSkill);
    this.cooldownTick(this.boss);
    this.advanceTurn();
  }

  advanceTurn() {
    this.applyEndOfTurnRegen();
    this.turnIndex = (this.turnIndex + 1) % this.turnOrder.length;
    this.stats.turns += 1;
    this.resolveDot();
    this.buildTurnOrder();
    setTimeout(() => this.startTurn(), 300);
  }

  applyEndOfTurnRegen() {
    const diff = DIFFICULTIES[this.getDifficulty()] || DIFFICULTIES.normal;
    const modMp = this.getModifiers().map((id) => MODIFIERS.find((m) => m.id === id)).reduce((a, m) => a * (m?.mp || 1), 1);
    this.heroes.forEach((h) => {
      if (!h.alive) return;
      const regen = Math.round(3 * (diff?.mp || 1) * modMp);
      h.mp = Math.min(h.maxMp, h.mp + regen);
    });
    const bossRegen = Math.round(4 * (diff?.mp || 1));
    this.boss.mp = Math.min(this.boss.maxMp, this.boss.mp + bossRegen);
    this.renderParty();
    this.renderBoss();
  }

  applyDurations() {
    const decay = (status) => {
      Object.keys(status).forEach((k) => {
        if (k === 'dot') return;
        if (status[k] && typeof status[k].duration === 'number') {
          status[k].duration -= 1;
          if (status[k].duration <= 0) delete status[k];
        }
      });
    };
    this.heroes.forEach((h) => decay(h.status || {}));
    decay(this.boss.status || {});
    this.renderParty();
    this.renderBoss();
  }

  resolveDot() {
    const tick = (unit) => {
      if (unit.status?.dot) {
        unit.hp = Math.max(0, unit.hp - unit.status.dot.amount);
        unit.status.dot.duration -= 1;
        this.log(`${unit.name} suffers ${unit.status.dot.amount} damage from burning.`);
        if (unit.status.dot.duration <= 0) delete unit.status.dot;
      }
    };
    this.heroes.forEach((h) => h.alive && tick(h));
    tick(this.boss);
    this.renderParty();
    this.renderBoss();
  }

  computeDefense(target) {
    const baseDef = target.def || (target.id === 'boss' ? this.boss.def : 0);
    let modifier = 1;
    if (target.status?.defDown) modifier -= target.status.defDown.amount;
    return Math.max(1, Math.round(baseDef * modifier));
  }

  applyHeal(source, target, skill) {
    const ratio = skill.target === 'team' ? 0.22 : 0.35;
    const amount = Math.round(target.maxHp * ratio * (skill.power || 1));
    target.hp = Math.min(target.maxHp, target.hp + amount);
    this.stats.healing[source.id] = (this.stats.healing[source.id] || 0) + amount;
    return amount;
  }

  synergyMultiplier(source, target, isMagic) {
    let multi = 1;
    if (!isMagic && target.status?.defDown) multi += 0.15;
    return multi;
  }

  applyDamage(source, target, skill) {
    const isMagic = skill.type === 'magic';
    const attackStat = isMagic ? source.mag : source.atk;
    const defense = this.computeDefense(target);
    const base = Math.max(8, attackStat * (skill.power || 1) - Math.round(defense * 0.25));
    const buffMulti = 1 + (source.status?.atkUp?.amount || 0) + (isMagic ? source.status?.magUp?.amount || 0 : 0);
    const dmgDown = target.status?.dmgDown?.amount || 0;
    const guardCut = target.status?.guard?.amount || 0;
    const guardTeam = target.status?.guardTeam?.amount || 0;
    const synergy = this.synergyMultiplier(source, target, isMagic);
    const damage = Math.max(10, Math.round(base * buffMulti * synergy * (1 - dmgDown) * (1 - guardCut - guardTeam)));
    target.hp = Math.max(0, target.hp - damage);
    if (target.id !== 'boss') {
      this.stats.damage[source.id] = (this.stats.damage[source.id] || 0) + damage;
      if (target.hp <= 0) target.alive = false;
    }
    return damage;
  }

  cooldownTick(unit) {
    (unit.skills || []).forEach((s) => {
      if (s.currentCd && s.currentCd > 0) {
        s.currentCd -= 1;
        if (s.currentCd < 0) s.currentCd = 0;
      }
    });
  }

  skillAvailable(unit, skill) {
    return (skill.currentCd || 0) === 0 && unit.mp >= (skill.cost || 0);
  }

  chooseBossSkill() {
    this.updateBossPhase();
    const phase = this.boss.phases[this.boss.phaseIndex];
    const weights = phase?.weights || { claw: 1 };
    const entries = Object.entries(weights);
    const total = entries.reduce((s, [_, w]) => s + w, 0);
    let pick = Math.random() * total;
    for (const [key, weight] of entries) {
      if ((pick -= weight) <= 0) return this.boss.skills[key];
    }
    return this.boss.skills[entries[0][0]];
  }

  updateBossPhase() {
    const hpPct = this.boss.hp / this.boss.maxHp;
    const idx = this.boss.phases.findIndex((p) => hpPct <= p.threshold);
    if (idx !== -1) this.boss.phaseIndex = idx;
  }

  useSkill(user, skill) {
    if (user.mp < (skill.cost || 0)) {
      this.log(`${user.name} lacks MP.`);
      return;
    }
    user.mp -= skill.cost || 0;
    if (skill.cooldown) skill.currentCd = skill.cooldown;
    const targets = this.resolveTargets(skill);
    targets.forEach((target) => {
      let amount = 0;
      switch (skill.type) {
        case 'physical':
        case 'magic':
          amount = this.applyDamage(user, target, skill);
          this.log(`${user.name} uses ${skill.name} on ${target.name} for ${amount}.`);
          if (skill.dot) {
            target.status = target.status || {};
            target.status.dot = { amount: skill.dot.amount, duration: skill.dot.duration };
            this.log(`${target.name} is burning!`);
          }
          break;
        case 'guard':
          target.status = target.status || {};
          target.status.guardTeam = { amount: skill.power, duration: skill.duration || 1 };
          this.log(`${user.name} braces the team.`);
          break;
        case 'debuff':
          target.status = target.status || {};
          if (skill.debuff?.defDown) target.status.defDown = { amount: skill.debuff.defDown, duration: skill.debuff.duration };
          if (skill.power) {
            amount = this.applyDamage(user, target, skill);
            this.log(`${target.name} also takes ${amount} damage.`);
          } else {
            this.log(`${user.name} weakens ${target.name}.`);
          }
          break;
        case 'buff':
          target.status = target.status || {};
          if (skill.buff?.guard) target.status.guard = { amount: skill.buff.guard, duration: skill.buff.duration };
          if (skill.buff?.atkUp) target.status.atkUp = { amount: skill.buff.atkUp, duration: skill.buff.duration };
          if (skill.buff?.dmgDown) target.status.dmgDown = { amount: skill.buff.dmgDown, duration: skill.buff.duration };
          this.log(`${user.name} empowers ${target.name === user ? 'self' : 'allies'}.`);
          break;
        case 'heal':
          amount = this.applyHeal(user, target, skill);
          this.log(`${user.name} heals ${target.name} for ${amount}.`);
          break;
        case 'dot':
          amount = this.applyDamage(user, target, skill);
          target.status = target.status || {};
          target.status.dot = { ...skill.dot };
          this.log(`${target.name} is burning!`);
          break;
      }
    });
    this.renderParty();
    this.renderBoss();
    if (this.boss.hp <= 0) this.finishBattle(true);
    if (this.heroes.every((h) => !h.alive)) this.finishBattle(false);
  }

  resolveTargets(skill) {
    if (this.turnOrder[this.turnIndex].id === 'boss') {
      if (skill.target === 'team') return this.heroes.filter((h) => h.alive);
      if (skill.target === 'weakest') return [this.heroes.filter((h) => h.alive).sort((a, b) => a.hp - b.hp)[0]];
      const alive = this.heroes.filter((h) => h.alive);
      return [alive[Math.floor(Math.random() * alive.length)]];
    }
    switch (skill.target) {
      case 'ally':
        return [this.heroes.find((h) => h.id === this.activeHero.id)];
      case 'team':
        return this.heroes.filter((h) => h.alive);
      default:
        return [this.boss];
    }
  }

  renderSkills(hero) {
    this.skillBar.innerHTML = '';
    hero.skills.forEach((skill) => {
      const btn = document.createElement('button');
      btn.className = 'skill-btn tooltip';
      const cd = skill.currentCd || 0;
      btn.textContent = `${skill.name}${cd ? ' (' + cd + ')' : ''}`;
      const tip = document.createElement('div');
      tip.className = 'tooltip-text';
      tip.textContent = `${skill.type} | Cost ${skill.cost || 0}` + (skill.description ? ` | ${skill.description}` : '');
      btn.appendChild(tip);
      btn.disabled = !this.skillAvailable(hero, skill);
      btn.addEventListener('click', () => {
        if (!this.skillAvailable(hero, skill)) return;
        this.useSkill(hero, skill);
      });
      this.skillBar.appendChild(btn);
    });
  }

  renderParty() {
    this.heroRoot.innerHTML = '';
    this.heroes.forEach((hero) => {
      const card = document.createElement('div');
      card.className = 'hero-card';
      const header = document.createElement('div');
      header.className = 'hero-header';
      const name = document.createElement('div');
      name.textContent = hero.name;
      const mp = document.createElement('div');
      mp.className = 'badge';
      mp.textContent = `${hero.mp}/${hero.maxMp} MP`;
      header.appendChild(name);
      header.appendChild(mp);
      card.appendChild(header);
      card.appendChild(this.buildMeter('HP', hero.hp, hero.maxHp));
      card.appendChild(this.buildMeter('MP', hero.mp, hero.maxMp, true));
      card.appendChild(this.renderStatuses(hero));
      this.heroRoot.appendChild(card);
    });
  }

  renderBoss() {
    const b = this.boss;
    this.bossCard.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'boss-header';
    header.innerHTML = `<div>${b.name}</div><div class="badge">${b.mp}/${b.maxMp} MP</div>`;
    this.bossCard.appendChild(header);
    this.bossCard.appendChild(this.buildMeter('HP', b.hp, b.maxHp));
    this.bossCard.appendChild(this.renderStatuses(b));
  }

  buildMeter(label, value, max, mp = false) {
    const wrap = document.createElement('div');
    wrap.className = 'meter';
    const lbl = document.createElement('div');
    lbl.className = 'meter-label';
    lbl.innerHTML = `<span>${label}</span><span>${value}/${max}</span>`;
    const bar = document.createElement('div');
    bar.className = 'meter-bar';
    const fill = document.createElement('div');
    const pct = Math.max(0, Math.round((value / max) * 100));
    fill.className = `meter-fill ${mp ? 'mp-fill' : 'hp-fill'} ${!mp && pct < 25 ? 'critical' : ''}`;
    fill.style.width = pct + '%';
    bar.appendChild(fill);
    wrap.appendChild(lbl);
    wrap.appendChild(bar);
    return wrap;
  }

  renderStatuses(unit) {
    const row = document.createElement('div');
    row.className = 'status-row';
    Object.entries(unit.status || {}).forEach(([key, val]) => {
      const tag = document.createElement('div');
      tag.className = 'status-tag';
      tag.textContent = `${this.statusLabel(key)}${val.duration !== undefined ? val.duration : ''}`;
      row.appendChild(tag);
    });
    return row;
  }

  statusLabel(key) {
    const map = { guard: 'Guard', guardTeam: 'Guard', defDown: 'DEF↓', dmgDown: 'DMG↓', atkUp: 'ATK↑', magUp: 'MAG↑', dot: 'Burn' };
    return map[key] || key;
  }

  log(text) {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = text;
    this.logEl.prepend(line);
  }

  finishBattle(victory) {
    this.mode = 'result';
    document.getElementById('battlefield').classList.add('hidden');
    document.getElementById('result-panel').classList.remove('hidden');
    document.getElementById('result-title').textContent = victory ? 'Victory!' : 'Defeat';
    this.renderResults();
  }

  renderResults() {
    const wrap = document.getElementById('result-details');
    wrap.innerHTML = '';
    const turns = document.createElement('div');
    turns.textContent = `Turns: ${this.stats.turns}`;
    wrap.appendChild(turns);
    const damage = document.createElement('div');
    damage.textContent = 'Damage dealt:';
    const list = document.createElement('ul');
    Object.entries(this.stats.damage).forEach(([id, val]) => {
      const hero = this.heroes.find((h) => h.id === id);
      if (!hero) return;
      const li = document.createElement('li');
      li.textContent = `${hero.name}: ${val}`;
      list.appendChild(li);
    });
    wrap.appendChild(damage);
    wrap.appendChild(list);
    const heals = document.createElement('div');
    heals.textContent = `Healing done: ${this.stats.healing.healer || 0}`;
    wrap.appendChild(heals);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
