import express from 'express';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import type {
  MetadataEntry,
  AssetEntry,
  CatalogGroup,
  Catalog,
  LayoutVariation,
  PlacedObject,
  LevelLayout,
  LayoutObject,
} from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const PORT = 3456;

// ── Metadata ──────────────────────────────────────────────────────────────────

let rawMetadata: Record<string, MetadataEntry> = {};
let catalog: Catalog = { groups: {} };

function buildCatalog(raw: Record<string, MetadataEntry>): Catalog {
  const groups: Record<string, CatalogGroup> = {};

  for (const [path, entry] of Object.entries(raw)) {
    // Skip animation frames — they're not useful for level design
    if (entry.suggestedType === 'animation-frame') continue;

    const { room, category } = entry.pathHints;
    const key = `${room}/${category}`;

    if (!groups[key]) {
      // Build a human-readable label from the category slug
      const readableCategory = category
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const readableRoom = room.charAt(0).toUpperCase() + room.slice(1);
      groups[key] = {
        label: `${readableRoom} — ${readableCategory}`,
        room,
        category,
        assets: [],
      };
    }

    groups[key].assets.push({
      path,
      type: entry.suggestedType,
      w: entry.width,
      h: entry.height,
      perspective: entry.perspective,
      dominantColor: entry.dominantColor,
    });
  }

  return { groups };
}

async function loadMetadata(): Promise<void> {
  const raw = await readFile(join(ROOT, 'metadata.json'), 'utf-8');
  rawMetadata = JSON.parse(raw) as Record<string, MetadataEntry>;
  catalog = buildCatalog(rawMetadata);
  const assetCount = Object.values(catalog.groups).reduce((n, g) => n + g.assets.length, 0);
  console.log(`Loaded ${Object.keys(rawMetadata).length} raw assets → ${assetCount} usable assets in ${Object.keys(catalog.groups).length} groups`);
}

// ── Keyword filtering ─────────────────────────────────────────────────────────

const ALWAYS_INCLUDE_ROOMS = ['other', 'animations'];
const ROOM_KEYWORDS: Record<string, string[]> = {
  office: ['office', 'work', 'desk', 'cubicle', 'corporate', 'meeting', 'conference'],
  bedroom: ['bedroom', 'bed', 'sleep', 'room', 'dorm'],
  bathroom: ['bathroom', 'bath', 'toilet', 'shower', 'restroom', 'washroom'],
  kitchen: ['kitchen', 'cook', 'dining', 'cafeteria', 'food', 'eat'],
  livingroom: ['living', 'lounge', 'couch', 'sofa', 'television', 'tv'],
  kidsbedroom: ['kids', "children's", 'kid', 'child', 'nursery', 'playroom'],
};

function filterCatalogForPrompt(prompt: string): Record<string, CatalogGroup> {
  const lower = prompt.toLowerCase();
  const filtered: Record<string, CatalogGroup> = {};

  for (const [key, group] of Object.entries(catalog.groups)) {
    // Always include shared assets (floors, doors, decorations)
    if (ALWAYS_INCLUDE_ROOMS.includes(group.room)) {
      filtered[key] = group;
      continue;
    }

    // Include if room keyword matches
    const roomKws = ROOM_KEYWORDS[group.room] ?? [group.room];
    if (roomKws.some((kw) => lower.includes(kw))) {
      filtered[key] = group;
    }
  }

  // If nothing matched, include everything (fallback)
  if (Object.keys(filtered).length < 3) {
    return catalog.groups;
  }

  return filtered;
}

// ── Claude API ────────────────────────────────────────────────────────────────

const MAX_ASSETS_PER_GROUP = 5; // keep prompt small — pick representative samples per group

function buildAssetCatalogText(groups: Record<string, CatalogGroup>): string {
  const lines: string[] = [];
  for (const [key, group] of Object.entries(groups)) {
    // Sample up to MAX_ASSETS_PER_GROUP assets, spread across the full list
    const all = group.assets;
    const sampled: AssetEntry[] = [];
    const step = Math.max(1, Math.floor(all.length / MAX_ASSETS_PER_GROUP));
    for (let i = 0; i < all.length && sampled.length < MAX_ASSETS_PER_GROUP; i += step) {
      const entry = all[i];
      if (entry) sampled.push(entry);
    }
    lines.push(`\n[GROUP: ${key} — ${group.label}]`);
    for (const asset of sampled) {
      lines.push(JSON.stringify({ path: asset.path, type: asset.type, w: asset.w, h: asset.h }));
    }
  }
  return lines.join('\n');
}

const RESPONSE_SCHEMA = `{
  "variations": [
    {
      "id": "variation-1",
      "name": "string",
      "description": "string (1-2 sentences)",
      "canvasWidth": 800,
      "canvasHeight": 600,
      "objects": [
        {
          "id": "obj-0",
          "assetPath": "extracted-assets/Interior/...",
          "x": 0,
          "y": 0,
          "layer": "floor | object | overlay",
          "label": "optional string"
        }
      ]
    }
  ]
}`;

const SYSTEM_PROMPT = `You are a level designer for an isometric pixel-art JRPG interior scene.
Given a room description and a catalog of available sprite assets, generate exactly 3 distinct layout variations.

CANVAS: 800x600 pixels. Place objects using pixel coordinates (x, y) for the top-left corner of the sprite.

DEPTH RULES (isometric rendering):
- Objects with higher Y values appear in FRONT of objects with lower Y values.
- Use "floor" layer for floor tiles and carpets — these render first regardless of Y.
- Use "object" layer for furniture, fixtures, and decorations.
- Use "overlay" layer for anything that should render on top (rare).
- Do NOT overlap large furniture items. Check w and h dimensions to avoid collisions.
- Leave a 20px margin from canvas edges.

FLOOR: Every layout MUST include floor tiles. Pick one floor asset and repeat it tiled across the canvas (e.g. place it every 48px in a grid).

VARIATIONS: Make each feel distinct:
- Variation 1: Compact — dense furniture
- Variation 2: Spacious — minimal furniture
- Variation 3: Creative — interesting focal point

OBJECT COUNT: 8-12 objects per variation total (including floor tiles). Keep it concise.
Use only assets from the provided catalog. Reference them by exact path.

Respond with ONLY valid JSON (no markdown, no explanation) matching this schema:
${RESPONSE_SCHEMA}`;

function validateVariations(
  data: unknown,
  validPaths: Set<string>,
): { valid: LayoutVariation[]; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || !Array.isArray((data as Record<string, unknown>).variations)) {
    return { valid: [], errors: ['Response missing "variations" array'] };
  }

  const raw = (data as { variations: unknown[] }).variations;
  const valid: LayoutVariation[] = [];

  for (const v of raw) {
    if (!v || typeof v !== 'object') { errors.push('Non-object variation'); continue; }
    const variation = v as Record<string, unknown>;

    if (typeof variation.id !== 'string') { errors.push('Variation missing id'); continue; }
    if (!Array.isArray(variation.objects)) { errors.push(`Variation ${variation.id}: missing objects array`); continue; }

    const cleanObjects: PlacedObject[] = [];
    for (const obj of variation.objects as unknown[]) {
      if (!obj || typeof obj !== 'object') continue;
      const o = obj as Record<string, unknown>;
      if (typeof o.assetPath !== 'string') continue;

      // Validate asset path exists in metadata
      if (!validPaths.has(o.assetPath as string)) {
        errors.push(`Unknown asset: ${o.assetPath}`);
        continue;
      }

      cleanObjects.push({
        id: String(o.id ?? `obj-${cleanObjects.length}`),
        assetPath: o.assetPath as string,
        x: Number(o.x ?? 0),
        y: Number(o.y ?? 0),
        layer: (['floor', 'object', 'overlay'].includes(o.layer as string) ? o.layer : 'object') as PlacedObject['layer'],
        label: typeof o.label === 'string' ? o.label : undefined,
      });
    }

    valid.push({
      id: variation.id as string,
      name: String(variation.name ?? variation.id),
      description: String(variation.description ?? ''),
      canvasWidth: Number(variation.canvasWidth ?? 800),
      canvasHeight: Number(variation.canvasHeight ?? 600),
      objects: cleanObjects,
    });
  }

  return { valid, errors };
}

const apiKey = process.env['ANTHROPIC_API_KEY'];
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY is not set. Set it before running the level builder.');
  process.exit(1);
}
const anthropic = new Anthropic({ apiKey });

async function callClaudeSDK(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
}


async function generateLayouts(prompt: string): Promise<{ variations: LayoutVariation[]; warnings: string[] }> {
  const filteredGroups = filterCatalogForPrompt(prompt);
  const catalogText = buildAssetCatalogText(filteredGroups);
  const validPaths = new Set(Object.keys(rawMetadata));

  const userMessage = `Room description: "${prompt}"

Available assets:
${catalogText}

Respond with ONLY valid JSON. No markdown fences.`;

  console.log(`[generate] userMessage is ${userMessage.length} chars, calling Anthropic API...`);
  const rawText = await callClaudeSDK(SYSTEM_PROMPT, userMessage);
  console.log(`[generate] got ${rawText.length} chars back`);

  // Strip any accidental markdown fences
  let jsonText = rawText.trim();
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) jsonText = fenceMatch[1].trim();

  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${jsonText.slice(0, 200)}`);
  }

  const { valid, errors } = validateVariations(parsed, validPaths);
  if (valid.length === 0) {
    throw new Error(`No valid variations in response. Errors: ${errors.join('; ')}`);
  }

  return { variations: valid, warnings: errors };
}

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Serve extracted-assets as /assets/*
app.use('/assets', express.static(join(ROOT, 'extracted-assets')));

// Serve tool frontend
app.get('/', (_req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});
app.get('/renderer.js', (_req, res) => {
  res.sendFile(join(__dirname, 'renderer.js'));
});
app.get('/editor.js', (_req, res) => {
  res.sendFile(join(__dirname, 'editor.js'));
});

// API: grouped asset catalog
app.get('/api/metadata', (_req, res) => {
  res.json(catalog);
});

// Debug: test API connectivity
app.get('/api/test', async (_req, res) => {
  try {
    const result = await callClaudeSDK('Respond with only: {"ok":true}', 'test');
    res.json({ ok: true, chars: result.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});


// API: generate 3 layout variations using Claude
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body as { prompt?: string };
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  console.log(`[generate] prompt received: "${prompt.trim().slice(0, 50)}"`);
  try {
    const result = await generateLayouts(prompt.trim());
    console.log(`[generate] done: ${result.variations.length} variations`);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[generate] error:', message);
    res.status(500).json({ error: message });
  }
});

// API: export a variation to game-ready JSON
app.post('/api/export', (req, res) => {
  const { variation, promptUsed } = req.body as {
    variation?: LayoutVariation;
    promptUsed?: string;
  };

  if (!variation || !variation.objects) {
    res.status(400).json({ error: 'variation is required' });
    return;
  }

  const enrich = (obj: PlacedObject): LayoutObject => {
    const meta = rawMetadata[obj.assetPath];
    return {
      assetPath: obj.assetPath,
      x: obj.x,
      y: obj.y,
      w: meta?.width ?? 48,
      h: meta?.height ?? 48,
      label: obj.label,
    };
  };

  const floors = variation.objects.filter((o) => o.layer === 'floor').map(enrich);
  const objects = variation.objects.filter((o) => o.layer === 'object').map(enrich);
  const overlay = variation.objects.filter((o) => o.layer === 'overlay').map(enrich);

  // Sort object layer by (y + h) for isometric depth
  const depthSort = (a: LayoutObject, b: LayoutObject) => (a.y + a.h) - (b.y + b.h);
  objects.sort(depthSort);
  overlay.sort(depthSort);

  const layout: LevelLayout = {
    version: 1,
    name: variation.name,
    description: variation.description,
    generatedAt: new Date().toISOString(),
    promptUsed: promptUsed ?? '',
    width: variation.canvasWidth,
    height: variation.canvasHeight,
    layers: { floor: floors, object: objects, overlay },
  };

  res.json(layout);
});

// ── Start ─────────────────────────────────────────────────────────────────────

loadMetadata()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\nLevel Builder running at http://localhost:${PORT}\n`);
    });
  })
  .catch((err) => {
    console.error('Failed to load metadata:', err);
    process.exit(1);
  });
