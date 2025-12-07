const CONFIG = window.GAME_CONFIG;
const TYPE_SPEED_MS = CONFIG.constants.TYPE_SPEED_MS;
const STORY_ADVANCE_DELAY = CONFIG.constants.STORY_ADVANCE_DELAY;
const HERO_REGEN = CONFIG.constants.HERO_REGEN;
const BOSS_REGEN = CONFIG.constants.BOSS_REGEN;
const SINGLE_HEAL_RATIO = CONFIG.constants.SINGLE_HEAL_RATIO;
const GROUP_HEAL_RATIO = CONFIG.constants.GROUP_HEAL_RATIO;
const LIMIT_GAIN_TAKEN = CONFIG.constants.LIMIT_GAIN_TAKEN;
const LIMIT_GAIN_DEALT = CONFIG.constants.LIMIT_GAIN_DEALT;

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
    this.bossPhase = 1;
    this.targeting = false;
    this.currentSceneIndex = 0;
    this.currentCharIndex = 0;
    this.typingInterval = null;
    this.autoAdvanceTimeout = null;
    this.isTyping = false;
    this.isPaused = false;
    this.turnCount = 0;
    this.totalDamageByHero = {};
    this.totalHealingByHero = {};
    this.highestHit = 0;

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
        this.updateBestRunDisplay();
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
    this.turnCount = 0;
    this.totalDamageByHero = { soldier: 0, mage: 0, healer: 0, tank: 0 };
    this.totalHealingByHero = { soldier: 0, mage: 0, healer: 0, tank: 0 };
    this.highestHit = 0;
    this.state = "start";
    this.pendingSkill = null;
    this.bossEnragedNotified = false;
    this.bossEnraged = false;
    this.bossWindupSkill = null;
    this.bossPhase = 1;
    this.targeting = false;
    this.closeTargetSelect();
    document.getElementById("gameOver").style.display = "none";
    const summary = document.getElementById("runSummary");
    if (summary) summary.innerHTML = "";
    this.logEl.innerHTML = "";
    this.renderHeroes();
    this.rebuildTurnOrder();
    this.updateUI();
    this.updateBestRunDisplay();
  }

  buildHeroes() {
    const diff =
      CONFIG.difficulties[this.difficulty] || CONFIG.difficulties.normal;
    const heroList = ["soldier", "mage", "healer", "tank"];
    return heroList.map((heroId) => {
      const h = CONFIG.characters[heroId];
      const maxHp = Math.round(h.maxHp * diff.heroHp);
      return {
        ...h,
        maxHp,
        hp: maxHp,
        mp: h.maxMp,
        status: {},
        limit: 0,
        skills: h.skills.map((s) => ({ ...s, currentCd: 0 })),
      };
    });
  }

  buildBoss() {
    const diff =
      CONFIG.difficulties[this.difficulty] || CONFIG.difficulties.normal;
    const bossConfig = CONFIG.boss;
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
    const scene = CONFIG.storyScenes[index];

    let speakerName = "Narrator";
    let gifName = null;
    if (scene.speakerId) {
      const speakerToCharMap = {
        aruna: "soldier",
        meer: "mage",
        khade: "healer",
        zabx: "tank",
        "naga kampar": "dragon",
      };

      const charKey = speakerToCharMap[scene.speakerId] || scene.speakerId;
      const char = CONFIG.characters[charKey];
      if (char) {
        speakerName = char.name;
        gifName = char.gifName || charKey;
      } else {
        speakerName = scene.speakerId;
      }
    }

    this.storyName.textContent = speakerName;
    if (gifName) {
      this.storyPortrait.src = `gif/${gifName}.gif`;
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
    if (this.currentSceneIndex < CONFIG.storyScenes.length - 1) {
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
    this.log(CONFIG.messages.tipArmorBreak);
    this.log(CONFIG.messages.tipBurning);
    this.log(CONFIG.messages.tipGuard);
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
        <div class="limit-line" id="${hero.id}Limit">Limit: 0%</div>
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
      this.waitingText.textContent = CONFIG.messages.dragonActing;
      this.skillButtons.innerHTML = "";
      this.skillInfo.style.display = "none";
      setTimeout(() => this.dragonAct(), 700);
    } else {
      const hero = this.getHero(current);
      if (!hero || hero.hp <= 0) {
        this.advanceTurn();
        return;
      }
      hero.skills.forEach((s) => {
        if (s.currentCd > 0) s.currentCd -= 1;
      });
      this.waitingText.textContent = CONFIG.messages.heroTurn.replace(
        "${heroName}",
        hero.name
      );
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

  getEffectiveSpd(unit) {
    let spd = unit.spd || 10;
    if (unit.status?.spdUp) spd = Math.round(spd * 1.2);
    if (unit.status?.spdDown) spd = Math.round(spd * 0.8);
    return spd;
  }

  rebuildTurnOrder() {
    const livingUnits = [...this.heroes, this.boss].filter((u) => u.hp > 0);
    livingUnits.sort(
      (a, b) => this.getEffectiveSpd(b) - this.getEffectiveSpd(a)
    );
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
      const isSilenced = hero.status?.silence && skill.type === "magic";
      const onCooldown = skill.currentCd && skill.currentCd > 0;
      const needsLimit =
        skill.requiresLimit && hero.limit < skill.requiresLimit;
      btn.disabled =
        hero.mp < skill.cost ||
        hero.hp <= 0 ||
        onCooldown ||
        needsLimit ||
        isSilenced;
      btn.innerHTML = `
        <div><strong>${skill.name}</strong></div>
        <div class="skill-meta">
          <span>${skill.target}${needsLimit ? " · Limit" : ""}${
        isSilenced ? " · Silenced" : ""
      }</span>
          <span>MP ${skill.cost}${
        onCooldown ? ` · CD ${skill.currentCd}` : ""
      }${skill.requiresLimit ? ` · Limit ${skill.requiresLimit}%` : ""}</span>
        </div>
      `;
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
    const metaParts = [targetLabel, `MP ${skill.cost}`];
    if (skill.cooldown) metaParts.push(`CD ${skill.cooldown}`);
    if (skill.requiresLimit) metaParts.push(`Limit ${skill.requiresLimit}%`);
    this.skillInfo.innerHTML = `
      <div class="skill-tooltip-title">${skill.name}</div>
      <div class="skill-tooltip-meta">${metaParts.join(" · ")}</div>
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
      btn.className = "target-btn";
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
      if (hero)
        this.waitingText.textContent = CONFIG.messages.heroTurn.replace(
          "${heroName}",
          hero.name
        );
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
    if (target.status?.defUp) {
      modifier += target.status.defUp.amount;
    }

    return Math.max(1, Math.round(baseDef * modifier));
  }

  gainLimit(hero, amount) {
    if (!hero || hero.id === "boss") return;
    hero.limit = Math.min(100, (hero.limit || 0) + amount);
  }

  applyDamage(source, target, skill) {
    const isMagic = skill.type === "magic";
    const attackStat = isMagic ? source.mag : source.atk;
    const defense = this.computeDefense(target);
    let base = Math.max(0, attackStat - defense * 0.5);
    const power = skill.power || 1;
    let buffMulti = 1;
    if (source.status?.atkUp && !isMagic)
      buffMulti += source.status.atkUp.amount;
    if (source.status?.magUp && isMagic)
      buffMulti += source.status.magUp.amount;
    if (target.status?.dmgDown) buffMulti -= target.status.dmgDown.amount;
    const guardCut = target.status?.guard?.amount || 0;
    const guardTeam = target.status?.guardTeam?.amount || 0;
    let synergyMulti = 1;
    if (!isMagic && target.status?.defDown) synergyMulti += 0.15;
    if (target.status?.mark && skill.element === "fire") synergyMulti += 0.2;
    if (source.id === "tank" && this.boss.status?.dot && target.id === "boss") {
      synergyMulti += 0.1;
    }
    const enrageMultiplier =
      source.id === "boss" && this.isDragonEnraged() ? 2 : 1;
    const damage = Math.max(
      8,
      Math.round(
        base * power * buffMulti * synergyMulti * (1 - guardCut - guardTeam)
      )
    );
    const finalDamage = Math.max(8, Math.round(damage * enrageMultiplier));
    target.hp = Math.max(0, target.hp - finalDamage);
    if (source.id !== "boss") {
      this.totalDamageByHero[source.id] =
        (this.totalDamageByHero[source.id] || 0) + finalDamage;
      this.highestHit = Math.max(this.highestHit, finalDamage);
      this.gainLimit(source, LIMIT_GAIN_DEALT);
    }
    if (target.id !== "boss") {
      this.gainLimit(target, LIMIT_GAIN_TAKEN);
    }
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
    if (source.id !== "boss") {
      this.totalHealingByHero[source.id] =
        (this.totalHealingByHero[source.id] || 0) + amount;
    }
    return amount;
  }

  executeSkill(user, skill, target = null) {
    if (skill.currentCd && skill.currentCd > 0) return;
    if (skill.requiresLimit && (user.limit || 0) < skill.requiresLimit) return;
    if (user.status?.silence && skill.type === "magic") return;
    if (user.mp < skill.cost) return;
    user.mp -= skill.cost;
    if (!target) target = skill.target === "self" ? user : null;

    if (skill.type === "physical" || skill.type === "magic") {
      const tgt = target || this.boss;
      const dmg = this.applyDamage(user, tgt, skill);
      const name = tgt.id === "boss" ? this.boss.name : tgt.name;
      this.log(
        CONFIG.messages.skillUsed
          .replace("${user}", user.name)
          .replace("${skill}", skill.name)
          .replace("${target}", name)
          .replace("${damage}", dmg)
      );
      if (skill.execute && tgt.hp / tgt.maxHp < skill.execute) {
        tgt.hp = Math.max(0, tgt.hp - 40);
        this.log(CONFIG.messages.executeBonus.replace("${skill}", skill.name));
      }
    } else if (skill.type === "heal") {
      if (skill.target === "allies") {
        this.heroes.forEach((h) => {
          if (h.hp > 0) {
            const healed = this.applyHeal(user, h, skill);
            this.log(
              CONFIG.messages.healed
                .replace("${user}", user.name)
                .replace("${target}", h.name)
                .replace("${amount}", healed)
            );
          }
        });
      } else if (target) {
        const healed = this.applyHeal(user, target, skill);
        this.log(
          CONFIG.messages.healed
            .replace("${user}", user.name)
            .replace("${target}", target.name)
            .replace("${amount}", healed)
        );
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
      this.log(
        CONFIG.messages.buffAllies
          .replace("${user}", user.name)
          .replace("${skill}", skill.name)
      );
    } else if (skill.type === "cleanse" && target) {
      target.status = {};
      this.log(
        CONFIG.messages.cleansed
          .replace("${user}", user.name)
          .replace("${target}", target.name)
      );
    } else if (skill.type === "taunt") {
      this.boss.status.taunt = {
        amount: 1,
        duration: skill.duration,
        target: user.id,
      };
      this.log(CONFIG.messages.provoke.replace("${user}", user.name));
    }

    if (skill.cooldown) {
      skill.currentCd = skill.cooldown;
    }
    if (skill.requiresLimit) {
      user.limit = 0;
    }

    this.resolveDot();
    this.updateUI();
    this.checkEnd();
    if (this.state === "playing") {
      this.advanceTurn();
    } else {
      this.turnCount += 1;
    }
  }

  resolveDot() {
    const targets = [...this.heroes, this.boss];
    targets.forEach((unit) => {
      if (unit.status?.dot) {
        const dot = unit.status.dot;
        unit.hp = Math.max(0, unit.hp - dot.amount);
        const name = unit.id === "boss" ? this.boss.name : unit.name;
        this.log(
          CONFIG.messages.burningDamage
            .replace("${target}", name)
            .replace("${damage}", dot.amount)
        );
        dot.duration -= 1;
        if (dot.duration <= 0) {
          delete unit.status.dot;
          if (unit.id === "boss") {
            this.log(CONFIG.messages.burningFades);
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

    this.updateBossPhase();
    this.isDragonEnraged();
    let choice = this.bossWindupSkill;

    if (!choice) {
      choice = this.chooseDragonSkill();
      if (this.bossEnraged && choice.pattern === "aoe") {
        this.log(CONFIG.messages.dragonWindup);
        this.bossWindupSkill = choice;
        this.advanceTurn();
        return;
      }
    } else {
      this.log(CONFIG.messages.dragonUnleash);
      this.bossWindupSkill = null;
    }

    boss.mp = Math.max(0, boss.mp - choice.cost);

    if (choice.pattern === "aoe") {
      aliveHeroes.forEach((hero) => {
        if (hero.hp > 0) {
          const dmg = this.applyDamage(boss, hero, choice);
          this.log(
            CONFIG.messages.dragonScorched
              .replace("${target}", hero.name)
              .replace("${damage}", dmg)
          );
        }
      });
    } else if (choice.pattern === "single-splash") {
      const targetHero = this.selectDragonTarget(aliveHeroes) || aliveHeroes[0];
      const mainDmg = this.applyDamage(boss, targetHero, choice);
      this.log(
        CONFIG.messages.dragonBlast
          .replace("${target}", targetHero.name)
          .replace("${damage}", mainDmg)
      );
      aliveHeroes
        .filter((h) => h.id !== targetHero.id)
        .forEach((hero) => {
          const splashSkill = { ...choice, power: choice.splashPower };
          const splashDmg = this.applyDamage(boss, hero, splashSkill);
          this.log(
            CONFIG.messages.dragonSplash
              .replace("${target}", hero.name)
              .replace("${damage}", splashDmg)
          );
        });
    } else if (choice.pattern === "self") {
      boss.status = boss.status || {};
      Object.keys(choice.buff || {}).forEach((key) => {
        if (key !== "duration") {
          boss.status[key] = {
            amount: choice.buff[key],
            duration: choice.buff.duration,
          };
        }
      });
      if (boss.status.defDown) delete boss.status.defDown;
      this.log(CONFIG.messages.dragonHarden);
    } else if (choice.pattern === "berserk") {
      boss.status = boss.status || {};
      Object.keys(choice.buff || {}).forEach((key) => {
        if (key !== "duration") {
          boss.status[key] = {
            amount: choice.buff[key],
            duration: choice.buff.duration,
          };
        }
      });
      this.log(CONFIG.messages.dragonBerserk);
    } else if (choice.pattern === "silence") {
      const preferredTargets = aliveHeroes.filter(
        (h) => h.id === "mage" || h.id === "healer"
      );
      const silenced = (
        preferredTargets.length ? preferredTargets : aliveHeroes
      ).slice(0, 2);
      silenced.forEach((hero) => {
        hero.status = hero.status || {};
        hero.status.silence = { amount: 1, duration: 2 };
        this.log(CONFIG.messages.dragonSilence.replace("${target}", hero.name));
      });
    } else {
      const targetHero = this.selectDragonTarget(aliveHeroes) || aliveHeroes[0];
      const dmg = this.applyDamage(boss, targetHero, choice);
      if (choice.id === "obliterate") {
        this.log(
          CONFIG.messages.dragonObliterate
            .replace("${target}", targetHero.name)
            .replace("${damage}", dmg)
        );
      } else {
        this.log(
          CONFIG.messages.dragonBasicAttack
            .replace("${target}", targetHero.name)
            .replace("${damage}", dmg)
        );
      }
    }

    this.resolveDot();
    this.updateUI();
    this.checkEnd();
    if (this.state === "playing") this.advanceTurn();
    else this.turnCount += 1;
  }

  chooseDragonSkill() {
    const enraged = this.isDragonEnraged() || this.bossEnraged;
    const weightedSkills = this.boss.skills
      .filter((s) => s.cost === 0 || this.boss.mp >= s.cost)
      .map((s) => {
        let weight = s.weight || 1;
        if (this.bossPhase === 1) {
          if (s.id === "crushingClaw" || s.id === "fieryRend") weight += 1;
        } else if (this.bossPhase === 2) {
          if (s.id === "scaleHarden") weight += 2;
          if (s.id === "roaringSilence") weight += 2;
          if (s.id === "obliterate") weight = Math.max(1, weight - 1);
        } else {
          if (s.id === "cinderWave" || s.id === "fieryRend") weight += 2;
          if (s.id === "obliterate") weight += 1;
          if (s.id === "recklessFury") weight += 2;
        }
        if (enraged && s.pattern === "aoe") weight += 1;
        return { ...s, weight };
      });

    const pool = weightedSkills.length ? weightedSkills : [this.boss.skills[0]];
    const weighted = [];
    pool.forEach((skill) => {
      const weight = skill.weight || 1;
      for (let i = 0; i < weight; i++) weighted.push(skill);
    });
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  updateBossPhase() {
    const ratio = this.boss.hp / this.boss.maxHp;
    let newPhase;
    if (ratio > 0.6) newPhase = 1;
    else if (ratio > 0.3) newPhase = 2;
    else newPhase = 3;

    if (newPhase !== this.bossPhase) {
      this.bossPhase = newPhase;
      if (newPhase === 2) {
        this.log(CONFIG.messages.dragonPhase2);
      } else if (newPhase === 3) {
        this.log(CONFIG.messages.dragonPhase3);
      }
    }
  }

  selectDragonTarget(aliveHeroes) {
    if (!aliveHeroes.length) return null;
    const tauntTarget =
      this.boss.status.taunt && this.getHero(this.boss.status.taunt.target);
    if (tauntTarget && tauntTarget.hp > 0 && Math.random() < 0.7) {
      this.log(
        CONFIG.messages.dragonProvoked.replace("${target}", tauntTarget.name)
      );
      return tauntTarget;
    }
    return aliveHeroes.reduce((lowest, hero) => {
      return hero.hp / hero.maxHp < lowest.hp / lowest.maxHp ? hero : lowest;
    }, aliveHeroes[0]);
  }

  isDragonEnraged() {
    const enraged = this.boss.hp <= this.boss.maxHp * 0.5;
    if (enraged && !this.bossEnragedNotified) {
      this.log(
        CONFIG.messages.dragonEnraged.replace("${bossName}", this.boss.name)
      );
      this.bossEnragedNotified = true;
    }
    if (enraged) this.bossEnraged = true;
    return enraged;
  }

  advanceTurn() {
    this.turnCount += 1;
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
    document.getElementById(
      "bossHpText"
    ).textContent = `${this.boss.hp}/${this.boss.maxHp}`;
    document.getElementById(
      "bossMpText"
    ).textContent = `${this.boss.mp}/${this.boss.maxMp}`;
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

    this.heroes.forEach((h) => {
      const hpPct = (h.hp / h.maxHp) * 100;
      const mpPct = (h.mp / h.maxMp) * 100;
      document.getElementById(`${h.id}HpBar`).style.width = `${hpPct}%`;
      document.getElementById(`${h.id}MpBar`).style.width = `${mpPct}%`;
      document.getElementById(
        `${h.id}HpText`
      ).textContent = `${h.hp}/${h.maxHp}`;
      document.getElementById(
        `${h.id}MpText`
      ).textContent = `${h.mp}/${h.maxMp}`;
      const status = document.getElementById(`${h.id}Status`);
      const format = (label, effect) => {
        if (!effect) return null;
        const duration =
          typeof effect.duration === "number" ? ` (${effect.duration})` : "";
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
        format("Silenced", h.status.silence),
      ].filter(Boolean);
      status.textContent = labels.join(" · ");
      status.style.display = labels.length ? "inline-block" : "none";
      const limitEl = document.getElementById(`${h.id}Limit`);
      if (limitEl) limitEl.textContent = `Limit: ${Math.round(h.limit)}%`;
    });
  }

  renderRunSummary() {
    const summary = document.getElementById("runSummary");
    if (!summary) return;
    const heroDamage = this.heroes
      .map(
        (h) =>
          `<div class="summary-line"><span>${h.name} dmg</span><span>${
            this.totalDamageByHero[h.id] || 0
          }</span></div>`
      )
      .join("");
    const heroHealing = this.heroes
      .map(
        (h) =>
          `<div class="summary-line"><span>${h.name} healing</span><span>${
            this.totalHealingByHero[h.id] || 0
          }</span></div>`
      )
      .join("");
    summary.innerHTML = `
      <h4>Run Stats</h4>
      <div class="summary-line"><span>Turns</span><span>${this.turnCount}</span></div>
      <div class="summary-line"><span>Highest Hit</span><span>${this.highestHit}</span></div>
      ${heroDamage}
      ${heroHealing}
    `;
  }

  getBestRunKey() {
    return `celestia_bestRun_${this.difficulty}`;
  }

  getBestRunRecord() {
    try {
      const existing = localStorage.getItem(this.getBestRunKey());
      return existing ? JSON.parse(existing) : null;
    } catch (e) {
      return null;
    }
  }

  saveBestRun() {
    const current = {
      difficulty: this.difficulty,
      victory: true,
      turnCount: this.turnCount,
      timestamp: Date.now(),
    };
    const best = this.getBestRunRecord();
    if (!best || current.turnCount < best.turnCount) {
      try {
        localStorage.setItem(this.getBestRunKey(), JSON.stringify(current));
      } catch (e) {
        // ignore storage errors
      }
    }
    this.updateBestRunDisplay();
  }

  updateBestRunDisplay() {
    const display = document.getElementById("bestRunDisplay");
    if (!display) return;
    const best = this.getBestRunRecord();
    if (!best) {
      display.style.display = "none";
      return;
    }
    const label =
      best.difficulty.charAt(0).toUpperCase() + best.difficulty.slice(1);
    display.style.display = "block";
    display.textContent = `Best (${label}): ${best.turnCount} turns`;
  }

  checkEnd() {
    const heroesAlive = this.heroes.some((h) => h.hp > 0);
    if (this.boss.hp <= 0) {
      this.state = "victory";
      document.getElementById("gameOver").style.display = "flex";
      document.getElementById("gameOverTitle").textContent = "Victory";
      document.getElementById("gameOverTitle").className = "victory";
      document.getElementById("gameOverText").textContent =
        CONFIG.messages.victory;
      this.renderRunSummary();
      this.saveBestRun();
    } else if (!heroesAlive) {
      this.state = "defeat";
      document.getElementById("gameOver").style.display = "flex";
      document.getElementById("gameOverTitle").textContent = "Defeat";
      document.getElementById("gameOverTitle").className = "defeat";
      document.getElementById("gameOverText").textContent =
        CONFIG.messages.defeat;
      this.renderRunSummary();
    }
  }
}

new Game();
