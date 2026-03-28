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
    const FRAMES  = 5;  // 0-3 running, 4 = kick pose

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

  // Side-view east-facing character. frame 0=neutral, 1=stride-A, 2=neutral, 3=stride-B, 4=kick
  _drawFinnFrame(ctx, ox, oy, w, h, frame) {
    // Centre-x slightly left to leave room for ball on the right
    const cx = ox + w * 0.42;

    if (frame === 4) {
      this._drawFinnKickFrame(ctx, ox, oy, cx);
      return;
    }

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

  // Kick pose: planted leg, kicking leg raised forward, arms spread for balance
  _drawFinnKickFrame(ctx, ox, oy, cx) {
    const legsTopY = oy + 48;
    const bodyY    = oy + 28;
    const headX    = cx + 4;
    const headY    = oy + 14;

    // ── Planted leg ─────────────────────────────────────────────────────────
    ctx.strokeStyle = '#003F7F';
    ctx.lineWidth   = 7;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 4, legsTopY);
    ctx.lineTo(cx - 4, legsTopY + 18);
    ctx.stroke();
    // Planted sock
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(cx - 4, legsTopY + 18, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#003F7F';
    ctx.fillRect(cx - 8, legsTopY + 16, 8, 3);
    // Planted boot
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.ellipse(cx + 1, legsTopY + 23, 7, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // ── Kicking upper leg (thigh, drawn behind body) ─────────────────────────
    ctx.strokeStyle = '#003F7F';
    ctx.lineWidth   = 7;
    ctx.beginPath();
    ctx.moveTo(cx + 4, legsTopY);
    ctx.lineTo(cx + 14, legsTopY + 5);
    ctx.stroke();

    // ── Shorts ──────────────────────────────────────────────────────────────
    ctx.fillStyle = '#003F7F';
    ctx.beginPath();
    ctx.roundRect(cx - 12, legsTopY - 4, 24, 11, 3);
    ctx.fill();

    // ── Jersey body ──────────────────────────────────────────────────────────
    ctx.fillStyle = '#0065BD';
    ctx.beginPath();
    ctx.roundRect(cx - 12, bodyY, 24, 22, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.fillRect(cx - 12, bodyY + 8, 24, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px "Segoe UI", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10', cx, bodyY + 15);

    // ── Arms spread wide for balance ─────────────────────────────────────────
    ctx.strokeStyle = '#0065BD';
    ctx.lineWidth   = 6;
    ctx.lineCap     = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 10, bodyY + 5); ctx.lineTo(cx - 24, bodyY + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 10, bodyY + 5); ctx.lineTo(cx + 24, bodyY + 10); ctx.stroke();
    ctx.fillStyle = '#F4C080';
    ctx.beginPath();
    ctx.arc(cx - 24, bodyY + 10, 4, 0, Math.PI * 2);
    ctx.arc(cx + 24, bodyY + 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // ── Kicking lower leg + boot (in front of body) ──────────────────────────
    ctx.strokeStyle = '#003F7F';
    ctx.lineWidth   = 7;
    ctx.beginPath();
    ctx.moveTo(cx + 14, legsTopY + 5);
    ctx.lineTo(cx + 24, legsTopY + 12);
    ctx.stroke();
    // Kicking sock
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(cx + 24, legsTopY + 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#003F7F';
    ctx.fillRect(cx + 20, legsTopY + 10, 8, 3);
    // Kicking boot (toe points east-forward)
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.ellipse(cx + 30, legsTopY + 14, 7, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // ── Head ─────────────────────────────────────────────────────────────────
    ctx.fillStyle = '#F4C080';
    ctx.beginPath(); ctx.arc(headX, headY, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8B1A1A';
    ctx.beginPath(); ctx.arc(headX - 2, headY - 4, 10, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillRect(headX - 11, headY - 8, 20, 5);
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath(); ctx.arc(headX + 6, headY, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5A1A1A';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(headX + 3, headY - 4); ctx.lineTo(headX + 9, headY - 3); ctx.stroke();
    ctx.fillStyle = '#D4904A';
    ctx.beginPath(); ctx.arc(headX + 10, headY + 1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8B3A1A';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(headX + 5, headY + 4, 3.5, 0.2, Math.PI - 0.2); ctx.stroke();
    // White collar
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.roundRect(cx - 5, bodyY, 10, 5, 3); ctx.fill();
  }

  // ── Cell textures (obstacles, waypoints, mud) ─────────────────────────────
  _createCellTextures() {
    const SIZE = 64;

    const obsCanvas = document.createElement('canvas');
    obsCanvas.width = obsCanvas.height = SIZE;
    this._drawObstacle(obsCanvas.getContext('2d'), SIZE);
    this.textures.addCanvas('obstacle', obsCanvas);

    const oppCanvas = document.createElement('canvas');
    oppCanvas.width = oppCanvas.height = SIZE;
    this._drawOpponentPlayer(oppCanvas.getContext('2d'), SIZE);
    this.textures.addCanvas('opponent-player', oppCanvas);

    const wpCanvas = document.createElement('canvas');
    wpCanvas.width = wpCanvas.height = SIZE;
    this._drawWaypoint(wpCanvas.getContext('2d'), SIZE);
    this.textures.addCanvas('waypoint', wpCanvas);

    const mudCanvas = document.createElement('canvas');
    mudCanvas.width = mudCanvas.height = SIZE;
    this._drawMud(mudCanvas.getContext('2d'), SIZE);
    this.textures.addCanvas('mud', mudCanvas);
  }

  _drawOpponentPlayer(ctx, size) {
    // Side-view defender facing WEST (left) — mirror of Finn's silhouette.
    const cx       = 32;
    const headX    = cx - 4;   // head shifted west (toward face direction)
    const headY    = 11;
    const bodyY    = 22;
    const legsTopY = 38;
    const legEndY  = legsTopY + 13;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, size - 4, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Legs ──────────────────────────────────────────────────────────────
    ctx.strokeStyle = '#660000';
    ctx.lineWidth   = 6;
    ctx.lineCap     = 'round';

    const bLegX = cx + 3;   // back leg (east side for westward-facer)
    const fLegX = cx - 3;   // front leg (west side)

    ctx.beginPath(); ctx.moveTo(bLegX, legsTopY); ctx.lineTo(bLegX, legEndY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fLegX, legsTopY); ctx.lineTo(fLegX, legEndY); ctx.stroke();

    // Socks
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bLegX, legEndY, 3.5, 0, Math.PI * 2);
    ctx.arc(fLegX, legEndY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Red hoop on socks
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(bLegX - 3.5, legEndY - 2, 7, 2.5);
    ctx.fillRect(fLegX - 3.5, legEndY - 2, 7, 2.5);

    // Boots (angled westward)
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.ellipse(bLegX - 5, legEndY + 4, 6, 3.5, -0.3, 0, Math.PI * 2);
    ctx.ellipse(fLegX - 5, legEndY + 4, 6, 3.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // ── Shorts ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#660000';
    ctx.beginPath();
    ctx.roundRect(cx - 10, legsTopY - 3, 20, 9, 3);
    ctx.fill();

    // ── Jersey (red) ──────────────────────────────────────────────────────
    ctx.fillStyle = '#CC0000';
    ctx.beginPath();
    ctx.roundRect(cx - 10, bodyY, 20, 18, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.fillRect(cx - 10, bodyY + 7, 20, 3);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px "Segoe UI", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('7', cx, bodyY + 12);

    // ── Arms ──────────────────────────────────────────────────────────────
    ctx.strokeStyle = '#CC0000';
    ctx.lineWidth   = 5;
    ctx.lineCap     = 'round';

    // Back arm (extends east/right, behind body)
    ctx.beginPath(); ctx.moveTo(cx + 8, bodyY + 4); ctx.lineTo(cx + 16, bodyY + 11); ctx.stroke();
    // Front arm (extends west/left, toward Finn)
    ctx.beginPath(); ctx.moveTo(cx - 8, bodyY + 4); ctx.lineTo(cx - 16, bodyY + 11); ctx.stroke();

    // Hands
    ctx.fillStyle = '#F4C080';
    ctx.beginPath();
    ctx.arc(cx + 16, bodyY + 11, 3.5, 0, Math.PI * 2);
    ctx.arc(cx - 16, bodyY + 11, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // ── Head (side-view facing west/left) ─────────────────────────────────
    ctx.fillStyle = '#F4C080';
    ctx.beginPath(); ctx.arc(headX, headY, 10, 0, Math.PI * 2); ctx.fill();

    // Dark brown hair
    ctx.fillStyle = '#3D1A00';
    ctx.beginPath(); ctx.arc(headX + 2, headY - 3, 9, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillRect(headX - 8, headY - 7, 18, 5);

    // Eye (on west/left side of face)
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath(); ctx.arc(headX - 5, headY, 2, 0, Math.PI * 2); ctx.fill();

    // Stern eyebrow (angled down toward nose for a scowl)
    ctx.strokeStyle = '#3D1A00';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(headX - 2, headY - 4); ctx.lineTo(headX - 8, headY - 2); ctx.stroke();

    // Nose (on west/left side)
    ctx.fillStyle = '#D4904A';
    ctx.beginPath(); ctx.arc(headX - 9, headY + 1, 1.8, 0, Math.PI * 2); ctx.fill();

    // Frown
    ctx.strokeStyle = '#8B3A1A';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(headX - 4, headY + 5, 3, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke();

    // White collar
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.roundRect(cx - 4, bodyY, 8, 4, 3); ctx.fill();

    // Warning border
    ctx.strokeStyle = 'rgba(200,30,30,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.roundRect(2, 2, size - 4, size - 4, 8); ctx.stroke();
  }

  _drawObstacle(ctx, size) {
    this._drawOpponentPlayer(ctx, size);
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
