const CONFIG = window.GAME_CONFIG;
const TYPE_SPEED_MS = CONFIG.constants.TYPE_SPEED_MS;
const STORY_ADVANCE_DELAY = CONFIG.constants.STORY_ADVANCE_DELAY;
const HERO_REGEN = CONFIG.constants.HERO_REGEN;
const BOSS_REGEN = CONFIG.constants.BOSS_REGEN;
const SINGLE_HEAL_RATIO = CONFIG.constants.SINGLE_HEAL_RATIO;
const GROUP_HEAL_RATIO = CONFIG.constants.GROUP_HEAL_RATIO;
const LIMIT_GAIN_TAKEN = CONFIG.constants.LIMIT_GAIN_TAKEN;
const LIMIT_GAIN_DEALT = CONFIG.constants.LIMIT_GAIN_DEALT;
const STAGGER_MAX = CONFIG.constants.STAGGER_MAX;
const STAGGER_DECAY_PER_BOSS_TURN =
  CONFIG.constants.STAGGER_DECAY_PER_BOSS_TURN;
const STAGGERED_TURNS = CONFIG.constants.STAGGERED_TURNS;
const STAGGERED_DAMAGE_BONUS = CONFIG.constants.STAGGERED_DAMAGE_BONUS;
const COUNTER_STAGGER_BONUS = CONFIG.constants.COUNTER_STAGGER_BONUS;
const WINDUP_INTERRUPT_STAGGER = CONFIG.constants.WINDUP_INTERRUPT_STAGGER;

class Game {
  constructor() {
    try {
      // DOM element references with error checking
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
      this.bossIntentEl = document.getElementById("bossIntent");
      this.bossStaggerBar = document.getElementById("bossStaggerBar");
      this.bossStaggerText = document.getElementById("bossStaggerText");
      this.bossPartsEl = document.getElementById("bossParts");
      this.blessingOptions = document.getElementById("blessingOptions");
      this.gameModeOptions = document.getElementById("gameModeOptions");
      this.challengeOptions = document.getElementById("challengeOptions");

      // Check critical elements
      if (!this.heroRow || !this.logEl || !this.startScreen) {
        throw new Error("Critical DOM elements missing. Check HTML structure.");
      }

      this.difficulty = "normal";
      this.state = "start";
      this.pendingSkill = null;
      this.pendingItem = null;
      this.bossEnragedNotified = false;
      this.bossEnraged = false;
      this.bossWindupSkill = null;
      this.bossNextSkill = null;
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
      this.staggerCount = 0;
      this.intentCounterCount = 0;
      this.partsBrokenCount = 0;
      this.selectedBlessingId = CONFIG.blessings?.[0]?.id || null;
      this.selectedChallengeId = CONFIG.challenges?.[0]?.id || "none";
      this.selectedGameMode = "skirmish";
      this.activeBlessing = null;
      this.activeChallenge = null;
      this.inventory = {};
      this.comboHistory = [];
      this.activeCombo = null;
      this.comboCount = 0;
      this.itemsUsedCount = 0;
      this.currentEncounterIndex = 0;
      this.completedEncounterCount = 0;

      this.bindDifficultyControls();
      this.bindModeControls();
      this.bindChallengeControls();
      this.bindBlessingControls();
      this.bindMenu();
      this.prepareNewRun();
      this.showScreen("start");
    } catch (error) {
      console.error("Game initialization failed:", error);
      this.showError("Failed to initialize game. Please refresh the page.");
    }
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 107, 107, 0.95);
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      font-size: 1.1rem;
      z-index: 9999;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
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

  bindModeControls() {
    const options = document.querySelectorAll("#gameModeOptions .option-button");
    options.forEach((btn) => {
      btn.addEventListener("click", () => {
        options.forEach((button) => button.classList.remove("active"));
        btn.classList.add("active");
        this.selectedGameMode = btn.dataset.mode || "skirmish";
        this.updateBestRunDisplay();
      });
    });
  }

  bindChallengeControls() {
    if (!this.challengeOptions || !CONFIG.challenges?.length) return;

    this.challengeOptions.innerHTML = "";
    CONFIG.challenges.forEach((challenge) => {
      const btn = document.createElement("button");
      btn.className =
        "option-button" +
        (challenge.id === this.selectedChallengeId ? " active" : "");
      btn.dataset.challengeId = challenge.id;
      btn.textContent = challenge.name;
      btn.title = challenge.description;
      btn.addEventListener("click", () => {
        this.selectedChallengeId = challenge.id;
        this.challengeOptions
          .querySelectorAll(".option-button")
          .forEach((button) => button.classList.remove("active"));
        btn.classList.add("active");
        this.updateBestRunDisplay();
      });
      this.challengeOptions.appendChild(btn);
    });
  }

  bindBlessingControls() {
    if (!this.blessingOptions || !CONFIG.blessings?.length) return;

    this.blessingOptions.innerHTML = "";
    CONFIG.blessings.forEach((blessing) => {
      const btn = document.createElement("button");
      btn.className =
        "option-button blessing-button" +
        (blessing.id === this.selectedBlessingId ? " active" : "");
      btn.dataset.blessingId = blessing.id;
      btn.innerHTML = `
        <div class="blessing-name">${blessing.name}</div>
        <div class="blessing-desc">${blessing.description}</div>
      `;
      btn.addEventListener("click", () => {
        this.selectedBlessingId = blessing.id;
        this.blessingOptions
          .querySelectorAll(".blessing-button")
          .forEach((button) => button.classList.remove("active"));
        btn.classList.add("active");
        this.updateBestRunDisplay();
      });
      this.blessingOptions.appendChild(btn);
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
      if (this.state === "encounter-clear") {
        this.continueCampaign();
        return;
      }
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
    this.activeBlessing = this.getSelectedBlessing();
    this.activeChallenge = this.getSelectedChallenge();
    this.currentEncounterIndex = 0;
    this.completedEncounterCount = 0;
    this.inventory = this.buildInventory();
    this.comboHistory = [];
    this.activeCombo = null;
    this.heroes = this.buildHeroes();
    this.boss = this.buildBoss();
    this.turnOrder = [];
    this.turnIndex = 0;
    this.turnCount = 0;
    this.totalDamageByHero = { soldier: 0, mage: 0, healer: 0, tank: 0 };
    this.totalHealingByHero = { soldier: 0, mage: 0, healer: 0, tank: 0 };
    this.highestHit = 0;
    this.staggerCount = 0;
    this.intentCounterCount = 0;
    this.partsBrokenCount = 0;
    this.comboCount = 0;
    this.itemsUsedCount = 0;
    this.state = "start";
    this.pendingSkill = null;
    this.pendingItem = null;
    this.bossEnragedNotified = false;
    this.bossEnraged = false;
    this.bossWindupSkill = null;
    this.bossNextSkill = null;
    this.bossPhase = 1;
    this.targeting = false;
    this.closeTargetSelect();
    const gameOver = document.getElementById("gameOver");
    gameOver.style.display = "none";
    const restart = document.getElementById("restart");
    if (restart) restart.textContent = "Restart";
    const summary = document.getElementById("runSummary");
    if (summary) summary.innerHTML = "";
    this.logEl.innerHTML = "";
    if (this.bossIntentEl) this.bossIntentEl.style.display = "none";
    this.applyBlessingStart();
    this.renderHeroes();
    this.rebuildTurnOrder();
    this.updateUI();
    this.updateBestRunDisplay();
  }

  getSelectedBlessing() {
    return (
      CONFIG.blessings?.find((blessing) => blessing.id === this.selectedBlessingId) ||
      CONFIG.blessings?.[0] ||
      null
    );
  }

  getSelectedChallenge() {
    return (
      CONFIG.challenges?.find(
        (challenge) => challenge.id === this.selectedChallengeId
      ) ||
      CONFIG.challenges?.[0] ||
      null
    );
  }

  getBlessingEffect(key) {
    return this.activeBlessing?.effects?.[key] || 0;
  }

  getChallengeEffect(key) {
    return this.activeChallenge?.effects?.[key] || 0;
  }

  getActiveTurnLimit() {
    if (!this.activeChallenge?.effects) return 0;
    if (this.isCampaignMode() && this.activeChallenge.effects.campaignTurnLimit) {
      return this.activeChallenge.effects.campaignTurnLimit;
    }
    return this.activeChallenge.effects.turnLimit || 0;
  }

  isCampaignMode() {
    return this.selectedGameMode === "campaign";
  }

  getCurrentEncounter() {
    if (!this.isCampaignMode()) return null;
    return CONFIG.campaign?.encounters?.[this.currentEncounterIndex] || null;
  }

  buildInventory() {
    const penalty = this.getChallengeEffect("itemCountPenalty");
    return (CONFIG.consumables || []).reduce((items, item) => {
      items[item.id] = Math.max(0, item.count - penalty);
      return items;
    }, {});
  }

  applyBlessingStart() {
    const startLimit = this.getBlessingEffect("startLimit");
    const startGuardTeam = this.getBlessingEffect("startGuardTeam");
    const guardDuration = this.getBlessingEffect("guardDuration") || 2;

    this.heroes.forEach((hero) => {
      if (startLimit) {
        hero.limit = Math.min(100, startLimit);
      }
      if (startGuardTeam) {
        hero.status.guardTeam = {
          amount: startGuardTeam,
          duration: guardDuration,
        };
      }
    });
  }

  buildHeroes() {
    const diff =
      CONFIG.difficulties[this.difficulty] || CONFIG.difficulties.normal;
    const hpBonus =
      this.getBlessingEffect("maxHpBonus") + this.getChallengeEffect("heroHpBonus");
    const heroList = ["soldier", "mage", "healer", "tank"];
    return heroList.map((heroId) => {
      const h = CONFIG.characters[heroId];
      const maxHp = Math.round(h.maxHp * diff.heroHp * (1 + hpBonus));
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
    const encounter = this.getCurrentEncounter();
    const encounterHp = encounter?.bossHp || 1;
    const encounterAtk = encounter?.bossAtk || 1;
    const partIntegrity = encounter?.partIntegrity || 1;
    const maxHp = Math.round(bossConfig.maxHp * diff.bossHp * encounterHp);
    return {
      ...bossConfig,
      name: encounter?.name || bossConfig.name,
      maxHp,
      hp: maxHp,
      atk: Math.round(
        bossConfig.atk *
          diff.bossAtk *
          encounterAtk *
          (1 + this.getChallengeEffect("bossAtkBonus"))
      ),
      mp: bossConfig.maxMp,
      status: {},
      stagger: 0,
      maxStagger: STAGGER_MAX,
      staggerTaken: diff.staggerTaken || 1,
      staggeredTurns: 0,
      intentCanceled: false,
      parts: (bossConfig.parts || []).map((part) => ({
        ...part,
        maxIntegrity: Math.round(part.maxIntegrity * partIntegrity),
        integrity: Math.round(part.maxIntegrity * partIntegrity),
        broken: false,
      })),
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
    if (this.activeBlessing) {
      this.log(
        CONFIG.messages.blessingChosen.replace(
          "${blessingName}",
          this.activeBlessing.name
        ),
        "buff"
      );
    }
    if (this.activeChallenge && this.activeChallenge.id !== "none") {
      this.log(
        CONFIG.messages.challengeActive.replace(
          "${challengeName}",
          this.activeChallenge.name
        ),
        "phase"
      );
    }
    this.logCurrentEncounter();
    this.log(CONFIG.messages.tipArmorBreak, "tip");
    this.log(CONFIG.messages.tipBurning, "tip");
    this.log(CONFIG.messages.tipGuard, "tip");
    this.rollBossIntent();
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

  log(message, type = "info") {
    const entry = document.createElement("div");
    entry.className = `log-line log-${type}`;
    
    // Add icon based on type
    const icon = {
      damage: "⚔️",
      heal: "💚",
      buff: "✨",
      debuff: "💀",
      phase: "🔔",
      tip: "💡",
      info: "📋"
    }[type] || "•";
    
    entry.innerHTML = `<span class="log-icon">${icon}</span><span class="log-text">${message}</span>`;
    this.logEl.prepend(entry);
    const maxEntries = 8; // Increased from 6 to 8
    while (this.logEl.children.length > maxEntries) {
      this.logEl.removeChild(this.logEl.lastElementChild);
    }
  }

  showFloatingText(targetId, text, type = "damage") {
    if (!targetId || !text) return;
    
    const cardId = targetId === "boss" ? "bossCard" : `${targetId}Card`;
    const card = document.getElementById(cardId);
    if (!card) {
      console.warn(`Card not found for target: ${targetId}`);
      return;
    }

    const floater = document.createElement("div");
    floater.className = `floating-text ${type}`;
    floater.textContent = text;
    
    const rect = card.getBoundingClientRect();
    floater.style.left = `${rect.left + rect.width / 2 - 20}px`;
    floater.style.top = `${rect.top + 20}px`;
    floater.style.position = "fixed";
    
    document.body.appendChild(floater);
    setTimeout(() => floater.remove(), 1200);
  }

  updateBossIntent() {
    if (!this.bossIntentEl) return;

    if (this.boss?.staggeredTurns > 0) {
      this.bossIntentEl.textContent = "Staggered: next action canceled";
      this.bossIntentEl.style.display = "block";
      return;
    }

    if (this.boss?.intentCanceled) {
      this.bossIntentEl.textContent = "Interrupted: next action canceled";
      this.bossIntentEl.style.display = "block";
      return;
    }

    const skill = this.getActiveBossIntent();
    if (skill) {
      let intentText = this.bossWindupSkill
        ? `Charging: ${skill.name}`
        : `Next: ${skill.name}`;

      if (skill.pattern === "aoe") {
        intentText += " (All Heroes)";
      } else if (skill.pattern === "single-splash") {
        intentText += " (Splash)";
      } else if (skill.pattern === "silence") {
        intentText += " (Silence)";
      }

      const hint = this.getIntentCounterHint(skill);
      if (hint) intentText += ` | Counter: ${hint}`;

      this.bossIntentEl.textContent = intentText;
      this.bossIntentEl.style.display = "block";
    } else {
      this.bossIntentEl.style.display = "none";
    }
  }

  getActiveBossIntent() {
    return this.bossWindupSkill || this.bossNextSkill;
  }

  getIntentCounterHint(skill) {
    if (!skill) return "";
    const hints = {
      single: "Provoke + Guard",
      "single-splash": "Provoke / Shield Wall",
      aoe: "Shield Wall / Break",
      silence: "Cleanse after",
      self: "Armor Break",
      berserk: "Bash",
    };
    return hints[skill.pattern] || "Break";
  }

  rollBossIntent() {
    if (this.state !== "playing" || !this.boss || this.boss.hp <= 0) return;
    if (this.boss.staggeredTurns > 0 || this.boss.intentCanceled) {
      this.updateBossIntent();
      return;
    }
    if (this.bossWindupSkill) {
      this.updateBossIntent();
      return;
    }
    this.bossNextSkill = this.chooseDragonSkill();
    this.updateBossIntent();
  }

  getHero(id) {
    if (!id || !this.heroes) return null;
    return this.heroes.find((h) => h.id === id);
  }

  startTurn() {
    if (this.state !== "playing") return;
    const current = this.turnOrder[this.turnIndex];
    this.applyDurations(current);
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
    
    // Event delegation for better performance
    const handleSkillClick = (e) => {
      const btn = e.target.closest(".skill-button");
      if (!btn || btn.disabled) return;
      
      const itemId = btn.dataset.itemId;
      if (itemId) {
        const item = this.getConsumable(itemId);
        if (item) {
          this.pendingItem = { hero, item };
          this.pendingSkill = null;
          this.prepareItemTargeting(hero, item);
        }
        return;
      }

      const skillId = btn.dataset.skillId;
      const skill = hero.skills.find(s => s.id === skillId);
      if (skill) {
        this.pendingSkill = { hero, skill };
        this.pendingItem = null;
        this.prepareTargeting(hero, skill);
      }
    };
    
    const handleSkillHover = (e) => {
      const btn = e.target.closest(".skill-button");
      if (!btn) {
        this.hideSkillInfo();
        return;
      }
      const itemId = btn.dataset.itemId;
      if (itemId) {
        const item = this.getConsumable(itemId);
        if (item) this.showItemInfo(item, btn);
        return;
      }
      const skillId = btn.dataset.skillId;
      const skill = hero.skills.find(s => s.id === skillId);
      if (skill) this.showSkillInfo(skill, btn);
    };
    
    // Remove old listeners if any
    this.skillButtons.removeEventListener("click", this._skillClickHandler);
    this.skillButtons.removeEventListener("mouseover", this._skillHoverHandler);
    this.skillButtons.removeEventListener("mouseout", this._skillLeaveHandler);
    
    // Store handlers for cleanup
    this._skillClickHandler = handleSkillClick;
    this._skillHoverHandler = handleSkillHover;
    this._skillLeaveHandler = () => this.hideSkillInfo();
    
    this.skillButtons.addEventListener("click", this._skillClickHandler);
    this.skillButtons.addEventListener("mouseover", this._skillHoverHandler);
    this.skillButtons.addEventListener("mouseout", this._skillLeaveHandler);
    
    hero.skills.forEach((skill) => {
      const btn = document.createElement("button");
      btn.className = "skill-button";
      btn.dataset.skillId = skill.id;
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
      this.skillButtons.appendChild(btn);
    });

    (CONFIG.consumables || []).forEach((item) => {
      const btn = document.createElement("button");
      const count = this.inventory[item.id] || 0;
      btn.className = "skill-button item-button";
      btn.dataset.itemId = item.id;
      btn.disabled = count <= 0 || hero.hp <= 0;
      btn.innerHTML = `
        <div><strong>${item.name}</strong></div>
        <div class="skill-meta">
          <span>${item.target}</span>
          <span>x${count}</span>
        </div>
      `;
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

  showItemInfo(item, button) {
    const metaParts = [item.target, `Stock ${this.inventory[item.id] || 0}`];
    this.skillInfo.innerHTML = `
      <div class="skill-tooltip-title">${item.name}</div>
      <div class="skill-tooltip-meta">${metaParts.join(" · ")}</div>
      <div class="skill-tooltip-text">${item.description}</div>
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

  getConsumable(itemId) {
    return (CONFIG.consumables || []).find((item) => item.id === itemId) || null;
  }

  prepareItemTargeting(hero, item) {
    if (item.target === "allies") {
      this.executeItem(hero, item);
      return;
    }
    this.openTargetSelect(this.heroes.filter((h) => h.hp > 0));
  }

  getBossTargetOptions() {
    const targets = [
      {
        id: "boss",
        name: `${this.boss.name} Core`,
        hp: this.boss.hp,
        maxHp: this.boss.maxHp,
        status: this.boss.status,
        isBossCore: true,
        effectLabel: "Direct boss HP damage",
      },
    ];

    (this.boss.parts || [])
      .filter((part) => !part.broken)
      .forEach((part) => {
        targets.push({
          id: `bossPart-${part.id}`,
          name: part.name,
          hp: part.integrity,
          maxHp: part.maxIntegrity,
          status: this.boss.status,
          isBossPart: true,
          partId: part.id,
          effectLabel: part.effectLabel,
        });
      });

    return targets;
  }

  prepareTargeting(hero, skill) {
    if (["self", "allies", "all-enemies"].includes(skill.target)) {
      this.executeSkill(hero, skill);
    } else if (skill.target === "enemy") {
      const targets = this.getBossTargetOptions();
      if (targets.length > 1) {
        this.openTargetSelect(targets);
      } else {
        this.executeSkill(hero, skill, this.boss);
      }
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
    
    const currentSkill = this.pendingSkill?.skill;
    const currentHero = this.pendingSkill?.hero;
    
    targets.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "target-btn";
      
      const hpPct = Math.round((t.hp / t.maxHp) * 100);
      const effectText = t.effectLabel
        ? `<div style="margin-top: 4px; font-size: 0.78em; color: var(--muted);">${t.effectLabel}</div>`
        : "";
      
      // Check for synergies
      const synergies = [];
      if (currentSkill && currentHero) {
        // Physical + DEF Down synergy
        if (currentSkill.type === "physical" && t.status?.defDown) {
          synergies.push("💥+15%");
        }
        // Fire + Mark synergy
        if (currentSkill.element === "fire" && t.status?.mark) {
          synergies.push("🔥+20%");
        }
        // Tank + Burning synergy
        if (
          currentHero.id === "tank" &&
          t.status?.dot &&
          (t.id === "boss" || t.isBossPart)
        ) {
          synergies.push("🛡️+10%");
        }
      }
      
      const synergyText = synergies.length > 0 ? ` ${synergies.join(" ")}` : "";
      btn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>${t.name}</span>
          <span style="font-size: 0.85em; opacity: 0.8;">${t.hp}/${t.maxHp} (${hpPct}%)</span>
        </div>
        ${effectText}
        ${synergyText ? `<div style="margin-top: 4px; font-size: 0.8em; color: var(--secondary);">${synergyText}</div>` : ""}
      `;
      
      btn.addEventListener("click", () => {
        if (this.pendingItem) {
          this.executeItem(this.pendingItem.hero, this.pendingItem.item, t);
        } else if (this.pendingSkill) {
          this.executeSkill(this.pendingSkill.hero, this.pendingSkill.skill, t);
        }
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
      if (t.isBossPart) {
        const partEl = document.getElementById(`bossPart-${t.partId}`);
        if (partEl) partEl.classList.add("targetable");
      } else if (t.id === "boss") {
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
    this.pendingItem = null;
    this.skillInfo.style.display = "none";
    this.closeTargetSelect();
  }

  applyDurations(currentId) {
    const decay = (status) => {
      Object.keys(status).forEach((k) => {
        if (k === "dot") return;
        if (status[k] && typeof status[k].duration === "number") {
          status[k].duration -= 1;
          if (status[k].duration <= 0) delete status[k];
        }
      });
    };
    if (currentId === "boss") {
      decay(this.boss.status || {});
      return;
    }
    const hero = this.getHero(currentId);
    if (hero) decay(hero.status || {});
  }

  applyEndOfTurnRegen() {
    const heroRegen = Math.max(
      0,
      HERO_REGEN +
        this.getBlessingEffect("mpRegenBonus") -
        this.getChallengeEffect("mpRegenPenalty")
    );
    this.heroes.forEach((h) => {
      if (h.hp > 0) {
        h.mp = Math.min(h.maxMp, h.mp + heroRegen);
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

  findComboForSkill(skill) {
    const ids = [...this.comboHistory.map((entry) => entry.skillId), skill.id];
    return (CONFIG.comboChains || []).find((combo) => {
      if (!combo.sequence || combo.sequence.length > ids.length) return false;
      const tail = ids.slice(ids.length - combo.sequence.length);
      return combo.sequence.every((skillId, index) => skillId === tail[index]);
    });
  }

  startComboIfMatched(user, skill) {
    if (!user || user.id === "boss") return;
    const combo = this.findComboForSkill(skill);
    if (!combo) return;

    this.activeCombo = combo;
    this.comboCount += 1;
    this.log(
      CONFIG.messages.comboTriggered.replace("${comboName}", combo.name),
      "buff"
    );
    this.showFloatingText("boss", "COMBO", "buff");
  }

  recordComboSkill(user, skill) {
    if (!user || user.id === "boss") return;
    this.comboHistory.push({ heroId: user.id, skillId: skill.id });
    this.comboHistory = this.comboHistory.slice(-4);
  }

  increaseBossStagger(rawAmount, source = null) {
    if (!this.boss || this.boss.hp <= 0 || this.boss.staggeredTurns > 0) {
      return;
    }

    const maxStagger = this.boss.maxStagger || STAGGER_MAX;
    const amount = Math.max(
      0,
      Math.round(rawAmount * (this.boss.staggerTaken || 1))
    );
    if (amount <= 0) return;

    this.boss.stagger = Math.min(maxStagger, (this.boss.stagger || 0) + amount);
    this.showFloatingText("boss", `+${amount} BRK`, "buff");

    if (this.boss.stagger >= maxStagger) {
      this.triggerBossStagger(source);
    }
  }

  applyStagger(source, target, skill, bonus = 0) {
    if (!source || source.id === "boss" || target?.id !== "boss") return;
    const blessingBonus = this.getBlessingEffect("staggerBonus");
    const comboBonus = this.activeCombo?.staggerBonus || 0;
    this.increaseBossStagger(
      (skill.stagger || 0) + bonus + blessingBonus + comboBonus,
      source
    );
  }

  triggerBossStagger(source = null) {
    this.boss.stagger = 0;
    this.boss.staggeredTurns = STAGGERED_TURNS;
    this.boss.intentCanceled = false;
    this.bossWindupSkill = null;
    this.bossNextSkill = null;
    this.staggerCount += 1;
    this.log(
      CONFIG.messages.bossStaggered.replace("${bossName}", this.boss.name),
      "phase"
    );
    this.showFloatingText("boss", "STAGGER", "crit");
    if (source && source.id !== "boss") {
      this.gainLimit(source, LIMIT_GAIN_DEALT);
    }
    this.updateBossIntent();
  }

  decayBossStagger() {
    if (!this.boss || this.boss.staggeredTurns > 0 || this.boss.stagger <= 0) {
      return;
    }
    this.boss.stagger = Math.max(
      0,
      this.boss.stagger - STAGGER_DECAY_PER_BOSS_TURN
    );
  }

  applySkillCounterplay(user, skill, target, canAddStaggerBonus) {
    const counterplay = skill.counterplay;
    const intent = this.getActiveBossIntent();
    const patterns = counterplay?.patterns || [];
    if (!counterplay || !intent || !patterns.includes(intent.pattern)) return 0;

    let staggerBonus = 0;
    let counted = false;

    if (counterplay.guardBoost) {
      this.boostCounterGuard(user, skill, counterplay.guardBoost);
      this.log(
        CONFIG.messages.bossShieldPrepared.replace("${user}", user.name),
        "buff"
      );
      counted = true;
    }

    if (counterplay.forceTaunt && this.boss.status?.taunt) {
      this.boss.status.taunt.guaranteed = true;
      this.log(CONFIG.messages.bossTauntLocked.replace("${user}", user.name));
      counted = true;
    }

    if (this.bossWindupSkill && counterplay.interruptWindup) {
      this.bossWindupSkill = null;
      this.bossNextSkill = null;
      this.boss.intentCanceled = true;
      staggerBonus += WINDUP_INTERRUPT_STAGGER;
      this.log(
        CONFIG.messages.bossWindupInterrupted.replace("${user}", user.name),
        "phase"
      );
      counted = true;
    }

    if (canAddStaggerBonus && counterplay.staggerBonus) {
      staggerBonus += counterplay.staggerBonus;
      this.log(
        CONFIG.messages.bossIntentCountered.replace("${user}", user.name),
        "buff"
      );
      counted = true;
    }

    if (counted) {
      this.intentCounterCount += 1;
    }

    return staggerBonus;
  }

  boostCounterGuard(user, skill, amount) {
    const cap = 0.85;
    if (skill.target === "allies") {
      this.heroes.forEach((hero) => {
        if (hero.status?.guardTeam) {
          hero.status.guardTeam.amount = Math.min(
            cap,
            hero.status.guardTeam.amount + amount
          );
        }
      });
      return;
    }

    if (user.status?.guard) {
      user.status.guard.amount = Math.min(cap, user.status.guard.amount + amount);
    }
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
    if (source.status?.dmgDown) buffMulti -= source.status.dmgDown.amount;
    const guardCut = target.status?.guard?.amount || 0;
    const guardTeam = target.status?.guardTeam?.amount || 0;
    const totalGuardCut = Math.min(0.85, guardCut + guardTeam);
    let synergyMulti = 1;
    let synergyMsg = "";
    if (!isMagic && target.status?.defDown) {
      synergyMulti += 0.15;
      synergyMsg = "💥 Physical Synergy!";
    }
    if (target.status?.mark && skill.element === "fire") {
      synergyMulti += 0.2;
      synergyMsg = "🔥 Fire+Mark Synergy!";
    }
    if (source.id === "tank" && this.boss.status?.dot && target.id === "boss") {
      synergyMulti += 0.1;
      synergyMsg = "🛡️ Tank Synergy!";
    }
    if (target.id === "boss" && target.staggeredTurns > 0) {
      synergyMulti += STAGGERED_DAMAGE_BONUS;
      synergyMsg = "⚡ Stagger Bonus!";
    }
    if (source.id !== "boss" && this.activeCombo?.damageBonus) {
      synergyMulti += this.activeCombo.damageBonus;
      synergyMsg = `🔗 ${this.activeCombo.name}!`;
    }
    const enrageMultiplier =
      source.id === "boss" && this.isDragonEnraged() ? 2 : 1;
    const damage = Math.max(
      8,
      Math.round(
        base * power * buffMulti * synergyMulti * (1 - totalGuardCut)
      )
    );
    let finalDamage = Math.max(8, Math.round(damage * enrageMultiplier));
    
    // Critical Hit System (10% chance for 1.5x damage, heroes only)
    let isCrit = false;
    if (source.id !== "boss" && Math.random() < 0.1) {
      finalDamage = Math.round(finalDamage * 1.5);
      isCrit = true;
    }
    
    target.hp = Math.max(0, target.hp - finalDamage);
    
    // Show floating damage text
    const targetId = target.id === "boss" ? "boss" : target.id;
    const floatType = isCrit ? "crit" : "damage";
    this.showFloatingText(targetId, `-${finalDamage}`, floatType);
    
    // Log synergy if triggered
    if (synergyMsg && synergyMulti > 1) {
      this.log(synergyMsg, "buff");
    }
    
    // Log critical hit
    if (isCrit) {
      this.log(`💥 CRITICAL HIT! (${finalDamage} damage)`, "damage");
    }
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
    
    // Show floating heal text
    this.showFloatingText(target.id, `+${amount}`, "heal");
    
    return amount;
  }

  getBossPart(partId) {
    return (this.boss.parts || []).find((part) => part.id === partId) || null;
  }

  getDisabledBossSkillIds() {
    const disabled = new Set();
    (this.boss.parts || []).forEach((part) => {
      if (!part.broken) return;
      (part.disabledSkillIds || []).forEach((skillId) => disabled.add(skillId));
    });
    return disabled;
  }

  getFallbackBossSkill() {
    return {
      id: "woundedStrike",
      name: "Wounded Strike",
      cost: 0,
      type: "physical",
      power: 0.85,
      pattern: "single",
      weight: 1,
    };
  }

  applyBossPartDamage(partId, damage, skill, source) {
    const part = this.getBossPart(partId);
    if (!part || part.broken) return;

    const partDamageBonus = this.getBlessingEffect("partDamageBonus");
    const comboBonus = this.activeCombo?.partDamageBonus || 0;
    const multiplier =
      (skill.partDamageMultiplier || 0.75) + partDamageBonus + comboBonus;
    const partDamage = Math.max(1, Math.round(damage * multiplier));
    part.integrity = Math.max(0, part.integrity - partDamage);
    this.showFloatingText("boss", `-${partDamage} PART`, "debuff");

    if (part.integrity > 0) return;

    part.broken = true;
    this.partsBrokenCount += 1;
    this.log(part.breakMessage || CONFIG.messages.bossPartBroken.replace("${partName}", part.name), "phase");
    if (part.breakStagger) {
      this.increaseBossStagger(part.breakStagger, source);
    }
    this.cancelDisabledBossIntent(part);
  }

  cancelDisabledBossIntent(part) {
    const disabled = new Set(part.disabledSkillIds || []);
    const blocksWindup = this.bossWindupSkill && disabled.has(this.bossWindupSkill.id);
    const blocksNext = this.bossNextSkill && disabled.has(this.bossNextSkill.id);

    if (!blocksWindup && !blocksNext) return;

    this.bossWindupSkill = null;
    this.bossNextSkill = null;
    this.boss.intentCanceled = true;
    this.intentCounterCount += 1;
    this.log(
      CONFIG.messages.bossPartInterrupted.replace("${partName}", part.name),
      "phase"
    );
    this.updateBossIntent();
  }

  executeItem(user, item, target = null) {
    if (!item || (this.inventory[item.id] || 0) <= 0) return;

    this.inventory[item.id] -= 1;
    this.itemsUsedCount += 1;

    if (item.type === "heal" && target) {
      const amount = Math.round(target.maxHp * item.healRatio);
      target.hp = Math.min(target.maxHp, target.hp + amount);
      this.showFloatingText(target.id, `+${amount}`, "heal");
      this.log(
        CONFIG.messages.itemUsed
          .replace("${user}", user.name)
          .replace("${itemName}", item.name)
          .replace("${target}", target.name),
        "heal"
      );
    } else if (item.type === "mp" && target) {
      target.mp = Math.min(target.maxMp, target.mp + item.amount);
      this.showFloatingText(target.id, `+${item.amount} MP`, "buff");
      this.log(
        CONFIG.messages.itemUsed
          .replace("${user}", user.name)
          .replace("${itemName}", item.name)
          .replace("${target}", target.name),
        "buff"
      );
    } else if (item.type === "limit" && target) {
      this.gainLimit(target, item.amount);
      this.showFloatingText(target.id, `+${item.amount}%`, "buff");
      this.log(
        CONFIG.messages.itemUsed
          .replace("${user}", user.name)
          .replace("${itemName}", item.name)
          .replace("${target}", target.name),
        "buff"
      );
    } else if (item.type === "guardTeam") {
      this.heroes.forEach((hero) => {
        if (hero.hp <= 0) return;
        hero.status.guardTeam = {
          amount: item.amount,
          duration: item.duration,
        };
      });
      this.log(
        CONFIG.messages.itemAllies
          .replace("${user}", user.name)
          .replace("${itemName}", item.name),
        "buff"
      );
    }

    this.pendingItem = null;
    this.resolveDot();
    this.updateUI();
    this.checkEnd();
    if (this.state === "playing") {
      this.advanceTurn();
    } else {
      this.turnCount += 1;
    }
  }

  executeSkill(user, skill, target = null) {
    if (skill.currentCd && skill.currentCd > 0) return;
    if (skill.requiresLimit && (user.limit || 0) < skill.requiresLimit) return;
    if (user.status?.silence && skill.type === "magic") return;
    if (user.mp < skill.cost) return;
    const bossPartTarget = target?.isBossPart ? target : null;
    const bossCoreTarget = target?.isBossCore ? target : null;
    this.activeCombo = null;
    this.startComboIfMatched(user, skill);
    user.mp -= skill.cost;
    if (!target) target = skill.target === "self" ? user : null;
    let resolvedTarget = target;
    let canAddStaggerBonus = false;

    if (skill.type === "physical" || skill.type === "magic") {
      const tgt = bossPartTarget || bossCoreTarget ? this.boss : target || this.boss;
      resolvedTarget = tgt;
      canAddStaggerBonus = true;
      const dmg = this.applyDamage(user, tgt, skill);
      const name = bossPartTarget
        ? bossPartTarget.name
        : tgt.id === "boss"
        ? this.boss.name
        : tgt.name;
      this.log(
        CONFIG.messages.skillUsed
          .replace("${user}", user.name)
          .replace("${skill}", skill.name)
          .replace("${target}", name)
          .replace("${damage}", dmg),
        "damage"
      );
      if (bossPartTarget) {
        this.applyBossPartDamage(bossPartTarget.partId, dmg, skill, user);
      }
      if (skill.execute && tgt.hp / tgt.maxHp < skill.execute) {
        tgt.hp = Math.max(0, tgt.hp - 40);
        this.log(CONFIG.messages.executeBonus.replace("${skill}", skill.name), "damage");
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
                .replace("${amount}", healed),
              "heal"
            );
          }
        });
      } else if (target) {
        const healed = this.applyHeal(user, target, skill);
        this.log(
          CONFIG.messages.healed
            .replace("${user}", user.name)
            .replace("${target}", target.name)
            .replace("${amount}", healed),
          "heal"
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
          .replace("${skill}", skill.name),
        "buff"
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

    const counterStaggerBonus = this.applySkillCounterplay(
      user,
      skill,
      resolvedTarget,
      canAddStaggerBonus
    );
    if (canAddStaggerBonus) {
      this.applyStagger(user, resolvedTarget, skill, counterStaggerBonus);
    }

    if (skill.cooldown) {
      skill.currentCd = skill.cooldown;
    }
    if (skill.requiresLimit) {
      user.limit = 0;
    }

    this.recordComboSkill(user, skill);
    this.activeCombo = null;
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

    if (boss.staggeredTurns > 0) {
      boss.staggeredTurns = Math.max(0, boss.staggeredTurns - 1);
      this.log(CONFIG.messages.bossStaggerSkip.replace("${bossName}", boss.name), "phase");
      this.resolveDot();
      this.updateUI();
      this.checkEnd();
      if (this.state === "playing") {
        this.rollBossIntent();
        this.advanceTurn();
      } else {
        this.turnCount += 1;
      }
      return;
    }

    if (boss.intentCanceled) {
      boss.intentCanceled = false;
      this.log(CONFIG.messages.bossIntentCanceled.replace("${bossName}", boss.name), "phase");
      this.resolveDot();
      this.updateUI();
      this.checkEnd();
      if (this.state === "playing") {
        this.rollBossIntent();
        this.advanceTurn();
      } else {
        this.turnCount += 1;
      }
      return;
    }

    let choice = this.bossWindupSkill || this.bossNextSkill || this.chooseDragonSkill();
    const isChargedSkill = this.bossWindupSkill === choice;

    if (!isChargedSkill && this.bossEnraged && choice.pattern === "aoe") {
      this.log(CONFIG.messages.dragonWindup);
      this.bossWindupSkill = choice;
      this.bossNextSkill = choice;
      this.updateBossIntent();
      this.advanceTurn();
      return;
    }

    if (isChargedSkill) {
      this.log(CONFIG.messages.dragonUnleash);
      this.bossWindupSkill = null;
    } else {
      this.bossNextSkill = null;
    }

    boss.mp = Math.max(0, boss.mp - choice.cost);

    if (choice.pattern === "self" && boss.status?.defDown) {
      delete boss.status.defDown;
      this.intentCounterCount += 1;
      this.log(CONFIG.messages.bossHardenCountered, "phase");
      this.increaseBossStagger(COUNTER_STAGGER_BONUS);
      this.resolveDot();
      this.updateUI();
      this.checkEnd();
      if (this.state === "playing") {
        this.rollBossIntent();
        this.advanceTurn();
      } else {
        this.turnCount += 1;
      }
      return;
    }

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
      const targetHero =
        this.selectDragonTarget(aliveHeroes, choice) || aliveHeroes[0];
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
      const targetHero =
        this.selectDragonTarget(aliveHeroes, choice) || aliveHeroes[0];
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
    this.decayBossStagger();
    this.updateUI();
    this.checkEnd();
    
    // Pick next skill for telegraph (predict what boss will do next)
    if (this.state === "playing") {
      this.rollBossIntent();
      this.advanceTurn();
    } else {
      this.turnCount += 1;
    }
  }

  chooseDragonSkill() {
    const enraged = this.isDragonEnraged() || this.bossEnraged;
    const disabledSkills = this.getDisabledBossSkillIds();
    const weightedSkills = this.boss.skills
      .filter(
        (s) => !disabledSkills.has(s.id) && (s.cost === 0 || this.boss.mp >= s.cost)
      )
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

    const pool = weightedSkills.length
      ? weightedSkills
      : [this.getFallbackBossSkill()];
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
        this.log(CONFIG.messages.dragonPhase2, "phase");
      } else if (newPhase === 3) {
        this.log(CONFIG.messages.dragonPhase3, "phase");
      }
    }
  }

  selectDragonTarget(aliveHeroes, skill = null) {
    if (!aliveHeroes.length) return null;
    const tauntTarget =
      this.boss.status.taunt && this.getHero(this.boss.status.taunt.target);
    const tauntCountersIntent =
      this.boss.status.taunt?.guaranteed &&
      ["single", "single-splash"].includes(skill?.pattern);
    if (tauntTarget && tauntTarget.hp > 0 && tauntCountersIntent) {
      this.log(
        CONFIG.messages.dragonProvoked.replace("${target}", tauntTarget.name)
      );
      return tauntTarget;
    }
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
    this.checkEnd();
    if (this.state !== "playing") return;
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

  renderBossParts() {
    if (!this.bossPartsEl) return;
    const parts = this.boss.parts || [];
    if (!parts.length) {
      this.bossPartsEl.innerHTML = "";
      return;
    }

    this.bossPartsEl.innerHTML = parts
      .map((part) => {
        const integrityPct = (part.integrity / part.maxIntegrity) * 100;
        const state = part.broken ? "Broken" : `${part.integrity}/${part.maxIntegrity}`;
        return `
          <div class="boss-part ${part.broken ? "broken" : ""}" id="bossPart-${part.id}">
            <div class="part-top">
              <span>${part.name}</span>
              <span>${state}</span>
            </div>
            <div class="part-bar">
              <div class="part-fill" style="width:${integrityPct}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  updateUI() {
    const bossHpPct = (this.boss.hp / this.boss.maxHp) * 100;
    const bossMpPct = (this.boss.mp / this.boss.maxMp) * 100;
    const bossNameEl = document.getElementById("bossName");
    if (bossNameEl) bossNameEl.textContent = this.boss.name;
    document.getElementById("bossHpBar").style.width = `${bossHpPct}%`;
    document.getElementById("bossMpBar").style.width = `${bossMpPct}%`;
    document.getElementById(
      "bossHpText"
    ).textContent = `${this.boss.hp}/${this.boss.maxHp}`;
    document.getElementById(
      "bossMpText"
    ).textContent = `${this.boss.mp}/${this.boss.maxMp}`;
    if (this.bossStaggerBar && this.bossStaggerText) {
      const maxStagger = this.boss.maxStagger || STAGGER_MAX;
      const staggerValue =
        this.boss.staggeredTurns > 0 ? maxStagger : this.boss.stagger || 0;
      const staggerPct = (staggerValue / maxStagger) * 100;
      this.bossStaggerBar.style.width = `${staggerPct}%`;
      this.bossStaggerText.textContent =
        this.boss.staggeredTurns > 0
          ? "Staggered"
          : `${Math.round(staggerValue)}/${maxStagger}`;
    }
    this.renderBossParts();
    const bossStatus = document.getElementById("bossStatus");
    const bossIcons = [];
    
    const addBossIcon = (icon, label, duration, type) => {
      bossIcons.push(`<span class="status-icon ${type}" title="${label}">${icon}<span class="duration">${duration}</span></span>`);
    };
    
    // Boss debuffs (from heroes)
    if (this.boss.status?.dot) addBossIcon("🔥", "Burning", this.boss.status.dot.duration, "debuff");
    if (this.boss.status?.defDown) addBossIcon("🛡️↓", "DEF Down", this.boss.status.defDown.duration, "debuff");
    if (this.boss.status?.mark) addBossIcon("🎯", "Marked", this.boss.status.mark.duration, "neutral");
    if (this.boss.status?.taunt) addBossIcon("😤", "Provoked", this.boss.status.taunt.duration, "neutral");
    if (this.boss.staggeredTurns > 0) addBossIcon("⚡", "Staggered", this.boss.staggeredTurns, "debuff");
    
    // Boss buffs (self)
    if (this.boss.status?.defUp) addBossIcon("🛡️↑", "DEF Up", this.boss.status.defUp.duration, "buff");
    if (this.boss.status?.atkUp) addBossIcon("⚔️↑", "ATK Up", this.boss.status.atkUp.duration, "buff");
    
    if (bossIcons.length > 0) {
      bossStatus.innerHTML = `<div class="status-icons">${bossIcons.join("")}</div>`;
      bossStatus.style.display = "block";
    } else {
      bossStatus.style.display = "none";
    }

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
      
      // Enhanced status icons display
      const statusEl = document.getElementById(`${h.id}Status`);
      const statusIcons = [];
      
      const addIcon = (icon, label, duration, type) => {
        if (duration !== undefined) {
          statusIcons.push(`<span class="status-icon ${type}" title="${label}">${icon}<span class="duration">${duration}</span></span>`);
        }
      };
      
      // Buffs (green)
      if (h.status.atkUp) addIcon("⚔️", "ATK Up", h.status.atkUp.duration, "buff");
      if (h.status.magUp) addIcon("✨", "MAG Up", h.status.magUp.duration, "buff");
      if (h.status.spdUp) addIcon("💨", "SPD Up", h.status.spdUp.duration, "buff");
      if (h.status.guard) addIcon("🛡️", "Guard", h.status.guard.duration, "buff");
      if (h.status.guardTeam) addIcon("🏰", "Shielded", h.status.guardTeam.duration, "buff");
      
      // Debuffs (red)
      if (h.status.atkDown) addIcon("⚔️↓", "ATK Down", h.status.atkDown.duration, "debuff");
      if (h.status.defDown) addIcon("🛡️↓", "DEF Down", h.status.defDown.duration, "debuff");
      if (h.status.spdDown) addIcon("🐌", "SPD Down", h.status.spdDown.duration, "debuff");
      if (h.status.silence) addIcon("🔇", "Silenced", h.status.silence.duration, "debuff");
      if (h.status.dot) addIcon("🔥", "Burning", h.status.dot.duration, "debuff");
      
      if (statusIcons.length > 0) {
        statusEl.innerHTML = `<div class="status-icons">${statusIcons.join("")}</div>`;
        statusEl.style.display = "block";
      } else {
        statusEl.style.display = "none";
      }
      
      const limitEl = document.getElementById(`${h.id}Limit`);
      if (limitEl) limitEl.textContent = `Limit: ${Math.round(h.limit)}%`;
    });
  }

  hasNextEncounter() {
    return (
      this.isCampaignMode() &&
      this.currentEncounterIndex < (CONFIG.campaign?.encounters?.length || 1) - 1
    );
  }

  logCurrentEncounter() {
    const encounter = this.getCurrentEncounter();
    if (!encounter) return;
    this.log(
      CONFIG.messages.campaignEncounter.replace(
        "${encounterName}",
        encounter.message || encounter.name
      ),
      "phase"
    );
  }

  recoverHeroesBetweenEncounters() {
    const hpRatio = CONFIG.campaign?.recoveryHpRatio || 0;
    const mpRatio = CONFIG.campaign?.recoveryMpRatio || 0;

    this.heroes.forEach((hero) => {
      hero.status = {};
      hero.hp = Math.max(
        hero.hp,
        Math.min(hero.maxHp, hero.hp + Math.round(hero.maxHp * hpRatio))
      );
      hero.mp = Math.min(hero.maxMp, hero.mp + Math.round(hero.maxMp * mpRatio));
      hero.skills.forEach((skill) => {
        skill.currentCd = 0;
      });
    });
  }

  continueCampaign() {
    if (!this.hasNextEncounter()) return;

    this.currentEncounterIndex += 1;
    this.recoverHeroesBetweenEncounters();
    this.boss = this.buildBoss();
    this.turnOrder = [];
    this.turnIndex = 0;
    this.bossEnragedNotified = false;
    this.bossEnraged = false;
    this.bossWindupSkill = null;
    this.bossNextSkill = null;
    this.bossPhase = 1;
    this.comboHistory = [];
    this.activeCombo = null;
    this.targeting = false;
    this.pendingSkill = null;
    this.pendingItem = null;
    this.closeTargetSelect();
    document.getElementById("gameOver").style.display = "none";
    document.getElementById("restart").textContent = "Restart";
    this.state = "playing";
    this.renderHeroes();
    this.rebuildTurnOrder();
    this.updateUI();
    this.logCurrentEncounter();
    this.rollBossIntent();
    this.startTurn();
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
      <div class="summary-line"><span>Mode</span><span>${this.isCampaignMode() ? "Campaign" : "Skirmish"}</span></div>
      <div class="summary-line"><span>Challenge</span><span>${this.activeChallenge?.name || "Standard"}</span></div>
      <div class="summary-line"><span>Blessing</span><span>${this.activeBlessing?.name || "None"}</span></div>
      <div class="summary-line"><span>Highest Hit</span><span>${this.highestHit}</span></div>
      <div class="summary-line"><span>Breaks</span><span>${this.staggerCount}</span></div>
      <div class="summary-line"><span>Counters</span><span>${this.intentCounterCount}</span></div>
      <div class="summary-line"><span>Parts Broken</span><span>${this.partsBrokenCount}</span></div>
      <div class="summary-line"><span>Combos</span><span>${this.comboCount}</span></div>
      <div class="summary-line"><span>Items Used</span><span>${this.itemsUsedCount}</span></div>
      <div class="summary-line"><span>Encounters</span><span>${this.completedEncounterCount + (this.state === "victory" ? 1 : 0)}</span></div>
      ${heroDamage}
      ${heroHealing}
    `;
  }

  getBestRunKey() {
    return `celestia_bestRun_${this.selectedGameMode}_${this.difficulty}_${
      this.selectedBlessingId || "none"
    }_${this.selectedChallengeId || "none"}`;
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
      mode: this.selectedGameMode,
      difficulty: this.difficulty,
      blessingId: this.selectedBlessingId,
      challengeId: this.selectedChallengeId,
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
    const blessing = this.getSelectedBlessing();
    const blessingLabel = blessing ? ` · ${blessing.name}` : "";
    const challenge = this.getSelectedChallenge();
    const challengeLabel =
      challenge && challenge.id !== "none" ? ` · ${challenge.name}` : "";
    const modeLabel = this.isCampaignMode() ? "Campaign" : "Skirmish";
    display.textContent = `Best (${modeLabel} · ${label}${blessingLabel}${challengeLabel}): ${best.turnCount} turns`;
  }

  checkEnd() {
    const heroesAlive = this.heroes.some((h) => h.hp > 0);
    if (this.boss.hp <= 0) {
      if (this.isCampaignMode() && this.hasNextEncounter()) {
        this.state = "encounter-clear";
        this.completedEncounterCount += 1;
        const encounter = this.getCurrentEncounter();
        document.getElementById("gameOver").style.display = "flex";
        document.getElementById("gameOverTitle").textContent =
          "Encounter Clear";
        document.getElementById("gameOverTitle").className = "victory";
        document.getElementById("gameOverText").textContent =
          CONFIG.messages.encounterClear.replace(
            "${encounterName}",
            encounter?.name || this.boss.name
          );
        document.getElementById("restart").textContent = "Continue";
        this.renderRunSummary();
        return;
      }
      this.state = "victory";
      document.getElementById("gameOver").style.display = "flex";
      document.getElementById("gameOverTitle").textContent = this.isCampaignMode()
        ? "Campaign Victory"
        : "Victory";
      document.getElementById("gameOverTitle").className = "victory";
      document.getElementById("gameOverText").textContent =
        this.isCampaignMode() ? CONFIG.messages.campaignVictory : CONFIG.messages.victory;
      document.getElementById("restart").textContent = "Restart";
      this.renderRunSummary();
      this.saveBestRun();
    } else if (this.getActiveTurnLimit() && this.turnCount >= this.getActiveTurnLimit()) {
      this.state = "defeat";
      document.getElementById("gameOver").style.display = "flex";
      document.getElementById("gameOverTitle").textContent = "Defeat";
      document.getElementById("gameOverTitle").className = "defeat";
      document.getElementById("gameOverText").textContent =
        CONFIG.messages.challengeFailed;
      document.getElementById("restart").textContent = "Restart";
      this.renderRunSummary();
    } else if (!heroesAlive) {
      this.state = "defeat";
      document.getElementById("gameOver").style.display = "flex";
      document.getElementById("gameOverTitle").textContent = "Defeat";
      document.getElementById("gameOverTitle").className = "defeat";
      document.getElementById("gameOverText").textContent =
        CONFIG.messages.defeat;
      document.getElementById("restart").textContent = "Restart";
      this.renderRunSummary();
    }
  }
}

new Game();
