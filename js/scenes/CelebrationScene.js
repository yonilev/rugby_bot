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

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0);
    overlay.fillRect(0, 0, W, H);
    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.45,  // indirect — use alpha on the graphics object
      duration: 400,
    });
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 0.45, duration: 400 });

    // Confetti particles
    this._spawnConfetti(W, H);

    // "TRY!" banner
    const banner = this.add.text(W/2, H/2 - 40, '🏉  TRY!', {
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#F0BB50',
      stroke: '#003F7F',
      strokeThickness: 8,
      shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 12, fill: true },
    }).setOrigin(0.5, 0.5).setAlpha(0).setScale(0.3);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.out(1.7)',
    });

    // Points badge
    const badge = this.add.text(W/2, H/2 + 40, `+${this._points} pts`, {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setAlpha(0);

    this.tweens.add({
      targets: badge,
      alpha: 1,
      y: H/2 + 30,
      duration: 300,
      delay: 350,
      ease: 'Power2',
    });

    // Finn jumps in game scene (send message)
    this._doFinnJump();

    // Auto close after 2.5s
    this.time.delayedCall(2500, () => {
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

  _spawnConfetti(W, H) {
    const COLORS = [0xC8962E, 0x0065BD, 0xFFFFFF, 0x4CAF50, 0xFF5252, 0xF5A623];
    const particles = [];

    for (let i = 0; i < 80; i++) {
      const g = this.add.graphics();
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      g.fillStyle(color, 1);

      if (Math.random() < 0.5) {
        g.fillRect(-4, -6, 8, 12); // rectangle
      } else {
        g.fillCircle(0, 0, 5); // circle
      }

      const startX = Math.random() * W;
      g.setPosition(startX, -20);
      g.setAngle(Math.random() * 360);
      particles.push(g);

      // Each particle falls with varying speed and wobble
      const duration = 2000 + Math.random() * 1000;
      const targetX = startX + (Math.random() - 0.5) * 200;
      const delay = Math.random() * 500;

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

  _doFinnJump() {
    // Signal the GameScene to make Finn jump
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene._finnSprite) {
      const origY = gameScene._finnSprite.y;
      this.tweens.add({
        targets: gameScene._finnSprite,
        y: origY - 30,
        duration: 250,
        yoyo: true,
        repeat: 3,
        ease: 'Power2',
        onComplete: () => {
          gameScene._finnSprite.y = origY;
          // Victory pose — rotate slightly
          this.tweens.add({
            targets: gameScene._finnSprite,
            angle: gameScene._finnSprite.angle + 15,
            duration: 200,
            yoyo: true,
            ease: 'Sine.inOut',
          });
        },
      });
    }
  }
}
