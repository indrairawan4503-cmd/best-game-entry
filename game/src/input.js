// Emberlight — keyboard and pointer input in one place.
// The game reads keys by code (WASD and arrows move, Space dashes,
// P pauses, M mutes, R restarts, Enter starts) and follows the pointer
// while it is down or has moved recently. Edge presses are consumed
// once per frame so a single tap never fires twice.

export class Input {
  constructor(canvas) {
    this.down = new Set();
    this.pressed = new Set();
    this.pointer = { x: 0, y: 0, inside: false, movedAt: -10, clicked: false, clickX: 0, clickY: 0 };
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.down.add(event.code);
      this.pressed.add(event.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => this.down.delete(event.code));
    window.addEventListener('blur', () => {
      this.down.clear();
      this.pointer.inside = false;
    });

    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = event.clientX - rect.left;
      this.pointer.y = event.clientY - rect.top;
      this.pointer.inside = true;
      this.pointer.movedAt = performance.now() / 1000;
    });
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = event.clientX - rect.left;
      this.pointer.y = event.clientY - rect.top;
      this.pointer.inside = true;
      this.pointer.clicked = true;
      this.pointer.clickX = this.pointer.x;
      this.pointer.clickY = this.pointer.y;
      this.pointer.movedAt = performance.now() / 1000;
    });
    canvas.addEventListener('pointerleave', () => {
      this.pointer.inside = false;
    });
  }

  held(code) {
    return this.down.has(code);
  }

  // True once for the frame the key went down, then consumed.
  tapped(code) {
    return this.pressed.has(code);
  }

  anyOf(codes) {
    return codes.some((code) => this.pressed.has(code));
  }

  moveVector() {
    let x = 0;
    let y = 0;
    if (this.held('ArrowLeft') || this.held('KeyA')) x -= 1;
    if (this.held('ArrowRight') || this.held('KeyD')) x += 1;
    if (this.held('ArrowUp') || this.held('KeyW')) y -= 1;
    if (this.held('ArrowDown') || this.held('KeyS')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  pointerFresh(secondsNow) {
    return this.pointer.inside && secondsNow - this.pointer.movedAt < 2.5;
  }

  takeClick() {
    if (!this.pointer.clicked) return null;
    this.pointer.clicked = false;
    return { x: this.pointer.clickX, y: this.pointer.clickY };
  }

  endFrame() {
    this.pressed.clear();
  }
}
