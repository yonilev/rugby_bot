# Finn Russell's Rugby Coding Academy 🏴󠁧󠁢󠁳󠁣󠁴󠁿🏉

A browser-based coding game for kids, starring Scotland fly-half **Finn Russell (#10)**.
Kids learn to program by guiding Finn across a rugby pitch to score tries.

## How to play

Open `index.html` in Chrome, Firefox, or Safari. **Internet access required** (Phaser 3 loads from CDN).
No server, no install, no build step.

## Game overview

- **Build a program** by clicking command blocks into a sequence
- **Press Run** to watch Finn execute the code step-by-step
- **Score a try** (+5 pts) when Finn reaches the try line
- **Answer a math question** for a conversion kick bonus (+2 pts)

## Levels

| Group | Concepts taught | Levels |
|---|---|---|
| 🏃 Basic Movement | move-forward, turn-left, turn-right | 5 |
| ❓ If / Else | if-condition (obstacle or mud ahead) | 4 |
| 🔁 Loops & Repeats | repeat N times | 4 |

Groups unlock sequentially. Session score persists while the tab is open.

## Tech stack

| Layer | Technology |
|---|---|
| Game rendering | [Phaser 3](https://phaser.io/) via jsDelivr CDN (free, MIT) |
| Game logic | Vanilla JavaScript (`window.RUGBY` namespace) |
| Audio | Web Audio API (all sounds generated — no audio files) |
| Storage | `sessionStorage` (score resets on tab close) |
| Build | None — plain `<script>` tags, works on `file://` |

## File structure

```
rugby_bot/
├── index.html               # Entry point
├── css/
│   ├── base.css             # CSS variables, Scotland palette, reset
│   ├── layout.css           # Game screen layout (canvas + coding panel)
│   ├── blocks.css           # Command block palette and sequence tray
│   ├── screens.css          # Home and level-select screens
│   └── ui.css               # Modals, toasts, HUD
├── js/
│   ├── utils.js             # Pure helpers (grid math, directions, math questions)
│   ├── audio.js             # Web Audio API sound generators
│   ├── levels.js            # All level definitions (pure data)
│   ├── state.js             # Single GameState object + mutations + events
│   ├── blocks.js            # Block palette and sequence tray DOM logic
│   ├── executor.js          # Recursive sequence runner, win detection
│   ├── score.js             # Session score, conversion kick modal
│   ├── screens.js           # Screen transitions, level-select rendering
│   └── main.js              # Entry point, wires all modules
└── js/scenes/
    ├── BootScene.js         # Creates Finn sprite texture, launches GameScene
    ├── GameScene.js         # Pitch rendering, Finn movement API
    └── CelebrationScene.js  # Confetti + try banner overlay
```

## Adding a new level

Edit **only** `js/levels.js`. Add one object to the appropriate group's `levels` array:

```js
{
  id: 'mv-6',                          // unique ID
  groupId: 'movement',                 // 'movement' | 'conditions' | 'loops'
  title: 'My New Level',
  description: 'What the player needs to do.',
  grid: { cols: 7, rows: 5 },
  cells: [
    { col: 5, row: 2, type: 'try-line' },
    { col: 3, row: 2, type: 'obstacle' },  // optional
  ],
  finn: { startCol: 1, startRow: 2, startDir: 'east' },
  availableCommands: ['move-forward', 'turn-left', 'turn-right'],
  winCondition: { type: 'reach', target: { col: 5, row: 2 } },
  maxCommands: null,
  hint: 'Tip shown when the player clicks the 💡 button.',
}
```

**Cell types:** `try-line` · `obstacle` · `waypoint` · `mud`
**Win condition types:** `reach` · `reach-any` · `visit-waypoints-then-reach`
**Available commands:** `move-forward` · `move-back` · `turn-left` · `turn-right` · `if-condition` · `repeat`

## Adding a new group

Add an entry to the `GROUPS` array in `js/levels.js`. New groups unlock after all levels of the previous group are completed.

## Scoring

| Event | Points |
|---|---|
| Try scored | +5 |
| Conversion kick (correct math) | +2 |

Math difficulty scales by group: addition/subtraction → two-digit arithmetic → multiplication.
