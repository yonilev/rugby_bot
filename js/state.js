// js/state.js — single source of truth for all game state.
// All mutations go through GameState.mutations.* which dispatch events.

const GameState = (() => {
  // ── Internal state ────────────────────────────────────────────────────────
  const state = {
    // Session (persists across levels until page reload)
    session: {
      totalScore: 0,
      completedLevelIds: [],  // string[]
      levelStars: {},         // { [levelId]: 1 | 2 }
      tries: 0,
      conversions: 0,
    },

    // Current level in play
    current: {
      levelDef: null,     // the full level definition object from levels.js

      // Finn's live position (updated during execution)
      finn: {
        col: 0,
        row: 0,
        dir: 'east',
      },

      // The player's constructed program (tree of command nodes)
      sequence: [],

      // Which waypoints have been collected this run
      visitedWaypoints: [],  // [{col,row}]

      // Execution state (managed by executor.js)
      execution: {
        running: false,
        stopped: false,
      },
    },
  };

  // ── Event helper ─────────────────────────────────────────────────────────
  function dispatch(changed, detail = {}) {
    document.dispatchEvent(
      new CustomEvent('rugby:statechange', { detail: { changed, ...detail } })
    );
  }

  // ── Session persistence ───────────────────────────────────────────────────
  function saveSession() {
    try {
      sessionStorage.setItem('rugby_session', JSON.stringify(state.session));
    } catch (e) { /* sessionStorage may be unavailable */ }
  }

  function loadSession() {
    try {
      const raw = sessionStorage.getItem('rugby_session');
      if (raw) {
        const saved = JSON.parse(raw);
        state.session.totalScore = saved.totalScore || 0;
        state.session.completedLevelIds = saved.completedLevelIds || [];
        state.session.levelStars = saved.levelStars || {};
        state.session.tries = saved.tries || 0;
        state.session.conversions = saved.conversions || 0;
      }
    } catch (e) {}
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  const mutations = {
    loadLevel(levelDef) {
      state.current.levelDef = levelDef;
      state.current.finn = {
        col: levelDef.finn.startCol,
        row: levelDef.finn.startRow,
        dir: levelDef.finn.startDir,
      };
      state.current.sequence = [];
      state.current.visitedWaypoints = [];
      state.current.execution = { running: false, stopped: false };
      dispatch('level', { levelDef });
    },

    addCommand(commandNode, insertIndex) {
      const seq = state.current.sequence;
      if (insertIndex == null || insertIndex >= seq.length) {
        seq.push(commandNode);
      } else {
        seq.splice(insertIndex, 0, commandNode);
      }
      dispatch('sequence');
    },

    addCommandToNode(parentId, slot, commandNode) {
      // Add a nested command inside a repeat/if block
      const parent = findNodeById(state.current.sequence, parentId);
      if (!parent) return;
      if (!parent[slot]) parent[slot] = [];
      parent[slot].push(commandNode);
      dispatch('sequence');
    },

    removeCommand(commandId) {
      state.current.sequence = removeNodeById(state.current.sequence, commandId);
      dispatch('sequence');
    },

    setParam(commandId, value) {
      const node = findNodeById(state.current.sequence, commandId);
      if (node) node.param = value;
      dispatch('sequence');
    },

    clearSequence() {
      state.current.sequence = [];
      dispatch('sequence');
    },

    updateFinn(col, row, dir) {
      state.current.finn.col = col;
      state.current.finn.row = row;
      state.current.finn.dir = dir;
      dispatch('finn');
    },

    markWaypointVisited(col, row) {
      state.current.visitedWaypoints.push({ col, row });
      dispatch('waypoint', { col, row });
    },

    setExecutionRunning(running) {
      state.current.execution.running = running;
      dispatch('execution', { running });
    },

    setExecutionStopped(stopped) {
      state.current.execution.stopped = stopped;
    },

    resetFinn() {
      const def = state.current.levelDef;
      if (!def) return;
      state.current.finn = {
        col: def.finn.startCol,
        row: def.finn.startRow,
        dir: def.finn.startDir,
      };
      state.current.visitedWaypoints = [];
      state.current.execution = { running: false, stopped: false };
      dispatch('finn');
    },

    addScore(points) {
      state.session.totalScore += points;
      saveSession();
      dispatch('score', { total: state.session.totalScore, added: points });
    },

    recordTry() {
      state.session.tries += 1;
      saveSession();
      dispatch('score', { total: state.session.totalScore });
    },

    recordConversion() {
      state.session.conversions += 1;
      saveSession();
      dispatch('score', { total: state.session.totalScore });
    },

    completeLevel(levelId) {
      if (!state.session.completedLevelIds.includes(levelId)) {
        state.session.completedLevelIds.push(levelId);
        saveSession();
      }
      dispatch('levelComplete', { levelId });
    },

    addLevelStar(levelId) {
      const current = state.session.levelStars[levelId] || 0;
      if (current < 3) {
        state.session.levelStars[levelId] = current + 1;
        saveSession();
        dispatch('stars', { levelId, stars: current + 1 });
      }
    },
  };

  // ── Tree helpers ──────────────────────────────────────────────────────────
  function findNodeById(nodes, id) {
    for (const node of nodes) {
      if (node.id === id) return node;
      // Search nested slots
      for (const slot of ['body', 'then', 'else']) {
        if (node[slot]) {
          const found = findNodeById(node[slot], id);
          if (found) return found;
        }
      }
    }
    return null;
  }

  function removeNodeById(nodes, id) {
    return nodes
      .filter(n => n.id !== id)
      .map(n => {
        const copy = Object.assign({}, n);
        for (const slot of ['body', 'then', 'else']) {
          if (n[slot]) copy[slot] = removeNodeById(n[slot], id);
        }
        return copy;
      });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    get session() { return state.session; },
    get current() { return state.current; },
    mutations,
    loadSession,
    saveSession,
    findNodeById: (id) => findNodeById(state.current.sequence, id),
  };
})();
