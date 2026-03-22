# CLAUDE.md — Rugby Coding Academy

## Project overview
Browser-based kids coding game. No server — open `index.html` directly.
Scotland rugby theme: Finn Russell (#10, fly-half) navigates a pitch grid.

## Stack
- **Phaser 3** (CDN) — game canvas, tweens, particles, sprites
- **Vanilla JS** — all other logic (no bundler, no ES modules)
- All scripts loaded as plain `<script>` tags; share state via `window.RUGBY`

## Key modules to check before adding code
- `js/levels.js` — add new levels here (pure data, no DOM)
- `js/state.js` — all game state; always mutate via `state.mutations.*`
- `js/utils.js` — grid math, direction helpers, uuid; check before writing new helpers
- `js/audio.js` — Web Audio API sounds; add new sounds here
- `COMMAND_REGISTRY` in `js/blocks.js` — register new block types here

## Adding a new level
Add one object to the appropriate group's `levels` array in `js/levels.js`.
No other file needs changing. See the schema comment at the top of that file.

## Patterns
- Executor calls `window.RUGBY.gameScene.*` directly (not via DOM events)
- State mutations dispatch `rugby:statechange` custom DOM events
- Phaser scenes expose their public API via `this.api = { ... }` stored on `window.RUGBY.gameScene`
- Never call `state.mutations.*` from inside Phaser scenes — scenes only animate

## Testing
Open `index.html` in Chrome/Firefox/Safari (needs internet for Phaser CDN).
Complete a level, verify try+conversion flow, verify score persists across levels.
