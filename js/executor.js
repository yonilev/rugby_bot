// js/executor.js — Runs the player's command sequence step-by-step.
// Calls GameScene's animation API and updates state.
// Uses recursive async callbacks — no pre-compilation needed.

const Executor = (() => {

  let _stopped = false;

  // ── Entry point ──────────────────────────────────────────────────────────
  function run() {
    const seq = GameState.current.sequence;
    if (seq.length === 0) {
      BlockSystem.showGameMessage('Add some blocks first! 📋', 'error');
      return;
    }
    if (GameState.current.execution.running) return;

    // Check maxCommands constraint
    const levelDef = GameState.current.levelDef;
    if (levelDef && levelDef.maxCommands && seq.length > levelDef.maxCommands) {
      BlockSystem.showGameMessage(`Too many blocks! Max is ${levelDef.maxCommands}`, 'error');
      return;
    }

    AudioEngine.ensure();
    AudioEngine.playRunStart();

    _stopped = false;
    GameState.mutations.setExecutionRunning(true);
    GameState.mutations.setExecutionStopped(false);

    // Reset Finn to start position
    GameState.mutations.resetFinn();
    if (window.RUGBY.gameScene) {
      window.RUGBY.gameScene.api.resetToStart();
    }

    executeNodes(seq, () => {
      // Program ended without winning
      GameState.mutations.setExecutionRunning(false);
      if (!_stopped) {
        BlockSystem.showGameMessage("Almost! Try a different path. 🤔", 'error');
      }
    });
  }

  function stop() {
    _stopped = true;
    GameState.mutations.setExecutionStopped(true);
    GameState.mutations.setExecutionRunning(false);
  }

  // ── Core recursive executor ───────────────────────────────────────────────
  function executeNodes(nodes, onAllDone) {
    let i = 0;

    function next() {
      if (_stopped) return;
      if (i >= nodes.length) { onAllDone(); return; }
      executeNode(nodes[i++], next);
    }

    next();
  }

  function executeNode(node, onDone) {
    if (_stopped) return;

    switch (node.type) {
      case 'move-forward':
        _doMove('forward', onDone);
        break;

      case 'move-back':
        _doMove('back', onDone);
        break;

      case 'turn-left':
        _doTurn('left', onDone);
        break;

      case 'turn-right':
        _doTurn('right', onDone);
        break;

      case 'repeat': {
        const times = Math.max(1, node.param || 3);
        let iter = 0;

        function doIter() {
          if (_stopped) return;
          if (iter >= times) { onDone(); return; }
          iter++;
          executeNodes(node.body || [], doIter);
        }

        doIter();
        break;
      }

      case 'if-condition': {
        const condMet = _evaluateCondition();
        const branch = condMet ? (node.then || []) : (node.else || []);
        executeNodes(branch, onDone);
        break;
      }

      case 'turn-around': {
        const { finn } = GameState.current;
        const newDir = Utils.rotateDir(Utils.rotateDir(finn.dir, 'right'), 'right');
        GameState.mutations.updateFinn(finn.col, finn.row, newDir);
        if (window.RUGBY.gameScene) {
          window.RUGBY.gameScene.api.turnFinn(newDir, () => {
            if (_stopped) return;
            onDone();
          });
        } else {
          onDone();
        }
        break;
      }

      case 'sprint':
        _doMove('forward', () => {
          if (_stopped) return;
          _doMove('forward', onDone);
        });
        break;

      case 'while-clear': {
        let safetyCounter = 0;
        function doWhile() {
          if (_stopped) return;
          if (safetyCounter++ >= 20) { onDone(); return; }
          if (_evaluateCondition()) { onDone(); return; } // obstacle/edge ahead → stop
          executeNodes(node.body || [], doWhile);
        }
        doWhile();
        break;
      }

      case 'pass':
        _doPass(node.param ?? 2, onDone);
        break;

      default:
        onDone();
    }
  }

  // ── Movement ──────────────────────────────────────────────────────────────
  function _doMove(direction, onDone) {
    if (_stopped) return;

    const { finn, levelDef } = GameState.current;
    const { col, row, dir } = finn;
    const newPos = direction === 'forward'
      ? Utils.moveForward(col, row, dir)
      : Utils.moveBack(col, row, dir);

    // Check bounds
    if (!Utils.isInBounds(newPos.col, newPos.row, levelDef.grid.cols, levelDef.grid.rows)) {
      _handleError('Out of bounds! 🚫');
      return;
    }

    // Check obstacles and mud (mud blocks movement — use if-condition to detect and avoid it)
    const cell = _getCellAt(newPos.col, newPos.row);
    if (cell && (cell.type === 'obstacle' || cell.type === 'opponent-player')) {
      _handleError('Tackled by an opponent! 🏉');
      return;
    }
    if (cell && cell.type === 'mud') {
      _handleError('Too muddy! Use IF to avoid the mud. 🟫');
      return;
    }
    if (cell && cell.type === 'teammate-player') {
      _handleError("Use PASS to give the ball to your teammate! 🏉");
      return;
    }

    // Update state immediately
    GameState.mutations.updateFinn(newPos.col, newPos.row, dir);

    // Check if waypoint collected
    if (cell && cell.type === 'waypoint') {
      const already = GameState.current.visitedWaypoints.some(
        w => w.col === newPos.col && w.row === newPos.row
      );
      if (!already) {
        GameState.mutations.markWaypointVisited(newPos.col, newPos.row);
        if (window.RUGBY.gameScene) {
          window.RUGBY.gameScene.api.collectWaypoint(newPos.col, newPos.row);
        }
      }
    }

    // Animate the move
    if (window.RUGBY.gameScene) {
      window.RUGBY.gameScene.api.moveFinnTo(newPos.col, newPos.row, dir, () => {
        if (_stopped) return;
        // Check win condition after animation
        if (_checkWin(newPos.col, newPos.row)) return;
        onDone();
      });
    } else {
      if (_checkWin(newPos.col, newPos.row)) return;
      onDone();
    }
  }

  function _doTurn(turn, onDone) {
    if (_stopped) return;

    const { finn } = GameState.current;
    const newDir = Utils.rotateDir(finn.dir, turn);
    GameState.mutations.updateFinn(finn.col, finn.row, newDir);

    if (window.RUGBY.gameScene) {
      window.RUGBY.gameScene.api.turnFinn(newDir, () => {
        if (_stopped) return;
        onDone();
      });
    } else {
      onDone();
    }
  }

  // ── Pass ─────────────────────────────────────────────────────────────────
  function _doPass(strength, onDone) {
    if (_stopped) return;

    const { finn } = GameState.current;
    // Pass goes to Finn's left (lateral, rugby-legal)
    const passDir = Utils.rotateDir(finn.dir, 'left');
    const delta = Utils.DIR_DELTA[passDir];
    const targetCol = finn.col + delta.dc * strength;
    const targetRow = finn.row + delta.dr * strength;

    const cell = _getCellAt(targetCol, targetRow);
    const hasTeammate = cell && cell.type === 'teammate-player';

    if (window.RUGBY.gameScene) {
      window.RUGBY.gameScene.api.passTo(targetCol, targetRow, passDir, () => {
        if (_stopped) return;
        if (hasTeammate) {
          _triggerWin();
        } else {
          _handleError('Pass missed! Adjust the strength. 🏉');
        }
      });
    } else {
      if (hasTeammate) {
        _triggerWin();
      } else {
        _handleError('Pass missed! Adjust the strength. 🏉');
      }
    }
  }

  // ── Win condition ─────────────────────────────────────────────────────────
  function _checkWin(col, row) {
    const { levelDef, visitedWaypoints } = GameState.current;
    const wc = levelDef.winCondition;

    if (wc.type === 'reach') {
      if (col === wc.target.col && row === wc.target.row) {
        _triggerWin();
        return true;
      }
    } else if (wc.type === 'reach-any') {
      if (wc.targets.some(t => t.col === col && t.row === row)) {
        _triggerWin();
        return true;
      }
    } else if (wc.type === 'visit-waypoints-then-reach') {
      const allCollected = wc.waypoints.every(wp =>
        visitedWaypoints.some(v => v.col === wp.col && v.row === wp.row)
      );
      if (allCollected && col === wc.target.col && row === wc.target.row) {
        _triggerWin();
        return true;
      }
    }

    return false;
  }

  function _triggerWin() {
    _stopped = true;
    GameState.mutations.setExecutionRunning(false);

    if (window.RUGBY.gameScene) {
      window.RUGBY.gameScene.api.highlightTryLine();
    }

    AudioEngine.playWhistle();

    // Short delay then show celebration
    setTimeout(() => {
      AudioEngine.playCrowd();
      window.RUGBY.score.tryScored();
    }, 300);
  }

  // ── Error handling ────────────────────────────────────────────────────────
  function _handleError(message) {
    _stopped = true;
    GameState.mutations.setExecutionRunning(false);

    if (window.RUGBY.gameScene) {
      window.RUGBY.gameScene.api.shakeError();
    }

    setTimeout(() => {
      BlockSystem.showGameMessage(message, 'error');
    }, 200);
  }

  // ── Condition evaluation ──────────────────────────────────────────────────
  function _evaluateCondition() {
    const { finn, levelDef } = GameState.current;
    const ahead = Utils.moveForward(finn.col, finn.row, finn.dir);

    // Out of bounds → treat as obstacle
    if (!Utils.isInBounds(ahead.col, ahead.row, levelDef.grid.cols, levelDef.grid.rows)) {
      return true;
    }

    const cell = _getCellAt(ahead.col, ahead.row);
    if (!cell) return false;
    return cell.type === 'obstacle' || cell.type === 'opponent-player' || cell.type === 'mud' || cell.type === 'teammate-player';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _getCellAt(col, row) {
    const cells = GameState.current.levelDef.cells || [];
    return cells.find(c => c.col === col && c.row === row) || null;
  }

  return { run, stop };
})();
