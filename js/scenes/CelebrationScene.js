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

    // Dark overlay (fade in)
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, W, H);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 0.40, duration: 350 });

    // ── Effects: confetti, fireworks, jets, balloons ───────────────────────
    this._spawnConfetti(W, H);

    // Fireworks (staggered bursts)
    this.time.delayedCall(200,  () => this._firework(W * 0.25, H * 0.25));
    this.time.delayedCall(450,  () => this._firework(W * 0.75, H * 0.20));
    this.time.delayedCall(700,  () => this._firework(W * 0.50, H * 0.30));
    this.time.delayedCall(950,  () => this._firework(W * 0.20, H * 0.40));
    this.time.delayedCall(1200, () => this._firework(W * 0.80, H * 0.25));
    this.time.delayedCall(1500, () => this._firework(W * 0.60, H * 0.15));

    // Jet planes flying across
    this.time.delayedCall(300,  () => this._jetPlane(H * 0.15, 1));    // left→right
    this.time.delayedCall(700,  () => this._jetPlane(H * 0.35, -1));   // right→left
    this.time.delayedCall(1100, () => this._jetPlane(H * 0.22, 1));

    // Balloons floating up
    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 150, () => this._balloon(W, H));
    }

    // ── "TRY!" banner ─────────────────────────────────────────────────────
    const banner = this.add.text(W/2, H/2 - 50, '🏉  TRY!', {
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#FFD700',
      stroke: '#003F7F',
      strokeThickness: 8,
      shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 14, fill: true },
    }).setOrigin(0.5, 0.5).setAlpha(0).setScale(0.3);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      scale: 1,
      duration: 420,
      ease: 'Back.out(1.7)',
    });

    // Points badge
    const badge = this.add.text(W/2, H/2 + 30, `+${this._points} pts`, {
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5, 0.5).setAlpha(0);

    this.tweens.add({
      targets: badge,
      alpha: 1,
      y: H/2 + 20,
      duration: 300,
      delay: 380,
      ease: 'Power2',
    });

    // Finn jumps in GameScene
    this._doFinnJump();

    // Auto-close after 2.8s
    this.time.delayedCall(2800, () => {
      this.tweens.add({
        targets: [banner, badge, overlay],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.scene.stop();
          this._onDone();
        },
      });
    });
  }

  // ── Confetti ──────────────────────────────────────────────────────────────
  _spawnConfetti(W, H) {
    const COLORS = [0xC8962E, 0x0065BD, 0xFFFFFF, 0x4CAF50, 0xFF5252, 0xF5A623, 0xFF69B4, 0x00BFFF];

    for (let i = 0; i < 80; i++) {
      const g = this.add.graphics();
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      g.fillStyle(color, 1);
      if (Math.random() < 0.5) {
        g.fillRect(-4, -6, 8, 12);
      } else {
        g.fillCircle(0, 0, 5);
      }
      const startX = Math.random() * W;
      g.setPosition(startX, -20);
      g.setAngle(Math.random() * 360);

      const duration = 2000 + Math.random() * 1200;
      const targetX  = startX + (Math.random() - 0.5) * 200;
      const delay    = Math.random() * 600;

      this.tweens.add({
        targets: g,
        x: targetX,
        y: H + 30,
        angle: g.angle + (Math.random() < 0.5 ? 360 : -360),
        duration,
        delay,
        ease: 'Sine.in',
        onComplete: () => g.destroy(),
      });
    }
  }

  // ── Firework burst ────────────────────────────────────────────────────────
  _firework(cx, cy) {
    const COLORS = [0xFFD700, 0xFF4444, 0x4CAF50, 0x00BFFF, 0xFF69B4, 0xFFFFFF, 0xC8962E];
    const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
    const count  = 14 + Math.floor(Math.random() * 8);

    // Pre-flash
    const flash = this.add.graphics();
    flash.fillStyle(0xFFFFFF, 0.8);
    flash.fillCircle(cx, cy, 10);
    flash.setDepth(18);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 3,
      scaleY: 3,
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    // Sparkle particles
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 80 + Math.random() * 80;
      const endX  = cx + Math.cos(angle) * speed;
      const endY  = cy + Math.sin(angle) * speed;

      const spark = this.add.graphics();
      spark.fillStyle(color, 1);
      spark.fillCircle(0, 0, 4 + Math.random() * 3);
      // Small trail dots
      spark.fillStyle(color, 0.5);
      spark.fillCircle(Math.cos(angle) * -8, Math.sin(angle) * -8, 2);
      spark.setPosition(cx, cy);
      spark.setDepth(17);

      this.tweens.add({
        targets: spark,
        x: endX,
        y: endY + 40, // gravity
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 700 + Math.random() * 400,
        ease: 'Power2.out',
        onComplete: () => spark.destroy(),
      });
    }

    // Star burst (secondary ring)
    const count2 = 8;
    for (let i = 0; i < count2; i++) {
      const angle = (i / count2) * Math.PI * 2 + 0.2;
      const speed = 120 + Math.random() * 50;
      const spark2 = this.add.graphics();
      spark2.fillStyle(0xFFFFFF, 0.9);
      this._drawStar(spark2, 0, 0, 5);
      spark2.setPosition(cx, cy);
      spark2.setDepth(17);

      this.tweens.add({
        targets: spark2,
        x: cx + Math.cos(angle) * speed,
        y: cy + Math.sin(angle) * speed + 30,
        angle: 360 * (Math.random() < 0.5 ? 1 : -1),
        alpha: 0,
        duration: 900 + Math.random() * 300,
        ease: 'Power2.out',
        onComplete: () => spark2.destroy(),
      });
    }
  }

  _drawStar(g, x, y, r) {
    g.fillStyle(0xFFD700, 1);
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
      const ia = a + 2 * Math.PI / 5;
      if (i === 0) g.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
      else g.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
      g.lineTo(x + (r/2) * Math.cos(ia), y + (r/2) * Math.sin(ia));
    }
    g.closePath();
    g.fillPath();
  }

  // ── Jet plane ─────────────────────────────────────────────────────────────
  // dir: 1 = left to right, -1 = right to left
  _jetPlane(y, dir) {
    const W = this.scale.width;
    const startX = dir === 1 ? -80 : W + 80;
    const endX   = dir === 1 ? W + 80 : -80;

    const plane = this.add.graphics();
    plane.setDepth(19);

    // Draw a simple jet silhouette facing the direction of flight
    const flip = dir === -1;
    plane.fillStyle(0xCCCCDD, 1);

    // Fuselage
    plane.fillRect(-28, -5, 56, 10);
    // Nose cone
    plane.fillTriangle(28, 0, 50, -4, 50, 4);
    plane.fillTriangle(-28, 0, -50, -3, -50, 3);
    // Wing (top view)
    plane.fillTriangle(0, 0, -10, -24, 16, 0);
    plane.fillTriangle(0, 0, -10,  24, 16, 0);
    // Tail wing
    plane.fillTriangle(-24, 0, -28, -14, -18, 0);
    plane.fillTriangle(-24, 0, -28,  14, -18, 0);
    // Scotland flag on fuselage
    plane.fillStyle(0x003F7F, 1);
    plane.fillRect(-6, -4, 12, 8);
    plane.fillStyle(0xFFFFFF, 1);
    plane.fillRect(-7, -1, 14, 2);
    plane.fillRect(-1, -5, 2, 10);

    // Contrail
    const trail = this.add.graphics();
    trail.setDepth(16);
    trail.fillStyle(0xFFFFFF, 0.3);
    trail.fillRect(0, -1.5, 60, 3);
    trail.setPosition(startX, y);
    if (flip) {
      plane.setFlipX(true);
      trail.x = startX;
    }

    plane.setPosition(startX, y);

    const duration = 1800;

    this.tweens.add({
      targets: [plane, trail],
      x: endX,
      duration,
      ease: 'Linear',
      onUpdate: () => {
        trail.setPosition(
          plane.x + (dir === 1 ? -60 : 60),
          plane.y
        );
      },
      onComplete: () => { plane.destroy(); trail.destroy(); },
    });

    // Sonic "whoosh" — just a very brief flash across the screen
    const boom = this.add.graphics();
    boom.fillStyle(0xFFFFFF, 0.12);
    boom.fillRect(0, y - 10, W, 20);
    boom.setDepth(15);
    this.tweens.add({
      targets: boom,
      alpha: 0,
      duration: 400,
      onComplete: () => boom.destroy(),
    });
  }

  // ── Balloon ───────────────────────────────────────────────────────────────
  _balloon(W, H) {
    const COLORS = [0xFF4444, 0x4CAF50, 0xFFD700, 0x0065BD, 0xFF69B4, 0xC8962E];
    const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
    const x      = 40 + Math.random() * (W - 80);

    const g = this.add.graphics();
    g.setDepth(16);
    // Balloon body
    g.fillStyle(color, 0.85);
    g.fillEllipse(0, 0, 22, 28);
    // Highlight
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillEllipse(-4, -6, 8, 10);
    // Knot
    g.fillStyle(color, 1);
    g.fillTriangle(0, 14, -3, 18, 3, 18);
    // String
    g.lineStyle(1, 0x888888, 0.7);
    g.beginPath();
    g.moveTo(0, 18);
    g.lineTo(0, 36);
    g.strokePath();

    g.setPosition(x, H + 40);

    const targetY = -50;
    const wobbleX = (Math.random() - 0.5) * 80;

    this.tweens.add({
      targets: g,
      x: x + wobbleX,
      y: targetY,
      duration: 2500 + Math.random() * 1000,
      delay: Math.random() * 500,
      ease: 'Sine.inOut',
      onComplete: () => g.destroy(),
    });
  }

  // ── Finn victory jump ─────────────────────────────────────────────────────
  _doFinnJump() {
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene._finnSprite) {
      const origY = gameScene._finnSprite.y;
      this.tweens.add({
        targets: gameScene._finnSprite,
        y: origY - 30,
        duration: 220,
        yoyo: true,
        repeat: 3,
        ease: 'Power2',
        onComplete: () => {
          gameScene._finnSprite.y = origY;
        },
      });
    }
  }
}
