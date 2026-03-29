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
    this._crowdGfx   = null;   // crowd stands around the pitch
    this._injuryObjs = [];     // objects created by injury animation (cleaned on level reload)

    // Public API for executor.js and screens.js
    this.api = {
      loadLevel:        (def) => this._loadLevel(def),
      moveFinnTo:       (col, row, dir, onDone) => this._moveFinnTo(col, row, dir, onDone),
      turnFinn:         (dir, onDone) => this._turnFinn(dir, onDone),
      shakeError:       () => this._shakeError(),
      flashCell:        (col, row, color) => this._flashCell(col, row, color),
      collectWaypoint:  (col, row) => this._collectWaypoint(col, row),
      highlightTryLine: () => this._highlightTryLine(),
      resetToStart:     () => this._resetToStart(),
      doGoalKick:       (isCorrect, onDone) => this._doGoalKick(isCorrect, onDone),
      celebrate:        (points, onDone) => this._celebrate(points, onDone),
      passTo:           (col, row, dir, onDone) => this._passTo(col, row, dir, onDone),
      scoreTry:         (onDone) => this._scoreTry(onDone),
      jumpFinn:         (col, row, dir, onDone) => this._jumpFinn(col, row, dir, onDone),
      tackleOpponent:   (col, row, onDone) => this._tackleOpponent(col, row, onDone),
      pickupBall:       (col, row, onDone) => this._pickupBall(col, row, onDone),
    };
  }

  create() {
    this._gridGfx    = this.add.graphics();
    this._crowdGfx   = this.add.graphics().setDepth(1);
    this._postGfx    = this.add.graphics().setDepth(2);
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
    this._injuryObjs.forEach(o => { if (o && o.active) o.destroy(); });
    this._cellObjs = {};
    this._waypointGlow = {};
    this._injuryObjs = [];

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
    this._drawCrowd(cols, rows);
    this._drawCells(GameState.current.activeCells || def.cells);
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

    // ── In-goal areas (left and right end-zones, distinct olive-green stripes) ──
    const inGoalW = cs;  // 1 cell deep
    for (let r = 0; r < rows; r++) {
      const color = r % 2 === 0 ? 0x4A7C1F : 0x5A9225;
      g.fillStyle(color, 1);
      g.fillRect(ox,                    oy + r * cs, inGoalW, cs); // left
      g.fillRect(ox + pitchW - inGoalW, oy + r * cs, inGoalW, cs); // right
    }

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
      } else if (type === 'opponent-player') {
        const img = this.add.image(px + cs/2, py + cs/2, 'opponent-player');
        img.setDisplaySize(cs * 0.82, cs * 0.82);
        this._cellObjs[`${col},${row}`] = img;
        // Subtle idle sway
        this.tweens.add({
          targets: img,
          angle: 4,
          duration: 700 + Math.random() * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
        });
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
      } else if (type === 'teammate-player') {
        const img = this.add.image(px + cs/2, py + cs/2, 'teammate-player');
        img.setDisplaySize(cs * 0.82, cs * 0.82);
        this._cellObjs[`${col},${row}`] = img;
        // Gentle bounce — ready to receive
        this.tweens.add({
          targets: img,
          y: img.y - 6,
          duration: 600 + Math.random() * 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
        });
      } else if (type === 'hurdle') {
        this._drawHurdleCell(col, row, px, py, cs);
      } else if (type === 'ball') {
        const img = this.add.image(px + cs/2, py + cs/2, 'ball');
        img.setDisplaySize(cs * 0.7, cs * 0.7);
        this._cellObjs[`${col},${row}`] = img;
        this.tweens.add({
          targets: img,
          scaleX: img.scaleX * 1.1,
          scaleY: img.scaleY * 1.1,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
        });
      }
    });
  }

  _drawHurdleCell(col, row, px, py, cs) {
    const g = this.add.graphics();
    const postW  = Math.max(4, cs * 0.07);
    const postH  = cs * 0.55;
    const barH   = Math.max(4, cs * 0.08);
    const barY   = py + cs * 0.35;
    const leftX  = px + cs * 0.18;
    const rightX = px + cs * 0.82 - postW;

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillRect(leftX + 2, py + cs * 0.42 + 2, postW, postH);
    g.fillRect(rightX + 2, py + cs * 0.42 + 2, postW, postH);

    // Posts
    g.fillStyle(0xE86A1A, 1);
    g.fillRect(leftX, py + cs * 0.42, postW, postH);
    g.fillRect(rightX, py + cs * 0.42, postW, postH);

    // Crossbar with stripes
    g.fillStyle(0xFFFFFF, 1);
    g.fillRect(leftX, barY, rightX - leftX + postW, barH);
    g.fillStyle(0xE86A1A, 1);
    const stripeW = (rightX - leftX + postW) / 6;
    for (let i = 0; i < 6; i += 2) {
      g.fillRect(leftX + i * stripeW, barY, stripeW, barH);
    }

    // Outer border of crossbar
    g.lineStyle(1, 0xCC4400, 1);
    g.strokeRect(leftX, barY, rightX - leftX + postW, barH);

    g.setDepth(5);
    this._cellObjs[`${col},${row}`] = g;

    // Subtle idle pulse
    this.tweens.add({
      targets: g,
      alpha: 0.75,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
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

  _passTo(col, row, dir, onDone) {
    if (!this._finnSprite) { if (onDone) onDone(); return; }

    const { px: targetPx, py: targetPy } = this._cellPixel(col, row);
    const cs = this._cellSize;
    const targetX = targetPx + cs / 2;
    const targetY = targetPy + cs / 2;

    // Turn Finn to face the pass direction, then throw
    this._applyFinnDirection(dir);
    this.tweens.add({
      targets: this._finnSprite,
      scaleX: this._finnSprite.scaleX * 1.2,
      scaleY: this._finnSprite.scaleY * 1.2,
      duration: 120,
      yoyo: true,
      ease: 'Power2',
    });

    // Ball sprite
    const ball = this.add.graphics();
    ball.fillStyle(0x8B4513, 1);
    ball.fillEllipse(0, 0, 16, 10);
    ball.lineStyle(1.5, 0xFFFFFF, 1);
    ball.strokeEllipse(0, 0, 16, 10);
    const startX = this._finnSprite.x;
    const startY = this._finnSprite.y;
    ball.x = startX;
    ball.y = startY;
    ball.setDepth(15);

    // Arc height proportional to distance
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const arcHeight = dist * 0.35;

    // Perpendicular lift direction (always "up" in screen space for a nice arc)
    // For horizontal passes use vertical arc, for vertical passes use horizontal arc
    const isVertical = Math.abs(dy) > Math.abs(dx);
    const arcObj = { t: 0 };

    AudioEngine.playStep();

    this.tweens.add({
      targets: arcObj,
      t: 1,
      duration: 420,
      ease: 'Power1.inOut',
      onUpdate: () => {
        const p = arcObj.t;
        const arc = arcHeight * Math.sin(p * Math.PI);
        ball.x = startX + dx * p + (isVertical ? arc : 0);
        ball.y = startY + dy * p + (isVertical ? 0 : -arc);
        ball.angle += 9; // spin
      },
      onComplete: () => {
        ball.x = targetX;
        ball.y = targetY;

        // Catch flash on teammate cell
        const flash = this.add.graphics();
        flash.fillStyle(0xC8962E, 0.7);
        flash.fillCircle(targetX, targetY, cs * 0.48);
        flash.setDepth(14);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 380,
          ease: 'Power2',
          onComplete: () => { flash.destroy(); },
        });
        ball.destroy();
        if (onDone) onDone();
      },
    });
  }

  _shakeError() {
    this._injuryAmbulance();
  }

  // ── Injury + ambulance sequence ───────────────────────────────────────────
  // Finn collapses, dizzy stars orbit, ambulance drives in, loads Finn, drives off.
  _injuryAmbulance() {
    if (!this._finnSprite) return;

    const finn  = this._finnSprite;
    const cs    = this._cellSize;
    const W     = this.scale.width;

    // ── Phase 1: Finn collapses ──────────────────────────────────────────
    AudioEngine.playBump();
    finn.anims.stop();

    const origAngle  = finn.angle;
    const origScaleY = finn.scaleY;
    this.tweens.add({
      targets: finn,
      angle:  origAngle + 90,
      scaleY: origScaleY * 0.55,
      y:      finn.y + cs * 0.28,
      duration: 290,
      ease: 'Bounce.out',
    });

    // Red impact flash
    const flash = this.add.graphics().setDepth(9);
    flash.fillStyle(0xFF3333, 0.5);
    flash.fillCircle(finn.x, finn.y, cs * 0.58);
    this._injuryObjs.push(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 380,
      onComplete: () => { if (flash.active) flash.destroy(); },
    });

    // ── Dizzy orbit dots (yellow ★, red ●, cyan ●) ───────────────────────
    const dotColors = [0xFFD700, 0xFF5050, 0x40DDFF];
    const orbitDots = dotColors.map((color) => {
      const g = this.add.graphics().setDepth(16);
      g.fillStyle(color, 1);
      // Simple 5-point star shape
      g.fillCircle(0, 0, 5);
      g.fillTriangle(-5, -1, 0, -11, 5, -1);
      g.fillTriangle(-6, 5, 0, -3, 6, 5);
      this._injuryObjs.push(g);
      return g;
    });

    let orbitT = 0;
    const orbitEvent = this.time.addEvent({
      delay: 16,
      repeat: 175, // ~2.8 s
      callback: () => {
        if (!finn.active) return;
        orbitT += 0.13;
        orbitDots.forEach((dot, i) => {
          if (!dot.active) return;
          const a = orbitT + i * 2.094; // 120° apart
          dot.x = finn.x + Math.cos(a) * cs * 0.42;
          dot.y = finn.y - cs * 0.05 + Math.sin(a) * cs * 0.2;
        });
      },
      callbackScope: this,
    });

    // ── Phase 2: Ambulance drives in from the right (after 300 ms) ───────
    this.time.delayedCall(300, () => {
      if (!finn.active) return;
      AudioEngine.playAmbulanceSiren();

      const ambW       = cs * 2.6;
      const ambH       = cs * 0.95;
      const ambCY      = finn.y;
      // Ambulance parks with its centre 1.4 cells right of Finn; left edge nearly touches Finn
      const ambTargetX = finn.x + cs * 1.4;

      const ambGfx = this.add.graphics().setDepth(12);
      this._injuryObjs.push(ambGfx);

      let sirenOn = false;
      const redrawAmb = () => {
        ambGfx.clear();
        this._drawAmbulanceOn(ambGfx, ambW, ambH, sirenOn);
      };

      ambGfx.x = W + ambW;
      ambGfx.y = ambCY;
      redrawAmb();

      // Blinking siren lights (just redraws the whole ambulance graphic)
      const sirenEvent = this.time.addEvent({
        delay: 140,
        repeat: -1,
        callback: () => { if (ambGfx.active) { sirenOn = !sirenOn; redrawAmb(); } },
        callbackScope: this,
      });

      // Drive in
      this.tweens.add({
        targets: ambGfx,
        x: ambTargetX,
        duration: 820,
        ease: 'Power2.out',
        onComplete: () => {
          if (!finn.active) return;

          // ── Phase 3: Stretcher out + Finn loaded (200 ms pause) ──
          this.time.delayedCall(200, () => {
            if (!finn.active) return;

            const strGfx = this.add.graphics().setDepth(9);
            this._injuryObjs.push(strGfx);
            // Stretcher sits in the gap between Finn's original position and the ambulance
            const strCX = finn.x + cs * 0.55;
            const strCY = ambCY;
            strGfx.fillStyle(0xEECC88, 1);
            strGfx.fillRoundedRect(strCX - cs * 0.52, strCY - cs * 0.1, cs * 1.04, cs * 0.2, 4);
            strGfx.fillStyle(0x888888, 1);
            strGfx.fillRect(strCX - cs * 0.42, strCY + cs * 0.1, 5, cs * 0.28);
            strGfx.fillRect(strCX + cs * 0.38, strCY + cs * 0.1, 5, cs * 0.28);

            this.tweens.add({
              targets: finn,
              x: strCX,
              y: strCY - cs * 0.04,
              duration: 300,
              ease: 'Power1.inOut',
              onComplete: () => {
                if (!finn.active) return;

                // ── Phase 4: Ambulance + Finn drive off left ───────
                this.time.delayedCall(220, () => {
                  if (!finn.active) return;

                  const startAmbX = ambGfx.x;
                  const exitX     = -W - ambW * 1.2;

                  this.tweens.add({
                    targets: ambGfx,
                    x: exitX,
                    duration: 950,
                    ease: 'Power2.in',
                    onUpdate: () => {
                      if (!finn.active || !strGfx.active) return;
                      const dx = ambGfx.x - startAmbX;
                      finn.x   = strCX + dx;
                      strGfx.x = dx;
                    },
                    onComplete: () => {
                      sirenEvent.destroy();
                      orbitEvent.destroy();
                      orbitDots.forEach(d => { if (d.active) d.destroy(); });
                      if (finn.active) finn.setVisible(false);
                    },
                  });
                });
              },
            });
          });
        },
      });
    });
  }

  // Draws a left-facing side-view ambulance centred at local (0, 0).
  // sirenOn toggles between orange-left / blue-right and blue-left / orange-right.
  _drawAmbulanceOn(g, ambW, ambH, sirenOn) {
    // Body (white)
    g.fillStyle(0xFFFFFF, 1);
    g.fillRoundedRect(-ambW * 0.5, -ambH * 0.38, ambW, ambH * 0.76, 10);

    // Cab section (front / left end)
    g.fillStyle(0xE0E0E0, 1);
    g.fillRoundedRect(-ambW * 0.5, -ambH * 0.68, ambW * 0.3, ambH * 0.32, 7);

    // Windshield
    g.fillStyle(0x88BBFF, 0.85);
    g.fillRoundedRect(-ambW * 0.47, -ambH * 0.64, ambW * 0.2, ambH * 0.24, 4);

    // Red side stripe
    g.fillStyle(0xDD1111, 1);
    g.fillRect(-ambW * 0.5, -ambH * 0.06, ambW, ambH * 0.12);

    // Red cross on patient bay (right side)
    const cx = ambW * 0.18;
    const cy = -ambH * 0.1;
    g.fillStyle(0xFF0000, 1);
    g.fillRect(cx - 10, cy - 3,  20, 7);   // horizontal bar
    g.fillRect(cx - 3,  cy - 10, 7,  20);  // vertical bar

    // "AMBULANCE" label area (tinted band for readability)
    g.fillStyle(0xEEEEEE, 0.5);
    g.fillRect(-ambW * 0.18, -ambH * 0.36, ambW * 0.65, ambH * 0.16);

    // Rear doors hint (right end)
    g.lineStyle(2, 0xCCCCCC, 1);
    g.strokeRect(ambW * 0.31, -ambH * 0.36, ambW * 0.18, ambH * 0.74);
    g.lineBetween(ambW * 0.4, -ambH * 0.36, ambW * 0.4, ambH * 0.38);

    // Ground shadow
    g.fillStyle(0x000000, 0.14);
    g.fillEllipse(0, ambH * 0.52, ambW * 0.88, ambH * 0.16);

    // Wheels
    g.fillStyle(0x111111, 1);
    g.fillCircle(-ambW * 0.3, ambH * 0.38, ambH * 0.22);
    g.fillCircle( ambW * 0.26, ambH * 0.38, ambH * 0.22);
    g.fillStyle(0x555555, 1);
    g.fillCircle(-ambW * 0.3, ambH * 0.38, ambH * 0.1);
    g.fillCircle( ambW * 0.26, ambH * 0.38, ambH * 0.1);

    // Blinking siren lights on roof
    g.fillStyle(sirenOn ? 0xFF4400 : 0x552200, 1);
    g.fillRoundedRect(-ambW * 0.10, -ambH * 0.74, ambW * 0.09, ambH * 0.17, 3);
    g.fillStyle(sirenOn ? 0x223399 : 0x0055FF, 1);
    g.fillRoundedRect(ambW * 0.04,  -ambH * 0.74, ambW * 0.09, ambH * 0.17, 3);
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
      .filter(c => c.type === 'try-line')
      .forEach(c => this._flashCell(c.col, c.row, '#FFD700'));
  }

  _resetToStart() {
    if (!this._levelDef) return;

    // Clean up any injury animation objects still on screen
    this._injuryObjs.forEach(o => { if (o && o.active) o.destroy(); });
    this._injuryObjs = [];

    // Rebuild cell objects in case any were destroyed (e.g. tackled opponents)
    Object.values(this._cellObjs).forEach(o => o.destroy());
    Object.values(this._waypointGlow).forEach(o => o.destroy());
    this._cellObjs = {};
    this._waypointGlow = {};
    this._drawCells(GameState.current.activeCells || this._levelDef.cells);

    const { startCol, startRow, startDir } = this._levelDef.finn;
    if (this._finnSprite) this._finnSprite.destroy();
    this._placeFinn(startCol, startRow, startDir);
  }

  // ── Goal kick animation ───────────────────────────────────────────────────
  // isCorrect=true: ball arcs through posts and they flash
  // isCorrect=false: ball veers wide, no flash
  _doGoalKick(isCorrect, onDone) {
    if (!this._finnSprite || !this._levelDef) { if (onDone) onDone(); return; }

    const cs     = this._cellSize;
    const ox     = this._offsetX;
    const oy     = this._offsetY;
    const cols   = this._levelDef.grid.cols;
    const rows   = this._levelDef.grid.rows;
    const pitchH = rows * cs;
    const pitchW = cols * cs;

    // Goal posts are always to the east
    const postX = ox + pitchW;
    const postY = oy + pitchH / 2 - cs * 0.05;

    // For a miss, aim wide — well below the crossbar
    const targetX = isCorrect ? postX : postX + cs * 0.4;
    const targetY = isCorrect ? postY : postY + cs * 1.8;

    // Face east and stop walking
    this._finnSprite.stop();
    this._finnSprite.setAngle(0);
    this._finnSprite.setFlipX(false);

    const baseScale = this._finnSprite.scaleX;

    // Wind-up: brief body squish before the kick
    this.tweens.add({
      targets: this._finnSprite,
      scaleX: baseScale * 0.88,
      scaleY: baseScale * 1.12,
      duration: 200,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this._finnSprite.setScale(baseScale);

        // Switch to kick frame (frame 4: leg raised, arms spread)
        this._finnSprite.setFrame(4);

        // Ball appears at the kicking foot
        // Boot toe offset within sprite frame: x≈+32, y≈+22 from sprite centre
        const footX = this._finnSprite.x + 32 * baseScale;
        const footY = this._finnSprite.y + 22 * baseScale;

        const ball = this.add.graphics();
        ball.setDepth(20);
        this._drawBallGraphic(ball);
        ball.setPosition(footX, footY);
        ball.setScale(2); // large at contact point

        AudioEngine.playKick();

        // Brief pause so player sees the kick pose, then launch
        this.time.delayedCall(180, () => {
          const startTime = { t: 0 };
          this.tweens.add({
            targets: startTime,
            t: 1,
            duration: 1100,
            ease: 'Linear',
            onUpdate: (tween) => {
              const p = tween.progress;
              const x = footX + (targetX - footX) * p;
              const y = footY + (targetY - footY) * p - Math.sin(p * Math.PI) * (pitchH * 0.55);
              ball.setPosition(x, y);
              ball.setAngle(p * 720);
              ball.setScale(Math.max(0.5, 2 - p * 1.5)); // shrinks as it travels away
            },
            onComplete: () => {
              if (isCorrect) {
                this._flashGoalPosts();
                AudioEngine.playWhistle();
              }
              this._crowdReact(isCorrect);
              this._finnSprite.setFrame(0); // back to neutral stance

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
    const pg = this._postGfx;
    this.tweens.add({
      targets: pg,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => pg.setAlpha(1),
    });
  }

  // ── Celebration overlay (runs inside GameScene — no scene.launch needed) ──
  _celebrate(points, onDone) {
    const W = this.scale.width;
    const H = this.scale.height;
    const DEPTH = 50; // well above all pitch objects

    // Instant gold flash
    const flash = this.add.graphics().setDepth(DEPTH + 10);
    flash.fillStyle(0xFFD700, 1);
    flash.fillRect(0, 0, W, H);
    this.tweens.add({ targets: flash, alpha: 0, duration: 220, ease: 'Power2',
      onComplete: () => flash.destroy() });

    // Dark overlay
    const overlay = this.add.graphics().setDepth(DEPTH);
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, W, H);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 0.5, duration: 180 });

    // Crowd cheer
    this._crowdReact(true);

    const CONF_COLORS = [0xFFD700, 0x0065BD, 0xFFFFFF, 0xFF5252, 0x4CAF50, 0xFF69B4, 0xC8962E, 0x00BFFF];

    const _confettiRain = () => {
      for (let i = 0; i < 160; i++) {
        const g = this.add.graphics().setDepth(DEPTH + 2);
        const c = CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)];
        g.fillStyle(c, 1);
        Math.random() < 0.5 ? g.fillRect(-5, -7, 10, 14) : g.fillCircle(0, 0, 6);
        g.setPosition(Math.random() * W, -20);
        this.tweens.add({
          targets: g, x: g.x + (Math.random() - 0.5) * 220,
          y: H + 40, angle: (Math.random() < 0.5 ? 540 : -540),
          duration: 2200 + Math.random() * 1200, delay: Math.random() * 700,
          ease: 'Sine.in', onComplete: () => g.destroy(),
        });
      }
    };

    const _confettiBurst = () => {
      for (let i = 0; i < 80; i++) {
        const g = this.add.graphics().setDepth(DEPTH + 3);
        const c = CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)];
        g.fillStyle(c, 1);
        Math.random() < 0.5 ? g.fillRect(-5, -7, 10, 14) : g.fillCircle(0, 0, 6);
        g.setPosition(W / 2, H / 2);
        const a = Math.random() * Math.PI * 2, spd = 80 + Math.random() * 200;
        this.tweens.add({
          targets: g, x: W / 2 + Math.cos(a) * spd, y: H / 2 + Math.sin(a) * spd + 80,
          angle: (Math.random() - 0.5) * 720, alpha: 0,
          duration: 1000 + Math.random() * 800, ease: 'Power2.out',
          onComplete: () => g.destroy(),
        });
      }
    };

    const _fireworks = () => {
      const FW_COLORS = [0xFFD700, 0xFF4444, 0x4CAF50, 0x00BFFF, 0xFF69B4, 0xFFFFFF, 0xC8962E];
      const _firework = (cx, cy) => {
        const col = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
        const burst = this.add.graphics().setDepth(DEPTH + 8);
        burst.fillStyle(0xFFFFFF, 1); burst.fillCircle(0, 0, 14);
        burst.setPosition(cx, cy);
        this.tweens.add({ targets: burst, alpha: 0, scaleX: 4, scaleY: 4, duration: 200,
          ease: 'Power2', onComplete: () => burst.destroy() });
        for (let i = 0; i < 20; i++) {
          const ang = (i / 20) * Math.PI * 2, spd = 80 + Math.random() * 110;
          const sp = this.add.graphics().setDepth(DEPTH + 7);
          sp.fillStyle(col, 1); sp.fillCircle(0, 0, 5 + Math.random() * 3);
          sp.setPosition(cx, cy);
          this.tweens.add({
            targets: sp, x: cx + Math.cos(ang) * spd, y: cy + Math.sin(ang) * spd + 50,
            alpha: 0, scaleX: 0.2, scaleY: 0.2,
            duration: 700 + Math.random() * 500, ease: 'Power2.out',
            onComplete: () => sp.destroy(),
          });
        }
      };
      [[80, 0.25, 0.22],[220, 0.75, 0.18],[380, 0.50, 0.28],[550, 0.18, 0.38],
       [720, 0.82, 0.22],[900, 0.60, 0.12],[1100, 0.35, 0.30],[1300, 0.72, 0.18],
       [1600, 0.45, 0.20],[2000, 0.25, 0.28],[2400, 0.80, 0.15]].forEach(([d, xf, yf]) => {
        this.time.delayedCall(d, () => _firework(W * xf, H * yf));
      });
    };

    const _balloons = () => {
      const BAL_COLORS = [0xFF4444, 0x4CAF50, 0xFFD700, 0x0065BD, 0xFF69B4, 0xC8962E, 0x9B59B6];
      for (let i = 0; i < 20; i++) {
        this.time.delayedCall(i * 100, () => {
          const col = BAL_COLORS[Math.floor(Math.random() * BAL_COLORS.length)];
          const bx  = 30 + Math.random() * (W - 60);
          const g   = this.add.graphics().setDepth(DEPTH + 4);
          g.fillStyle(col, 0.9); g.fillEllipse(0, 0, 24, 32);
          g.fillStyle(0xFFFFFF, 0.35); g.fillEllipse(-5, -7, 9, 12);
          g.fillStyle(col, 1); g.fillTriangle(0, 14, -3, 20, 3, 20);
          g.lineStyle(1.5, 0x888888, 0.8); g.beginPath(); g.moveTo(0, 20); g.lineTo(0, 40); g.strokePath();
          g.setPosition(bx, H + 50);
          this.tweens.add({
            targets: g, x: bx + (Math.random() - 0.5) * 100, y: -60,
            duration: 2200 + Math.random() * 1200, delay: Math.random() * 400,
            ease: 'Sine.inOut', onComplete: () => g.destroy(),
          });
        });
      }
    };

    const _musicalNotes = () => {
      const NOTES = ['♩', '♪', '♫', '♬', '🎵', '🎶'];
      const NOTE_COLS = ['#FFD700', '#FF69B4', '#00BFFF', '#FFFFFF', '#C8962E'];
      for (let i = 0; i < 14; i++) {
        this.time.delayedCall(i * 180, () => {
          const nx = 20 + Math.random() * (W - 40);
          const nt = this.add.text(nx, H * 0.85, NOTES[Math.floor(Math.random() * NOTES.length)], {
            fontSize: `${20 + Math.floor(Math.random() * 22)}px`,
            color: NOTE_COLS[Math.floor(Math.random() * NOTE_COLS.length)],
            stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5, 0.5).setDepth(DEPTH + 5).setAlpha(0);
          this.tweens.add({ targets: nt, alpha: 1, duration: 120, onComplete: () => {
            this.tweens.add({
              targets: nt, y: H * 0.1, x: nx + (Math.random() - 0.5) * 60,
              alpha: 0, angle: (Math.random() - 0.5) * 40, scale: 1.3,
              duration: 1400 + Math.random() * 600, ease: 'Power2.out',
              onComplete: () => nt.destroy(),
            });
          }});
        });
      }
    };

    const _jets = () => {
      const _jet = (y, dir) => {
        const sx = dir === 1 ? -90 : W + 90, ex = dir === 1 ? W + 90 : -90;
        const pl = this.add.graphics().setDepth(DEPTH + 9);
        pl.fillStyle(0xDDDDEE, 1); pl.fillRect(-30, -5, 60, 10);
        pl.fillStyle(0x88BBDD, 1); pl.fillTriangle(28, -4, 48, -1, 28, 4);
        pl.fillStyle(0xCCCCDD, 1);
        pl.fillTriangle(0, 0, -12, -26, 18, 0); pl.fillTriangle(0, 0, -12, 26, 18, 0);
        pl.fillTriangle(-26, 0, -30, -16, -18, 0); pl.fillTriangle(-26, 0, -30, 16, -18, 0);
        pl.fillStyle(0x003F7F, 1); pl.fillRect(-8, -4, 16, 8);
        pl.fillStyle(0xFFFFFF, 1); pl.fillRect(-9, -1, 18, 3); pl.fillRect(-1, -5, 3, 10);
        const trail = this.add.graphics().setDepth(DEPTH + 6);
        trail.fillStyle(0xFFFFFF, 0.25); trail.fillRect(0, -2, 55, 4);
        if (dir === -1) pl.setScale(-1, 1);
        pl.setPosition(sx, y);
        this.tweens.add({
          targets: pl, x: ex, duration: 1600, ease: 'Linear',
          onUpdate: () => trail.setPosition(pl.x + (dir === 1 ? -65 : 65), pl.y),
          onComplete: () => { pl.destroy(); trail.destroy(); },
        });
      };
      [[150, 0.12, 1],[500, 0.38, -1],[900, 0.20, 1],[1300, 0.52, -1],[1700, 0.28, 1]].forEach(([d, yf, dir]) => {
        this.time.delayedCall(d, () => _jet(H * yf, dir));
      });
    };

    // Pick 2–3 effects at random each celebration
    const effects = [_confettiRain, _confettiBurst, _fireworks, _balloons, _musicalNotes, _jets];
    const count = 2 + Math.floor(Math.random() * 2); // 2 or 3
    const picked = effects.slice().sort(() => Math.random() - 0.5).slice(0, count);
    picked.forEach(fn => fn());

    // "TRY!" banner
    const banner = this.add.text(W / 2, H / 2 - 55, '🏉  TRY!', {
      fontSize: '88px', fontStyle: 'bold', color: '#FFD700',
      stroke: '#003F7F', strokeThickness: 10,
      shadow: { offsetX: 5, offsetY: 5, color: '#000', blur: 18, fill: true },
    }).setOrigin(0.5, 0.5).setAlpha(0).setScale(0.1).setDepth(DEPTH + 12);
    this.tweens.add({ targets: banner, alpha: 1, scale: 1, duration: 350, ease: 'Back.out(2)',
      onComplete: () => this.tweens.add({ targets: banner, scale: 1.08, duration: 400, yoyo: true, repeat: 4, ease: 'Sine.inOut' }),
    });

    // Points badge
    const badge = this.add.text(W / 2, H / 2 + 45, `+${points} pts`, {
      fontSize: '44px', fontStyle: 'bold', color: '#FFFFFF',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5, 0.5).setAlpha(0).setDepth(DEPTH + 12);
    this.tweens.add({ targets: badge, alpha: 1, y: H / 2 + 32, duration: 280, delay: 320, ease: 'Power2' });

    // "SCOTLAND!" sub-text
    const scotText = this.add.text(W / 2, H - 55, '🏴󠁧󠁢󠁳󠁣󠁴󠁿  SCOTLAND!  🏴󠁧󠁢󠁳󠁣󠁴󠁿', {
      fontSize: '30px', fontStyle: 'bold', color: '#FFFFFF',
      stroke: '#0065BD', strokeThickness: 5,
    }).setOrigin(0.5, 0.5).setAlpha(0).setDepth(DEPTH + 12);
    this.tweens.add({ targets: scotText, alpha: 1, y: H * 0.82, duration: 380, delay: 450, ease: 'Back.out(1.5)',
      onComplete: () => this.tweens.add({ targets: scotText, alpha: 0, duration: 380, delay: 1700 }),
    });

    // Finn jumps
    if (this._finnSprite) {
      const origY = this._finnSprite.y;
      this.tweens.add({ targets: this._finnSprite, y: origY - 40, duration: 200,
        yoyo: true, repeat: 5, ease: 'Power2',
        onComplete: () => { this._finnSprite.y = origY; },
      });
    }

    // Auto-close then hand off
    this.time.delayedCall(3200, () => {
      this.tweens.add({
        targets: [banner, badge, overlay, scotText],
        alpha: 0, duration: 280,
        onComplete: () => {
          if (onDone) onDone();
        },
      });
    });
  }

  // ── Crowd reaction overlay ────────────────────────────────────────────────
  // isGoal=true → staggered gold wave on each stand; false → brief dark groan
  _crowdReact(isGoal) {
    if (!this._levelDef) return;
    const cs = this._cellSize;
    const ox = this._offsetX, oy = this._offsetY;
    const pw = this._levelDef.grid.cols * cs;
    const ph = this._levelDef.grid.rows * cs;
    const BH = 17, SW = 17; // BAND_H / SIDE_W — must match _drawCrowd constants
    const rects = [
      [ox,      oy - BH - 1, pw, BH + 1], // top stand
      [ox,      oy + ph,     pw, BH + 1], // bottom stand
      [ox - SW, oy,          SW, ph     ], // left stand
      [ox + pw, oy,          SW, ph     ], // right stand
    ];

    if (isGoal) {
      rects.forEach((r, i) => {
        const ov = this.add.graphics().setDepth(2);
        ov.fillStyle(0xFFD700, 1);
        ov.fillRect(r[0], r[1], r[2], r[3]);
        ov.setAlpha(0);
        this.time.delayedCall(i * 55, () => {
          this.tweens.add({
            targets: ov, alpha: 0.65,
            duration: 75, yoyo: true, repeat: 3,
            ease: 'Power2',
            onComplete: () => ov.destroy(),
          });
        });
      });
    } else {
      const ov = this.add.graphics().setDepth(2);
      ov.fillStyle(0x000000, 1);
      rects.forEach(r => ov.fillRect(r[0], r[1], r[2], r[3]));
      ov.setAlpha(0);
      this.tweens.add({
        targets: ov, alpha: 0.55,
        duration: 280, yoyo: true, ease: 'Power2',
        onComplete: () => ov.destroy(),
      });
    }
  }

  // ── Crowd stands around the pitch ─────────────────────────────────────────
  _drawCrowd(cols, rows) {
    const cg = this._crowdGfx;
    cg.clear();

    const cs = this._cellSize;
    const ox = this._offsetX;
    const oy = this._offsetY;
    const pw = cols * cs;
    const ph = rows * cs;
    const W  = this.scale.width;
    const H  = this.scale.height;

    // 12 Scotland-heavy, 4 opposition — mix of navy, blue, white, gold, red
    const JERSEY = [
      0x003F7F, 0x0065BD, 0x003F7F, 0xFFFFFF,
      0x0065BD, 0x003F7F, 0xC8962E, 0x0065BD,
      0x003F7F, 0xFFFFFF, 0x0065BD, 0x003F7F,
      0xCC2222, 0xFFFFFF, 0xCC2222, 0x0065BD,
    ];
    const HAIR = [0x111111, 0x553300, 0xBBAA00, 0x772200, 0x444444];

    const HEAD_R = 4;
    const BODY_W = 8;
    const BODY_H = 7;
    const SPACING = 12;
    const BAND_H  = BODY_H + HEAD_R * 2 + 2;  // total px a fan row needs

    // One fan facing the pitch. edgeY = pitch border; dir=-1 → above, dir=+1 → below
    const drawFan = (cx, edgeY, dir) => {
      const si = Math.floor(cx / 9) & 15;
      const hi = Math.floor(cx / 11) % HAIR.length;
      const bodyTopY = dir === -1 ? edgeY - 2 - BODY_H : edgeY + 2;
      const headCY   = dir === -1 ? bodyTopY - HEAD_R   : bodyTopY + BODY_H + HEAD_R;

      cg.fillStyle(JERSEY[si], 1);
      cg.fillRect(cx - BODY_W / 2, bodyTopY, BODY_W, BODY_H);

      cg.fillStyle(0xF0C080, 1);
      cg.fillCircle(cx, headCY, HEAD_R);

      cg.fillStyle(HAIR[hi], 1);
      cg.fillRect(cx - HEAD_R, headCY - HEAD_R, HEAD_R * 2, HEAD_R);
    };

    const drawStand = (x, y, w, h) => {
      cg.fillStyle(0x0A1E0A, 0.65);
      cg.fillRect(x, y, w, h);
    };

    // Fans above the pitch
    if (oy >= BAND_H) {
      drawStand(ox, oy - BAND_H - 1, pw, BAND_H + 1);
      const n = Math.floor(pw / SPACING);
      for (let i = 0; i < n; i++) drawFan(ox + i * SPACING + SPACING / 2, oy - 1, -1);
    }

    // Fans below the pitch
    if (H - (oy + ph) >= BAND_H) {
      drawStand(ox, oy + ph, pw, BAND_H + 1);
      const n = Math.floor(pw / SPACING);
      for (let i = 0; i < n; i++) drawFan(ox + i * SPACING + SPACING / 2, oy + ph + 1, 1);
    }

    // Fans on the sides (simplified — facing inward as blobs)
    const sideW = HEAD_R * 2 + BODY_H + 2;
    if (ox >= sideW) {
      drawStand(ox - sideW - 1, oy, sideW + 1, ph);
      const n = Math.floor(ph / SPACING);
      for (let i = 0; i < n; i++) {
        const fy  = oy + i * SPACING + SPACING / 2;
        const si  = (i * 3) & 15;
        const hi  = (i * 2) % HAIR.length;
        // body then head (fan faces east/right toward pitch)
        cg.fillStyle(JERSEY[si], 1);
        cg.fillRect(ox - sideW + 1, fy - BODY_W / 2, BODY_H, BODY_W);
        cg.fillStyle(0xF0C080, 1);
        cg.fillCircle(ox - sideW + 1 + BODY_H + HEAD_R, fy, HEAD_R);
        cg.fillStyle(HAIR[hi], 1);
        cg.fillRect(ox - sideW + 1 + BODY_H + HEAD_R - HEAD_R, fy - HEAD_R, HEAD_R * 2, HEAD_R);
      }
    }
    if (W - (ox + pw) >= sideW) {
      drawStand(ox + pw, oy, sideW + 1, ph);
      const n = Math.floor(ph / SPACING);
      for (let i = 0; i < n; i++) {
        const fy  = oy + i * SPACING + SPACING / 2;
        const si  = (i * 5 + 4) & 15;
        const hi  = (i * 3 + 1) % HAIR.length;
        // body then head (fan faces west/left toward pitch)
        cg.fillStyle(JERSEY[si], 1);
        cg.fillRect(ox + pw + HEAD_R + 2, fy - BODY_W / 2, BODY_H, BODY_W);
        cg.fillStyle(0xF0C080, 1);
        cg.fillCircle(ox + pw + 2, fy, HEAD_R);
        cg.fillStyle(HAIR[hi], 1);
        cg.fillRect(ox + pw + 2 - HEAD_R, fy - HEAD_R, HEAD_R * 2, HEAD_R);
      }
    }
  }

  // ── Score Try animation (Finn grounds the ball + celebration dance) ─────────
  _scoreTry(onDone) {
    if (!this._finnSprite) { if (onDone) onDone(); return; }

    const finn = this._finnSprite;
    const baseScale = finn.scaleX;
    const origAngle = finn.angle;
    const origY = finn.y;

    // Ball graphic at Finn's feet
    const ball = this.add.graphics();
    this._drawBallGraphic(ball);
    ball.setPosition(finn.x, finn.y + 32 * baseScale);
    ball.setDepth(finn.depth - 1);

    // Gold flash on the try-line cell
    if (this._levelDef) {
      const { finn: fs } = GameState.current;
      this._flashCell(fs.col, fs.row, '#FFD700');
    }

    // Phase 1: Finn drives down and squashes ball into the turf
    this.tweens.add({
      targets: finn,
      scaleY: baseScale * 0.38,
      scaleX: baseScale * 1.25,
      duration: 170,
      ease: 'Power3.in',
      onComplete: () => {
        this.tweens.add({
          targets: ball,
          scaleY: 0.08,
          scaleX: 2.6,
          duration: 90,
          ease: 'Power3.in',
        });
        this.cameras.main.shake(130, 0.005);

        this.time.delayedCall(200, () => {
          // Ball stays pinned to turf then fades
          this.tweens.add({
            targets: ball,
            alpha: 0,
            scaleX: 3.5,
            duration: 280,
            ease: 'Power2',
            onComplete: () => ball.destroy(),
          });

          // Finn springs back up with stretch overshoot
          this.tweens.add({
            targets: finn,
            scaleY: baseScale * 1.3,
            scaleX: baseScale * 0.78,
            y: origY - 18 * baseScale,
            duration: 180,
            ease: 'Back.out(4)',
            onComplete: () => {
              this.tweens.add({
                targets: finn,
                scaleY: baseScale,
                scaleX: baseScale,
                y: origY,
                duration: 110,
                ease: 'Power2.out',
                onComplete: () => _dance(),
              });
            },
          });
        });
      },
    });

    // Phase 2: spin + flip celebration dance
    const _dance = () => {
      finn.setFrame(4); // arms-spread frame

      const spawnSparkles = () => {
        for (let i = 0; i < 10; i++) {
          const sg = this.add.graphics().setDepth(finn.depth + 1);
          sg.fillStyle([0xFFD700, 0xFFFFFF, 0x0065BD, 0xFF69B4][i % 4], 1);
          i % 2 === 0 ? sg.fillCircle(0, 0, 4) : sg.fillRect(-3, -3, 6, 6);
          sg.setPosition(finn.x + (Math.random() - 0.5) * 40 * baseScale, finn.y - 5 * baseScale);
          sg.setAngle(Math.random() * 360);
          const a = Math.random() * Math.PI * 2;
          const spd = 30 + Math.random() * 45;
          this.tweens.add({
            targets: sg,
            x: sg.x + Math.cos(a) * spd,
            y: sg.y - 25 - Math.sin(Math.abs(a)) * spd,
            alpha: 0,
            angle: sg.angle + (Math.random() - 0.5) * 400,
            duration: 460 + Math.random() * 180,
            ease: 'Power2',
            onComplete: () => sg.destroy(),
          });
        }
      };

      // Move 1: 360° spin jump
      const doSpin = (done) => {
        spawnSparkles();
        // y arc up and back (yoyo)
        this.tweens.add({
          targets: finn,
          y: origY - 34 * baseScale,
          duration: 220,
          ease: 'Power2.out',
          yoyo: true,
          onComplete: () => { finn.setAngle(origAngle); done(); },
        });
        // simultaneous full 360° rotation
        this.tweens.add({
          targets: finn,
          angle: origAngle + 360,
          duration: 440,
          ease: 'Linear',
        });
      };

      // Move 2: backflip — jump arc + scaleY collapses through 0 then back
      const doFlip = (done) => {
        spawnSparkles();
        this.tweens.add({
          targets: finn,
          y: origY - 30 * baseScale,
          duration: 200,
          ease: 'Power2.out',
          yoyo: true,
          onComplete: done,
        });
        const flipObj = { t: 0 };
        this.tweens.add({
          targets: flipObj,
          t: 1,
          duration: 400,
          ease: 'Linear',
          onUpdate: () => {
            const t = flipObj.t;
            finn.scaleY = t < 0.5
              ? baseScale * (1 - t * 2)
              : baseScale * ((t - 0.5) * 2);
          },
          onComplete: () => { finn.scaleY = baseScale; },
        });
      };

      doSpin(() => {
        this.time.delayedCall(80, () => {
          doFlip(() => {
            this.time.delayedCall(60, () => {
              this.tweens.add({
                targets: finn,
                angle: origAngle,
                scaleX: baseScale,
                scaleY: baseScale,
                duration: 130,
                ease: 'Power2',
                onComplete: () => { finn.setFrame(0); if (onDone) onDone(); },
              });
            });
          });
        });
      });
    };
  }

  // ── Jump animation (arc from current pos to landing) ──────────────────────
  _jumpFinn(col, row, dir, onDone) {
    if (!this._finnSprite) { if (onDone) onDone(); return; }

    const { px: tx, py: ty } = this._cellPixel(col, row);
    const cs = this._cellSize;
    const targetX = tx + cs / 2;
    const targetY = ty + cs / 2;
    const startX  = this._finnSprite.x;
    const startY  = this._finnSprite.y;
    const arcHeight = cs * 1.4;
    const duration  = 460;

    this._applyFinnDirection(dir);

    const progress = { t: 0 };
    this.tweens.add({
      targets: progress,
      t: 1,
      duration,
      ease: 'Sine.inOut',
      onUpdate: () => {
        const p = progress.t;
        this._finnSprite.x = startX + (targetX - startX) * p;
        this._finnSprite.y = startY + (targetY - startY) * p - Math.sin(p * Math.PI) * arcHeight;
        // Scale up at peak, back down on land
        const peakScale = 1 + 0.25 * Math.sin(p * Math.PI);
        const base = (cs * 0.85) / 80;
        this._finnSprite.setScale(base * peakScale);
      },
      onComplete: () => {
        // Snap to exact landing position and restore scale
        this._finnSprite.setPosition(targetX, targetY);
        const base = (cs * 0.85) / 80;
        this._finnSprite.setScale(base);

        // Landing squish
        this.tweens.add({
          targets: this._finnSprite,
          scaleY: base * 0.75,
          scaleX: base * 1.2,
          duration: 60,
          yoyo: true,
          ease: 'Power2',
          onComplete: () => {
            this._finnSprite.setScale(base);
            if (onDone) onDone();
          },
        });
      },
    });
  }

  // ── Tackle animation (opponent flashes red then disappears) ───────────────
  _tackleOpponent(col, row, onDone) {
    const key = `${col},${row}`;
    const obj = this._cellObjs[key];

    // Flash red on the cell
    this._flashCell(col, row, '#FF2222');

    if (obj) {
      // Shake then scale out
      const origX = obj.x;
      this.tweens.add({
        targets: obj,
        x: origX + 8,
        duration: 40,
        yoyo: true,
        repeat: 3,
        ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: obj,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 220,
            ease: 'Back.in(2)',
            onComplete: () => {
              obj.destroy();
              delete this._cellObjs[key];
              if (onDone) onDone();
            },
          });
        },
      });
    } else {
      this.time.delayedCall(300, () => { if (onDone) onDone(); });
    }
  }

  // ── Pickup ball animation (ball pops up and vanishes) ────────────────────
  _pickupBall(col, row, onDone) {
    const key = `${col},${row}`;
    const obj = this._cellObjs[key];

    this._flashCell(col, row, '#C8962E');

    if (obj) {
      this.tweens.add({
        targets: obj,
        y: obj.y - 32,
        scaleX: obj.scaleX * 1.4,
        scaleY: obj.scaleY * 1.4,
        alpha: 0,
        duration: 350,
        ease: 'Power2',
        onComplete: () => {
          obj.destroy();
          delete this._cellObjs[key];
          if (onDone) onDone();
        },
      });
    } else {
      this.time.delayedCall(200, () => { if (onDone) onDone(); });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  _cellPixel(col, row) {
    return {
      px: this._offsetX + col * this._cellSize,
      py: this._offsetY + row * this._cellSize,
    };
  }
}
