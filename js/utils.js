// js/utils.js — pure helpers, no DOM or Phaser references

const Utils = (() => {
  // ── Direction system ──────────────────────────────────────────────────────
  const DIRS = ['north', 'east', 'south', 'west'];

  const DIR_DELTA = {
    north: { dc: 0,  dr: -1 },
    east:  { dc: 1,  dr: 0  },
    south: { dc: 0,  dr: 1  },
    west:  { dc: -1, dr: 0  },
  };

  // Angle in radians for each direction (0 = up / north, clockwise)
  const DIR_ANGLE = {
    north: 0,
    east:  Math.PI / 2,
    south: Math.PI,
    west:  3 * Math.PI / 2,
  };

  function rotateDir(dir, turn) {
    const idx = DIRS.indexOf(dir);
    if (turn === 'left')  return DIRS[(idx + 3) % 4];
    if (turn === 'right') return DIRS[(idx + 1) % 4];
    return dir;
  }

  function moveForward(col, row, dir) {
    const d = DIR_DELTA[dir];
    return { col: col + d.dc, row: row + d.dr };
  }

  function moveBack(col, row, dir) {
    const d = DIR_DELTA[dir];
    return { col: col - d.dc, row: row - d.dr };
  }

  function dirAngle(dir) {
    return DIR_ANGLE[dir];
  }

  // ── UUID ──────────────────────────────────────────────────────────────────
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // ── Grid helpers ──────────────────────────────────────────────────────────
  function cellKey(col, row) {
    return `${col},${row}`;
  }

  function isInBounds(col, row, gridCols, gridRows) {
    return col >= 0 && col < gridCols && row >= 0 && row < gridRows;
  }

  // ── Math question generator ───────────────────────────────────────────────
  // groupId: 'movement' | 'conditions' | 'loops'
  function generateMathQuestion(groupId) {
    let a, b, op, answer;

    if (groupId === 'movement') {
      // Single-digit addition or subtraction
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * 9) + 1;
      if (Math.random() < 0.5 || a < b) {
        op = '+';
        answer = a + b;
      } else {
        op = '−';
        answer = a - b;
      }
    } else if (groupId === 'conditions') {
      // Two-digit + single-digit
      a = Math.floor(Math.random() * 30) + 10;
      b = Math.floor(Math.random() * 9) + 1;
      const sub = Math.random() < 0.4;
      op = sub ? '−' : '+';
      answer = sub ? a - b : a + b;
    } else {
      // Multiplication up to 9×9
      a = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * 8) + 2;
      op = '×';
      answer = a * b;
    }

    return { question: `${a} ${op} ${b} = ?`, answer };
  }

  // ── Deep clone (for command trees) ───────────────────────────────────────
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  return {
    DIRS,
    DIR_DELTA,
    rotateDir,
    moveForward,
    moveBack,
    dirAngle,
    uuid,
    cellKey,
    isInBounds,
    generateMathQuestion,
    deepClone,
  };
})();
