# best-game-entry

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/indrairawan4503-cmd/best-game-entry/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/indrairawan4503-cmd/best-game-entry/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Emberlight: guide Pip the firefly through a neon night garden — gather glowing pollen to fill the Dawn Meter three times and summon the sunrise, dodging shadow bats with only three hearts. Keyboard + mouse, synthesized sound, no network.

## Run it

```sh
cd game && python3 -m http.server 8321
# then open http://localhost:8321/index.html
```

## About this entry

**Emberlight — Dawn of the Fireflies** is a complete arcade game in static files under `game/` (no build step, no network requests, no libraries): a goal (fill the Dawn Meter three times to win), rules (a missed orb breaks the combo, a bat costs a heart, three hearts lost ends the run), responsive keyboard + mouse controls (WASD/arrows or pointer, SPACE to dash, P to pause, M to mute, R to restart), a HUD (score, combo, hearts, Dawn Meter, dash cooldown), a start screen, a pause card, a win screen and a game-over screen — and synthesized WebAudio sound throughout.

- `game/src/config.js` — tuning, palette, seeded random
- `game/src/audio.js` — WebAudio sound engine
- `game/src/input.js` — keyboard + pointer input
- `game/src/entities.js` — player, orbs, bats, particles, motes
- `game/src/world.js` — game state, spawning, collisions, scoring, dawns
- `game/src/render.js` — all canvas drawing + HUD
- `game/src/screens.js` — title, pause, win and game-over overlays
- `game/src/main.js` — bootstrap, frame loop, screenshot states

Screenshots in `screenshots/` are real renders of the game's own code (`?shot=start|play|win|over`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=8dxq9bq0&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
