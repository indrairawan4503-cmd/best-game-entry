// Emberlight — the things that live in the garden: the firefly player,
// the pollen and golden orbs she gathers, the shadow bats she dodges,
// the sparkle particles every event throws off, and the ambient motes
// that drift behind the title screen. Plain objects, no classes: the
// world owns the lists and the renderer owns the drawing.

import { VIEW_W, VIEW_H, TUNING } from './config.js';

export function makePlayer() {
  return {
    x: VIEW_W / 2,
    y: VIEW_H * 0.62,
    vx: 0,
    vy: 0,
    r: TUNING.playerRadius,
    angle: -Math.PI / 2,
    trail: [],
    invuln: 0,
    dashTime: 0,
    dashCooldown: 0,
    dashDirX: 0,
    dashDirY: -1,
    glowPulse: 0,
  };
}

export function makeOrb(kind, rng, dawnLevel) {
  const gold = kind === 'gold';
  const fall = TUNING.orbFallMin + rng() * (TUNING.orbFallMax - TUNING.orbFallMin);
  const speed = fall * (1 + TUNING.difficultyPerDawn * dawnLevel);
  return {
    kind,
    x: 60 + rng() * (VIEW_W - 120),
    y: -30 - rng() * 90,
    vy: speed,
    sway: rng() * Math.PI * 2,
    swaySpeed: 0.8 + rng() * 1.4,
    swayAmp: 14 + rng() * 26,
    r: gold ? TUNING.goldRadius : TUNING.orbRadius,
    value: gold ? TUNING.goldScore : TUNING.pollenScore,
    meter: gold ? TUNING.meterPerGold : TUNING.meterPerPollen,
    spin: rng() * Math.PI * 2,
    dead: false,
  };
}

export function makeBat(rng, dawnLevel) {
  const fromLeft = rng() < 0.5;
  const speed = TUNING.batSpeedMin + rng() * (TUNING.batSpeedMax - TUNING.batSpeedMin);
  const boosted = speed * (1 + TUNING.difficultyPerDawn * dawnLevel * 0.7);
  const startY = 90 + rng() * (VIEW_H * 0.55);
  return {
    x: fromLeft ? -50 : VIEW_W + 50,
    y: startY,
    vx: (fromLeft ? 1 : -1) * boosted,
    vy: 0,
    baseY: startY,
    bobPhase: rng() * Math.PI * 2,
    bobSpeed: 2.2 + rng() * 2.0,
    bobAmp: 26 + rng() * 30,
    r: TUNING.batRadius,
    flap: rng() * Math.PI * 2,
    dead: false,
  };
}

export function makeParticle(x, y, color, count, speed, life) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const vel = speed * (0.3 + Math.random() * 0.7);
    parts.push({
      x,
      y,
      vx: Math.cos(angle) * vel,
      vy: Math.sin(angle) * vel - speed * 0.25,
      r: 1.5 + Math.random() * 3,
      color,
      life: life * (0.6 + Math.random() * 0.4),
      maxLife: life,
    });
  }
  return parts;
}

export function makeMote(rng) {
  return {
    x: rng() * VIEW_W,
    y: rng() * VIEW_H,
    r: 1 + rng() * 2.4,
    drift: 6 + rng() * 14,
    phase: rng() * Math.PI * 2,
    pulse: 0.6 + rng() * 1.8,
    hue: rng() < 0.75 ? '255, 217, 77' : '150, 200, 255',
  };
}
