// Emberlight — entrypoint. It sizes the canvas to the window with a
// fixed 1280x800 playfield letterboxed inside it, wires input, audio
// and the world together, runs the frame loop, and answers clicks on
// the screens' buttons. A ?shot=start|play|win|over parameter picks
// one of the deterministic states the maker screenshots.

import { VIEW_W, VIEW_H } from './config.js';
import { World } from './world.js';
import { Input } from './input.js';
import { SoundEngine } from './audio.js';
import { drawWorld } from './render.js';
import { drawScreen, lastButtons } from './screens.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 20261117);

const world = new World(seed);
const input = new Input(canvas);
const sound = new SoundEngine();

let scale = 1;
let offsetX = 0;
let offsetY = 0;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  scale = Math.min(cssW / VIEW_W, cssH / VIEW_H);
  offsetX = (cssW - VIEW_W * scale) / 2;
  offsetY = (cssH - VIEW_H * scale) / 2;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
  input.pointerScale = scale;
  input.pointerOffsetX = offsetX;
  input.pointerOffsetY = offsetY;
}

window.addEventListener('resize', resize);
resize();

if (shot) world.toShot(shot);

function hitButton(click) {
  const logicalX = (click.x - offsetX) / scale;
  const logicalY = (click.y - offsetY) / scale;
  for (const btn of lastButtons) {
    if (
      logicalX >= btn.x && logicalX <= btn.x + btn.w &&
      logicalY >= btn.y && logicalY <= btn.y + btn.h
    ) {
      return btn;
    }
  }
  return null;
}

function announce() {
  if (!status) return;
  const lines = {
    start: 'Emberlight. Press Enter to begin the flight.',
    playing: `Score ${world.score}. Dawn ${world.dawn} of 3. ${world.hearts} hearts.`,
    paused: 'Paused.',
    win: `You win. Final score ${world.score}.`,
    over: `Game over. Final score ${world.score}.`,
  };
  status.textContent = lines[world.mode] || '';
}

let lastMode = world.mode;
let lastTime = performance.now();

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;

  const click = input.takeClick();
  if (click) {
    sound.unlock();
    if (world.mode === 'start' || world.mode === 'win' || world.mode === 'over') {
      // Any click on a title or end screen starts a fresh flight.
      sound.click();
      world.startGame();
    } else if (world.mode === 'paused' && hitButton(click)) {
      sound.click();
      world.mode = 'playing';
    }
  }
  if (input.tapped('KeyM') && world.mode !== 'playing') sound.toggleMute();

  world.update(dt, input, sound);
  drawWorld(ctx, world, sound.muted);
  drawScreen(ctx, world);

  if (world.mode !== lastMode) {
    lastMode = world.mode;
    announce();
  }
  input.endFrame();
  requestAnimationFrame(frame);
}

announce();
requestAnimationFrame(frame);
