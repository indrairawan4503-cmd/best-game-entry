// Emberlight — the world: one object owns the whole game state and
// advances it a frame at a time. It spawns pollen and bats, moves the
// firefly, resolves every catch and every hit, fills the Dawn Meter,
// and decides when the run is won (three dawns, the sunrise arrives)
// or lost (no hearts left). It also builds the four deterministic
// screenshot states the maker renders with ?shot=.

import { VIEW_W, VIEW_H, TUNING, clamp, mulberry32 } from './config.js';
import { makePlayer, makeOrb, makeBat, makeParticle, makeMote } from './entities.js';

const STORE_KEY = 'emberlight-best';

export class World {
  constructor(seed) {
    this.rng = mulberry32(seed || 20261117);
    this.best = 0;
    try {
      this.best = Number(window.localStorage.getItem(STORE_KEY)) || 0;
    } catch (err) {
      this.best = 0;
    }
    this.motes = [];
    for (let i = 0; i < 42; i++) this.motes.push(makeMote(this.rng));
    this.reset();
    this.mode = 'start';
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.hearts = TUNING.hearts;
    this.dawn = 0;
    this.meter = 0;
    this.time = 0;
    this.orbTimer = 0.4;
    this.batTimer = 2.2;
    this.shake = 0;
    this.flash = 0;
    this.winShown = false;
    this.player = makePlayer();
    this.orbs = [];
    this.bats = [];
    this.particles = [];
  }

  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      try {
        window.localStorage.setItem(STORE_KEY, String(this.best));
      } catch (err) {
        // Best score is a nicety; a blocked store must never break play.
      }
    }
  }

  startGame() {
    this.reset();
    this.mode = 'playing';
  }

  comboMultiplier() {
    return Math.min(1 + Math.max(0, this.combo - 1) * TUNING.comboStep, TUNING.comboCap);
  }

  // One frame. Input and sound are handed in so this file never touches
  // the DOM or the audio device itself.
  update(dt, input, sound) {
    this.time += dt;
    this.updateMotes(dt);
    this.updateParticles(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.4);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.8);
    if (this.mode === 'start') return this.updateStart(dt, input, sound);
    if (this.mode === 'playing') return this.updatePlaying(dt, input, sound);
    if (this.mode === 'paused') return this.updatePaused(dt, input, sound);
    return this.updateEnd(dt, input, sound);
  }

  updateMotes(dt) {
    for (const mote of this.motes) {
      mote.phase += dt * mote.pulse;
      mote.y -= mote.drift * dt;
      if (mote.y < -8) {
        mote.y = VIEW_H + 8;
        mote.x = this.rng() * VIEW_W;
      }
    }
  }

  updateParticles(dt) {
    for (const part of this.particles) {
      part.life -= dt;
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.vy += 26 * dt;
    }
    this.particles = this.particles.filter((part) => part.life > 0);
  }

  updateStart(dt, input, sound) {
    // A slow drift of pollen behind the title keeps it alive.
    this.orbTimer -= dt;
    if (this.orbTimer <= 0 && this.orbs.length < 9) {
      this.orbTimer = 0.7;
      const orb = makeOrb('pollen', this.rng, 0);
      orb.y = VIEW_H + 20;
      orb.vy = -26 - this.rng() * 20;
      this.orbs.push(orb);
    }
    for (const orb of this.orbs) {
      orb.y += orb.vy * dt;
      orb.sway += dt * orb.swaySpeed;
      orb.x += Math.sin(orb.sway) * 12 * dt;
    }
    this.orbs = this.orbs.filter((orb) => orb.y > -60);
    if (input.anyOf(['Enter', 'Space']) || input.takeClick()) {
      sound.unlock();
      sound.click();
      this.startGame();
    }
  }

  updatePlaying(dt, input, sound) {
    const player = this.player;
    if (input.tapped('KeyP') || input.tapped('Escape')) {
      this.mode = 'paused';
      return;
    }
    if (input.tapped('KeyM')) sound.toggleMute();

    // --- movement: keys accelerate, pointer pulls, dash overrides both.
    const move = input.moveVector();
    if (player.dashTime > 0) {
      player.dashTime -= dt;
      player.vx = player.dashDirX * TUNING.dashSpeed;
      player.vy = player.dashDirY * TUNING.dashSpeed;
    } else if (move.x !== 0 || move.y !== 0) {
      player.vx += move.x * TUNING.playerAccel * dt;
      player.vy += move.y * TUNING.playerAccel * dt;
      const speed = Math.hypot(player.vx, player.vy);
      if (speed > TUNING.playerMaxSpeed) {
        player.vx = (player.vx / speed) * TUNING.playerMaxSpeed;
        player.vy = (player.vy / speed) * TUNING.playerMaxSpeed;
      }
    } else if (input.pointerFresh(this.time)) {
      const scale = input.pointerScale || 1;
      const px = (input.pointer.x - (input.pointerOffsetX || 0)) / scale;
      const py = (input.pointer.y - (input.pointerOffsetY || 0)) / scale;
      player.vx = (px - player.x) * TUNING.pointerEase;
      player.vy = (py - player.y) * TUNING.pointerEase;
    } else {
      const drag = Math.exp(-TUNING.playerFriction * dt);
      player.vx *= drag;
      player.vy *= drag;
    }
    if (input.tapped('Space') && player.dashCooldown <= 0) {
      player.dashCooldown = TUNING.dashCooldown;
      player.dashTime = TUNING.dashTime;
      const dir = move.x !== 0 || move.y !== 0 ? move : { x: 0, y: -1 };
      const len = Math.hypot(dir.x, dir.y) || 1;
      player.dashDirX = dir.x / len;
      player.dashDirY = dir.y / len;
      this.particles.push(...makeParticle(player.x, player.y, '#ffe066', 10, 190, 0.5));
      sound.dash();
    }
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.x = clamp(player.x + player.vx * dt, 24, VIEW_W - 24);
    player.y = clamp(player.y + player.vy * dt, 24, VIEW_H - 24);
    if (Math.hypot(player.vx, player.vy) > 40) {
      player.angle = Math.atan2(player.vy, player.vx);
    }
    player.glowPulse += dt;
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > TUNING.trailLength) player.trail.shift();

    // --- combo decay: let one orb slip past and the chain breaks.
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    this.spawn(dt);
    this.updateOrbs(dt);
    this.updateBats(dt);
    this.collide(sound);
    sound.updateMusic(dt, true);
  }

  spawn(dt) {
    this.orbTimer -= dt;
    if (this.orbTimer <= 0) {
      this.orbTimer = TUNING.spawnOrbEvery / (1 + TUNING.difficultyPerDawn * this.dawn);
      const kind = this.rng() < TUNING.goldChance ? 'gold' : 'pollen';
      this.orbs.push(makeOrb(kind, this.rng, this.dawn));
    }
    this.batTimer -= dt;
    if (this.batTimer <= 0) {
      this.batTimer =
        TUNING.spawnBatEvery / (1 + TUNING.difficultyPerDawn * this.dawn * 0.8);
      this.bats.push(makeBat(this.rng, this.dawn));
    }
  }

  updateOrbs(dt) {
    for (const orb of this.orbs) {
      orb.y += orb.vy * dt;
      orb.sway += dt * orb.swaySpeed;
      orb.x += Math.sin(orb.sway) * 18 * dt;
      orb.spin += dt * 2;
      if (orb.y > VIEW_H + 40) {
        orb.dead = true;
        if (this.combo > 0) this.combo = 0;
      }
    }
    this.orbs = this.orbs.filter((orb) => !orb.dead);
  }

  updateBats(dt) {
    for (const bat of this.bats) {
      bat.x += bat.vx * dt;
      bat.flap += dt * 14;
      bat.y = bat.baseY + Math.sin(this.time * bat.bobSpeed + bat.bobPhase) * bat.bobAmp;
      if (bat.x < -90 || bat.x > VIEW_W + 90) bat.dead = true;
    }
    this.bats = this.bats.filter((bat) => !bat.dead);
  }

  collide(sound) {
    const player = this.player;
    for (const orb of this.orbs) {
      const dx = orb.x - player.x;
      const dy = orb.y - player.y;
      const reach = orb.r + player.r + 6;
      if (dx * dx + dy * dy < reach * reach) {
        orb.dead = true;
        this.combo += 1;
        this.comboTimer = TUNING.comboWindow;
        const gained = Math.round(orb.value * this.comboMultiplier());
        this.score += gained;
        this.meter = Math.min(100, this.meter + orb.meter);
        this.particles.push(
          ...makeParticle(orb.x, orb.y, orb.kind === 'gold' ? '#ffb300' : '#ffd94d', 12, 170, 0.55),
        );
        if (orb.kind === 'gold') sound.collectGold();
        else sound.collect(this.combo);
        if (this.meter >= 100) this.nextDawn(sound);
      }
    }
    this.orbs = this.orbs.filter((orb) => !orb.dead);
    if (player.invuln > 0 || player.dashTime > 0) return;
    for (const bat of this.bats) {
      const dx = bat.x - player.x;
      const dy = bat.y - player.y;
      const reach = bat.r + player.r - 6;
      if (dx * dx + dy * dy < reach * reach) {
        bat.dead = true;
        this.hearts -= 1;
        this.combo = 0;
        this.comboTimer = 0;
        player.invuln = TUNING.invulnTime;
        this.shake = 1;
        this.particles.push(...makeParticle(player.x, player.y, '#ff4d6d', 18, 260, 0.7));
        sound.hit();
        if (this.hearts <= 0) {
          this.saveBest();
          this.mode = 'over';
          sound.lose();
        }
        break;
      }
    }
    this.bats = this.bats.filter((bat) => !bat.dead);
  }

  nextDawn(sound) {
    this.dawn += 1;
    this.meter = 0;
    this.score += TUNING.dawnBonus;
    this.flash = 1;
    this.particles.push(
      ...makeParticle(this.player.x, this.player.y, '#fff3c4', 26, 320, 0.9),
    );
    if (this.dawn >= TUNING.dawnsToWin) {
      this.saveBest();
      this.mode = 'win';
      sound.win();
    } else {
      sound.dawn();
    }
  }

  updatePaused(dt, input, sound) {
    if (input.tapped('KeyP') || input.tapped('Escape') || input.tapped('Enter')) {
      this.mode = 'playing';
      sound.click();
    }
    if (input.tapped('KeyR')) {
      sound.click();
      this.startGame();
    }
  }

  updateEnd(dt, input, sound) {
    if (input.tapped('KeyR') || input.tapped('Enter') || input.takeClick()) {
      sound.unlock();
      sound.click();
      this.startGame();
    }
  }

  // Deterministic states for the screenshots: same seed, same picture.
  // The live loop keeps animating behind them, so a shot is a real
  // render of the game's own code, not a still image.
  toShot(name) {
    const rng = mulberry32(4242);
    this.rng = rng;
    this.reset();
    if (name === 'start') {
      this.mode = 'start';
      for (let i = 0; i < 7; i++) {
        const orb = makeOrb(i === 3 ? 'gold' : 'pollen', rng, 0);
        orb.x = 150 + i * 150 + rng() * 40;
        orb.y = 180 + rng() * 420;
        orb.vy = 0;
        this.orbs.push(orb);
      }
      return;
    }
    if (name === 'play') {
      this.mode = 'playing';
      this.score = 1240;
      this.combo = 6;
      this.comboTimer = TUNING.comboWindow;
      this.hearts = 2;
      this.dawn = 1;
      this.meter = 62;
      this.player.x = 640;
      this.player.y = 470;
      this.player.vx = 120;
      this.player.vy = -60;
      this.player.angle = -0.4;
      for (let i = 0; i < 12; i++) {
        this.player.trail.push({ x: 640 - i * 9, y: 470 + i * 5 });
      }
      const spots = [
        [420, 210, 'pollen'], [700, 150, 'pollen'], [880, 260, 'gold'],
        [300, 380, 'pollen'], [980, 430, 'pollen'], [560, 330, 'pollen'],
        [760, 520, 'pollen'], [220, 560, 'pollen'], [1080, 300, 'pollen'],
      ];
      for (const [x, y, kind] of spots) {
        const orb = makeOrb(kind, rng, 1);
        orb.x = x;
        orb.y = y;
        this.orbs.push(orb);
      }
      const batA = makeBat(rng, 1);
      batA.x = 240;
      batA.baseY = 300;
      batA.y = 300;
      batA.vx = 170;
      const batB = makeBat(rng, 1);
      batB.x = 1050;
      batB.baseY = 620;
      batB.y = 620;
      batB.vx = -190;
      this.bats.push(batA, batB);
      this.particles.push(...makeParticle(700, 150, '#ffd94d', 8, 120, 0.8));
      return;
    }
    if (name === 'win') {
      this.mode = 'win';
      this.score = 5240;
      this.dawn = TUNING.dawnsToWin;
      this.meter = 100;
      this.hearts = 2;
      this.best = 5240;
      this.flash = 0.25;
      return;
    }
    // 'over' and anything unknown: the game-over screen.
    this.mode = 'over';
    this.score = 1870;
    this.dawn = 1;
    this.meter = 48;
    this.hearts = 0;
    this.best = 5240;
  }
}
