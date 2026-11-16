// Emberlight — everything the eye sees: the night garden, the glowing
// orbs and bats, Pip the firefly with her light trail, the particles,
// and the HUD (score, combo, hearts, Dawn Meter, dash). One cached
// glow sprite per colour keeps the frame cheap; the vignette and the
// star field are drawn once into offscreen canvases and reused.

import { VIEW_W, VIEW_H, PALETTE, TUNING, mulberry32 } from './config.js';

const glowCache = new Map();
const stars = (() => {
  const rng = mulberry32(777);
  const list = [];
  for (let i = 0; i < 130; i++) {
    list.push({ x: rng() * VIEW_W, y: rng() * VIEW_H * 0.55, r: 0.5 + rng() * 1.6, tw: rng() * Math.PI * 2 });
  }
  return list;
})();

let vignette = null;

function glowSprite(rgb, radius) {
  const key = rgb + '|' + radius;
  if (glowCache.has(key)) return glowCache.get(key);
  const size = radius * 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grad.addColorStop(0, `rgba(${rgb}, 0.85)`);
  grad.addColorStop(0.35, `rgba(${rgb}, 0.32)`);
  grad.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  glowCache.set(key, canvas);
  return canvas;
}

function drawGlow(ctx, rgb, x, y, radius, alpha) {
  const sprite = glowSprite(rgb, radius);
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, x - radius, y - radius);
  ctx.globalAlpha = 1;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function buildVignette() {
  const canvas = document.createElement('canvas');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(
    VIEW_W / 2, VIEW_H * 0.45, VIEW_H * 0.42,
    VIEW_W / 2, VIEW_H * 0.5, VIEW_H * 0.95,
  );
  grad.addColorStop(0, 'rgba(5, 6, 20, 0)');
  grad.addColorStop(1, 'rgba(5, 6, 20, 0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  vignette = canvas;
}

function drawBackground(ctx, world) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.55, PALETTE.skyMid);
  sky.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // The moon, low and warm, is the dawn the fireflies are chasing.
  drawGlow(ctx, '255, 190, 90', VIEW_W - 210, 130, 150, 0.5);
  ctx.fillStyle = '#ffe9b8';
  ctx.beginPath();
  ctx.arc(VIEW_W - 210, 130, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0cf8a';
  for (const [cx, cy, cr] of [
    [VIEW_W - 232, 112, 7],
    [VIEW_W - 186, 148, 6],
    [VIEW_W - 202, 104, 4],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const star of stars) {
    const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(world.time * 0.7 + star.tw));
    ctx.globalAlpha = twinkle * 0.9;
    ctx.fillStyle = '#e8ecff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Two grassy ridges anchor the bottom of the garden.
  ctx.fillStyle = PALETTE.grassMid;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  ctx.lineTo(0, 690);
  ctx.bezierCurveTo(260, 640, 420, 720, 700, 678);
  ctx.bezierCurveTo(940, 644, 1120, 716, VIEW_W, 676);
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.grassDark;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  ctx.lineTo(0, 748);
  ctx.bezierCurveTo(300, 706, 560, 762, 860, 724);
  ctx.bezierCurveTo(1060, 700, 1180, 752, VIEW_W, 730);
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.grassLight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 748);
  ctx.bezierCurveTo(300, 706, 560, 762, 860, 724);
  ctx.bezierCurveTo(1060, 700, 1180, 752, VIEW_W, 730);
  ctx.stroke();

  for (const mote of world.motes) {
    const glow = 0.25 + 0.55 * Math.abs(Math.sin(mote.phase));
    drawGlow(ctx, mote.hue, mote.x, mote.y, 14, glow);
    ctx.fillStyle = `rgba(${mote.hue}, ${0.5 + glow * 0.5})`;
    ctx.beginPath();
    ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOrbs(ctx, world) {
  for (const orb of world.orbs) {
    const gold = orb.kind === 'gold';
    const bob = Math.sin(orb.spin * 1.4) * 0.15 + 1;
    const glowR = orb.r * (gold ? 4.6 : 3.6) * bob;
    drawGlow(ctx, gold ? '255, 179, 0' : '255, 217, 77', orb.x, orb.y, glowR, gold ? 0.9 : 0.75);
    ctx.fillStyle = gold ? PALETTE.gold : PALETTE.pollen;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = gold ? PALETTE.goldCore : PALETTE.pollenCore;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    if (gold) {
      ctx.strokeStyle = '#fff3c4';
      ctx.lineWidth = 2;
      const s = orb.r + 8 + Math.sin(orb.spin * 3) * 2;
      ctx.beginPath();
      ctx.moveTo(orb.x - s, orb.y);
      ctx.lineTo(orb.x + s, orb.y);
      ctx.moveTo(orb.x, orb.y - s);
      ctx.lineTo(orb.x, orb.y + s);
      ctx.stroke();
    }
  }
}

function drawBats(ctx, world) {
  for (const bat of world.bats) {
    const flap = Math.sin(bat.flap) * 0.9;
    const facing = bat.vx >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(bat.x, bat.y);
    ctx.scale(facing, 1);
    ctx.fillStyle = PALETTE.batWing;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-26, -22 - flap * 16, -44, -6 - flap * 22);
    ctx.quadraticCurveTo(-24, 2, -8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-24, 20 + flap * 12, -40, 12 + flap * 16);
    ctx.quadraticCurveTo(-22, 6, -6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.bat;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.bat;
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(15, -20);
    ctx.lineTo(19, -7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2, -10);
    ctx.lineTo(4, -22);
    ctx.lineTo(9, -9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.batEye;
    for (const [ex, ey] of [[9, -3], [16, -3]]) {
      ctx.beginPath();
      ctx.arc(ex, ey, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawPlayer(ctx, world) {
  const player = world.player;
  if (player.invuln > 0 && Math.floor(world.time * 14) % 2 === 0) return;
  const dashing = player.dashTime > 0;
  const pulse = 1 + Math.sin(player.glowPulse * 6) * 0.12;

  for (let i = 0; i < player.trail.length; i++) {
    const point = player.trail[i];
    const t = i / player.trail.length;
    ctx.globalAlpha = t * 0.45;
    ctx.fillStyle = PALETTE.playerGlow;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3 + t * 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawGlow(ctx, '255, 207, 61', player.x, player.y, (dashing ? 86 : 64) * pulse, 0.95);

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  const wingFlap = Math.sin(world.time * 22) * 0.55;
  ctx.fillStyle = 'rgba(255, 251, 224, 0.75)';
  ctx.beginPath();
  ctx.ellipse(-4, -12 - wingFlap * 6, 13, 5 + wingFlap * 3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-4, 12 + wingFlap * 6, 13, 5 + wingFlap * 3, 0.5, 0, Math.PI * 2);
  ctx.fill();
  const bodyGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, player.r + 2);
  bodyGrad.addColorStop(0, PALETTE.playerCore);
  bodyGrad.addColorStop(0.55, PALETTE.player);
  bodyGrad.addColorStop(1, '#e8a91c');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 70, 0, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, player.r - 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#241a00';
  for (const [ex, ey] of [[6, -5], [6, 5]]) {
    ctx.beginPath();
    ctx.arc(ex, ey, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles(ctx, world) {
  for (const part of world.particles) {
    ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(part.x, part.y, part.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.hudBorder;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 12);
  ctx.stroke();
}

function drawHearts(ctx, x, y, hearts, max) {
  for (let i = 0; i < max; i++) {
    const hx = x + i * 34;
    const filled = i < hearts;
    ctx.fillStyle = filled ? PALETTE.heart : PALETTE.heartEmpty;
    ctx.beginPath();
    ctx.moveTo(hx, y + 8);
    ctx.bezierCurveTo(hx - 11, y - 3, hx - 4, y - 11, hx, y - 3);
    ctx.bezierCurveTo(hx + 4, y - 11, hx + 11, y - 3, hx, y + 8);
    ctx.closePath();
    ctx.fill();
    if (filled) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(hx - 3, y - 4, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawHud(ctx, world, muted) {
  // Score, top left.
  panel(ctx, 18, 16, 250, 84);
  ctx.fillStyle = PALETTE.textSoft;
  ctx.font = '700 13px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('S C O R E', 34, 40);
  ctx.fillStyle = PALETTE.textBright;
  ctx.font = '800 34px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.fillText(world.score.toLocaleString('en-US'), 32, 76);
  ctx.fillStyle = PALETTE.textSoft;
  ctx.font = '600 13px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.fillText('BEST  ' + world.best.toLocaleString('en-US'), 150, 40);

  // Combo, under the score, only while the chain is alive.
  if (world.combo >= 2) {
    const mult = world.comboMultiplier();
    panel(ctx, 18, 110, 190, 52);
    ctx.fillStyle = '#ffd94d';
    ctx.font = '800 24px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillText('COMBO x' + mult.toFixed(1), 34, 134);
    ctx.fillStyle = 'rgba(255, 217, 77, 0.3)';
    ctx.fillRect(34, 142, 158, 6);
    ctx.fillStyle = '#ffd94d';
    ctx.fillRect(34, 142, 158 * Math.max(0, world.comboTimer / TUNING.comboWindow), 6);
  }

  // Dawn Meter, top centre: three suns and one long bar.
  const barW = 380;
  const barX = (VIEW_W - barW) / 2;
  panel(ctx, barX - 16, 16, barW + 32, 84);
  ctx.fillStyle = PALETTE.textSoft;
  ctx.font = '700 13px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('D A W N   M E T E R', VIEW_W / 2, 40);
  for (let i = 0; i < TUNING.dawnsToWin; i++) {
    const sx = barX + 26 + i * 30;
    const lit = i < world.dawn;
    drawGlow(ctx, '255, 179, 0', sx, 62, lit ? 26 : 12, lit ? 0.9 : 0.35);
    ctx.fillStyle = lit ? '#ffb300' : '#4a3a72';
    ctx.beginPath();
    ctx.arc(sx, 62, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lit ? '#fff3c4' : '#8a7bb5';
    ctx.beginPath();
    ctx.arc(sx, 62, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  const meterX = barX + 118;
  const meterW = barW - 118;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  roundRect(ctx, meterX, 52, meterW, 20, 10);
  ctx.fill();
  const fill = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
  fill.addColorStop(0, '#ffb300');
  fill.addColorStop(1, '#ffe066');
  ctx.fillStyle = fill;
  if (world.meter > 0) {
    roundRect(ctx, meterX, 52, meterW * (world.meter / 100), 20, 10);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.textBright;
  ctx.font = '700 12px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.fillText(Math.floor(world.meter) + '%', meterX + meterW / 2, 67);

  // Hearts and dash, top right.
  panel(ctx, VIEW_W - 268, 16, 250, 84);
  drawHearts(ctx, VIEW_W - 246, 44, world.hearts, TUNING.hearts);
  ctx.fillStyle = PALETTE.textSoft;
  ctx.font = '700 13px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('DASH', VIEW_W - 246, 82);
  const dashReady = world.player.dashCooldown <= 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  roundRect(ctx, VIEW_W - 196, 70, 96, 12, 6);
  ctx.fill();
  ctx.fillStyle = dashReady ? '#7dffb0' : '#ffd94d';
  const dashFrac = dashReady ? 1 : 1 - world.player.dashCooldown / TUNING.dashCooldown;
  roundRect(ctx, VIEW_W - 196, 70, 96 * dashFrac, 12, 6);
  ctx.fill();
  ctx.fillStyle = dashReady ? '#7dffb0' : PALETTE.textSoft;
  ctx.font = '700 12px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    dashReady ? 'READY' : world.player.dashCooldown.toFixed(1) + 's',
    VIEW_W - 88,
    82,
  );
  ctx.fillStyle = PALETTE.textSoft;
  ctx.font = '600 12px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(muted ? 'M — sound off' : 'M — sound on', VIEW_W - 34, 40);

  // Bottom hint, quiet and small.
  ctx.fillStyle = 'rgba(201, 194, 240, 0.75)';
  ctx.font = '600 13px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Move: mouse or WASD / arrows   ·   Dash: SPACE   ·   Pause: P', VIEW_W / 2, VIEW_H - 16);
}

export function drawWorld(ctx, world, muted) {
  if (!vignette) buildVignette();
  ctx.save();
  if (world.shake > 0) {
    const mag = world.shake * 12;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  drawBackground(ctx, world);
  drawOrbs(ctx, world);
  drawBats(ctx, world);
  // Pip only shows while a run is live; the title and end screens
  // keep the garden to themselves.
  if (world.mode === 'playing' || world.mode === 'paused') drawPlayer(ctx, world);
  drawParticles(ctx, world);
  ctx.restore();
  ctx.drawImage(vignette, 0, 0);
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(255, 236, 170, ${world.flash * 0.45})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (world.mode === 'playing' || world.mode === 'paused') drawHud(ctx, world, muted);
}
