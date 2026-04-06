#!/usr/bin/env node
/**
 * Re-extract specific sheets that need gap=0 to separate tightly packed tiles.
 */

import sharp from 'sharp';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, basename, extname, relative } from 'node:path';

const SRC_DIR = 'bought-packs/pixel-world-pack/Interior';
const OUT_DIR = 'extracted-assets/Interior';
const ALPHA_THRESHOLD = 10;
const MIN_SIZE = 6;

// Sheets that need gap=0 re-extraction
const RERUN = [
  { file: 'other/floorswalls.png', gap: 0 },
];

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

function detectSprites(rawPixels, w, h, gap) {
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    mask[i] = rawPixels[i * 4 + 3] > ALPHA_THRESHOLD ? 1 : 0;
  }

  let dilated = mask;
  if (gap > 0) {
    dilated = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (mask[y * w + x]) {
          for (let dy = -gap; dy <= gap; dy++) {
            for (let dx = -gap; dx <= gap; dx++) {
              const ny = y + dy, nx = x + dx;
              if (ny >= 0 && ny < h && nx >= 0 && nx < w) dilated[ny * w + nx] = 1;
            }
          }
        }
      }
    }
  }

  const uf = new UnionFind(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!dilated[y * w + x]) continue;
      const idx = y * w + x;
      if (x + 1 < w && dilated[y * w + x + 1]) uf.union(idx, idx + 1);
      if (y + 1 < h && dilated[(y + 1) * w + x]) uf.union(idx, (y + 1) * w + x);
    }
  }

  const boxes = new Map();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
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

  const results = [];
  for (const b of boxes.values()) {
    const bw = b.x2 - b.x1 + 1;
    const bh = b.y2 - b.y1 + 1;
    if (bw >= MIN_SIZE && bh >= MIN_SIZE) {
      results.push({ x: b.x1, y: b.y1, w: bw, h: bh });
    }
  }
  results.sort((a, b) => {
    const rowA = Math.floor(a.y / 8);
    const rowB = Math.floor(b.y / 8);
    if (rowA !== rowB) return rowA - rowB;
    return a.x - b.x;
  });
  return results;
}

async function main() {
  // Load existing manifest and remove entries for sheets we're re-running
  const manifestPath = join(OUT_DIR, 'index.json');
  let manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const rerunFiles = new Set(RERUN.map(r => r.file));
  manifest = manifest.filter(e => !rerunFiles.has(e.source));

  for (const { file, gap } of RERUN) {
    const srcPath = join(SRC_DIR, file);
    const rel = file;
    const dir = join(OUT_DIR, rel.replace(extname(rel), ''));
    await mkdir(dir, { recursive: true });

    const img = sharp(srcPath);
    const meta = await img.metadata();
    const { width, height } = meta;
    const rawPixels = await img.ensureAlpha().raw().toBuffer();

    const sprites = detectSprites(rawPixels, width, height, gap);
    console.log(`  ${rel}: ${width}x${height} → ${sprites.length} sprites (gap=${gap})`);

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

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Manifest updated.');
}

main().catch(e => { console.error(e); process.exit(1); });
