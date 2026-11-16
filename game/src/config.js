// Emberlight — tuning, palette and the seeded random source.
// One job: every number the rest of the game agrees on lives here.

export const VIEW_W = 1280;
export const VIEW_H = 800;

export const PALETTE = {
  skyTop: '#0b1030',
  skyMid: '#1a1446',
  skyLow: '#3b1d5e',
  horizonGlow: '#ff9a3d',
  grassDark: '#0d2417',
  grassMid: '#123524',
  grassLight: '#1d4d33',
  pollen: '#ffd94d',
  pollenCore: '#fff6bf',
  gold: '#ffb300',
  goldCore: '#fff3c4',
  bat: '#2a2140',
  batWing: '#4a3a72',
  batEye: '#ff4d6d',
  player: '#ffe066',
  playerCore: '#fffbe0',
  playerGlow: '#ffcf3d',
  heart: '#ff5d7a',
  heartEmpty: '#3a2b4d',
  hudPanel: 'rgba(10, 12, 34, 0.62)',
  hudBorder: 'rgba(255, 217, 77, 0.45)',
  textBright: '#fff8d6',
  textSoft: '#c9c2f0',
  dawnFill: '#ffb300',
  danger: '#ff4d6d',
  panel: 'rgba(12, 14, 40, 0.82)',
  panelEdge: '#ffd94d',
};

export const TUNING = {
  playerRadius: 15,
  playerAccel: 3400,
  playerMaxSpeed: 460,
  playerFriction: 6.5,
  pointerEase: 14,
  dashSpeed: 980,
  dashTime: 0.16,
  dashCooldown: 1.6,
  invulnTime: 1.4,
  hearts: 3,
  dawnsToWin: 3,
  meterPerPollen: 7,
  meterPerGold: 25,
  pollenScore: 10,
  goldScore: 50,
  dawnBonus: 250,
  comboWindow: 2.6,
  comboStep: 0.5,
  comboCap: 5,
  orbFallMin: 62,
  orbFallMax: 118,
  orbRadius: 11,
  goldRadius: 14,
  batSpeedMin: 130,
  batSpeedMax: 210,
  batRadius: 20,
  spawnOrbEvery: 0.62,
  spawnBatEvery: 2.6,
  goldChance: 0.09,
  difficultyPerDawn: 0.22,
  trailLength: 14,
};

// Deterministic random source for screenshot states and for the run itself.
// A tiny mulberry32: same seed, same stream, every browser.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
