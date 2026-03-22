// js/scenes/GameScene.js — Main game scene: pitch, grid, Finn, cell objects

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this._levelDef   = null;
    this._cellSize   = 72;
    this._offsetX    = 0;
    this._offsetY    = 0;
    this._finnSprite = null;
    this._cellObjs   = {};    // key → Phaser object
    this._gridGfx    = null;
    this._waypointGlow = {}; // col,row → Phaser object

    // Public API for executor.js and screens.js
    this.api = {
      loadLevel:   (def) => this._loadLevel(def),
      moveFinnTo:  (col, row, dir, onDone) => this._moveFinnTo(col, row, dir, onDone),
      turnFinn:    (dir, onDone) => this._turnFinn(dir, onDone),
      shakeError:  () => this._shakeError(),
      flashCell:   (col, row, color) => this._flashCell(col, row, color),
      collectWaypoint: (col, row) => this._collectWaypoint(col, row),
      highlightTryLine: () => this._highlightTryLine(),
      resetToStart: () => this._resetToStart(),
    };
  }

  create() {
    this._gridGfx = this.add.graphics();
    // Store scene reference globally for executor/score access
    window.RUGBY.gameScene = this;

    // If a level is already pending (set before Phaser finished booting), load it
    if (window.RUGBY.pendingLevel) {
      this._loadLevel(window.RUGBY.pendingLevel);
      window.RUGBY.pendingLevel = null;
    }
  }

  // ── Level loading ─────────────────────────────────────────────────────────
  _loadLevel(def) {
    this._levelDef = def;

    // Destroy existing objects
    if (this._finnSprite) this._finnSprite.destroy();
    Object.values(this._cellObjs).forEach(o => o.destroy());
    Object.values(this._waypointGlow).forEach(o => o.destroy());
    this._cellObjs = {};
    this._waypointGlow = {};

    // Compute cell size and grid offset to centre in canvas
    const { cols, rows } = def.grid;
    const W = this.scale.width;
    const H = this.scale.height;
    this._cellSize = Math.min(
      Math.floor((W - 20) / cols),
      Math.floor((H - 20) / rows),
      90
    );
    const gridW = cols * this._cellSize;
    const gridH = rows * this._cellSize;
    this._offsetX = Math.floor((W - gridW) / 2);
    this._offsetY = Math.floor((H - gridH) / 2);

    this._drawPitch(cols, rows);
    this._drawCells(def.cells);
    this._placeFinn(def.finn.startCol, def.finn.startRow, def.finn.startDir);
  }

  // ── Pitch drawing ─────────────────────────────────────────────────────────
  _drawPitch(cols, rows) {
    const g = this._gridGfx;
    g.clear();

    const cs = this._cellSize;
    const ox = this._offsetX;
    const oy = this._offsetY;

    // Alternating pitch stripes
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = (c + r) % 2 === 0 ? 0x2D6A2F : 0x348038;
        g.fillStyle(color, 1);
        g.fillRect(ox + c * cs, oy + r * cs, cs, cs);
      }
    }

    // Outer border
    g.lineStyle(3, 0xFFFFFF, 0.9);
    g.strokeRect(ox, oy, cols * cs, rows * cs);

    // Grid lines (inner)
    g.lineStyle(1, 0xFFFFFF, 0.15);
    for (let c = 1; c < cols; c++) {
      g.beginPath();
      g.moveTo(ox + c * cs, oy);
      g.lineTo(ox + c * cs, oy + rows * cs);
      g.strokePath();
    }
    for (let r = 1; r < rows; r++) {
      g.beginPath();
      g.moveTo(ox, oy + r * cs);
      g.lineTo(ox + cols * cs, oy + r * cs);
      g.strokePath();
    }

    // Corner decorations
    const cornerSize = Math.max(4, cs / 10);
    g.fillStyle(0xFFFFFF, 0.7);
    [[0,0],[cols,0],[0,rows],[cols,rows]].forEach(([c, r]) => {
      g.fillRect(ox + c * cs - cornerSize/2, oy + r * cs - cornerSize/2, cornerSize, cornerSize);
    });

    // Try-line end zones — highlight columns 0 and cols-1 lightly
    g.fillStyle(0xFFFFFF, 0.04);
    g.fillRect(ox, oy, cs, rows * cs);
    g.fillRect(ox + (cols - 1) * cs, oy, cs, rows * cs);
  }

  // ── Cell objects ──────────────────────────────────────────────────────────
  _drawCells(cells) {
    cells.forEach(cell => {
      const { col, row, type } = cell;
      const { px, py } = this._cellPixel(col, row);
      const cs = this._cellSize;

      if (type === 'try-line') {
        this._drawTryLineCell(col, row, px, py, cs);
      } else if (type === 'obstacle') {
        const img = this.add.image(px + cs/2, py + cs/2, 'obstacle');
        img.setDisplaySize(cs * 0.75, cs * 0.75);
        this._cellObjs[`${col},${row}`] = img;
      } else if (type === 'waypoint') {
        const img = this.add.image(px + cs/2, py + cs/2, 'waypoint');
        img.setDisplaySize(cs * 0.8, cs * 0.8);
        this._cellObjs[`${col},${row}`] = img;
        // Idle float tween
        this.tweens.add({
          targets: img,
          y: img.y - 5,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
        });
      } else if (type === 'mud') {
        const img = this.add.image(px + cs/2, py + cs/2, 'mud');
        img.setDisplaySize(cs * 0.9, cs * 0.9);
        this._cellObjs[`${col},${row}`] = img;
      }
    });
  }

  _drawTryLineCell(col, row, px, py, cs) {
    // Bright white stripe for the try-line cell
    const g = this.add.graphics();
    g.fillStyle(0xFFFFFF, 0.35);
    g.fillRect(px, py, cs, cs);
    g.lineStyle(2, 0xFFFFFF, 0.9);
    g.strokeRect(px + 2, py + 2, cs - 4, cs - 4);

    // "TRY" text
    const text = this.add.text(px + cs/2, py + cs/2, 'TRY', {
      fontSize: `${Math.max(10, cs/5)}px`,
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#003F7F',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    const container = this.add.container(0, 0, [g, text]);
    this._cellObjs[`${col},${row}`] = container;

    // Gentle pulse
    this.tweens.add({
      targets: text,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  // ── Finn placement ────────────────────────────────────────────────────────
  _placeFinn(col, row, dir) {
    const { px, py } = this._cellPixel(col, row);
    const cs = this._cellSize;

    // Phaser spritesheet: 4 frames, each 64×80
    if (!this.textures.exists('finn')) return;

    this._finnSprite = this.add.sprite(px + cs/2, py + cs/2, 'finn', 0);
    const scale = (cs * 0.85) / 80;
    this._finnSprite.setScale(scale);
    this._finnSprite.setAngle(this._dirToAngleDeg(dir));
    this._finnSprite.setDepth(10);

    // Walk animation (create once — skip if already registered)
    if (!this.anims.exists('walk')) {
      this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('finn', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  // ── Movement API (called by executor) ─────────────────────────────────────
  _moveFinnTo(col, row, dir, onDone) {
    if (!this._finnSprite) { if (onDone) onDone(); return; }

    const { px, py } = this._cellPixel(col, row);
    const cs = this._cellSize;
    const targetX = px + cs/2;
    const targetY = py + cs/2;
    const duration = 380;

    // Start walk animation
    this._finnSprite.play('walk');
    this._finnSprite.setAngle(this._dirToAngleDeg(dir));

    AudioEngine.playStep();

    this.tweens.add({
      targets: this._finnSprite,
      x: targetX,
      y: targetY,
      duration,
      ease: 'Power1.inOut',
      onComplete: () => {
        this._finnSprite.stop();
        this._finnSprite.setFrame(0);
        if (onDone) onDone();
      },
    });
  }

  _turnFinn(dir, onDone) {
    if (!this._finnSprite) { if (onDone) onDone(); return; }

    const targetAngle = this._dirToAngleDeg(dir);
    AudioEngine.playTurn();

    // Quick scale pulse for turn feedback
    this.tweens.add({
      targets: this._finnSprite,
      scaleX: this._finnSprite.scaleX * 1.2,
      scaleY: this._finnSprite.scaleY * 1.2,
      duration: 80,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this._finnSprite.setAngle(targetAngle);
        if (onDone) onDone();
      },
    });
  }

  _shakeError() {
    if (!this._finnSprite) return;
    AudioEngine.playBump();

    const origX = this._finnSprite.x;
    this.tweens.add({
      targets: this._finnSprite,
      x: origX + 12,
      duration: 50,
      yoyo: true,
      repeat: 4,
      ease: 'Power2',
      onComplete: () => { this._finnSprite.x = origX; },
    });

    // Red flash overlay
    const cs = this._cellSize;
    const flash = this.add.graphics();
    flash.fillStyle(0xFF4444, 0.4);
    flash.fillCircle(this._finnSprite.x, this._finnSprite.y, cs / 2);
    flash.setDepth(9);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });
  }

  _flashCell(col, row, colorHex) {
    const { px, py } = this._cellPixel(col, row);
    const cs = this._cellSize;
    const flash = this.add.graphics();
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    flash.fillStyle(color, 0.6);
    flash.fillRect(px, py, cs, cs);
    flash.setDepth(8);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    });
  }

  _collectWaypoint(col, row) {
    const key = `${col},${row}`;
    const obj = this._cellObjs[key];
    if (!obj) return;

    // Burst animation then remove
    this.tweens.add({
      targets: obj,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => { obj.destroy(); delete this._cellObjs[key]; },
    });

    // Sparkle particles
    const { px, py } = this._cellPixel(col, row);
    const cs = this._cellSize;
    const sparks = this.add.graphics();
    sparks.fillStyle(0xC8962E, 1);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      sparks.fillCircle(px + cs/2, py + cs/2, 4);
    }
    sparks.setDepth(11);
    this.tweens.add({
      targets: sparks,
      alpha: 0,
      duration: 400,
      onComplete: () => sparks.destroy(),
    });
  }

  _highlightTryLine() {
    // Already done by the try-line cell; this adds an extra gold pulse
    this._levelDef.cells
      .filter(c => c.type === 'try-line' || c.type === 'reach-any')
      .forEach(c => this._flashCell(c.col, c.row, '#C8962E'));
  }

  _resetToStart() {
    if (!this._levelDef || !this._finnSprite) return;
    const { startCol, startRow, startDir } = this._levelDef.finn;
    const { px, py } = this._cellPixel(startCol, startRow);
    const cs = this._cellSize;
    this._finnSprite.setPosition(px + cs/2, py + cs/2);
    this._finnSprite.setAngle(this._dirToAngleDeg(startDir));
    this._finnSprite.setFrame(0);
    this._finnSprite.stop();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  _cellPixel(col, row) {
    return {
      px: this._offsetX + col * this._cellSize,
      py: this._offsetY + row * this._cellSize,
    };
  }

  _dirToAngleDeg(dir) {
    return { north: 0, east: 90, south: 180, west: 270 }[dir] || 0;
  }
}
