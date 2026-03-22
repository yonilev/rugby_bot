// js/score.js — Session score tracking, conversion kick modal, scoreboard

const ScoreManager = (() => {

  // ── Try scored flow ──────────────────────────────────────────────────────
  function tryScored() {
    const levelDef = GameState.current.levelDef;
    GameState.mutations.addScore(5);
    GameState.mutations.completeLevel(levelDef.id);
    GameState.mutations.addLevelStar(levelDef.id);
    GameState.mutations.recordTry();
    updateHUD();

    // Celebrate, then show math question — the kick comes after the answer
    if (window.RUGBY.gameScene) {
      window.RUGBY.gameScene.api.celebrate(5, () => _showConversionModal());
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

    if (isNaN(given)) {
      input.focus();
      return;
    }

    const isCorrect = given === correct;
    document.getElementById('btn-conversion-submit').disabled = true;

    // Close modal, then play kick — outcome reveals whether answer was right
    setTimeout(() => {
      document.getElementById('modal-conversion').classList.remove('visible');
      document.getElementById('btn-conversion-submit').disabled = false;

      const afterKick = () => {
        if (isCorrect) {
          GameState.mutations.addScore(2);
          GameState.mutations.recordConversion();
          GameState.mutations.addLevelStar(GameState.current.levelDef.id);
          AudioEngine.playConversionGoal();
          _showToast('+2 Conversion! 🎯', 'green');
        } else {
          AudioEngine.playMiss();
          _showToast(`No good! The answer was ${correct} 😬`, 'red');
        }
        updateHUD();

        const nextLevel = getNextLevel(GameState.current.levelDef.id);
        setTimeout(() => {
          ScreenManager.showLevelSelect();
          if (nextLevel) {
            AudioEngine.playLevelUnlock();
            _showToast('Next level unlocked! 🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'gold');
          } else {
            _showToast('🏆 All levels complete! Champion!', 'gold');
          }
        }, 800);
      };

      if (window.RUGBY.gameScene) {
        window.RUGBY.gameScene.api.doGoalKick(isCorrect, afterKick);
      } else {
        afterKick();
      }
    }, 400);
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
