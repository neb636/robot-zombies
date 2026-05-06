#!/usr/bin/env node
// Chop tilesets out of 6.png (top-down apartment reference) into the v3 tileset folder.
// Floor + wall patches are sampled from clean regions of the reference; furniture is
// generated separately via the pixellab-assets skill.
//
// Run:  node scripts/chop-apartment.mjs
//
// Outputs:
//   public/assets/tilesets/v3/apartment_v3_floor.png  + .json
//   public/assets/tilesets/v3/apartment_v3_wall.png   + .json
//   public/assets/_staging/v3/chopped/<name>.png      (diagnostic copies)

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const SRC       = resolve(ROOT, '6.png');
const TILES_OUT = resolve(ROOT, 'public/assets/tilesets/v3');
const STAGE_OUT = resolve(ROOT, 'public/assets/_staging/v3/chopped');

// Crop boxes — pixel coords in the source 1402×1122 image. Tweak if seams appear.
const CROPS = [
  {
    name: 'apartment_v3_floor',
    box:  { left: 600, top: 690, width: 64, height: 64 },
    tileSize: 16,
    note: 'warm wood-grain plank, clean stretch between bed-area and couch',
  },
  {
    name: 'apartment_v3_wall',
    box:  { left: 595, top: 115, width: 32, height: 24 },
    tileSize: 16,
    note: 'plain tan wall surface below top molding, clean spot between objects',
  },
];

async function chop(crop) {
  const stagePath = resolve(STAGE_OUT, `${crop.name}.png`);
  const tilesPath = resolve(TILES_OUT, `${crop.name}.png`);
  const metaPath  = resolve(TILES_OUT, `${crop.name}.json`);

  const buf = await sharp(SRC).extract(crop.box).png().toBuffer();
  await writeFile(stagePath, buf);
  await writeFile(tilesPath, buf);

  const meta = {
    source:    '6.png',
    crop:      crop.box,
    note:      crop.note,
    tile_size: { width: crop.tileSize, height: crop.tileSize },
    tile_image: `${crop.name}.png`,
  };
  await writeFile(metaPath, JSON.stringify(meta, null, 2) + '\n');
  console.log(`  ${crop.name}: ${crop.box.width}×${crop.box.height} → ${tilesPath}`);
}

(async () => {
  await mkdir(TILES_OUT, { recursive: true });
  await mkdir(STAGE_OUT, { recursive: true });
  console.log('Chopping apartment tilesets from 6.png →');
  for (const c of CROPS) await chop(c);
  console.log('Done. Eyeball the PNGs in', TILES_OUT);
})().catch(err => { console.error(err); process.exit(1); });
