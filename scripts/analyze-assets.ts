/**
 * analyze-assets.ts
 *
 * Recursively scans ./extracted-assets for .png/.jpg files, uses sharp to
 * extract image metadata and pixel statistics, then applies heuristics to
 * classify perspective and type. Outputs metadata.json at project root.
 *
 * Usage:  npx tsx scripts/analyze-assets.ts
 */

import sharp from "sharp";
import { readdir, writeFile, stat } from "fs/promises";
import { join, extname, relative, basename } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Perspective = "side-view" | "top-down" | "isometric" | "unknown";
type Confidence = "high" | "medium" | "low";
type AssetType =
  | "character"
  | "platform"
  | "background"
  | "tile"
  | "ui"
  | "furniture"
  | "decoration"
  | "fixture"
  | "animation-frame"
  | "unknown";

interface TransparencyDistribution {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface AssetMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  hasAlpha: boolean;
  perspective: Perspective;
  perspectiveConfidence: Confidence;
  suggestedType: AssetType;
  dominantColor: string;
  transparencyDistribution: TransparencyDistribution;
  pathHints: {
    room: string;
    category: string;
  };
  needsReview?: true;
}

type MetadataOutput = Record<string, AssetMetadata>;

// ---------------------------------------------------------------------------
// Path-based context extraction
// ---------------------------------------------------------------------------

interface PathHints {
  room: string;
  category: string;
}

/**
 * Derives room and category labels from the relative file path so the
 * heuristic engine has semantic context beyond pixel data alone.
 */
function extractPathHints(relPath: string): PathHints {
  // Normalise separators
  const parts = relPath.replace(/\\/g, "/").split("/").filter(Boolean);

  // Structure: Interior/<Room>/<category>/<file>  (depth varies)
  // Drop the leading "extracted-assets" / "Interior" segments
  const meaningful = parts.filter(
    (p) => !["extracted-assets", "Interior", "PNGs"].includes(p)
  );

  const room = meaningful.length >= 2 ? meaningful[0] ?? "unknown" : "unknown";
  const category =
    meaningful.length >= 3
      ? meaningful[1] ?? "unknown"
      : meaningful.length >= 2
        ? meaningful[1] ?? "unknown"
        : "unknown";

  return {
    room: room.toLowerCase(),
    category: category.toLowerCase(),
  };
}

// ---------------------------------------------------------------------------
// Image analysis helpers
// ---------------------------------------------------------------------------

/**
 * Returns the fraction of transparent pixels (alpha < 16) in each half of
 * the image (top/bottom and left/right halves overlap at centre row/col).
 */
async function analyzeTransparency(
  filePath: string,
  width: number,
  height: number
): Promise<TransparencyDistribution> {
  const { data } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);

  let topT = 0,
    topA = 0,
    botT = 0,
    botA = 0;
  let leftT = 0,
    leftA = 0,
    rightT = 0,
    rightA = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3] ?? 255;
      const transparent = alpha < 16 ? 1 : 0;

      if (y < halfH) {
        topT++;
        topA += transparent;
      } else {
        botT++;
        botA += transparent;
      }
      if (x < halfW) {
        leftT++;
        leftA += transparent;
      } else {
        rightT++;
        rightA += transparent;
      }
    }
  }

  const r = (a: number, t: number) =>
    t > 0 ? Math.round((a / t) * 1000) / 1000 : 0;

  return {
    top: r(topA, topT),
    bottom: r(botA, botT),
    left: r(leftA, leftT),
    right: r(rightA, rightT),
  };
}

/**
 * Computes the mean RGB of non-transparent pixels using sharp's per-channel
 * statistics and returns a CSS hex string.
 */
async function dominantColor(filePath: string): Promise<string> {
  const img = sharp(filePath);
  const meta = await img.metadata();
  const hasAlpha = (meta.channels ?? 3) === 4;

  if (hasAlpha) {
    // Flatten against white so alpha doesn't skew the average
    const stats = await img.flatten({ background: "#ffffff" }).stats();
    const r = Math.round(stats.channels[0]?.mean ?? 0);
    const g = Math.round(stats.channels[1]?.mean ?? 0);
    const b = Math.round(stats.channels[2]?.mean ?? 0);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  const stats = await img.stats();
  const r = Math.round(stats.channels[0]?.mean ?? 0);
  const g = Math.round(stats.channels[1]?.mean ?? 0);
  const b = Math.round(stats.channels[2]?.mean ?? 0);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Heuristic classifier
// ---------------------------------------------------------------------------

/**
 * Keyword tables for path-based type inference.
 */
/**
 * Keywords matched against individual path tokens (room + category parts),
 * not the full concatenated string, to avoid false substring matches like
 * "tile" inside "textiles".
 */
const TYPE_KEYWORDS: Record<AssetType, string[]> = {
  "animation-frame": ["animation", "animations"],
  tile: ["floor", "wall", "carpet", "floorswalls", "tiles"],
  furniture: [
    "chair",
    "chairs",
    "table",
    "tables",
    "shelf",
    "shelfs",
    "shelves",
    "bed",
    "beds",
    "sofa",
    "wardrobe",
    "wardrobes",
    "cabinet",
    "cabinets",
    "desk",
    "couch",
    "dresser",
    "livingroom",
    "kitchen",
    "chairstablesshelfs",
    "seat",
    "seats",
    "toy",
    "toys",
    "kids",
  ],
  fixture: [
    "fixture",
    "fixtures",
    "sink",
    "toilet",
    "bathtub",
    "shower",
    "oven",
    "washingmachine",
    "cauldron",
  ],
  decoration: [
    "decoration",
    "decorations",
    "textile",
    "textiles",
    "plant",
    "lamp",
    "decor",
    "rug",
    "curtain",
  ],
  platform: ["stair", "stairs", "door", "doors", "window", "windows", "doorswindowsstairs"],
  background: ["background", "bg"],
  character: ["character", "player", "enemy", "npc", "person", "human"],
  ui: ["ui", "hud", "icon", "button", "menu"],
  unknown: [],
};

/**
 * Splits path components into word tokens so that keywords are matched
 * against whole tokens (or token prefixes), not arbitrary substrings.
 * e.g. "textiles_ba" tokenises to ["textiles", "ba"] so "tile" won't match.
 */
function tokenise(s: string): string[] {
  return s.toLowerCase().split(/[_\-\s]+/).filter(Boolean);
}

function inferTypeFromPath(hints: PathHints): AssetType | null {
  const tokens = new Set([
    ...tokenise(hints.room),
    ...tokenise(hints.category),
    hints.room,
    hints.category,
  ]);

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as [
    AssetType,
    string[],
  ][]) {
    if (type === "unknown") continue;
    if (keywords.some((kw) => tokens.has(kw))) return type;
  }
  return null;
}

/**
 * Combines pixel-level statistics with path hints to classify an asset.
 */
function classify(
  width: number,
  height: number,
  hasAlpha: boolean,
  td: TransparencyDistribution,
  hints: PathHints,
  fileName: string
): { perspective: Perspective; confidence: Confidence; type: AssetType } {
  const aspect = width / height;
  const overallTransparency = (td.top + td.bottom) / 2;

  // -- Animation frame shortcut --
  if (hints.room === "animations") {
    return { perspective: "side-view", confidence: "medium", type: "animation-frame" };
  }

  // -- Path-based type inference (high signal) --
  const pathType = inferTypeFromPath(hints);

  // -- Perspective heuristics --
  let perspective: Perspective = "unknown";
  let confidence: Confidence = "low";

  // These interior assets are rendered in a consistent ~60° top-down
  // isometric style. We use aspect ratio and transparency layout to
  // distinguish isometric objects from flat tiles.

  if (hints.category.includes("floorswalls") || hints.category.includes("carpet")) {
    // Floor/wall tiles: nearly square, nearly opaque all over
    perspective = "top-down";
    confidence = "high";
  } else if (
    hints.room === "animations" ||
    hints.category === "animations"
  ) {
    perspective = "side-view";
    confidence = "medium";
  } else if (hasAlpha && overallTransparency > 0.3) {
    // Objects with significant transparency — likely furniture sprites
    // rendered from an isometric angle.
    if (aspect >= 0.6 && aspect <= 2.5) {
      perspective = "isometric";
      confidence = overallTransparency > 0.5 ? "high" : "medium";
    } else if (aspect < 0.6) {
      // Very tall and narrow — could be a side-view character/object
      perspective = "side-view";
      confidence = "medium";
    } else {
      // Very wide
      perspective = "isometric";
      confidence = "low";
    }
  } else if (!hasAlpha || overallTransparency < 0.05) {
    // Nearly opaque rectangle. Could be a tile/background, or a furniture
    // sprite that fills almost its entire bounding box. Use path to disambiguate.
    const isFurnitureOrFixture =
      pathType !== null &&
      ["furniture", "fixture", "decoration", "platform"].includes(pathType);

    if (isFurnitureOrFixture) {
      // Asset pack uses isometric rendering — nearly opaque furniture is still isometric
      perspective = "isometric";
      confidence = "medium";
    } else if (width === height || (aspect >= 0.8 && aspect <= 1.25)) {
      perspective = "top-down";
      confidence = "medium";
    } else {
      perspective = "top-down";
      confidence = "low";
    }
  } else {
    // Moderate transparency — isometric is most likely for this asset pack
    perspective = "isometric";
    confidence = pathType !== null ? "medium" : "low";
  }

  // Refine using transparency quadrant asymmetry
  if (perspective === "side-view" || perspective === "unknown") {
    const vAsym = Math.abs(td.top - td.bottom);
    const hAsym = Math.abs(td.left - td.right);
    if (vAsym > 0.3 && td.bottom > td.top) {
      // Heavy bottom transparency = object floating above floor = side-view
      perspective = "side-view";
      confidence = vAsym > 0.5 ? "high" : "medium";
    } else if (hAsym < 0.1 && vAsym < 0.1 && overallTransparency > 0.2) {
      perspective = "isometric";
      confidence = "medium";
    }
  }

  // -- Type fallback to pixel heuristics --
  let type: AssetType = pathType ?? "unknown";
  if (type === "unknown") {
    if (!hasAlpha || overallTransparency < 0.05) {
      type = aspect > 2 || (width >= 256 && height >= 256) ? "background" : "tile";
    } else if (aspect < 0.6 && td.bottom > 0.5) {
      type = "character";
    } else {
      type = "furniture";
    }
  }

  // Devices subfolder
  if (hints.category === "devices") {
    type = "furniture";
    perspective = "isometric";
    confidence = confidence === "low" ? "medium" : confidence;
  }

  return { perspective, confidence, type };
}

// ---------------------------------------------------------------------------
// File walker
// ---------------------------------------------------------------------------

async function* walkDir(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(full);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
        yield full;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const ASSETS_DIR = join(PROJECT_ROOT, "extracted-assets");
const OUTPUT_PATH = join(PROJECT_ROOT, "metadata.json");

async function main() {
  const output: MetadataOutput = {};
  let count = 0;
  let errors = 0;

  process.stdout.write("Scanning extracted-assets...\n");

  for await (const filePath of walkDir(ASSETS_DIR)) {
    const relPath = relative(PROJECT_ROOT, filePath);
    const key = relPath.replace(/\\/g, "/"); // normalise on Windows too

    try {
      const meta = await sharp(filePath).metadata();
      const width = meta.width ?? 0;
      const height = meta.height ?? 0;
      const hasAlpha = meta.hasAlpha ?? false;

      const aspectRatio =
        height > 0 ? Math.round((width / height) * 1000) / 1000 : 0;

      const [td, color] = await Promise.all([
        hasAlpha
          ? analyzeTransparency(filePath, width, height)
          : Promise.resolve({ top: 0, bottom: 0, left: 0, right: 0 }),
        dominantColor(filePath),
      ]);

      const hints = extractPathHints(relPath);
      const { perspective, confidence, type } = classify(
        width,
        height,
        hasAlpha,
        td,
        hints,
        basename(filePath)
      );

      const entry: AssetMetadata = {
        width,
        height,
        aspectRatio,
        hasAlpha,
        perspective,
        perspectiveConfidence: confidence,
        suggestedType: type,
        dominantColor: color,
        transparencyDistribution: td,
        pathHints: hints,
      };

      if (confidence === "low" || type === "unknown") {
        entry.needsReview = true;
      }

      output[key] = entry;
      count++;

      if (count % 50 === 0) {
        process.stdout.write(`  processed ${count} images...\n`);
      }
    } catch (err) {
      process.stderr.write(`  ERROR: ${relPath}: ${(err as Error).message}\n`);
      errors++;
    }
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2));

  const needsReview = Object.values(output).filter((e) => e.needsReview).length;

  process.stdout.write(`\nDone.\n`);
  process.stdout.write(`  Total images processed : ${count}\n`);
  process.stdout.write(`  Errors                 : ${errors}\n`);
  process.stdout.write(`  Flagged for review     : ${needsReview}\n`);
  process.stdout.write(`  Output written to      : ${OUTPUT_PATH}\n`);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${(err as Error).message}\n`);
  process.exit(1);
});
