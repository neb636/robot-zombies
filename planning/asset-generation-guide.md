# Asset Generation Guide — Silicon Requiem

A personal reference for how pixel-art assets get made, reviewed, and integrated into the game. Covers the three tools in the pipeline (PixelLab, Aseprite, the asset viewer), what each one is for, and the end-to-end flow.

Design-journal style, not a runbook. The actual generation workflow is automated by the `pixellab-assets` skill (`.claude/skills/pixellab-assets/SKILL.md`) — when I want something made, I just say so ("generate the Maya sprite", "make the Boston ruins tileset") and the skill takes it from there.

---

## The three tools, and where each one fits

| Tool | Role | When I reach for it |
|------|------|---------------------|
| **PixelLab** (MCP) | Generator — first draft | Creating a sprite, tileset, or map object from scratch. Always the first step. |
| **Aseprite** | Editor — fix and polish | Touching up a PixelLab result: cleaning outlines, adjusting palette, fixing animation frames, assembling a spritesheet by hand. |
| **Asset viewer** (`npm run viewer`) | Browser — review & audit | Seeing everything currently in the game side-by-side with stats/context. Used for review, not editing. |

Each tool has a clear lane. I don't try to generate in Aseprite (too slow for a solo dev), I don't try to edit in PixelLab (can't — it's generative only), and I don't review in either one (the viewer collects everything into one page).

---

## Art direction

Target look: **32-bit Modern Indie** — closer to Sea of Stars / CrossCode than SNES-era flat shading. Richer pixel density, context-sensitive outlines, color gradients for depth. JRPG camera angle, not RTS.

Style constants applied to every PixelLab generation:

| Setting | Value | Why |
|---------|-------|-----|
| `view` | `"low top-down"` | JRPG camera (not `"high top-down"` which reads as RTS) |
| `outline` | `"selective outline"` | Context-sensitive, not harsh black borders |
| `shading` | `"detailed shading"` | Gradients and depth, not flat 16-bit |
| `detail` | `"high detail"` | Richer pixel density |
| `tile_size` | `16×16` | Matches existing `world_tiles.png` |

References: Chrono Trigger (scene composition), FF6 (character silhouettes), Sea of Stars (modern pixel lighting). See `planning/inspiration/` and `planning/inspiration-links.md`.

Aseprite edits must respect these constants — same palette, same outline behavior, same 16×16 grid. If I can't match the style by hand, regenerate instead of forcing it.

---

## Cost decisions (PixelLab)

- **`mode: "pro"` is reserved for Elise Voss.** It costs 20–40× a normal generation. She's the final boss and needs to read as a person, not a robot — worth it for one character, not for anyone else.
- **Template animations over custom animations.** A template animation costs ~1 generation per direction; a custom one costs 20–40. Only reach for custom if no template fits.
- **Map objects at 32px, not 16px.** 16px is for tile grids; objects need the extra pixels to read.
- **Same seed per region** for tilesets so palette and texture variance match across adjacent tiles.
- **Chain tilesets** with `lower_base_tile_id` / `upper_base_tile_id` when creating neighbouring terrain — this is the single biggest factor in regional visual coherence.
- **Fix in Aseprite before regenerating.** If a result is 90% there but has one bad frame or a palette slip, touch it up in Aseprite — that's ~2 minutes vs. another generation + wait cycle.

---

## Status legend

- `planned` — on the list, not yet touched
- `generating` — job submitted to PixelLab, waiting on result
- `in-review` — staged at `public/assets/_staging/…`, eyeballing before integration
- `polishing` — pulled into Aseprite for edits; not yet re-staged
- `integrated` — in `public/assets/…`, loaded by `PreloadScene.ts`, status done

---

## Inventory

### Characters

All `humanoid`, 8 directions, canvas auto-sized (~40% larger than `size`). Each character also needs the animation set: `walking-4-frames`, `breathing-idle`, `fight-stance-idle-8-frames`, `taking-punch`. Deja also gets `running-4-frames` (she's the fastest ATB character).

| Character | Size | Status | Notes |
|-----------|------|--------|-------|
| Player | 48 | in-review | Survivor. Worn clothes, stubble, makeshift melee weapon. Adaptable passive. |
| Marcus | 48 | planned | Electrician's belt, flashlight, warm tired face. Prologue only (converted in boss). |
| Maya | 48 | planned | MIT hoodie, EMP device, hair in bun. INT-scaling damage. |
| Elias | 48 | planned | Appalachian, red flannel, hunting rifle. Lost in Ch.2. |
| Deja | 48 | planned | 19, streetwear, two short blades. Lost in Ch.4. Needs `running-4-frames`. |
| Jerome | 48 | planned | Former NFL / preacher, sledgehammer, wide shoulders. |
| Dr. Chen | 48 | planned | 61, slight stoop, engineer's tool belt, reading glasses. |

### Enemies

Humanoid, 4 directions, standard animation set (`walking-4-frames`, `breathing-idle`, `fight-stance-idle-8-frames`, `taking-punch`).

| Enemy | Size | Status | Notes |
|-------|------|--------|-------|
| Compliance Drone | 48 | planned | Flying disc, red sensor eye, thin rotors. Tier 1. |
| Enforcer Unit | 56 | planned | Bulky armored bipedal, orange visor. Tier 2. |
| Sentinel | 52 | planned | Tall sleek white, multiple camera lenses. Tier 3. |
| Converted Human | 32 | planned | Ordinary person, faint blue eye glow, neural device at temple. Special. |

### Bosses

4 directions, animations: `scary-walk`, `fight-stance-idle-8-frames`, `taking-punch`. The existing procedural placeholders in `PreloadScene.ts:311–879` get retired once real ones land.

| Boss | Size | Chapter | Status | Notes |
|------|------|---------|--------|-------|
| Warden Alpha | 64 | Ch.1 | placeholder | Enforcement commander, scarred plating, red sensor. Proc at `PreloadScene.ts:311`. |
| Excavator Prime | 80 | Ch.2 | placeholder | Mining bot, drill arm, tracked base. Proc at `PreloadScene.ts:395`. |
| The Governor | 32 | Ch.3 | placeholder | Administrative android in a suit. Proc at `PreloadScene.ts:483`. |
| Sentinel Spire | 48 | Ch.4 | placeholder | Three-legged tower, rotating dishes. Proc at `PreloadScene.ts:591`. |
| Gate Colossus | 80 | Ch.5 | placeholder | Titan border guardian, two massive fists. Proc at `PreloadScene.ts:679`. |
| **Elise Voss** | 32 | Final | placeholder | 58, composed, neural crown. **`mode: "pro"`.** Proc at `PreloadScene.ts:780`. |

### Tilesets

Wang topdown, `tile_size: 16×16`. Each region is usually 1–2 chained pairs for terrain variety.

| Region | Status | Terrain pair |
|--------|--------|--------------|
| Boston ruins | planned | Cracked asphalt → concrete rubble → red brick wall (chained) |
| Subway tunnel | planned | Dark concrete floor → worn ceramic wall tile |
| Appalachian forest | planned | Dirt path → dense forest undergrowth |
| Deep South / bayou | planned | Murky swamp water → muddy cypress bank |
| Great Plains | planned | Dry cracked soil → dead wheat stubble |
| Rockies | planned | Exposed rock → snow |
| Silicon Valley | planned | Pristine white tile → transparent glass floor |

The existing `public/assets/tilesets/world_tiles.png` is a first-pass hand-made tileset — it'll stay for the Boston prologue until the proper Boston ruins tileset lands.

### Map objects

32×32 to 64×48 depending on object, `view: "low top-down"`.

**Interactive:**

| Object | Size (w×h) | Status |
|--------|------------|--------|
| Door | 32×48 | planned |
| Terminal / computer station | 32×48 | planned |
| Vending machine (looted) | 32×48 | planned |
| Car wreck | 64×48 | planned |
| Supply crate | 32×32 | planned |

**Decorative:**

| Object | Size (w×h) | Status |
|--------|------------|--------|
| Trash heap | 32×32 | planned |
| Broken streetlight | 32×48 | planned |
| Chain-link fence section | 32×32 | planned |
| Barrel cluster | 32×32 | planned |

The Post-Apocalyptic pack assets already loaded in `PreloadScene.ts:26–49` (cars, cones, trash cans, signs) cover a lot of the decorative layer — I only need PixelLab to fill the gaps these don't cover, plus anything that needs to match a specific region's palette.

---

## The end-to-end workflow

### 1. Generate — PixelLab

I ask by name ("generate the Maya sprite"). The `pixellab-assets` skill submits the job, schedules a wake-up, and comes back with files staged at `public/assets/_staging/<category>/<asset>/`. I go do something else for ~5 minutes while it runs.

I never edit `PreloadScene.ts` by hand for generated assets — the skill handles that, so the pattern stays consistent.

### 2. Review — first pass

Two ways to look at a staged asset:

- **Files directly** — open the PNG in Finder / Preview for a quick yes/no.
- **Dev server** — if `npm run dev` is running, hit `http://localhost:5173/assets/_staging/<category>/<asset>/` in a browser.

Decision point:
- **Good as-is** → say "integrate maya" (or whatever). Skill moves files into the real asset tree and wires `PreloadScene.ts`. Status → `integrated`.
- **90% there** → pull into Aseprite, fix, re-stage. Status → `polishing`.
- **Not usable** → either regenerate with an adjusted prompt, or delete the staged folder and move on.

### 3. Polish — Aseprite

Aseprite is a $20 commercial pixel-art editor. It's the industry default; the file format (`.aseprite`) is first-class in every tool that ships pixel art. Focus on the minimum it takes to fix a generated asset — not on mastering it as a full art tool.

**What to actually use it for:**

- **Clean up outlines** — PixelLab's "selective outline" sometimes drops or adds pixels on edges. Pencil tool (B), fix in place.
- **Palette correction** — if a generated frame drifts off-palette (common on animation frames), `Sprite → Color Mode → Indexed` locks to a shared palette. Then `Edit → Replace Color` for any rogue pixels.
- **Animation frame fixes** — open the PNG spritesheet, use `Sprite → Import Sprite Sheet` to slice into frames, edit the bad frame, `File → Export Sprite Sheet` back out with the same dimensions.
- **Assembling tilesets** — occasionally a PixelLab tileset needs one tile swapped or rotated. Open as a tilemap (`Sprite → Tilemap`) for grid-aware editing.

**Workflow inside Aseprite:**

1. Open the staged PNG (`File → Open`, or drag from Finder).
2. Make edits. Save as `.aseprite` (working file, not shipped) alongside the PNG in the staging folder — this lets me re-edit without re-slicing frames.
3. `File → Export Sprite Sheet` — match the original dimensions and frame count exactly. Overwrite the staged PNG.
4. Re-review in the browser or viewer.
5. Ask the skill to integrate.

**Keyboard essentials** (the 90% of Aseprite I actually use):

| Key | Action |
|-----|--------|
| `B` | Pencil (1-pixel brush) |
| `G` | Paint bucket |
| `E` | Eraser |
| `M` | Rectangular marquee (select region) |
| `Alt+click` | Eyedropper (pick color — use constantly) |
| `Z` / `Shift+Z` | Zoom in / out |
| `1`–`9` | Quick zoom levels |
| `F` | Flip cel horizontally |
| `,` / `.` | Previous / next frame |

**What NOT to use Aseprite for:** creating assets from scratch (PixelLab does that faster), viewing the whole asset library (the viewer does that better), or timing animations (Phaser handles that at runtime).

### 4. Audit — Asset viewer

`npm run viewer` generates `asset-viewer.html` at the repo root and opens it. `npm run viewer:watch` serves it on `localhost:7700` with live reload — better when I'm iterating because the page refreshes on every file change in `public/assets/`.

The viewer shows **everything currently integrated**: characters with chapter-by-chapter stats, enemies, bosses, tilesets, props. It reads from `public/assets/` plus mirrored character/enemy data — so it's the ground truth for "what's in the game right now."

I use it for:

- **Pre-flight check before a playtest** — does everything render at the right size? Any missing sprites?
- **Regional palette coherence** — see all Appalachia assets on one page, catch any that drift from the palette.
- **Status tracking at a glance** — if something's not in the viewer, it's not integrated, no matter what this guide says.

The viewer does **not** show staged (`_staging/`) assets. That's intentional — staged means not-yet-real. If I want to compare a staged asset against existing ones, I pull up the browser on `localhost:5173/assets/_staging/…` in one tab and the viewer in another.

### 5. Integrate

I say "integrate maya" (or whatever). The skill moves files out of `_staging/` into `public/assets/…`, wires `PreloadScene.ts`, and flips the status in this file. Next `npm run viewer` run picks up the change automatically.

---

## Typical pipelines

**New character sprite (happy path):**
`"generate the Maya sprite"` → wait → review staged PNG in browser → `"integrate maya"` → `npm run viewer` to confirm → done.

**New character sprite (needs polish):**
`"generate the Maya sprite"` → wait → review → palette drift on frame 3 → open in Aseprite, eyedropper the correct skin tone, pencil over the bad pixels → export back over the staged PNG → `"integrate maya"` → viewer.

**New regional tileset:**
`"make the bayou tileset"` (may chain 2 generations) → wait → review both tiles side by side in the browser → if one has a bad seam, Aseprite `Sprite → Tilemap` to fix → re-stage → `"integrate bayou tileset"` → viewer → confirm it composes cleanly with neighbouring regions.

**Retiring a procedural boss placeholder:**
Check the procedural line number in the inventory above → generate the real sprite → polish if needed → integrate → remove the procedural block from `PreloadScene.ts` (manual — the skill doesn't touch placeholders).

---

## Rules of thumb

- **Generate first, polish second, never hand-draw from scratch.** A blank canvas is a trap for a solo dev.
- **Stage, don't ship.** Never write generated assets directly to `public/assets/sprites/` or `public/assets/tilesets/`. Always land in `_staging/` first.
- **Touch-ups belong in Aseprite, regenerations belong in PixelLab.** Decide within 30 seconds which one the asset needs — if I can't decide, it's an Aseprite job.
- **The viewer is the source of truth for "done".** If it's not in the viewer, it's not integrated. Status columns in this file are secondary.
- **Keep `.aseprite` working files in `_staging/`, never in `public/assets/`.** They're dev artifacts; only PNGs ship.
