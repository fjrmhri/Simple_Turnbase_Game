import { CONFIG } from './config.js';

class StoryController {
  constructor() {
    this.scenes = CONFIG.story.scenes;
    this.characters = CONFIG.story.characters;
    this.currentScene = null;
    this.lineIndex = 0;
    this.typeTimer = null;
    this.mode = 'story';
    this.onStoryEnd = null;
    this.bindUI();
    this.renderDifficultyOptions();
    this.renderModifiers();
  }

  bindUI() {
    this.storyPanel = document.getElementById('story-panel');
    this.storySpeaker = document.getElementById('story-speaker');
    this.storyLine = document.getElementById('story-line');
    this.storyPortrait = document.getElementById('story-portrait');
    document.getElementById('next-line').addEventListener('click', () => this.nextLine());
    document.getElementById('skip-text').addEventListener('click', () => this.skipType());
    document.getElementById('start-story').addEventListener('click', () => this.startIntro());
    document.getElementById('play-again').addEventListener('click', () => window.location.reload());
  }

  renderDifficultyOptions() {
    const select = document.getElementById('difficulty-select');
    select.innerHTML = '';
    Object.entries(CONFIG.difficulties).forEach(([id, diff]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = diff.label;
      select.appendChild(opt);
    });
  }

  renderModifiers() {
    const wrap = document.getElementById('modifier-container');
    wrap.innerHTML = '';
    CONFIG.modifiers.forEach((mod) => {
      const label = document.createElement('label');
      label.className = 'modifier-pill';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = mod.id;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + mod.label));
      wrap.appendChild(label);
    });
  }

  getSelectedDifficulty() {
    return document.getElementById('difficulty-select').value || 'normal';
  }

  getSelectedModifiers() {
    const wrap = document.getElementById('modifier-container');
    return Array.from(wrap.querySelectorAll('input:checked')).map((n) => n.value);
  }

  startIntro() {
    this.mode = 'story';
    this.currentScene = this.scenes.find((s) => s.id === 'intro');
    this.lineIndex = 0;
    this.storyPanel.classList.remove('hidden');
    document.getElementById('battle-panel').classList.add('hidden');
    document.getElementById('result-panel').classList.add('hidden');
    this.renderLine();
    const event = new CustomEvent('story:ready', {
      detail: {
        difficulty: this.getSelectedDifficulty(),
        modifiers: this.getSelectedModifiers()
      }
    });
    document.dispatchEvent(event);
  }

  showResult(sceneId) {
    this.mode = 'result';
    document.getElementById('battle-panel').classList.add('hidden');
    document.getElementById('story-panel').classList.remove('hidden');
    document.getElementById('result-panel').classList.remove('hidden');
    const scene = this.scenes.find((s) => s.id === sceneId);
    this.currentScene = scene;
    this.lineIndex = 0;
    this.renderLine();
    document.getElementById('result-title').textContent = sceneId === 'victory' ? 'Victory!' : 'Defeat';
  }

  renderLine() {
    if (!this.currentScene) return;
    const line = this.currentScene.lines[this.lineIndex];
    if (!line) return;
    this.storySpeaker.textContent = line.speaker;
    const portrait = this.characters[line.charId]?.portrait;
    if (portrait) {
      this.storyPortrait.src = portrait;
    }
    this.typeText(line.text);
  }

  typeText(text) {
    this.storyLine.textContent = '';
    let idx = 0;
    clearInterval(this.typeTimer);
    this.typeTimer = setInterval(() => {
      if (idx >= text.length) {
        clearInterval(this.typeTimer);
        return;
      }
      this.storyLine.textContent += text[idx];
      idx += 1;
    }, 20);
  }

  skipType() {
    if (!this.currentScene) return;
    clearInterval(this.typeTimer);
    const line = this.currentScene.lines[this.lineIndex];
    if (line) this.storyLine.textContent = line.text;
  }

  nextLine() {
    if (!this.currentScene) return;
    const line = this.currentScene.lines[this.lineIndex];
    if (this.storyLine.textContent !== line.text) {
      this.skipType();
      return;
    }
    this.lineIndex += 1;
    if (this.lineIndex >= this.currentScene.lines.length) {
      if (this.mode === 'story' && this.currentScene.id === 'intro') {
        this.startBattleMode();
        return;
      }
      return;
    }
    this.renderLine();
  }

  startBattleMode() {
    this.mode = 'battle';
    document.getElementById('battle-panel').classList.remove('hidden');
    document.getElementById('story-panel').classList.add('hidden');
    document.dispatchEvent(new CustomEvent('story:start-battle'));
  }
}

window.storyController = new StoryController();
