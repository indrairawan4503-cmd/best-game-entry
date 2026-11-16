// Emberlight — every sound is synthesized live with WebAudio.
// No audio files: a handful of tiny oscillators and envelopes cover the
// whole game (collect blips that climb with the combo, hits, dawn chimes,
// the win fanfare and the dash whoosh). Silent until the first gesture.

export class SoundEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = 0;
    this.musicStep = 0;
  }

  // Browsers only let audio start after a user gesture; call from any
  // click or key press and from the first frame that has one.
  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.master.gain.value = 0.42;
      this.master.connect(this.context.destination);
    } catch (err) {
      this.context = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.42;
    return this.muted;
  }

  tone(freq, seconds, kind, volume, slideTo, delay) {
    if (!this.context || this.muted) return;
    const when = this.context.currentTime + (delay || 0);
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = kind || 'sine';
    osc.frequency.setValueAtTime(freq, when);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, when + seconds);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume || 0.2, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(when);
    osc.stop(when + seconds + 0.05);
  }

  // The collect blip climbs a little with every step of the combo.
  collect(combo) {
    const step = Math.min(combo || 1, 12);
    const base = 540 * Math.pow(1.0595, step);
    this.tone(base, 0.14, 'sine', 0.22, base * 1.5);
    this.tone(base * 2, 0.1, 'triangle', 0.08, base * 2.4);
  }

  collectGold() {
    [660, 830, 990, 1320].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.16, null, i * 0.05));
  }

  hit() {
    this.tone(140, 0.28, 'sawtooth', 0.3, 55);
    this.tone(70, 0.32, 'square', 0.18, 40);
  }

  dash() {
    this.tone(320, 0.18, 'sine', 0.14, 920);
  }

  click() {
    this.tone(880, 0.06, 'triangle', 0.12);
  }

  dawn() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.16, null, i * 0.09));
    this.tone(262, 0.7, 'triangle', 0.1, null, 0.05);
  }

  win() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
      this.tone(f, 0.42, 'triangle', 0.18, null, i * 0.13));
  }

  lose() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.16, null, i * 0.16));
  }

  // A slow two-note firefly pad that drifts under play; called from the
  // main loop with the frame delta so it stays in time with the game.
  updateMusic(dt, playing) {
    if (!this.context || this.muted || !playing) return;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    this.musicTimer = 0.9;
    const scale = [220, 261.6, 293.7, 329.6, 392, 440];
    const note = scale[this.musicStep % scale.length];
    this.musicStep += 1;
    this.tone(note, 0.85, 'sine', 0.035);
    if (this.musicStep % 4 === 0) this.tone(note / 2, 1.4, 'sine', 0.03);
  }
}
