// js/scenes/BootScene.js — Creates Finn's sprite texture then starts GameScene

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Nothing to preload — all assets generated programmatically
  }

  create() {
    this._createFinnTexture();
    this._createCellTextures();
    this.scene.start('GameScene');
  }

  // ── Finn spritesheet (4 frames × 64×80 px) ───────────────────────────────
  // Each frame is a simple Scotland rugby player character
  _createFinnTexture() {
    const FRAME_W = 64;
    const FRAME_H = 80;
    const FRAMES  = 4;

    const canvas = document.createElement('canvas');
    canvas.width  = FRAME_W * FRAMES;
    canvas.height = FRAME_H;
    const ctx = canvas.getContext('2d');

    for (let f = 0; f < FRAMES; f++) {
      this._drawFinnFrame(ctx, f * FRAME_W, 0, FRAME_W, FRAME_H, f);
    }

    // Add canvas as texture, then attach explicit frame data for the spritesheet
    this.textures.addCanvas('finn', canvas);
    const texture = this.textures.get('finn');
    for (let i = 0; i < FRAMES; i++) {
      texture.add(i, 0, i * FRAME_W, 0, FRAME_W, FRAME_H);
    }
  }

  _drawFinnFrame(ctx, ox, oy, w, h, frame) {
    const cx = ox + w / 2;
    const headY = oy + 16;
    const bodyY = oy + 30;

    // ── Head ──────────────────────────────────────────────────────────────
    ctx.fillStyle = '#F4C080'; // skin tone
    ctx.beginPath();
    ctx.arc(cx, headY, 11, 0, Math.PI * 2);
    ctx.fill();

    // Hair (dark red — Finn's iconic red hair)
    ctx.fillStyle = '#8B1A1A';
    ctx.beginPath();
    ctx.arc(cx, headY - 4, 9, Math.PI, 0);
    ctx.fill();
    // Fringe
    ctx.fillRect(cx - 9, headY - 8, 18, 5);

    // Eyes
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.arc(cx - 4, headY - 1, 2, 0, Math.PI * 2);
    ctx.arc(cx + 4, headY - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#1A1A2E';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, headY + 2, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // ── Jersey (Scotland blue) ────────────────────────────────────────────
    ctx.fillStyle = '#0065BD';
    // Body
    ctx.beginPath();
    ctx.roundRect(cx - 12, bodyY, 24, 26, 4);
    ctx.fill();

    // White collar
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(cx - 6, bodyY, 12, 6, 3);
    ctx.fill();

    // Jersey number "10"
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px "Segoe UI", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10', cx, bodyY + 18);

    // Scotland flag band (white/navy diagonal stripe effect)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(cx - 12, bodyY + 8, 24, 3);

    // ── Arms ──────────────────────────────────────────────────────────────
    const armSwing = frame === 1 ? -6 : frame === 3 ? 6 : 0;
    ctx.strokeStyle = '#0065BD';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Left arm
    ctx.beginPath();
    ctx.moveTo(cx - 12, bodyY + 6);
    ctx.lineTo(cx - 20, bodyY + 16 + armSwing);
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(cx + 12, bodyY + 6);
    ctx.lineTo(cx + 20, bodyY + 16 - armSwing);
    ctx.stroke();

    // Hands
    ctx.fillStyle = '#F4C080';
    ctx.beginPath();
    ctx.arc(cx - 20, bodyY + 16 + armSwing, 4, 0, Math.PI * 2);
    ctx.arc(cx + 20, bodyY + 16 - armSwing, 4, 0, Math.PI * 2);
    ctx.fill();

    // Rugby ball (in right hand, only frame 0 and 2)
    if (frame === 0 || frame === 2) {
      const bx = cx + 20;
      const by = bodyY + 14 - armSwing;
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.ellipse(bx + 6, by, 8, 5, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 6, by - 3);
      ctx.lineTo(bx + 6, by + 3);
      ctx.stroke();
    }

    // ── Shorts ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#003F7F';
    ctx.fillRect(cx - 12, bodyY + 24, 24, 12);

    // ── Legs ──────────────────────────────────────────────────────────────
    const legStride = frame === 0 ? 0 : frame === 1 ? 10 : frame === 2 ? 0 : -10;
    ctx.strokeStyle = '#003F7F';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';

    // Left leg
    ctx.beginPath();
    ctx.moveTo(cx - 6, bodyY + 36);
    ctx.lineTo(cx - 6 - legStride * 0.4, bodyY + 54 + (legStride > 0 ? -legStride * 0.3 : legStride * 0.3));
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(cx + 6, bodyY + 36);
    ctx.lineTo(cx + 6 + legStride * 0.4, bodyY + 54 + (legStride < 0 ? legStride * 0.3 : -legStride * 0.3));
    ctx.stroke();

    // Socks (white with navy hoops)
    const lLegEndX = cx - 6 - legStride * 0.4;
    const lLegEndY = bodyY + 54 + (legStride > 0 ? -legStride * 0.3 : legStride * 0.3);
    const rLegEndX = cx + 6 + legStride * 0.4;
    const rLegEndY = bodyY + 54 + (legStride < 0 ? legStride * 0.3 : -legStride * 0.3);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(lLegEndX, lLegEndY + 2, 4, 0, Math.PI * 2);
    ctx.arc(rLegEndX, rLegEndY + 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Boots
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.ellipse(lLegEndX + 1, lLegEndY + 5, 6, 4, 0.2, 0, Math.PI * 2);
    ctx.ellipse(rLegEndX + 1, rLegEndY + 5, 6, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Cell textures (obstacles, waypoints, try-line, mud) ──────────────────
  _createCellTextures() {
    const SIZE = 64;

    // Obstacle — opposing player silhouette (red jersey)
    const obsCanvas = document.createElement('canvas');
    obsCanvas.width = obsCanvas.height = SIZE;
    const obsCtx = obsCanvas.getContext('2d');
    this._drawObstacle(obsCtx, SIZE);
    this.textures.addCanvas('obstacle', obsCanvas);

    // Waypoint — bouncing rugby ball
    const wpCanvas = document.createElement('canvas');
    wpCanvas.width = wpCanvas.height = SIZE;
    const wpCtx = wpCanvas.getContext('2d');
    this._drawWaypoint(wpCtx, SIZE);
    this.textures.addCanvas('waypoint', wpCanvas);

    // Mud
    const mudCanvas = document.createElement('canvas');
    mudCanvas.width = mudCanvas.height = SIZE;
    const mudCtx = mudCanvas.getContext('2d');
    this._drawMud(mudCtx, SIZE);
    this.textures.addCanvas('mud', mudCanvas);
  }

  _drawObstacle(ctx, size) {
    const cx = size / 2, cy = size / 2;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, size - 6, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Red jersey player silhouette
    ctx.fillStyle = '#CC2222';
    ctx.beginPath();
    ctx.roundRect(cx - 10, cy - 4, 20, 20, 4);
    ctx.fill();
    // Head
    ctx.fillStyle = '#F4C080';
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 9, 0, Math.PI * 2);
    ctx.fill();
    // X eyes (defeated pose)
    ctx.strokeStyle = '#CC2222';
    ctx.lineWidth = 2;
    [-3, 3].forEach(dx => {
      ctx.beginPath();
      ctx.moveTo(cx + dx - 2, cy - 13);
      ctx.lineTo(cx + dx + 2, cy - 9);
      ctx.moveTo(cx + dx + 2, cy - 13);
      ctx.lineTo(cx + dx - 2, cy - 9);
      ctx.stroke();
    });
    // Warning outline
    ctx.strokeStyle = 'rgba(255,80,80,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(2, 2, size - 4, size - 4, 8);
    ctx.stroke();
  }

  _drawWaypoint(ctx, size) {
    const cx = size / 2, cy = size / 2;
    // Glow
    const grd = ctx.createRadialGradient(cx, cy, 4, cx, cy, 24);
    grd.addColorStop(0, 'rgba(200,150,46,0.6)');
    grd.addColorStop(1, 'rgba(200,150,46,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);

    // Rugby ball
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Lace
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx, cy + 6);
    ctx.moveTo(cx - 4, cy - 3);
    ctx.lineTo(cx + 4, cy - 3);
    ctx.moveTo(cx - 4, cy + 3);
    ctx.lineTo(cx + 4, cy + 3);
    ctx.stroke();
    // Gold star above
    ctx.fillStyle = 'var(--scotland-gold, #C8962E)';
    this._drawStar(ctx, cx, cy - 22, 8);
  }

  _drawStar(ctx, x, y, r) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#C8962E';
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const innerAngle = angle + (2 * Math.PI) / 5;
      if (i === 0) ctx.moveTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
      else ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
      ctx.lineTo(x + (r/2) * Math.cos(innerAngle), y + (r/2) * Math.sin(innerAngle));
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawMud(ctx, size) {
    const cx = size / 2, cy = size / 2;
    // Brown mud patch
    ctx.fillStyle = 'rgba(101,67,33,0.75)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Mud splat marks
    ctx.fillStyle = 'rgba(139,90,43,0.8)';
    [[cx-8,cy-5,4],[cx+6,cy+4,5],[cx-3,cy+8,3],[cx+10,cy-8,3]].forEach(([x,y,r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Warning dashes
    ctx.strokeStyle = 'rgba(255,180,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.roundRect(3, 3, size - 6, size - 6, 6);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
