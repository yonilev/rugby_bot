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
  // Side-view character facing EAST (right). Each frame is a running pose.
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

    this.textures.addCanvas('finn', canvas);
    const texture = this.textures.get('finn');
    for (let i = 0; i < FRAMES; i++) {
      texture.add(i, 0, i * FRAME_W, 0, FRAME_W, FRAME_H);
    }
  }

  // Side-view east-facing character. frame 0=neutral, 1=stride-A, 2=neutral, 3=stride-B
  _drawFinnFrame(ctx, ox, oy, w, h, frame) {
    // Centre-x slightly left to leave room for ball on the right
    const cx = ox + w * 0.42;

    // Running animation offsets
    const legStride  = frame === 1 ? 10 : frame === 3 ? -10 : 0;
    const armSwing   = frame === 1 ? -7 : frame === 3 ?   7 : 0;

    // ── Legs (drawn behind body) ───────────────────────────────────────────
    ctx.strokeStyle = '#003F7F';
    ctx.lineWidth   = 7;
    ctx.lineCap     = 'round';

    const legsTopY = oy + 48;

    // Back leg
    ctx.beginPath();
    ctx.moveTo(cx - 3, legsTopY);
    ctx.lineTo(cx - 3 + legStride * 0.4, legsTopY + 18);
    ctx.stroke();

    // Front leg
    ctx.beginPath();
    ctx.moveTo(cx + 3, legsTopY);
    ctx.lineTo(cx + 3 - legStride * 0.4, legsTopY + 18);
    ctx.stroke();

    // Socks
    const bLegX = cx - 3 + legStride * 0.4;
    const fLegX = cx + 3 - legStride * 0.4;
    const legEndY = legsTopY + 18;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bLegX, legEndY, 4, 0, Math.PI * 2);
    ctx.arc(fLegX, legEndY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Navy hoop on socks
    ctx.fillStyle = '#003F7F';
    ctx.fillRect(bLegX - 4, legEndY - 2, 8, 3);
    ctx.fillRect(fLegX - 4, legEndY - 2, 8, 3);

    // Boots (angled eastward)
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.ellipse(bLegX + 5, legEndY + 5, 7, 4, 0.3, 0, Math.PI * 2);
    ctx.ellipse(fLegX + 5, legEndY + 5, 7, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // ── Shorts ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#003F7F';
    ctx.beginPath();
    ctx.roundRect(cx - 12, legsTopY - 4, 24, 11, 3);
    ctx.fill();

    // ── Jersey body (Scotland blue) ───────────────────────────────────────
    const bodyY = oy + 28;
    ctx.fillStyle = '#0065BD';
    ctx.beginPath();
    ctx.roundRect(cx - 12, bodyY, 24, 22, 4);
    ctx.fill();

    // White horizontal stripe across jersey
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.fillRect(cx - 12, bodyY + 8, 24, 4);

    // Jersey number "10"
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px "Segoe UI", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10', cx, bodyY + 15);

    // ── Arms ──────────────────────────────────────────────────────────────
    ctx.strokeStyle = '#0065BD';
    ctx.lineWidth   = 6;
    ctx.lineCap     = 'round';

    // Back arm (behind body, extends leftward/west)
    ctx.beginPath();
    ctx.moveTo(cx - 10, bodyY + 5);
    ctx.lineTo(cx - 18, bodyY + 14 + armSwing);
    ctx.stroke();

    // Front arm (extends rightward/east, toward ball)
    ctx.beginPath();
    ctx.moveTo(cx + 10, bodyY + 5);
    ctx.lineTo(cx + 20, bodyY + 14 - armSwing);
    ctx.stroke();

    // Hands
    ctx.fillStyle = '#F4C080';
    ctx.beginPath();
    ctx.arc(cx - 18, bodyY + 14 + armSwing, 4, 0, Math.PI * 2);
    ctx.arc(cx + 20, bodyY + 14 - armSwing, 4, 0, Math.PI * 2);
    ctx.fill();

    // ── Rugby ball in front hand (frames 0 & 2) ───────────────────────────
    if (frame === 0 || frame === 2) {
      const bx = cx + 28;
      const by = bodyY + 14 - armSwing - 1;
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.ellipse(bx, by, 9, 5.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth   = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx - 5, by);
      ctx.lineTo(bx + 5, by);
      ctx.moveTo(bx, by - 3);
      ctx.lineTo(bx, by + 3);
      ctx.stroke();
    }

    // ── Head (side-view facing right/east) ────────────────────────────────
    const headX = cx + 4;   // head slightly right of body centre (facing right)
    const headY = oy + 14;

    // Skin
    ctx.fillStyle = '#F4C080';
    ctx.beginPath();
    ctx.arc(headX, headY, 11, 0, Math.PI * 2);
    ctx.fill();

    // Red hair (Finn's iconic colour)
    ctx.fillStyle = '#8B1A1A';
    ctx.beginPath();
    ctx.arc(headX - 2, headY - 4, 10, Math.PI, 2 * Math.PI);
    ctx.fill();
    ctx.fillRect(headX - 11, headY - 8, 20, 5);

    // Eye (on right/east side of face)
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.arc(headX + 6, headY, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Eyebrow
    ctx.strokeStyle = '#5A1A1A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(headX + 3, headY - 4);
    ctx.lineTo(headX + 9, headY - 3);
    ctx.stroke();

    // Nose (small bump on right side)
    ctx.fillStyle = '#D4904A';
    ctx.beginPath();
    ctx.arc(headX + 10, headY + 1, 2, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#8B3A1A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(headX + 5, headY + 4, 3.5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // White collar peek
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(cx - 5, bodyY, 10, 5, 3);
    ctx.fill();
  }

  // ── Cell textures (obstacles, waypoints, mud) ─────────────────────────────
  _createCellTextures() {
    const SIZE = 64;

    const obsCanvas = document.createElement('canvas');
    obsCanvas.width = obsCanvas.height = SIZE;
    this._drawObstacle(obsCanvas.getContext('2d'), SIZE);
    this.textures.addCanvas('obstacle', obsCanvas);

    const wpCanvas = document.createElement('canvas');
    wpCanvas.width = wpCanvas.height = SIZE;
    this._drawWaypoint(wpCanvas.getContext('2d'), SIZE);
    this.textures.addCanvas('waypoint', wpCanvas);

    const mudCanvas = document.createElement('canvas');
    mudCanvas.width = mudCanvas.height = SIZE;
    this._drawMud(mudCanvas.getContext('2d'), SIZE);
    this.textures.addCanvas('mud', mudCanvas);
  }

  _drawObstacle(ctx, size) {
    const cx = size / 2, cy = size / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, size - 6, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#CC2222';
    ctx.beginPath();
    ctx.roundRect(cx - 10, cy - 4, 20, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#F4C080';
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 9, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.strokeStyle = 'rgba(255,80,80,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(2, 2, size - 4, size - 4, 8);
    ctx.stroke();
  }

  _drawWaypoint(ctx, size) {
    const cx = size / 2, cy = size / 2;
    const grd = ctx.createRadialGradient(cx, cy, 4, cx, cy, 24);
    grd.addColorStop(0, 'rgba(200,150,46,0.6)');
    grd.addColorStop(1, 'rgba(200,150,46,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.fillStyle = 'rgba(101,67,33,0.75)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(139,90,43,0.8)';
    [[cx-8,cy-5,4],[cx+6,cy+4,5],[cx-3,cy+8,3],[cx+10,cy-8,3]].forEach(([x,y,r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(255,180,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.roundRect(3, 3, size - 6, size - 6, 6);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
