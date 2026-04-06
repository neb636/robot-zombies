#!/usr/bin/env node
/**
 * extract-sprites.js
 *
 * Scans sprite sheet PNGs, detects individual sprites via connected-component
 * analysis on non-transparent pixels, and saves each as a separate PNG.
 *
 * Usage:  node scripts/extract-sprites.js --src <dir> --out <dir> [--gap N] [--min-size N]
 *
 *   --src       source directory containing sprite sheet PNGs (required)
 *   --out       output directory for extracted sprites (required)
 *   --gap       pixel gap to bridge between nearby opaque regions (default: 2)
 *   --min-size  ignore components smaller than NxN pixels (default: 6)
 *
 * Example:
 *   node scripts/extract-sprites.js --src bought-packs/pixel-world-pack/Interior --out extracted-assets/Interior
 */

import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { join, basename, extname, relative } from 'node:path';

// ── Config ──────────────────────────────────────────────────────────────────

const ALPHA_THRESHOLD = 10;   // pixels with alpha <= this are "transparent"

const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
}
function flagNum(name, def) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : def;
}

const SRC_DIR  = flag('src', null);
const OUT_DIR  = flag('out', null);
const GAP      = flagNum('gap', 2);
const MIN_SIZE = flagNum('min-size', 6);

if (!SRC_DIR || !OUT_DIR) {
  console.error('Usage: node scripts/extract-sprites.js --src <dir> --out <dir> [--gap N] [--min-size N]');
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively collect all .png files under dir (skipping .unitypackage etc.) */
async function collectPngs(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...await collectPngs(full));
    } else if (extname(e.name).toLowerCase() === '.png') {
      results.push(full);
    }
  }
  return results;
}

/**
 * Union-Find for connected component labelling.
 */
class UnionFind {
  constructor(n) { this.parent = Array.from({ length: n }, (_, i) => i); this.rank = new Uint8Array(n); }
  find(x) { while (this.parent[x] !== x) { this.parent[x] = this.parent[this.parent[x]]; x = this.parent[x]; } return x; }
  union(a, b) {
    a = this.find(a); b = this.find(b);
    if (a === b) return;
    if (this.rank[a] < this.rank[b]) [a, b] = [b, a];
    this.parent[b] = a;
    if (this.rank[a] === this.rank[b]) this.rank[a]++;
  }
}

/**
 * Detect bounding boxes of connected opaque regions.
 *
 * @param {Buffer} rawPixels  RGBA buffer
 * @param {number} w          image width
 * @param {number} h          image height
 * @param {number} gap        bridge gap (dilate radius before grouping)
 * @returns {{ x: number, y: number, w: number, h: number }[]}
 */
function detectSprites(rawPixels, w, h, gap) {
  // 1. Build binary mask: 1 = opaque
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    mask[i] = rawPixels[i * 4 + 3] > ALPHA_THRESHOLD ? 1 : 0;
  }

  // 2. Dilate mask by `gap` pixels so nearby sprites merge
  let dilated = mask;
  if (gap > 0) {
    dilated = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (mask[y * w + x]) {
          for (let dy = -gap; dy <= gap; dy++) {
            for (let dx = -gap; dx <= gap; dx++) {
              const ny = y + dy, nx = x + dx;
              if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
                dilated[ny * w + nx] = 1;
              }
            }
          }
        }
      }
    }
  }

  // 3. Connected-component labelling on dilated mask
  const uf = new UnionFind(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!dilated[y * w + x]) continue;
      const idx = y * w + x;
      // check right and down neighbors
      if (x + 1 < w && dilated[y * w + x + 1]) uf.union(idx, idx + 1);
      if (y + 1 < h && dilated[(y + 1) * w + x]) uf.union(idx, (y + 1) * w + x);
    }
  }

  // 4. Compute bounding boxes per component (using ORIGINAL mask, not dilated)
  const boxes = new Map();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;   // only count real opaque pixels
      const root = uf.find(y * w + x);
      if (!boxes.has(root)) {
        boxes.set(root, { x1: x, y1: y, x2: x, y2: y });
      } else {
        const b = boxes.get(root);
        if (x < b.x1) b.x1 = x;
        if (y < b.y1) b.y1 = y;
        if (x > b.x2) b.x2 = x;
        if (y > b.y2) b.y2 = y;
      }
    }
  }

  // 5. Convert to {x, y, w, h}, filter by min size, sort top-left
  const results = [];
  for (const b of boxes.values()) {
    const bw = b.x2 - b.x1 + 1;
    const bh = b.y2 - b.y1 + 1;
    if (bw >= MIN_SIZE && bh >= MIN_SIZE) {
      results.push({ x: b.x1, y: b.y1, w: bw, h: bh });
    }
  }
  // Sort: top to bottom, then left to right (with 8px row tolerance)
  results.sort((a, b) => {
    const rowA = Math.floor(a.y / 8);
    const rowB = Math.floor(b.y / 8);
    if (rowA !== rowB) return rowA - rowB;
    return a.x - b.x;
  });

  return results;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const pngs = await collectPngs(SRC_DIR);
  console.log(`Found ${pngs.length} PNGs in ${SRC_DIR}`);

  const manifest = [];

  for (const srcPath of pngs) {
    const rel = relative(SRC_DIR, srcPath);
    const dir = join(OUT_DIR, rel.replace(extname(rel), ''));
    await mkdir(dir, { recursive: true });

    const img = sharp(srcPath);
    const meta = await img.metadata();
    const { width, height } = meta;
    const rawPixels = await img.ensureAlpha().raw().toBuffer();

    const sprites = detectSprites(rawPixels, width, height, GAP);
    console.log(`  ${rel}: ${width}x${height} → ${sprites.length} sprites`);

    const sheetName = basename(srcPath, extname(srcPath));

    for (let i = 0; i < sprites.length; i++) {
      const s = sprites[i];
      const padded = String(i + 1).padStart(2, '0');
      const outName = `${sheetName}_${padded}.png`;
      const outPath = join(dir, outName);

      await sharp(srcPath)
        .extract({ left: s.x, top: s.y, width: s.w, height: s.h })
        .toFile(outPath);

      manifest.push({
        file: relative(OUT_DIR, outPath),
        source: rel,
        index: i + 1,
        x: s.x, y: s.y, width: s.w, height: s.h,
      });
    }
  }

  await writeFile(join(OUT_DIR, 'index.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone! ${manifest.length} sprites extracted to ${OUT_DIR}/`);
  console.log(`Manifest: ${OUT_DIR}/index.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
