// js/levels.js — all level data. Pure data, no DOM or Phaser references.
//
// Level schema:
// {
//   id: string,             unique ID e.g. 'mv-1'
//   groupId: string,        'movement' | 'conditions' | 'loops'
//   title: string,
//   description: string,
//   grid: { cols, rows },
//   cells: [{ col, row, type }],
//     types: 'try-line' | 'obstacle' | 'waypoint' | 'mud' | 'hurdle' | 'opponent-player' | 'tackle-zone'
//   finn: { startCol, startRow, startDir },
//     dir: 'north' | 'east' | 'south' | 'west'
//   availableCommands: string[],
//   winCondition: { type, ... }
//     type 'reach':                    { type:'reach', target:{col,row} }
//     type 'visit-waypoints-then-reach': { type:'visit-waypoints-then-reach',
//                                          waypoints:[{col,row}], target:{col,row} }
//   maxCommands: number | null,
//   hint: string,
// }

const GROUPS = [
  {
    id: 'movement',
    title: 'Basic Movement',
    description: 'Help Finn run, turn, and score his first try!',
    icon: '🏃',
    color: '#F5A623',
    levels: [
      {
        id: 'mv-1',
        groupId: 'movement',
        title: 'First Steps',
        description: "Finn just got the ball! Help him run straight to the try line, then ground it to score.",
        grid: { cols: 7, rows: 5 },
        cells: [
          { col: 6, row: 2, type: 'try-line' },
        ],
        finn: { startCol: 1, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'score-try'],
        winCondition: { type: 'reach', target: { col: 6, row: 2 } },
        maxCommands: null,
        hint: 'Add 5 "Move Forward" blocks, then "Score Try!" to ground the ball!',
      },
      {
        id: 'mv-2',
        groupId: 'movement',
        title: 'The First Turn',
        description: "The try line is around the corner. Use turns to reach it, then score!",
        grid: { cols: 7, rows: 7 },
        cells: [
          { col: 6, row: 1, type: 'try-line' },
        ],
        finn: { startCol: 1, startRow: 5, startDir: 'north' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'score-try'],
        winCondition: { type: 'reach', target: { col: 6, row: 1 } },
        maxCommands: null,
        hint: 'Move north 4 times, turn right and move east 5 times, then Score Try!',
      },
      {
        id: 'mv-3',
        groupId: 'movement',
        title: 'Hurdle & Dodge',
        description: "A training hurdle AND a defender block the way! Jump the hurdle, dodge the defender, then score.",
        grid: { cols: 9, rows: 7 },
        cells: [
          { col: 2, row: 3, type: 'hurdle' },
          { col: 4, row: 3, type: 'obstacle' },
          { col: 8, row: 3, type: 'try-line' },
        ],
        finn: { startCol: 1, startRow: 3, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'jump', 'score-try'],
        winCondition: { type: 'reach', target: { col: 8, row: 3 } },
        maxCommands: null,
        hint: 'Jump over the hurdle, then dodge around the defender to reach the try line!',
      },
      {
        id: 'mv-4',
        groupId: 'movement',
        title: 'Pick Up the Ball',
        description: "The ball is loose! Grab it, then race to the try line and score.",
        grid: { cols: 7, rows: 5 },
        cells: [
          { col: 3, row: 0, type: 'waypoint' },
          { col: 6, row: 4, type: 'try-line' },
        ],
        finn: { startCol: 0, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'score-try'],
        winCondition: {
          type: 'visit-waypoints-then-reach',
          waypoints: [{ col: 3, row: 0 }],
          target: { col: 6, row: 4 },
        },
        maxCommands: null,
        hint: 'Go to the ball first, then find a path to the try line, then Score Try!',
      },
      {
        id: 'mv-5',
        groupId: 'movement',
        title: 'Champion Run',
        description: "Two defenders block the direct path. Find the efficient way through!",
        grid: { cols: 9, rows: 5 },
        cells: [
          { col: 3, row: 2, type: 'obstacle' },
          { col: 6, row: 2, type: 'obstacle' },
          { col: 8, row: 2, type: 'try-line' },
        ],
        finn: { startCol: 0, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'score-try'],
        winCondition: { type: 'reach', target: { col: 8, row: 2 } },
        maxCommands: null,
        hint: 'Go around both defenders using the top or bottom of the pitch, then Score Try!',
      },
      {
        id: 'mv-6',
        groupId: 'movement',
        title: 'Step Back!',
        description: "A defender is blocking Finn's path — but the try line is right behind him in the in-goal!",
        grid: { cols: 7, rows: 5 },
        cells: [
          { col: 3, row: 2, type: 'obstacle' },
          { col: 0, row: 2, type: 'try-line' },
        ],
        finn: { startCol: 2, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'move-back', 'turn-left', 'turn-right', 'score-try'],
        winCondition: { type: 'reach', target: { col: 0, row: 2 } },
        maxCommands: 3,
        hint: "There's a defender ahead! Move Back twice to reach the try line, then Score Try!",
      },
    ],
  },

  {
    id: 'conditions',
    title: 'If / Else',
    description: 'Teach Finn to make smart decisions on the pitch.',
    icon: '❓',
    color: '#E63946',
    levels: [
      {
        id: 'cond-1',
        groupId: 'conditions',
        title: 'Spot the Tackle',
        description: "A defender might be ahead! Use IF to dodge them, then score.",
        grid: { cols: 7, rows: 5 },
        cells: [
          { col: 3, row: 2, type: 'obstacle' },
          { col: 6, row: 2, type: 'try-line' },
        ],
        finn: { startCol: 1, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'if-condition', 'score-try'],
        winCondition: { type: 'reach', target: { col: 6, row: 2 } },
        maxCommands: null,
        hint: 'Use IF obstacle-ahead: THEN turn left. Move forward to get around, then Score Try!',
      },
      {
        id: 'cond-2',
        groupId: 'conditions',
        title: 'Left or Right?',
        description: "One path is blocked — use IF/ELSE to take the right one!",
        grid: { cols: 9, rows: 7 },
        cells: [
          { col: 4, row: 3, type: 'obstacle' },
          { col: 4, row: 4, type: 'obstacle' },
          { col: 8, row: 3, type: 'try-line' },
        ],
        finn: { startCol: 1, startRow: 3, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'if-condition', 'score-try'],
        winCondition: { type: 'reach', target: { col: 8, row: 3 } },
        maxCommands: null,
        hint: 'Check if the path ahead is clear. If blocked, go around the top! Then Score Try.',
      },
      {
        id: 'cond-3',
        groupId: 'conditions',
        title: 'Muddy Pitch',
        description: "It rained last night! A mud patch blocks the way. Use IF to go over the top!",
        grid: { cols: 7, rows: 5 },
        cells: [
          { col: 2, row: 2, type: 'mud' },
          { col: 6, row: 1, type: 'try-line' },
        ],
        finn: { startCol: 0, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'if-condition', 'score-try'],
        winCondition: { type: 'reach', target: { col: 6, row: 1 } },
        maxCommands: null,
        hint: 'Move forward once. Use IF: if mud ahead → Turn Left, Forward, Turn Right. Then keep going and Score Try!',
      },
      {
        id: 'cond-4',
        groupId: 'conditions',
        title: 'Reading the Defence',
        description: "Multiple defenders — use your new IF/ELSE skills to navigate them all!",
        grid: { cols: 11, rows: 7 },
        cells: [
          { col: 3, row: 3, type: 'obstacle' },
          { col: 6, row: 2, type: 'obstacle' },
          { col: 10, row: 3, type: 'try-line' },
        ],
        finn: { startCol: 1, startRow: 3, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'if-condition', 'score-try'],
        winCondition: { type: 'reach', target: { col: 10, row: 3 } },
        maxCommands: null,
        hint: 'Use multiple IF blocks to dodge each defender in turn, then Score Try.',
      },
      {
        id: 'cond-5',
        groupId: 'conditions',
        title: 'Zig-Zag',
        description: "Two defenders on different sides of the pitch — dodge them both with IF!",
        grid: { cols: 9, rows: 5 },
        cells: [
          { col: 3, row: 2, type: 'obstacle' },
          { col: 5, row: 1, type: 'obstacle' },
          { col: 8, row: 0, type: 'try-line' },
        ],
        finn: { startCol: 0, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'if-condition', 'score-try'],
        winCondition: { type: 'reach', target: { col: 8, row: 0 } },
        maxCommands: null,
        hint: "Use IF to dodge each defender — you'll need two IF blocks this time! Then Score Try.",
      },
      {
        id: 'cond-6',
        groupId: 'conditions',
        title: 'Loose Ball',
        description: "The ball is loose near the sideline! Grab it, then dodge the defender to score.",
        grid: { cols: 9, rows: 5 },
        cells: [
          { col: 2, row: 2, type: 'waypoint' },
          { col: 5, row: 2, type: 'obstacle' },
          { col: 7, row: 1, type: 'try-line' },
        ],
        finn: { startCol: 0, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'if-condition', 'score-try'],
        winCondition: {
          type: 'visit-waypoints-then-reach',
          waypoints: [{ col: 2, row: 2 }],
          target: { col: 7, row: 1 },
        },
        maxCommands: null,
        hint: 'Move forward to grab the ball, then use IF to dodge the defender, then Score Try!',
      },
    ],
  },

  {
    id: 'loops',
    title: 'Loops & Repeats',
    description: 'Make Finn run the same play over and over with REPEAT.',
    icon: '🔁',
    color: '#2A9D8F',
    levels: [
      {
        id: 'loop-1',
        groupId: 'loops',
        title: 'The Sprint',
        description: "Finn needs to sprint 7 squares. Don't type it 7 times — use REPEAT!",
        grid: { cols: 9, rows: 5 },
        cells: [
          { col: 8, row: 2, type: 'try-line' },
        ],
        finn: { startCol: 1, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'repeat', 'score-try'],
        winCondition: { type: 'reach', target: { col: 8, row: 2 } },
        maxCommands: null,
        hint: 'Use REPEAT 7 times with Move Forward inside, then Score Try!',
      },
      {
        id: 'loop-2',
        groupId: 'loops',
        title: 'L-Shaped Run',
        description: "Use two REPEAT blocks — one to run east, one to run south to the try line!",
        grid: { cols: 7, rows: 7 },
        cells: [
          { col: 6, row: 6, type: 'try-line' },
        ],
        finn: { startCol: 0, startRow: 3, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'repeat', 'score-try'],
        winCondition: { type: 'reach', target: { col: 6, row: 6 } },
        maxCommands: null,
        hint: 'Use REPEAT 6 to go east, then Turn Right, then REPEAT 3 to go south, then Score Try!',
      },
      {
        id: 'loop-3',
        groupId: 'loops',
        title: 'Weave Drill',
        description: "Rugby players practise weaving through cones. One cone is a hurdle — use REPEAT and JUMP to get through!",
        grid: { cols: 9, rows: 7 },
        cells: [
          { col: 2, row: 2, type: 'obstacle' },
          { col: 4, row: 4, type: 'hurdle' },
          { col: 6, row: 2, type: 'obstacle' },
          { col: 8, row: 5, type: 'try-line' },
        ],
        finn: { startCol: 1, startRow: 5, startDir: 'north' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'repeat', 'jump', 'score-try'],
        winCondition: { type: 'reach', target: { col: 8, row: 5 } },
        maxCommands: null,
        hint: 'Weave around the cone obstacles — but one is a hurdle you can jump over!',
      },
      {
        id: 'loop-4',
        groupId: 'loops',
        title: 'Championship Run',
        description: "The hardest challenge — loops AND decisions. You're a coding pro!",
        grid: { cols: 11, rows: 7 },
        cells: [
          { col: 3, row: 3, type: 'obstacle' },
          { col: 6, row: 3, type: 'obstacle' },
          { col: 10, row: 3, type: 'try-line' },
        ],
        finn: { startCol: 1, startRow: 3, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'if-condition', 'repeat', 'score-try'],
        winCondition: { type: 'reach', target: { col: 10, row: 3 } },
        maxCommands: null,
        hint: 'Use REPEAT with IF inside to handle repeated obstacles, then Score Try!',
      },
      {
        id: 'loop-5',
        groupId: 'loops',
        title: 'Training Cones',
        description: "Run the training drill — collect all 3 cones then sprint to the try line! The cones are evenly spaced…",
        grid: { cols: 9, rows: 3 },
        cells: [
          { col: 2, row: 1, type: 'waypoint' },
          { col: 4, row: 1, type: 'waypoint' },
          { col: 6, row: 1, type: 'waypoint' },
          { col: 8, row: 1, type: 'try-line' },
        ],
        finn: { startCol: 0, startRow: 1, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'repeat', 'score-try'],
        winCondition: {
          type: 'visit-waypoints-then-reach',
          waypoints: [{ col: 2, row: 1 }, { col: 4, row: 1 }, { col: 6, row: 1 }],
          target: { col: 8, row: 1 },
        },
        maxCommands: null,
        hint: 'Each cone is 2 squares apart — put two Move Forwards inside REPEAT 4! Then Score Try.',
      },
      {
        id: 'loop-6',
        groupId: 'loops',
        title: 'Corner Run',
        description: "Sprint to the far corner of the pitch using REPEAT — two repeating bursts and a turn!",
        grid: { cols: 7, rows: 7 },
        cells: [
          { col: 6, row: 0, type: 'try-line' },
        ],
        finn: { startCol: 0, startRow: 6, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'repeat', 'score-try'],
        winCondition: { type: 'reach', target: { col: 6, row: 0 } },
        maxCommands: null,
        hint: 'REPEAT 6 to go east, Turn Left to face north, then REPEAT 6 to reach the corner, then Score Try!',
      },
    ],
  },

  {
    id: 'advanced',
    title: 'Advanced Plays',
    description: 'Sprint, turn on a sixpence, and run until the whistle!',
    icon: '⚡',
    color: '#7B2FBE',
    levels: [
      {
        id: 'adv-1',
        groupId: 'advanced',
        title: 'Sprint Training',
        description: "Sprint is faster than Move Forward — it covers 2 squares at once. Opponents flank the pitch — sprint down the middle and tackle any in your way!",
        grid: { cols: 9, rows: 5 },
        cells: [
          { col: 3, row: 1, type: 'opponent-player' },
          { col: 5, row: 3, type: 'opponent-player' },
          { col: 8, row: 2, type: 'try-line' },
        ],
        finn: { startCol: 0, startRow: 2, startDir: 'east' },
        availableCommands: ['sprint', 'move-forward', 'turn-left', 'turn-right', 'tackle', 'score-try'],
        winCondition: { type: 'reach', target: { col: 8, row: 2 } },
        maxCommands: 5,
        hint: 'Opponents flank the pitch — stay on row 2 and sprint east! 4 Sprints reach the try line. Then Score Try.',
      },
      {
        id: 'adv-2',
        groupId: 'advanced',
        title: 'About Turn!',
        description: "Finn is facing the wrong direction and a defender is right in front of him. Spin around and sprint to the try line!",
        grid: { cols: 9, rows: 5 },
        cells: [
          { col: 7, row: 2, type: 'obstacle' },
          { col: 0, row: 2, type: 'try-line' },
        ],
        finn: { startCol: 6, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'move-back', 'turn-around', 'sprint', 'turn-left', 'turn-right', 'score-try'],
        winCondition: { type: 'reach', target: { col: 0, row: 2 } },
        maxCommands: 5,
        hint: 'Turn Around faces Finn west, then 3 Sprints carry him to the try line. Score Try!',
      },
      {
        id: 'adv-3',
        groupId: 'advanced',
        title: 'Endless Run',
        description: "Forget counting squares — use While Clear so Finn keeps running until he scores!",
        grid: { cols: 11, rows: 3 },
        cells: [
          { col: 10, row: 1, type: 'try-line' },
        ],
        finn: { startCol: 1, startRow: 1, startDir: 'east' },
        availableCommands: ['move-forward', 'sprint', 'while-clear', 'score-try'],
        winCondition: { type: 'reach', target: { col: 10, row: 1 } },
        maxCommands: 2,
        hint: 'Two blocks only! Put Move Forward inside While Clear — Finn runs until the try line. Then Score Try!',
      },
      {
        id: 'adv-4',
        groupId: 'advanced',
        title: 'Grand Slam',
        description: "Dodge a defender, pick up the ball, run the corridor, and score — tackle opponents that get in your way!",
        grid: { cols: 11, rows: 7 },
        cells: [
          { col: 4, row: 5, type: 'obstacle' },
          { col: 4, row: 2, type: 'waypoint' },
          { col: 5, row: 5, type: 'opponent-player' },
          { col: 7, row: 2, type: 'obstacle' },
          { col: 9, row: 4, type: 'opponent-player' },
          { col: 10, row: 1, type: 'try-line' },
        ],
        finn: { startCol: 1, startRow: 5, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'sprint', 'turn-around', 'if-condition', 'repeat', 'while-clear', 'tackle', 'score-try'],
        winCondition: {
          type: 'visit-waypoints-then-reach',
          waypoints: [{ col: 4, row: 2 }],
          target: { col: 10, row: 1 },
        },
        maxCommands: null,
        hint: 'Dodge the first defender, tackle opponents in your way, grab the ball, then sprint to the try line and Score Try!',
      },
      {
        id: 'adv-5',
        groupId: 'advanced',
        title: 'Wall of Defenders',
        description: "A line of defenders blocks the centre of the pitch. An opponent patrols the far end — tackle or find the safe path!",
        grid: { cols: 11, rows: 5 },
        cells: [
          { col: 5, row: 2, type: 'obstacle' },
          { col: 5, row: 3, type: 'obstacle' },
          { col: 5, row: 4, type: 'obstacle' },
          { col: 8, row: 1, type: 'opponent-player' },
          { col: 10, row: 0, type: 'try-line' },
        ],
        finn: { startCol: 0, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'sprint', 'turn-left', 'turn-right', 'if-condition', 'while-clear', 'tackle', 'score-try'],
        winCondition: { type: 'reach', target: { col: 10, row: 0 } },
        maxCommands: null,
        hint: 'Find the gap in the defensive wall. An opponent guards row 1 — tackle them or use row 0 to reach the try line. Score Try!',
      },
      {
        id: 'adv-6',
        groupId: 'advanced',
        title: 'World Cup Final',
        description: "The ultimate challenge — grab the ball, dodge defenders, tackle opponents, and score the winning try for Scotland!",
        grid: { cols: 11, rows: 5 },
        cells: [
          { col: 3, row: 2, type: 'waypoint' },
          { col: 5, row: 2, type: 'obstacle' },
          { col: 7, row: 0, type: 'opponent-player' },
          { col: 9, row: 1, type: 'obstacle' },
          { col: 10, row: 0, type: 'try-line' },
        ],
        finn: { startCol: 0, startRow: 2, startDir: 'east' },
        availableCommands: ['move-forward', 'turn-left', 'turn-right', 'sprint', 'turn-around', 'if-condition', 'repeat', 'while-clear', 'tackle', 'score-try'],
        winCondition: {
          type: 'visit-waypoints-then-reach',
          waypoints: [{ col: 3, row: 2 }],
          target: { col: 10, row: 0 },
        },
        maxCommands: null,
        hint: 'Grab the ball first, dodge the defenders — tackle or avoid the opponent at col 7, navigate around col 9 row 1, and Score Try!',
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLevelById(id) {
  for (const group of GROUPS) {
    const level = group.levels.find(l => l.id === id);
    if (level) return level;
  }
  return null;
}

function getGroupById(id) {
  return GROUPS.find(g => g.id === id) || null;
}

function getNextLevel(currentLevelId) {
  for (const group of GROUPS) {
    const idx = group.levels.findIndex(l => l.id === currentLevelId);
    if (idx !== -1) {
      if (idx + 1 < group.levels.length) return group.levels[idx + 1];
      const groupIdx = GROUPS.indexOf(group);
      if (groupIdx + 1 < GROUPS.length) return GROUPS[groupIdx + 1].levels[0];
      return null; // all done
    }
  }
  return null;
}

function isGroupUnlocked(groupId, completedLevelIds) {
  const groupIdx = GROUPS.findIndex(g => g.id === groupId);
  if (groupIdx === 0) return true; // first group always unlocked
  const prevGroup = GROUPS[groupIdx - 1];
  return prevGroup.levels.every(l => completedLevelIds.includes(l.id));
}
