#!/usr/bin/env node
/**
 * px2ansi.js — PNG → ANSI strings for Companion.tsx
 *
 * Uses half-block technique (▄ with fg+bg truecolor) for 2× vertical resolution.
 * No palette snapping needed — uses raw RGB from the image.
 *
 * Usage:
 *   node scripts/px2ansi.js <image.png> [options]
 *
 * Options:
 *   --width  <n>        Target pixel width  (default: 20)
 *   --height <n>        Target pixel height (default: 30, must be even)
 *   --threshold <0-255> Alpha threshold for transparency (default: 30)
 *   --preview           Render sprite directly to terminal (no code output)
 *
 * Example:
 *   node scripts/px2ansi.js nain-removebg-preview.png --preview
 *   node scripts/px2ansi.js nain-removebg-preview.png --width 20 --height 30 > out.txt
 */

import sharp from 'sharp';

// ─── Args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const imgPath = args[0];

if (!imgPath) {
  console.error('Usage: node scripts/px2ansi.js <image.png> [--width N] [--height N] [--preview]');
  process.exit(1);
}

function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : fallback;
}

const targetW    = parseInt(getArg('--width', '20'), 10);
const targetH    = parseInt(getArg('--height', '30'), 10) & ~1; // force even
const alphaThres = parseInt(getArg('--threshold', '30'), 10);
const preview    = args.includes('--preview');
const annotate   = args.includes('--annotate'); // prefix each row with its index
const eyeRow     = args.includes('--eye-row') ? parseInt(getArg('--eye-row', '-1'), 10) : -1;

// ─── ANSI helpers ──────────────────────────────────────────────────────────

// Raw ANSI truecolor — used for preview and for code output strings
function ansiRgb(r, g, b, bg = false) {
  return `\x1b[${bg ? 48 : 38};2;${r};${g};${b}m`;
}
const RESET = '\x1b[0m';

// chalk.bgHex + chalk.hex expression for code output
function chalkExpr(topRgb, botRgb) {
  const top = topRgb ? `'#${toHex(...topRgb)}'` : null;
  const bot = botRgb ? `'#${toHex(...botRgb)}'` : null;

  if (!top && !bot) return `' '`;
  if (!top && bot)  return `chalk.hex(${bot})('▄')`;
  if (top && !bot)  return `chalk.bgHex(${top}).hex(${top})('▀')`;
  // both opaque — bg = top color, fg = bottom color, char = ▄
  return `chalk.bgHex(${top}).hex(${bot})('▄')`;
}

function toHex(r, g, b) {
  return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ─── Read + resize (height×2 so each terminal row covers 2 pixel rows) ─────

process.stderr.write(`⚒  ${imgPath} → ${targetW}×${targetH * 2}px raw  →  ${targetW}×${targetH} terminal rows\n`);

const { data, info } = await sharp(imgPath)
  .resize(targetW, targetH * 2, {
    kernel: 'lanczos3',       // better quality for photo sources
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height } = info;

// ─── Build terminal rows (pairs of pixel rows) ─────────────────────────────

function getPixel(x, y) {
  const i = (y * width + x) * 4;
  const a = data[i + 3];
  if (a < alphaThres) return null;
  return [data[i], data[i + 1], data[i + 2]];
}

// Each terminal row covers pixel rows (y*2) and (y*2+1)
const termRows = [];
for (let row = 0; row < height / 2; row++) {
  const cells = [];
  for (let x = 0; x < width; x++) {
    const top = getPixel(x, row * 2);
    const bot = getPixel(x, row * 2 + 1);
    cells.push({ top, bot });
  }
  termRows.push(cells);
}

// ─── Preview mode ──────────────────────────────────────────────────────────

if (preview) {
  process.stderr.write('\n');
  for (let rowIdx = 0; rowIdx < termRows.length; rowIdx++) {
    const cells = termRows[rowIdx];
    let line = '';
    for (const { top, bot } of cells) {
      if (!top && !bot) {
        line += ' ';
      } else if (!top && bot) {
        line += ansiRgb(...bot) + '▄' + RESET;
      } else if (top && !bot) {
        line += ansiRgb(...top, true) + ansiRgb(...top) + '▀' + RESET;
      } else {
        line += ansiRgb(...top, true) + ansiRgb(...bot) + '▄' + RESET;
      }
    }
    const prefix = annotate ? `\x1b[90m${String(rowIdx).padStart(3, ' ')} \x1b[0m` : '';
    process.stderr.write(prefix + line + '\n');
  }
  process.stderr.write('\n');
  process.exit(0);
}

// ─── Code output mode ──────────────────────────────────────────────────────

// Trim fully-transparent top/bottom rows
let top = 0, bot = termRows.length - 1;
const allTransparent = (cells) => cells.every(({ top: t, bot: b }) => !t && !b);
while (top <= bot && allTransparent(termRows[top])) top++;
while (bot >= top && allTransparent(termRows[bot])) bot--;
const trimmed = termRows.slice(top, bot + 1);

// Detect dominant opaque color in a terminal row (for eye row skin tone)
function dominantColor(cells) {
  const freq = new Map();
  for (const { top, bot } of cells) {
    for (const px of [top, bot]) {
      if (!px) continue;
      const key = toHex(...px);
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
  }
  let best = null, bestN = 0;
  for (const [hex, n] of freq) {
    if (n > bestN) { bestN = n; best = hex; }
  }
  return best;
}

// Adjust eye row index relative to trimmed slice
const eyeRowTrimmed = eyeRow >= 0 ? eyeRow - top : -1;
const skinHex = eyeRowTrimmed >= 0 && eyeRowTrimmed < trimmed.length
  ? dominantColor(trimmed[eyeRowTrimmed])
  : null;

console.log('// Auto-generated by scripts/px2ansi.js (half-block technique)');
console.log(`// Source: ${imgPath} → ${targetW}×${targetH * 2}px → ${trimmed.length} terminal rows`);
console.log('// Requires: import chalk from \'chalk\'');
if (skinHex) {
  console.log(`// Eye row: ${eyeRowTrimmed}  |  dominant face color: #${skinHex}`);
  console.log('//');
  console.log('// eyeLine(state) template — paste into Companion.tsx:');
  console.log('// function eyeLine(state: CompanionState): string {');
  console.log(`//   const skin = chalk.bgHex('#${skinHex}');`);
  console.log('//   const { sym, color } = EYE_CFG[state];');
  console.log(`//   const pad = ' '.repeat(${Math.floor((targetW - 10) / 2)});`);
  console.log('//   return skin(pad) + skin.hex(color.hex ?? \'#ffffff\')(sym + \'  \' + sym) + skin(pad);');
  console.log('// }');
}
console.log('');
console.log('const SPRITE_LINES: string[] = [');

for (let r = 0; r < trimmed.length; r++) {
  const comma = r < trimmed.length - 1 ? ',' : '';

  // Replace eye row with dynamic placeholder
  if (r === eyeRowTrimmed) {
    console.log(`  eyeLine(state)${comma} // ← eye row ${eyeRow}`);
    continue;
  }

  const cells = trimmed[r];
  const parts = [];
  let i = 0;
  while (i < cells.length) {
    const { top: t, bot: b } = cells[i];
    let j = i + 1;
    while (
      j < cells.length &&
      JSON.stringify(cells[j].top) === JSON.stringify(t) &&
      JSON.stringify(cells[j].bot) === JSON.stringify(b)
    ) j++;
    const count = j - i;
    const expr = chalkExpr(t, b);
    if (expr === `' '`) {
      parts.push(`' '.repeat(${count})`);
    } else if (count === 1) {
      parts.push(expr);
    } else {
      for (let k = 0; k < count; k++) parts.push(expr);
    }
    i = j;
  }
  console.log(`  ${parts.join(' + ')}${comma}`);
}

console.log('];');
process.stderr.write(`\nDone — ${trimmed.length} terminal rows (${targetW} cols). Eye row: ${eyeRowTrimmed} (skin: #${skinHex ?? 'n/a'})\n`);
