import { CONFIG } from './config.js';

class GameEngine {
  constructor() {
    this.config = CONFIG;
    this.difficultyId = 'normal';
    this.modifiers = [];
    this.turnOrder = [];
    this.turnIndex = 0;
    this.mode = 'story';
    this.stats = { turns: 0, damage: {}, healing: {}, skillUse: {} };
    this.bindUI();
    this.registerStoryHooks();
  }

  bindUI() {
    this.heroRoot = document.getElementById('heroes');
    this.bossCard = document.getElementById('boss-card');
    this.skillBar = document.getElementById('skill-bar');
    this.logEl = document.getElementById('log');
    this.bossIntent = document.getElementById('boss-intent');
    document.getElementById('next-turn').addEventListener('click', () => this.endPlayerTurn());
    document.getElementById('restart').addEventListener('click', () => window.location.reload());
  }

  registerStoryHooks() {
    document.addEventListener('story:ready', (e) => {
      this.difficultyId = e.detail.difficulty;
      this.modifiers = e.detail.modifiers;
      this.setupState();
    });
    document.addEventListener('story:start-battle', () => {
      this.startBattle();
    });
  }

  setupState() {
    const diff = this.config.difficulties[this.difficultyId] || this.config.difficulties.normal;
    const heroMods = this.modifiers.map((id) => this.config.modifiers.find((m) => m.id === id));
    this.heroes = this.config.heroes
      .filter((h) => !heroMods.some((m) => m?.disableHero === h.id))
      .map((h) => ({
        ...h,
        hp: Math.round(h.maxHp * diff.heroHp * (heroMods.reduce((m, v) => m * (v?.heroHp || 1), 1))),
        maxHp: Math.round(h.maxHp * diff.heroHp * (heroMods.reduce((m, v) => m * (v?.heroHp || 1), 1))),
        atk: Math.round(h.atk * diff.heroAtk * (heroMods.reduce((m, v) => m * (v?.heroAtk || 1), 1))),
        mp: Math.round(h.maxMp * diff.mp),
        maxMp: Math.round(h.maxMp * diff.mp),
        status: {},
        alive: true
      }));
    const bossAtkMulti = diff.bossAtk;
    const bossHpMulti = diff.bossHp;
    const boss = this.config.boss;
    this.boss = {
      ...boss,
      hp: Math.round(boss.maxHp * bossHpMulti),
      maxHp: Math.round(boss.maxHp * bossHpMulti),
      atk: Math.round(boss.atk * bossAtkMulti),
      mp: Math.round(boss.maxMp * diff.mp),
      maxMp: Math.round(boss.maxMp * diff.mp),
      status: {},
      phaseIndex: 0,
      telegraph: null
    };
    this.mode = 'story';
    this.resetStats();
    this.renderParty();
    this.renderBoss();
    this.log('Ready for deployment.');
  }

  resetStats() {
    this.stats = { turns: 0, damage: {}, healing: {}, skillUse: {} };
  }

  startBattle() {
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
    setTimeout(() => this.startTurn(), 400);
  }

  applyEndOfTurnRegen() {
    const diff = this.config.difficulties[this.difficultyId];
    const modMp = this.modifiers
      .map((id) => this.config.modifiers.find((m) => m.id === id))
      .reduce((a, m) => a * (m?.mp || 1), 1);
    this.heroes.forEach((h) => {
      if (!h.alive) return;
      const regen = Math.round(this.config.manaRegenHero * (diff?.mp || 1) * modMp);
      h.mp = Math.min(h.maxMp, h.mp + regen);
    });
    const bossRegen = Math.round(this.config.manaRegenBoss * (diff?.mp || 1));
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
    const baseDef = target.id === 'boss' ? this.boss.def : target.def;
    let modifier = 1;
    if (target.status?.defDown) {
      modifier -= target.status.defDown.amount;
    }
    return Math.max(1, Math.round(baseDef * modifier));
  }

  applyHeal(source, target, skill) {
    const power = skill.power || 0.5;
    const base = target.maxHp * 0.35;
    const amount = Math.round(base * power);
    target.hp = Math.min(target.maxHp, target.hp + amount);
    this.stats.healing[source.id] = (this.stats.healing[source.id] || 0) + amount;
    return amount;
  }

  synergyMultiplier(source, target, isMagic) {
    let multi = 1;
    if (!isMagic && target.status?.defDown) multi += 0.15;
    if (source.id === 'tank' && this.boss.status?.dot && target.id === 'boss') multi += 0.1;
    return multi;
  }

  applyDamage(source, target, skill) {
    const isMagic = skill.type === 'magic';
    const attackStat = isMagic ? source.mag : source.atk;
    const defense = this.computeDefense(target);
    const base = Math.max(6, attackStat - Math.round(defense * 0.35));
    const buffMulti = 1 + (source.status?.atkUp?.amount || 0) + (isMagic ? source.status?.magUp?.amount || 0 : 0);
    const dmgDown = target.status?.dmgDown?.amount || 0;
    const guardCut = target.status?.guard?.amount || 0;
    const guardTeam = target.status?.guardTeam?.amount || 0;
    const synergy = this.synergyMultiplier(source, target, isMagic);
    const damage = Math.max(8, Math.round(base * skill.power * buffMulti * synergy * (1 - dmgDown) * (1 - guardCut - guardTeam)));
    target.hp = Math.max(0, target.hp - damage);
    if (target.id !== 'boss') {
      this.stats.damage[source.id] = (this.stats.damage[source.id] || 0) + damage;
      if (target.hp <= 0) target.alive = false;
    }
    return damage;
  }

  updateStatus(target, changes) {
    target.status = target.status || {};
    Object.entries(changes).forEach(([k, val]) => {
      target.status[k] = { amount: val[k] ?? val.amount ?? val, duration: val.duration ?? val[k]?.duration ?? 1 };
    });
  }

  spendResource(user, skill) {
    if (user.mp < (skill.cost || 0)) return false;
    user.mp -= skill.cost || 0;
    return true;
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
    const total = entries.reduce((s, [k, w]) => s + w, 0);
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
    const phase = this.boss.phases[this.boss.phaseIndex];
    if (phase?.telegraph) {
      this.boss.telegraph = phase.telegraph;
      this.bossIntent.textContent = 'Next: ' + phase.telegraph.text;
      this.log(phase.telegraph.text);
    } else {
      this.bossIntent.textContent = '';
    }
  }

  useSkill(user, skill) {
    if (!this.spendResource(user, skill)) {
      this.log(`${user.name} lacks MP.`);
      return;
    }
    if (skill.cooldown) skill.currentCd = skill.cooldown;
    this.stats.skillUse[user.id] = (this.stats.skillUse[user.id] || 0) + 1;
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
          if (skill.debuff?.defDown) {
            target.status.defDown = { amount: skill.debuff.defDown, duration: skill.debuff.duration };
          }
          this.log(`${user.name} weakens ${target.name}.`);
          if (skill.power) {
            amount = this.applyDamage(user, target, skill);
            this.log(`${target.name} also takes ${amount} damage.`);
          }
          break;
        case 'buff':
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
    document.getElementById('battle-panel').classList.add('hidden');
    const resultId = victory ? 'victory' : 'defeat';
    window.storyController.showResult(resultId);
    this.renderResults(victory);
  }

  renderResults(victory) {
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

window.gameEngine = new GameEngine();
