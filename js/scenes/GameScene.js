// js/scenes/GameScene.js — Main game scene: pitch, grid, Finn, cell objects

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this._levelDef   = null;
    this._cellSize   = 72;
    this._offsetX    = 0;
    this._offsetY    = 0;
    this._finnSprite = null;
    this._cellObjs   = {};
    this._waypointGlow = {};
    this._gridGfx    = null;
    this._postGfx    = null;   // goal posts graphics (separate layer for flashing)

    // Public API for executor.js and screens.js
    this.api = {
      loadLevel:       (def) => this._loadLevel(def),
      moveFinnTo:      (col, row, dir, onDone) => this._moveFinnTo(col, row, dir, onDone),
      turnFinn:        (dir, onDone) => this._turnFinn(dir, onDone),
      shakeError:      () => this._shakeError(),
      flashCell:       (col, row, color) => this._flashCell(col, row, color),
      collectWaypoint: (col, row) => this._collectWaypoint(col, row),
      highlightTryLine: () => this._highlightTryLine(),
      resetToStart:    () => this._resetToStart(),
      doGoalKick:      (onDone) => this._doGoalKick(onDone),
    };
  }

  create() {
    this._gridGfx = this.add.graphics();
    this._postGfx = this.add.graphics();
    this._postGfx.setDepth(2);
    window.RUGBY.gameScene = this;

    if (window.RUGBY.pendingLevel) {
      this._loadLevel(window.RUGBY.pendingLevel);
      window.RUGBY.pendingLevel = null;
    }
  }

  // ── Level loading ─────────────────────────────────────────────────────────
  _loadLevel(def) {
    this._levelDef = def;

    if (this._finnSprite) this._finnSprite.destroy();
    Object.values(this._cellObjs).forEach(o => o.destroy());
    Object.values(this._waypointGlow).forEach(o => o.destroy());
    this._cellObjs = {};
    this._waypointGlow = {};

    const { cols, rows } = def.grid;
    const W = this.scale.width;
    const H = this.scale.height;
    this._cellSize = Math.min(
      Math.floor((W - 20) / cols),
      Math.floor((H - 40) / rows),
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
    this._postGfx.clear();

    const cs = this._cellSize;
    const ox = this._offsetX;
    const oy = this._offsetY;
    const pitchW = cols * cs;
    const pitchH = rows * cs;

    // ── Pitch background stripes (alternating dark/light green) ──────────
    for (let r = 0; r < rows; r++) {
      const color = r % 2 === 0 ? 0x2E7D32 : 0x388E3C;
      g.fillStyle(color, 1);
      g.fillRect(ox, oy + r * cs, pitchW, cs);
    }

    // ── In-goal areas (left and right end-zones, lighter green) ──────────
    const inGoalW = cs;  // 1 cell deep
    g.fillStyle(0x1B5E20, 0.6);
    g.fillRect(ox, oy, inGoalW, pitchH);                        // left
    g.fillRect(ox + pitchW - inGoalW, oy, inGoalW, pitchH);     // right

    // ── Centre circle ─────────────────────────────────────────────────────
    g.lineStyle(2, 0xFFFFFF, 0.25);
    const midX = ox + pitchW / 2;
    const midY = oy + pitchH / 2;
    g.strokeCircle(midX, midY, Math.min(pitchW, pitchH) * 0.14);

    // ── Centre spot ───────────────────────────────────────────────────────
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillCircle(midX, midY, 4);

    // ── 22m lines (at ~1/4 and ~3/4 of pitch width) ───────────────────────
    const line22Left  = ox + Math.round(pitchW * 0.25);
    const line22Right = ox + Math.round(pitchW * 0.75);
    g.lineStyle(2, 0xFFFFFF, 0.3);
    g.beginPath(); g.moveTo(line22Left,  oy); g.lineTo(line22Left,  oy + pitchH); g.strokePath();
    g.beginPath(); g.moveTo(line22Right, oy); g.lineTo(line22Right, oy + pitchH); g.strokePath();

    // ── Halfway line ──────────────────────────────────────────────────────
    g.lineStyle(2, 0xFFFFFF, 0.4);
    g.beginPath(); g.moveTo(midX, oy); g.lineTo(midX, oy + pitchH); g.strokePath();

    // ── Try lines (solid white, at edge of in-goal areas) ─────────────────
    g.lineStyle(3, 0xFFFFFF, 0.9);
    g.beginPath(); g.moveTo(ox + inGoalW, oy); g.lineTo(ox + inGoalW, oy + pitchH); g.strokePath();
    g.beginPath(); g.moveTo(ox + pitchW - inGoalW, oy); g.lineTo(ox + pitchW - inGoalW, oy + pitchH); g.strokePath();

    // ── Grid lines (inner, very faint) ────────────────────────────────────
    g.lineStyle(1, 0xFFFFFF, 0.08);
    for (let c = 1; c < cols; c++) {
      g.beginPath(); g.moveTo(ox + c * cs, oy); g.lineTo(ox + c * cs, oy + pitchH); g.strokePath();
    }
    for (let r = 1; r < rows; r++) {
      g.beginPath(); g.moveTo(ox, oy + r * cs); g.lineTo(ox + pitchW, oy + r * cs); g.strokePath();
    }

    // ── Outer border ──────────────────────────────────────────────────────
    g.lineStyle(3, 0xFFFFFF, 0.9);
    g.strokeRect(ox, oy, pitchW, pitchH);

    // ── Goal posts at left and right ──────────────────────────────────────
    this._drawGoalPosts(ox,          oy, pitchH, ox);
    this._drawGoalPosts(ox + pitchW, oy, pitchH, ox);
  }

  // Draws H-shaped rugby goal posts on one side of the pitch, with 3-D shading
  _drawGoalPosts(x, oy, pitchH, margin) {
    const pg = this._postGfx;
    const cs = this._cellSize;

    const midY      = oy + pitchH / 2;
    const uprightH  = cs * 1.5;           // uprights extend this far above crossbar
    const baseH     = cs * 0.38;          // central stem below crossbar
    const crossbarY = Math.round(midY - cs * 0.05); // top edge of the crossbar
    const postW     = 8;                  // post diameter (pixels)
    // Clamp halfSpan so the outer upright never clips past the canvas edge
    const halfSpan  = Math.min(Math.round(cs * 0.48), margin - Math.ceil(postW / 2) - 1);
    const barH      = 7;                  // crossbar height (pixels)
    const hl        = 2;                  // highlight strip (left/top edge)
    const sh        = 2;                  // shadow strip   (right/bottom edge)

    const colHL  = 0xFFFFF8;   // near-white highlight
    const colMid = 0xE8E4C0;   // cream main body
    const colSH  = 0x7A7860;   // warm dark-grey shadow

    // Draw one 3-D vertical cylindrical segment (top-to-bottom)
    const drawVPost = (cx, topY, height) => {
      const left = Math.round(cx - postW / 2);
      pg.fillStyle(colSH,  1); pg.fillRect(left + postW - sh, topY, sh, height);  // right shadow
      pg.fillStyle(colMid, 1); pg.fillRect(left + hl, topY, postW - hl - sh, height); // body
      pg.fillStyle(colHL,  1); pg.fillRect(left, topY, hl, height);               // left highlight
    };

    // Draw one 3-D horizontal bar segment (left-to-right)
    const drawHBar = (x1, x2, topY, height) => {
      const w = x2 - x1;
      pg.fillStyle(colSH,  1); pg.fillRect(x1, topY + height - sh, w, sh);        // bottom shadow
      pg.fillStyle(colMid, 1); pg.fillRect(x1, topY + hl, w, height - hl - sh);   // body
      pg.fillStyle(colHL,  1); pg.fillRect(x1, topY, w, hl);                      // top highlight
    };

    // Left upright   (above crossbar)
    drawVPost(x - halfSpan, crossbarY - uprightH, uprightH);
    // Right upright  (above crossbar)
    drawVPost(x + halfSpan, crossbarY - uprightH, uprightH);
    // Crossbar       (full width including uprights)
    drawHBar(Math.round(x - halfSpan - postW / 2), Math.round(x + halfSpan + postW / 2), crossbarY, barH);
    // Central stem   (below crossbar)
    drawVPost(x, crossbarY + barH, baseH);

    // Gold safety caps on top of each upright
    pg.fillStyle(0xC8962E, 1);
    pg.fillCircle(x - halfSpan, crossbarY - uprightH, 4);
    pg.fillCircle(x + halfSpan, crossbarY - uprightH, 4);
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
    const g = this.add.graphics();
    g.fillStyle(0xFFFFFF, 0.30);
    g.fillRect(px, py, cs, cs);
    g.lineStyle(3, 0xFFD700, 0.9);
    g.strokeRect(px + 2, py + 2, cs - 4, cs - 4);

    const text = this.add.text(px + cs/2, py + cs/2, 'TRY', {
      fontSize: `${Math.max(10, cs/4.5)}px`,
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#003F7F',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    const container = this.add.container(0, 0, [g, text]);
    this._cellObjs[`${col},${row}`] = container;

    this.tweens.add({
      targets: text,
      alpha: 0.5,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  // ── Finn placement ────────────────────────────────────────────────────────
  _placeFinn(col, row, dir) {
    const { px, py } = this._cellPixel(col, row);
    const cs = this._cellSize;

    if (!this.textures.exists('finn')) return;

    this._finnSprite = this.add.sprite(px + cs/2, py + cs/2, 'finn', 0);
    const scale = (cs * 0.85) / 80;
    this._finnSprite.setScale(scale);
    this._finnSprite.setDepth(10);
    this._applyFinnDirection(dir);

    if (!this.anims.exists('walk')) {
      this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('finn', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  // ── Direction helper (east-facing sprite) ─────────────────────────────────
  // Sprite is drawn facing east at angle=0. Use flipX for west direction.
  _applyFinnDirection(dir) {
    if (!this._finnSprite) return;
    const angles = { east: 0, south: 90, north: 270, west: 0 };
    this._finnSprite.setAngle(angles[dir] !== undefined ? angles[dir] : 0);
    this._finnSprite.setFlipX(dir === 'west');
  }

  // ── Movement API (called by executor) ─────────────────────────────────────
  _moveFinnTo(col, row, dir, onDone) {
    if (!this._finnSprite) { if (onDone) onDone(); return; }

    const { px, py } = this._cellPixel(col, row);
    const cs = this._cellSize;
    const targetX = px + cs/2;
    const targetY = py + cs/2;
    const duration = 380;

    this._finnSprite.play('walk');
    this._applyFinnDirection(dir);

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

    AudioEngine.playTurn();

    this.tweens.add({
      targets: this._finnSprite,
      scaleX: this._finnSprite.scaleX * 1.2,
      scaleY: this._finnSprite.scaleY * 1.2,
      duration: 80,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this._applyFinnDirection(dir);
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

    this.tweens.add({
      targets: obj,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => { obj.destroy(); delete this._cellObjs[key]; },
    });

    const { px, py } = this._cellPixel(col, row);
    const cs = this._cellSize;
    const sparks = this.add.graphics();
    sparks.fillStyle(0xC8962E, 1);
    for (let i = 0; i < 8; i++) {
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
    this._levelDef.cells
      .filter(c => c.type === 'try-line' || c.type === 'reach-any')
      .forEach(c => this._flashCell(c.col, c.row, '#FFD700'));
  }

  _resetToStart() {
    if (!this._levelDef || !this._finnSprite) return;
    const { startCol, startRow, startDir } = this._levelDef.finn;
    const { px, py } = this._cellPixel(startCol, startRow);
    const cs = this._cellSize;
    this._finnSprite.setPosition(px + cs/2, py + cs/2);
    this._applyFinnDirection(startDir);
    this._finnSprite.setFrame(0);
    this._finnSprite.stop();
  }

  // ── Goal kick animation ───────────────────────────────────────────────────
  // Animates a rugby ball arcing from Finn toward the nearest goal posts
  _doGoalKick(onDone) {
    if (!this._finnSprite || !this._levelDef) { if (onDone) onDone(); return; }

    const cs    = this._cellSize;
    const ox    = this._offsetX;
    const oy    = this._offsetY;
    const cols  = this._levelDef.grid.cols;
    const rows  = this._levelDef.grid.rows;
    const pitchH = rows * cs;
    const pitchW = cols * cs;

    // Kick toward the right-hand (east) goal posts
    const postX = ox + pitchW;
    const postY = oy + pitchH / 2 - cs * 0.05; // crossbar height (matches _drawGoalPosts)

    const startX = this._finnSprite.x;
    const startY = this._finnSprite.y;

    // Create a rugby ball graphic
    const ball = this.add.graphics();
    ball.setDepth(20);
    this._drawBallGraphic(ball);
    ball.setPosition(startX, startY);

    // Step flash on Finn — kick pose
    this.tweens.add({
      targets: this._finnSprite,
      y: this._finnSprite.y - 8,
      duration: 120,
      yoyo: true,
      ease: 'Power2',
    });

    // Animate ball along parabolic arc toward posts
    const duration = 1100;
    const startTime = { t: 0 };

    this.tweens.add({
      targets: startTime,
      t: 1,
      duration,
      ease: 'Linear',
      onUpdate: (tween) => {
        const p = tween.progress;
        const x = startX + (postX - startX) * p;
        const y = startY + (postY - startY) * p - Math.sin(p * Math.PI) * (pitchH * 0.55);
        ball.setPosition(x, y);
        ball.setAngle(p * 720);
        ball.setScale(1 + p * 0.3); // grow as it arcs forward then shrinks
      },
      onComplete: () => {
        // Flash goal posts yellow (success)
        this._flashGoalPosts();
        AudioEngine.playWhistle();

        this.tweens.add({
          targets: ball,
          alpha: 0,
          scaleX: 2,
          scaleY: 2,
          duration: 350,
          ease: 'Power2',
          onComplete: () => {
            ball.destroy();
            if (onDone) onDone();
          },
        });
      },
    });
  }

  _drawBallGraphic(g) {
    g.clear();
    g.fillStyle(0x8B4513, 1);
    g.fillEllipse(0, 0, 18, 11);
    g.lineStyle(1.5, 0xFFFFFF, 1);
    g.beginPath(); g.moveTo(-5, 0); g.lineTo(5, 0); g.strokePath();
    g.beginPath(); g.moveTo(0, -4); g.lineTo(0, 4); g.strokePath();
  }

  _flashGoalPosts() {
    // Tween the post graphics to yellow and back
    const pg = this._postGfx;
    this.tweens.add({
      targets: pg,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onUpdate: (tween) => {
        // Redraw in gold during flash
        pg.setTint(0xFFD700);
      },
      onComplete: () => {
        pg.clearTint();
        pg.setAlpha(1);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  _cellPixel(col, row) {
    return {
      px: this._offsetX + col * this._cellSize,
      py: this._offsetY + row * this._cellSize,
    };
  }
}
