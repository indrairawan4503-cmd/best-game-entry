// Emberlight — the four overlay screens: the title, the pause card,
// the sunrise win and the game-over card. Each one is drawn on the
// same canvas as the game, so the screenshots show the whole loop.
// lastButtons holds the clickable rectangles of the buttons drawn
// most recently; main.js reads it to answer mouse clicks.

import { VIEW_W, VIEW_H, PALETTE, TUNING } from './config.js';

export const lastButtons = [];

function clearButtons() {
  lastButtons.length = 0;
}

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(6, 8, 24, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function card(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 22);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 22);
  ctx.stroke();
}

function title(ctx, text, y, size, color, glow) {
  ctx.font = `800 ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 34;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW_W / 2, y);
  ctx.shadowBlur = 0;
}

function body(ctx, text, y, size, color) {
  ctx.font = `600 ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW_W / 2, y);
}

function button(ctx, label, y, primary) {
  const w = 340;
  const h = 62;
  const x = (VIEW_W - w) / 2;
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  if (primary) {
    grad.addColorStop(0, '#ffd94d');
    grad.addColorStop(1, '#ff9a3d');
  } else {
    grad.addColorStop(0, '#3a2b6e');
    grad.addColorStop(1, '#241a4a');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 31);
  ctx.fill();
  ctx.strokeStyle = primary ? '#fff3c4' : '#8a7bb5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 31);
  ctx.stroke();
  ctx.font = '800 24px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = primary ? '#241a00' : '#e8ecff';
  ctx.fillText(label, VIEW_W / 2, y + 40);
  lastButtons.push({ x, y, w, h, label });
  return { x, y, w, h };
}

function keyLine(ctx, y, key, action) {
  ctx.font = '700 17px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  const label = key + '  —  ' + action;
  const width = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - width / 2 - 14, y - 22, width + 28, 32, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.textBright;
  ctx.fillText(label, VIEW_W / 2, y);
}

export function drawStart(ctx, world) {
  clearButtons();
  dim(ctx, 0.42);
  title(ctx, 'EMBERLIGHT', 208, 92, '#ffd94d', 'rgba(255, 179, 0, 0.8)');
  body(ctx, 'Dawn of the Fireflies', 252, 26, '#fff3c4');
  body(ctx, 'Pip the firefly must gather the last light of the night.', 316, 20, PALETTE.textSoft);
  body(ctx, 'Fill the Dawn Meter three times and the sunrise comes —', 344, 20, PALETTE.textSoft);
  body(ctx, 'but the shadow bats are hungry, and Pip has only three hearts.', 372, 20, PALETTE.textSoft);
  keyLine(ctx, 432, 'MOUSE or WASD / ARROWS', 'guide Pip through the garden');
  keyLine(ctx, 472, 'SPACE', 'dash through danger (it beats a bat)');
  keyLine(ctx, 512, 'GOLD ORBS', 'worth 5 pollen · a missed orb breaks the combo');
  button(ctx, 'BEGIN THE FLIGHT', 556, true);
  body(ctx, 'Press ENTER or click to start  ·  P pauses  ·  M mutes', 656, 16, PALETTE.textSoft);
  if (world.best > 0) {
    body(ctx, 'Best flight so far: ' + world.best.toLocaleString('en-US') + ' points', 688, 17, '#ffd94d');
  }
}

export function drawPaused(ctx, world) {
  clearButtons();
  dim(ctx, 0.55);
  card(ctx, VIEW_W / 2 - 260, 240, 520, 300);
  title(ctx, 'PAUSED', 330, 54, PALETTE.textBright, null);
  body(ctx, 'Score ' + world.score.toLocaleString('en-US') + '  ·  Dawn ' + world.dawn + ' of ' + TUNING.dawnsToWin, 384, 20, PALETTE.textSoft);
  body(ctx, 'Take a breath. The bats will wait.', 420, 18, PALETTE.textSoft);
  button(ctx, 'RESUME  (P)', 452, true);
  body(ctx, 'R restarts the run', 566, 15, PALETTE.textSoft);
}

export function drawWin(ctx, world) {
  clearButtons();
  dim(ctx, 0.35);
  ctx.fillStyle = 'rgba(255, 190, 80, 0.10)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  title(ctx, 'THE SUNRISE CAME', 190, 64, '#ffe066', 'rgba(255, 179, 0, 0.9)');
  body(ctx, 'Three dawns gathered — Pip lit the whole garden.', 244, 24, '#fff3c4');
  card(ctx, VIEW_W / 2 - 300, 300, 600, 210);
  body(ctx, 'YOU WIN', 352, 40, '#ffd94d');
  body(ctx, 'Final score', 402, 18, PALETTE.textSoft);
  ctx.font = '800 58px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.textBright;
  ctx.fillText(world.score.toLocaleString('en-US'), VIEW_W / 2, 462);
  body(ctx, 'Best: ' + world.best.toLocaleString('en-US'), 496, 17, PALETTE.textSoft);
  button(ctx, 'FLY AGAIN  (R)', 552, true);
  body(ctx, 'The garden remembers its brightest firefly.', 656, 16, PALETTE.textSoft);
}

export function drawOver(ctx, world) {
  clearButtons();
  dim(ctx, 0.55);
  title(ctx, 'THE LIGHT WENT OUT', 190, 60, '#ff8fa3', 'rgba(255, 77, 109, 0.7)');
  body(ctx, 'The bats got Pip this time — but dawn is never far away.', 244, 22, PALETTE.textSoft);
  card(ctx, VIEW_W / 2 - 300, 300, 600, 230);
  body(ctx, 'GAME OVER', 352, 40, '#ff8fa3');
  body(ctx, 'Final score', 402, 18, PALETTE.textSoft);
  ctx.font = '800 58px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.textBright;
  ctx.fillText(world.score.toLocaleString('en-US'), VIEW_W / 2, 462);
  body(ctx, 'Dawns lit: ' + world.dawn + ' of ' + TUNING.dawnsToWin + '   ·   Best: ' + world.best.toLocaleString('en-US'), 506, 17, PALETTE.textSoft);
  button(ctx, 'FLY AGAIN  (R)', 566, true);
  body(ctx, 'Tip: dash through a bat instead of around it.', 666, 16, PALETTE.textSoft);
}

export function drawScreen(ctx, world) {
  if (world.mode === 'start') drawStart(ctx, world);
  else if (world.mode === 'paused') drawPaused(ctx, world);
  else if (world.mode === 'win') drawWin(ctx, world);
  else if (world.mode === 'over') drawOver(ctx, world);
}
