// js/main.js — Entry point: exposes modules on window.RUGBY and wires UI events

window.RUGBY = {
  state:     null,  // set below
  gameScene: null,  // set by GameScene.create()
  phaserGame: null, // set by ScreenManager._createPhaserGame()
  pendingLevel: null,
  // Module references for convenience
  score:   null,
  screens: null,
  blocks:  null,
  executor: null,
  audio:   null,
};

document.addEventListener('DOMContentLoaded', () => {
  // ── Wire module references ───────────────────────────────────────────────
  window.RUGBY.state    = GameState;
  window.RUGBY.score    = ScoreManager;
  window.RUGBY.screens  = ScreenManager;
  window.RUGBY.blocks   = BlockSystem;
  window.RUGBY.executor = Executor;
  window.RUGBY.audio    = AudioEngine;

  // ── Restore session score ────────────────────────────────────────────────
  GameState.loadSession();

  // ── Init block system ────────────────────────────────────────────────────
  BlockSystem.init();

  // ── Home screen ──────────────────────────────────────────────────────────
  document.getElementById('btn-start').addEventListener('click', () => {
    AudioEngine.ensure(); // unlock Web Audio on first gesture
    ScreenManager.showLevelSelect();
  });

  // ── Level select ─────────────────────────────────────────────────────────
  document.getElementById('hud-back').addEventListener('click', () => {
    Executor.stop();
    ScreenManager.showLevelSelect();
  });

  // ── Game controls ─────────────────────────────────────────────────────────
  document.getElementById('btn-run').addEventListener('click', () => {
    Executor.run();
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    Executor.stop();
    GameState.mutations.clearSequence();
    GameState.mutations.resetFinn();
    if (window.RUGBY.gameScene) {
      window.RUGBY.gameScene.api.resetToStart();
    }
  });

  document.getElementById('btn-hint').addEventListener('click', () => {
    const levelDef = GameState.current.levelDef;
    if (!levelDef) return;
    document.getElementById('hint-text').textContent = levelDef.hint || 'Try a different approach!';
    document.getElementById('modal-hint').classList.add('visible');
  });

  document.getElementById('btn-hint-close').addEventListener('click', () => {
    document.getElementById('modal-hint').classList.remove('visible');
  });

  // ── Conversion modal ──────────────────────────────────────────────────────
  document.getElementById('btn-conversion-submit').addEventListener('click', () => {
    ScoreManager.submitConversionAnswer();
  });

  document.getElementById('conversion-answer').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ScoreManager.submitConversionAnswer();
  });

  // ── Show home screen ──────────────────────────────────────────────────────
  ScreenManager.showHome();
});
