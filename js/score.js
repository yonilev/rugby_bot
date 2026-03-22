// js/score.js — Session score tracking and conversion kick math modal

const ScoreManager = (() => {

  // ── Try scored flow ──────────────────────────────────────────────────────
  function tryScored() {
    const levelDef = GameState.current.levelDef;
    GameState.mutations.addScore(5);
    GameState.mutations.completeLevel(levelDef.id);

    // Launch celebration in Phaser
    if (window.RUGBY.phaserGame) {
      window.RUGBY.phaserGame.scene.launch('CelebrationScene', {
        points: 5,
        onDone: () => _showConversionModal(),
      });
    } else {
      setTimeout(() => _showConversionModal(), 800);
    }
  }

  // ── Conversion kick modal ─────────────────────────────────────────────────
  function _showConversionModal() {
    const levelDef = GameState.current.levelDef;
    const groupId  = levelDef ? levelDef.groupId : 'movement';
    const q = Utils.generateMathQuestion(groupId);

    // Store correct answer
    document.getElementById('conversion-answer').dataset.correct = q.answer;
    document.getElementById('conversion-answer').value = '';

    // Update UI
    document.getElementById('conversion-question').textContent = q.question;
    document.querySelector('.conversion-result').textContent = '';
    document.querySelector('.conversion-result').className = 'conversion-result';

    const modal = document.getElementById('modal-conversion');
    modal.classList.add('visible');

    // Focus input
    setTimeout(() => {
      document.getElementById('conversion-answer').focus();
    }, 400);
  }

  function submitConversionAnswer() {
    const input   = document.getElementById('conversion-answer');
    const correct = parseInt(input.dataset.correct);
    const given   = parseInt(input.value);
    const result  = document.querySelector('.conversion-result');

    if (isNaN(given)) {
      input.focus();
      return;
    }

    document.getElementById('btn-conversion-submit').disabled = true;

    if (given === correct) {
      GameState.mutations.addScore(2);
      AudioEngine.playConversionGoal();
      result.textContent = '⚽ Conversion! +2 pts';
      result.className = 'conversion-result success';
      _showToast('+2 Conversion! 🎯', 'green');
    } else {
      AudioEngine.playMiss();
      result.textContent = `No good! The answer was ${correct}`;
      result.className = 'conversion-result fail';
      _showToast('Missed! Better luck next time 😬', 'red');
    }

    // Close modal and move to next level / level select after a pause
    setTimeout(() => {
      document.getElementById('modal-conversion').classList.remove('visible');
      document.getElementById('btn-conversion-submit').disabled = false;

      const nextLevel = getNextLevel(GameState.current.levelDef.id);
      if (nextLevel) {
        // Brief pause then load next level
        setTimeout(() => {
          ScreenManager.showLevelSelect();
          AudioEngine.playLevelUnlock();
          _showToast('Next level unlocked! 🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'gold');
        }, 600);
      } else {
        // All done!
        setTimeout(() => {
          ScreenManager.showLevelSelect();
          _showToast('🏆 All levels complete! Champion!', 'gold');
        }, 600);
      }
    }, 2000);
  }

  // ── Score HUD update ──────────────────────────────────────────────────────
  function updateHUD() {
    const el = document.getElementById('hud-score');
    if (el) el.textContent = `🏉 ${GameState.session.totalScore} pts`;

    const badge = document.getElementById('ls-score-badge');
    if (badge) badge.textContent = `🏉 ${GameState.session.totalScore} pts`;
  }

  // ── Toast helper ──────────────────────────────────────────────────────────
  function _showToast(message, type = '') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  return {
    tryScored,
    submitConversionAnswer,
    updateHUD,
    showToast: _showToast,
  };
})();
