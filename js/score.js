// js/score.js — Session score tracking, conversion kick modal, scoreboard

const ScoreManager = (() => {

  // ── Try scored flow ──────────────────────────────────────────────────────
  function tryScored() {
    const levelDef = GameState.current.levelDef;
    GameState.mutations.addScore(5);
    GameState.mutations.completeLevel(levelDef.id);
    GameState.mutations.recordTry();
    updateHUD();

    // Celebrate directly inside the running GameScene (no scene.launch needed)
    if (window.RUGBY.gameScene) {
      window.RUGBY.gameScene.api.celebrate(5, () => {
        window.RUGBY.gameScene.api.doGoalKick(() => _showConversionModal());
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

    document.getElementById('conversion-answer').dataset.correct = q.answer;
    document.getElementById('conversion-answer').value = '';
    document.getElementById('conversion-question').textContent = q.question;
    document.querySelector('.conversion-result').textContent = '';
    document.querySelector('.conversion-result').className = 'conversion-result';

    const modal = document.getElementById('modal-conversion');
    modal.classList.add('visible');

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
      GameState.mutations.recordConversion();
      AudioEngine.playConversionGoal();
      result.textContent = '⚽ Conversion! +2 pts';
      result.className   = 'conversion-result success';
      _showToast('+2 Conversion! 🎯', 'green');
    } else {
      AudioEngine.playMiss();
      result.textContent = `No good! The answer was ${correct}`;
      result.className   = 'conversion-result fail';
      _showToast('Missed! Better luck next time 😬', 'red');
    }

    updateHUD();

    // Close modal then advance
    setTimeout(() => {
      document.getElementById('modal-conversion').classList.remove('visible');
      document.getElementById('btn-conversion-submit').disabled = false;

      const nextLevel = getNextLevel(GameState.current.levelDef.id);
      if (nextLevel) {
        setTimeout(() => {
          ScreenManager.showLevelSelect();
          AudioEngine.playLevelUnlock();
          _showToast('Next level unlocked! 🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'gold');
        }, 600);
      } else {
        setTimeout(() => {
          ScreenManager.showLevelSelect();
          _showToast('🏆 All levels complete! Champion!', 'gold');
        }, 600);
      }
    }, 2000);
  }

  // ── HUD / scoreboard update ───────────────────────────────────────────────
  function updateHUD() {
    const { totalScore, tries, conversions } = GameState.session;

    const badge = document.getElementById('ls-score-badge');
    if (badge) badge.textContent = `🏉 ${totalScore} pts`;

    const sbTries = document.getElementById('sb-tries');
    if (sbTries) sbTries.textContent = tries;

    const sbConv = document.getElementById('sb-conversions');
    if (sbConv) sbConv.textContent = conversions;

    const sbScore = document.getElementById('sb-score');
    if (sbScore) sbScore.textContent = totalScore;
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
