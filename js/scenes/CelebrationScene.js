// js/scenes/CelebrationScene.js — Launched on top of GameScene after a try

class CelebrationScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CelebrationScene' });
  }

  init(data) {
    this._points = data.points || 5;
    this._onDone = data.onDone || function(){};
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Instant full-screen flash (ensures SOMETHING is visible immediately) ──
    const flashBg = this.add.graphics();
    flashBg.fillStyle(0xFFD700, 1);
    flashBg.fillRect(0, 0, W, H);
    flashBg.setDepth(30);
    this.tweens.add({
      targets: flashBg,
      alpha: 0,
      duration: 250,
      ease: 'Power2',
      onComplete: () => flashBg.destroy(),
    });

    // ── Dark overlay ───────────────────────────────────────────────────────────
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, W, H);
    overlay.setAlpha(0);
    overlay.setDepth(1);
    this.tweens.add({ targets: overlay, alpha: 0.50, duration: 200 });

    // ── Confetti (200 pieces, bursting from centre AND raining from top) ──────
    this._spawnConfetti(W, H);
    this._burstConfetti(W, H);

    // ── Fireworks ─────────────────────────────────────────────────────────────
    this.time.delayedCall(80,   () => this._firework(W * 0.25, H * 0.22));
    this.time.delayedCall(220,  () => this._firework(W * 0.75, H * 0.18));
    this.time.delayedCall(380,  () => this._firework(W * 0.50, H * 0.28));
    this.time.delayedCall(520,  () => this._firework(W * 0.18, H * 0.38));
    this.time.delayedCall(680,  () => this._firework(W * 0.82, H * 0.22));
    this.time.delayedCall(850,  () => this._firework(W * 0.60, H * 0.12));
    this.time.delayedCall(1050, () => this._firework(W * 0.35, H * 0.30));
    this.time.delayedCall(1250, () => this._firework(W * 0.70, H * 0.15));
    this.time.delayedCall(1500, () => this._firework(W * 0.45, H * 0.20));
    this.time.delayedCall(1800, () => this._firework(W * 0.25, H * 0.25));
    this.time.delayedCall(2100, () => this._firework(W * 0.80, H * 0.30));
    this.time.delayedCall(2400, () => this._firework(W * 0.55, H * 0.18));

    // ── Jet planes ─────────────────────────────────────────────────────────────
    this.time.delayedCall(150,  () => this._jetPlane(H * 0.12, 1));
    this.time.delayedCall(500,  () => this._jetPlane(H * 0.38, -1));
    this.time.delayedCall(900,  () => this._jetPlane(H * 0.20, 1));
    this.time.delayedCall(1300, () => this._jetPlane(H * 0.50, -1));
    this.time.delayedCall(1700, () => this._jetPlane(H * 0.28, 1));

    // ── Balloons (20 balloons) ─────────────────────────────────────────────────
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 100, () => this._balloon(W, H));
    }

    // ── Marching band: musical notes floating up ───────────────────────────────
    const noteDelay = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200];
    noteDelay.forEach(d => this.time.delayedCall(d, () => this._musicNote(W, H)));

    // ── Rugby balls bouncing ───────────────────────────────────────────────────
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 200, () => this._bounceBall(W, H));
    }

    // ── Scotland flag banners ──────────────────────────────────────────────────
    this.time.delayedCall(300,  () => this._flagBanner(W * 0.15, H, W, H));
    this.time.delayedCall(600,  () => this._flagBanner(W * 0.85, H, W, H));
    this.time.delayedCall(1000, () => this._flagBanner(W * 0.50, H, W, H));

    // ── Stars raining down ─────────────────────────────────────────────────────
    for (let i = 0; i < 25; i++) {
      this.time.delayedCall(i * 80 + 100, () => this._starDrop(W, H));
    }

    // ── "TRY!" banner ──────────────────────────────────────────────────────────
    const banner = this.add.text(W / 2, H / 2 - 60, '🏉  TRY!', {
      fontSize: '86px',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#003F7F',
      strokeThickness: 10,
      shadow: { offsetX: 5, offsetY: 5, color: '#000000', blur: 20, fill: true },
    }).setOrigin(0.5, 0.5).setAlpha(0).setScale(0.1).setDepth(22);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      scale: 1,
      duration: 350,
      ease: 'Back.out(2)',
      onComplete: () => {
        // Pulse the banner
        this.tweens.add({
          targets: banner,
          scale: 1.08,
          duration: 400,
          yoyo: true,
          repeat: 4,
          ease: 'Sine.inOut',
        });
      },
    });

    // ── Points badge ──────────────────────────────────────────────────────────
    const badge = this.add.text(W / 2, H / 2 + 40, `+${this._points} pts`, {
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5, 0.5).setAlpha(0).setDepth(22);

    this.tweens.add({
      targets: badge,
      alpha: 1,
      y: H / 2 + 30,
      duration: 280,
      delay: 320,
      ease: 'Power2',
    });

    // ── "SCOTLAND!" text blasting up ──────────────────────────────────────────
    const scotlandText = this.add.text(W / 2, H - 60, '🏴󠁧󠁢󠁳󠁣󠁴󠁿  SCOTLAND!  🏴󠁧󠁢󠁳󠁣󠁴󠁿', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#0065BD',
      strokeThickness: 5,
    }).setOrigin(0.5, 0.5).setAlpha(0).setDepth(22);

    this.tweens.add({
      targets: scotlandText,
      alpha: 1,
      y: H * 0.82,
      duration: 400,
      delay: 500,
      ease: 'Back.out(1.5)',
      onComplete: () => {
        this.tweens.add({
          targets: scotlandText,
          alpha: 0,
          duration: 400,
          delay: 1600,
        });
      },
    });

    // ── Finn jumps in GameScene ────────────────────────────────────────────────
    this._doFinnJump();

    // ── Auto-close after 3.2s ─────────────────────────────────────────────────
    this.time.delayedCall(3200, () => {
      this.tweens.add({
        targets: [banner, badge, overlay, scotlandText],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.scene.stop();
          this._onDone();
        },
      });
    });
  }

  // ── Confetti rain from top ─────────────────────────────────────────────────
  _spawnConfetti(W, H) {
    const COLORS = [0xC8962E, 0x0065BD, 0xFFFFFF, 0x4CAF50, 0xFF5252, 0xF5A623, 0xFF69B4, 0x00BFFF, 0xFFD700];
    for (let i = 0; i < 120; i++) {
      const g = this.add.graphics();
      g.setDepth(5);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      g.fillStyle(color, 1);
      const roll = Math.random();
      if (roll < 0.4) {
        g.fillRect(-5, -7, 10, 14);
      } else if (roll < 0.7) {
        g.fillCircle(0, 0, 6);
      } else {
        this._drawStar(g, 0, 0, 6);
      }
      const startX = Math.random() * W;
      g.setPosition(startX, -20);
      g.setAngle(Math.random() * 360);

      const duration = 2200 + Math.random() * 1400;
      const delay    = Math.random() * 800;

      this.tweens.add({
        targets: g,
        x: startX + (Math.random() - 0.5) * 240,
        y: H + 40,
        angle: g.angle + (Math.random() < 0.5 ? 540 : -540),
        duration,
        delay,
        ease: 'Sine.in',
        onComplete: () => g.destroy(),
      });
    }
  }

  // ── Confetti burst from screen centre ─────────────────────────────────────
  _burstConfetti(W, H) {
    const COLORS = [0xFFD700, 0xFF5252, 0x0065BD, 0xFFFFFF, 0x4CAF50, 0xFF69B4, 0xC8962E];
    const cx = W / 2;
    const cy = H / 2;
    for (let i = 0; i < 80; i++) {
      const g = this.add.graphics();
      g.setDepth(6);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      g.fillStyle(color, 1);
      if (Math.random() < 0.5) g.fillRect(-5, -7, 10, 14);
      else g.fillCircle(0, 0, 6);
      g.setPosition(cx, cy);

      const angle    = Math.random() * Math.PI * 2;
      const speed    = 100 + Math.random() * 200;
      const duration = 1200 + Math.random() * 800;

      this.tweens.add({
        targets: g,
        x: cx + Math.cos(angle) * speed,
        y: cy + Math.sin(angle) * speed + 80, // gravity pull
        angle: (Math.random() - 0.5) * 720,
        alpha: 0,
        duration,
        ease: 'Power2.out',
        onComplete: () => g.destroy(),
      });
    }
  }

  // ── Firework burst ────────────────────────────────────────────────────────
  _firework(cx, cy) {
    const COLORS = [0xFFD700, 0xFF4444, 0x4CAF50, 0x00BFFF, 0xFF69B4, 0xFFFFFF, 0xC8962E, 0xFF6600];
    const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
    const count  = 18 + Math.floor(Math.random() * 10);

    // Pre-flash
    const flash = this.add.graphics();
    flash.fillStyle(0xFFFFFF, 1);
    flash.fillCircle(0, 0, 16);
    flash.setPosition(cx, cy);
    flash.setDepth(19);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 4,
      scaleY: 4,
      duration: 220,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });

    // Main sparkle particles
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 90 + Math.random() * 110;
      const spark = this.add.graphics();
      spark.fillStyle(color, 1);
      spark.fillCircle(0, 0, 5 + Math.random() * 3);
      spark.fillStyle(color, 0.4);
      spark.fillCircle(Math.cos(angle) * -10, Math.sin(angle) * -10, 2.5);
      spark.setPosition(cx, cy);
      spark.setDepth(18);

      this.tweens.add({
        targets: spark,
        x: cx + Math.cos(angle) * speed,
        y: cy + Math.sin(angle) * speed + 50,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 800 + Math.random() * 500,
        ease: 'Power2.out',
        onComplete: () => spark.destroy(),
      });
    }

    // Star ring
    for (let i = 0; i < 10; i++) {
      const angle  = (i / 10) * Math.PI * 2 + 0.3;
      const speed  = 130 + Math.random() * 60;
      const spark2 = this.add.graphics();
      spark2.fillStyle(0xFFFFFF, 1);
      this._drawStar(spark2, 0, 0, 6);
      spark2.setPosition(cx, cy);
      spark2.setDepth(18);

      this.tweens.add({
        targets: spark2,
        x: cx + Math.cos(angle) * speed,
        y: cy + Math.sin(angle) * speed + 35,
        angle: 360 * (Math.random() < 0.5 ? 1 : -1),
        alpha: 0,
        duration: 1000 + Math.random() * 400,
        ease: 'Power2.out',
        onComplete: () => spark2.destroy(),
      });
    }
  }

  _drawStar(g, x, y, r) {
    g.fillStyle(0xFFD700, 1);
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a  = (i * 4 * Math.PI / 5) - Math.PI / 2;
      const ia = a + 2 * Math.PI / 5;
      if (i === 0) g.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
      else         g.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
      g.lineTo(x + (r / 2) * Math.cos(ia), y + (r / 2) * Math.sin(ia));
    }
    g.closePath();
    g.fillPath();
  }

  // ── Jet plane ─────────────────────────────────────────────────────────────
  _jetPlane(y, dir) {
    const W = this.scale.width;
    const startX = dir === 1 ? -90 : W + 90;
    const endX   = dir === 1 ? W + 90 : -90;

    const plane = this.add.graphics();
    plane.setDepth(20);

    // Fuselage
    plane.fillStyle(0xDDDDEE, 1);
    plane.fillRect(-30, -5, 60, 10);
    // Cockpit
    plane.fillStyle(0x88BBDD, 1);
    plane.fillTriangle(28, -4, 48, -1, 28, 4);
    // Wing
    plane.fillStyle(0xCCCCDD, 1);
    plane.fillTriangle(0, 0, -12, -26, 18, 0);
    plane.fillTriangle(0, 0, -12, 26, 18, 0);
    // Tail
    plane.fillTriangle(-26, 0, -30, -16, -18, 0);
    plane.fillTriangle(-26, 0, -30, 16, -18, 0);
    // Scotland flag on fuselage
    plane.fillStyle(0x003F7F, 1);
    plane.fillRect(-8, -4, 16, 8);
    plane.fillStyle(0xFFFFFF, 1);
    plane.fillRect(-9, -1.5, 18, 3);
    plane.fillRect(-1.5, -5, 3, 10);

    // Smoke trail
    const trailCount = 5;
    const trails = [];
    for (let i = 0; i < trailCount; i++) {
      const puff = this.add.graphics();
      puff.setDepth(16);
      puff.fillStyle(0xFFFFFF, 0.18 - i * 0.03);
      puff.fillCircle(0, 0, 6 + i * 2);
      puff.setPosition(startX + (dir === 1 ? -(i * 18) : (i * 18)), y + (Math.random() - 0.5) * 4);
      trails.push(puff);
    }

    if (dir === -1) plane.setFlipX(true);
    plane.setPosition(startX, y);

    const duration = 1600;
    this.tweens.add({
      targets: plane,
      x: endX,
      duration,
      ease: 'Linear',
      onUpdate: () => {
        trails.forEach((puff, i) => {
          puff.setPosition(
            plane.x + (dir === 1 ? -(30 + i * 18) : (30 + i * 18)),
            plane.y + (Math.random() - 0.5) * 3
          );
        });
      },
      onComplete: () => {
        plane.destroy();
        trails.forEach(p => p.destroy());
      },
    });

    // Whoosh flash
    const boom = this.add.graphics();
    boom.setDepth(15);
    boom.fillStyle(0xFFFFFF, 0.10);
    boom.fillRect(0, y - 12, W, 24);
    this.tweens.add({
      targets: boom,
      alpha: 0,
      duration: 350,
      onComplete: () => boom.destroy(),
    });
  }

  // ── Balloon ───────────────────────────────────────────────────────────────
  _balloon(W, H) {
    const COLORS = [0xFF4444, 0x4CAF50, 0xFFD700, 0x0065BD, 0xFF69B4, 0xC8962E, 0xFFFFFF, 0x9B59B6];
    const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
    const x      = 30 + Math.random() * (W - 60);
    const size   = 0.8 + Math.random() * 0.6; // vary sizes

    const g = this.add.graphics();
    g.setDepth(14);
    // Balloon body
    g.fillStyle(color, 0.9);
    g.fillEllipse(0, 0, 24 * size, 32 * size);
    // Shine highlight
    g.fillStyle(0xFFFFFF, 0.35);
    g.fillEllipse(-5 * size, -7 * size, 9 * size, 12 * size);
    // Knot
    g.fillStyle(color, 1);
    g.fillTriangle(0, 14 * size, -3, 20 * size, 3, 20 * size);
    // String
    g.lineStyle(1.5, 0x888888, 0.8);
    g.beginPath();
    g.moveTo(0, 20 * size);
    g.lineTo((Math.random() - 0.5) * 12, 40 * size);
    g.strokePath();

    g.setPosition(x, H + 50);

    const wobbleX = (Math.random() - 0.5) * 100;
    const duration = 2200 + Math.random() * 1200;

    this.tweens.add({
      targets: g,
      x: x + wobbleX,
      y: -60,
      duration,
      delay: Math.random() * 400,
      ease: 'Sine.inOut',
      onComplete: () => g.destroy(),
    });
  }

  // ── Musical note (marching band) ─────────────────────────────────────────
  _musicNote(W, H) {
    const NOTES = ['♩', '♪', '♫', '♬', '🎵', '🎶'];
    const NOTE_COLORS = ['#FFD700', '#FF69B4', '#00BFFF', '#FFFFFF', '#C8962E', '#FF6600'];
    const note  = NOTES[Math.floor(Math.random() * NOTES.length)];
    const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const x     = 20 + Math.random() * (W - 40);
    const size  = 20 + Math.floor(Math.random() * 22);

    const text = this.add.text(x, H * 0.85, note, {
      fontSize: `${size}px`,
      color,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5).setDepth(13).setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 150,
      onComplete: () => {
        this.tweens.add({
          targets: text,
          y: H * 0.1,
          x: x + (Math.random() - 0.5) * 60,
          alpha: 0,
          angle: (Math.random() - 0.5) * 40,
          scale: 1.3,
          duration: 1400 + Math.random() * 600,
          ease: 'Power2.out',
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  // ── Bouncing rugby ball ───────────────────────────────────────────────────
  _bounceBall(W, H) {
    const g = this.add.graphics();
    g.setDepth(12);
    g.fillStyle(0x8B4513, 1);
    g.fillEllipse(0, 0, 22, 14);
    g.lineStyle(1.5, 0xFFFFFF, 1);
    g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.strokePath();
    g.beginPath(); g.moveTo(0, -5); g.lineTo(0, 5); g.strokePath();

    const startX = Math.random() * W;
    const startY = H + 20;
    g.setPosition(startX, startY);

    const peakY  = H * 0.1 + Math.random() * H * 0.3;
    const endX   = startX + (Math.random() - 0.5) * 200;
    const totalT = 1200 + Math.random() * 600;

    // Parabolic arc
    const t = { p: 0 };
    this.tweens.add({
      targets: t,
      p: 1,
      duration: totalT,
      ease: 'Linear',
      onUpdate: (tween) => {
        const p = tween.progress;
        g.setPosition(
          startX + (endX - startX) * p,
          startY + (peakY - startY) * Math.sin(p * Math.PI) + (startY - startY) * (1 - p)
        );
        g.setAngle(p * 540);
      },
      onComplete: () => {
        this.tweens.add({
          targets: g,
          alpha: 0,
          duration: 200,
          onComplete: () => g.destroy(),
        });
      },
    });
  }

  // ── Scotland flag banner waving up ────────────────────────────────────────
  _flagBanner(x, startY, W, H) {
    const g = this.add.graphics();
    g.setDepth(11);

    // Flag (Saltire: blue with white X)
    const fw = 40, fh = 26;
    g.fillStyle(0x003F7F, 1);
    g.fillRect(-fw / 2, -fh / 2, fw, fh);
    g.lineStyle(5, 0xFFFFFF, 1);
    g.beginPath();
    g.moveTo(-fw / 2, -fh / 2); g.lineTo(fw / 2, fh / 2); g.strokePath();
    g.beginPath();
    g.moveTo(fw / 2, -fh / 2); g.lineTo(-fw / 2, fh / 2); g.strokePath();
    // Flagpole
    g.lineStyle(2, 0xCCCCCC, 1);
    g.beginPath();
    g.moveTo(-fw / 2, -fh / 2); g.lineTo(-fw / 2, fh / 2 + 30); g.strokePath();

    g.setPosition(x, startY);

    this.tweens.add({
      targets: g,
      y: H * 0.55,
      duration: 800,
      ease: 'Back.out(1.2)',
      onComplete: () => {
        // Gentle wave (horizontal oscillation)
        this.tweens.add({
          targets: g,
          x: x + 12,
          duration: 400,
          yoyo: true,
          repeat: 4,
          ease: 'Sine.inOut',
          onComplete: () => {
            this.tweens.add({
              targets: g,
              y: startY,
              alpha: 0,
              duration: 500,
              onComplete: () => g.destroy(),
            });
          },
        });
      },
    });
  }

  // ── Star drop ─────────────────────────────────────────────────────────────
  _starDrop(W, H) {
    const g = this.add.graphics();
    g.setDepth(8);
    this._drawStar(g, 0, 0, 8 + Math.random() * 6);
    g.setPosition(Math.random() * W, -20);
    g.setAngle(Math.random() * 360);

    const duration = 1800 + Math.random() * 1000;
    this.tweens.add({
      targets: g,
      y: H + 30,
      x: g.x + (Math.random() - 0.5) * 150,
      angle: g.angle + (Math.random() < 0.5 ? 360 : -360),
      duration,
      delay: Math.random() * 400,
      ease: 'Sine.in',
      onComplete: () => g.destroy(),
    });
  }

  // ── Finn victory jump ─────────────────────────────────────────────────────
  _doFinnJump() {
    const gameScene = this.scene.get('GameScene');
    if (!gameScene || !gameScene._finnSprite) return;

    const origY = gameScene._finnSprite.y;
    this.tweens.add({
      targets: gameScene._finnSprite,
      y: origY - 40,
      duration: 200,
      yoyo: true,
      repeat: 5,
      ease: 'Power2',
      onComplete: () => { gameScene._finnSprite.y = origY; },
    });
  }
}
