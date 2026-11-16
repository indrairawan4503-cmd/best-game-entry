// Emberlight — the hand-in program (Node 22, standard library only).
// It gathers this repository's game/ and screenshots/ and writes them
// to /output (or $MAKEFUN_OUTPUT_DIR outside the grader), together
// with /output/dossier.json, the summary the judge reads, built by the
// vendored make.fun library. The program runs twice and must write
// identical bytes both times, so it copies only what is on disk and
// never stamps a time or a random value into the output.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps for this bounty: only text_max_bytes shapes
// the dossier's bytes; the rest refuse an entry the scorer would
// refuse, so the program refuses it first with a clear message.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(from, to) {
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

function handIn() {
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  copyTree(join(repoRoot, 'game'), join(destination, 'game'));
  copyTree(join(repoRoot, 'screenshots'), join(destination, 'screenshots'));
  const dossier = buildDossier(destination, DOSSIER_LIMITS);
  writeFileSync(join(destination, 'dossier.json'), dossier);
  return dossier.length;
}

const dossierBytes = handIn();
console.log(`Emberlight handed in: dossier.json is ${dossierBytes} bytes.`);
