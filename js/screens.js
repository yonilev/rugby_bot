// js/screens.js — Screen transitions and level-select rendering

const ScreenManager = (() => {
  const SCREEN_IDS = ['home', 'level-select', 'game'];
  let _phaserReady = false;

  // ── Screen switching ──────────────────────────────────────────────────────
  function showScreen(name) {
    SCREEN_IDS.forEach(id => {
      const el = document.getElementById(`screen-${id}`);
      if (el) el.classList.toggle('active', id === name);
    });
  }

  function showHome()        { showScreen('home'); }
  function showLevelSelect() {
    renderLevelSelect();
    ScoreManager.updateHUD();
    showScreen('level-select');
  }
  function showGame()        { showScreen('game'); }

  // ── Level select rendering ────────────────────────────────────────────────
  function renderLevelSelect() {
    const body = document.getElementById('level-select-body');
    if (!body) return;

    body.innerHTML = '';
    const completed = GameState.session.completedLevelIds;

    GROUPS.forEach((group, groupIdx) => {
      const section = document.createElement('div');
      section.className = 'group-section';

      // Group header
      const header = document.createElement('div');
      header.className = 'group-header';
      header.innerHTML = `
        <span class="group-icon">${group.icon}</span>
        <div class="group-info">
          <div class="group-title" style="color:${group.color}">${group.title}</div>
          <div class="group-desc">${group.description}</div>
        </div>
      `;
      section.appendChild(header);

      // Level cards row
      const row = document.createElement('div');
      row.className = 'level-cards-row';

      group.levels.forEach((level, levelIdx) => {
        const isCompleted = completed.includes(level.id);
        const isLocked = false;
        const stars = GameState.session.levelStars[level.id] || 0;

        const card = document.createElement('div');
        card.className = `level-card${isLocked ? ' locked' : ''}${isCompleted ? ' completed' : ''}`;
        card.style.setProperty('--card-color', group.color);

        const starsHtml = isCompleted
          ? `<div class="level-card-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>`
          : '';

        card.innerHTML = `
          <div class="level-card-num">Level ${levelIdx + 1}</div>
          <div class="level-card-title">${level.title}</div>
          <div class="level-card-desc">${level.description}</div>
          ${isLocked ? '<div class="level-card-lock">🔒</div>' : ''}
          ${starsHtml}
        `;

        if (!isLocked) {
          card.addEventListener('click', () => loadLevel(level));
        }

        row.appendChild(card);
      });

      section.appendChild(row);
      body.appendChild(section);
    });
  }

  // ── Load a level ──────────────────────────────────────────────────────────
  function loadLevel(levelDef) {
    GameState.mutations.loadLevel(levelDef);

    // Update HUD
    document.getElementById('hud-level').textContent = levelDef.title;
    document.getElementById('level-description').textContent = levelDef.description;
    ScoreManager.updateHUD();

    // Render block palette for this level
    BlockSystem.renderPalette(levelDef.availableCommands);
    BlockSystem.renderTray();

    // Show game screen
    showGame();

    // Initialise or reload Phaser
    _initOrReloadPhaser(levelDef);
  }

  function _initOrReloadPhaser(levelDef) {
    if (!window.RUGBY.phaserGame) {
      // First time — store pending level; Phaser will pick it up in GameScene.create()
      window.RUGBY.pendingLevel = levelDef;
      _createPhaserGame();
    } else if (window.RUGBY.gameScene) {
      // Phaser already running — call loadLevel directly
      window.RUGBY.gameScene.api.loadLevel(levelDef);
    } else {
      // Scene not yet ready — store pending
      window.RUGBY.pendingLevel = levelDef;
    }
  }

  function _createPhaserGame() {
    if (window.RUGBY.phaserGame) return;

    const config = {
      type: Phaser.AUTO,
      width:  700,
      height: 500,
      parent: 'phaser-container',
      backgroundColor: '#2D6A2F',
      scene: [BootScene, GameScene, CelebrationScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      audio: {
        disableWebAudio: false,
        noAudio: true, // we use our own Web Audio engine
      },
      banner: false,
    };

    window.RUGBY.phaserGame = new Phaser.Game(config);
  }

  // ── State change listener → update score HUD ─────────────────────────────
  document.addEventListener('rugby:statechange', (e) => {
    if (e.detail.changed === 'score') {
      ScoreManager.updateHUD();
    }
    if (e.detail.changed === 'execution') {
      const running = e.detail.running;
      const runBtn   = document.getElementById('btn-run');
      const resetBtn = document.getElementById('btn-reset');
      if (runBtn)   runBtn.disabled = running;
      if (resetBtn) resetBtn.disabled = running;
    }
  });

  return {
    showHome,
    showLevelSelect,
    showGame,
    renderLevelSelect,
    loadLevel,
  };
})();
