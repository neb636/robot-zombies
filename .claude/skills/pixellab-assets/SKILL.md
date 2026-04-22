---
name: pixellab-assets
description: >
  Generate pixel-art game assets for Silicon Requiem using the PixelLab MCP server —
  characters, enemies, bosses, tilesets, map objects. Submits async jobs, waits,
  retrieves, and stages results at `public/assets/_staging/` for the user to review
  before integrating into `PreloadScene.ts`. Trigger on phrasing like "generate the
  Maya sprite", "make the Boston ruins tileset", "create the supply crate", "generate
  <character name> character", "generate <enemy> enemy", or any request that names an
  asset in `planning/asset-generation-guide.md`.
triggers:
  - generate sprite
  - generate character sprite
  - generate enemy sprite
  - generate boss sprite
  - generate tileset
  - generate map object
  - create pixel art asset
  - make the * tileset
  - pixellab
  - integrate asset
  - integrate sprite
  - integrate tileset
---

# PixelLab Asset Pipeline — Silicon Requiem

You are the asset-generation operator for this game. The user will ask for assets by name ("generate the Maya sprite"); you handle submission, waiting, staging, reporting, and — as a **separate, explicitly-requested** step — integration.

The full inventory, art-direction constants, cost reasoning, and live status tracker live in `planning/asset-generation-guide.md`. Read it before doing anything.

---

## Two phases: Generate and Integrate

These are separate turns, separated by user review. **Never do both in one turn** unless the user explicitly asks you to skip review.

- **Generate**: submit → wait → retrieve → stage under `public/assets/_staging/…` → report → **STOP**.
- **Integrate**: only after the user says "integrate X" / "ship these" / equivalent. Move files, wire `PreloadScene.ts`, update status in the guide.

---

## Generate phase

### 1. Pre-flight

1. Read `planning/asset-generation-guide.md`. Find the asset in the inventory. Note its size, direction count, animation set, and current status.
2. If status is `integrated`, ask the user whether they want to regenerate (don't overwrite silently).
3. If status is `generating` already, check `public/assets/_staging/<category>/<asset>/` — a prior run may already have results. Don't resubmit blindly.

### 2. Load tool schemas

PixelLab MCP tools are deferred. Before calling any, load schemas with `ToolSearch`:

```
ToolSearch(query: "select:mcp__pixellab__create_character,mcp__pixellab__animate_character,mcp__pixellab__get_character,mcp__pixellab__create_topdown_tileset,mcp__pixellab__get_topdown_tileset,mcp__pixellab__create_map_object,mcp__pixellab__get_map_object,mcp__pixellab__list_characters,mcp__pixellab__list_topdown_tilesets", max_results: 10)
```

Only load the subset you need for the current asset type — don't load everything every time.

### 3. Art-style constants (apply to every generation)

**Camera perspective:** Silicon Requiem uses a **3/4 view RPG perspective** (like Chrono Trigger / FF6) — not isometric. Characters and environments are drawn with a slight top-down angle showing both the top and front face of objects, with no strict 45° diamond grid. This perspective must be consistent across all generated assets.

Use these verbatim unless the asset type doesn't accept the parameter:

| Parameter | Value |
|-----------|-------|
| `view` | `"low top-down"` |
| `outline` | `"selective outline"` |
| `shading` | `"detailed shading"` |
| `detail` | `"high detail"` |

For tilesets specifically: `tile_size: {"width": 16, "height": 16}`.

For regional tilesets: pass the same `seed` across all tiles in one region, and chain adjacent tile pairs with `lower_base_tile_id` / `upper_base_tile_id` from the prior pair.

### 4. Submit

Batch all creates + animate calls for one asset (or one coherent group) in a **single message**. PixelLab queues server-side, so 10 parallel submits finish in roughly the same wall time as 1.

For characters: call `create_character`, and *immediately* in the same message queue the animation jobs with `animate_character` — PixelLab chains them internally. Don't wait for the character to finish before queuing animations.

Update `planning/asset-generation-guide.md` status column: `planned` → `generating`.

### 5. Wait

Characters + animations take ~3–5 minutes. Tilesets ~2–4. Map objects ~1–2. **Schedule a wake-up, don't poll:**

```
ScheduleWakeup(delaySeconds: 300, reason: "waiting on pixellab jobs for <asset>", prompt: "<the same user request>")
```

Pick the delay based on asset type:
- Single map object: 120s
- Tileset: 240s
- Character + full animation set: 300s
- Batch of multiple characters: 360s

### 6. Retrieve

On wake, call the matching `get_*` tool for each submitted job ID. Download the ZIPs / PNGs.

### 7. Stage

Write all outputs to:

```
public/assets/_staging/<category>/<asset-name>/
```

Where `<category>` is one of: `characters`, `enemies`, `bosses`, `tilesets`, `map-objects`.

Inside that folder, write:

- **The PNG files** (spritesheet, individual directions, tileset image — whatever PixelLab returned).
- **A `README.md`** recording:
  - Asset name and category
  - Generation date (use `currentDate` from the memory context)
  - PixelLab job IDs for each submission
  - The full prompt used
  - All parameters passed (`size`, `proportions`, `seed`, etc.)
  - What's included (list of directions, list of animations, frame counts)
  - How to preview (dev-server URL if available, or which file to open)

**Never** write generated output to `public/assets/sprites/`, `public/assets/tilesets/`, or any other "final" location during the Generate phase. Staging is a hard rule.

### 8. Report and stop

Print a compact summary to the user:

```
Staged: Maya — 8 directions, 4 animations (walking, breathing, fight-stance, taking-punch).
Path: public/assets/_staging/characters/maya/
Preview in browser: http://localhost:5173/assets/_staging/characters/maya/
When ready, say "integrate maya" to wire it into PreloadScene.
```

Update `planning/asset-generation-guide.md` status: `generating` → `in-review`.

**Stop here.** Do not touch `PreloadScene.ts`. Do not move files out of staging. Wait for the user's next turn.

---

## Integrate phase

Triggered by the user saying "integrate <asset>" / "ship it" / "looks good, wire it up". Keywords in the `triggers` frontmatter include `integrate asset`, `integrate sprite`, `integrate tileset`.

### 1. Verify staging

Confirm `public/assets/_staging/<category>/<asset>/` exists and has the expected files. If not, ask the user whether to regenerate.

### 2. Move files

Move PNGs to their final locations:

| Category | Destination |
|----------|-------------|
| characters | `public/assets/sprites/characters/<name>.png` |
| enemies | `public/assets/sprites/enemies/<name>.png` |
| bosses | `public/assets/sprites/enemies/<name>.png` (same dir — enemies and bosses share the folder) |
| tilesets | `public/assets/tilesets/<region>.png` |
| map-objects | `public/assets/sprites/props/misc/<name>.png` (or a more specific subfolder) |

Preserve the staging `README.md` alongside the final asset (or delete — your call, but keeping it is useful for provenance). Delete the staging folder after a successful move.

### 3. Wire `src/scenes/PreloadScene.ts`

Locate the relevant section. The file structure:

- `preload()` at line 12 — add `this.load.spritesheet(...)` or `this.load.image(...)` calls
- `create()` at line 52 — has `if (!this.textures.exists(...)) this._generateXxxTexture();` guards that fall back to procedural placeholders
- `_registerAnimations()` at line 231 — animation definitions

**To wire a new asset:**

1. Add the `this.load.spritesheet(...)` / `this.load.image(...)` call in `preload()`.
   - Character canvas is ~40% larger than `size` (PixelLab convention). For a `size: 48` character, use `frameWidth: 68, frameHeight: 68` — but **verify against the actual output dimensions** by reading the staging README or checking the PNG.
2. If a procedural placeholder exists (`_generateHeroTexture`, `_generateWardenAlphaTexture`, etc. at lines 81, 311, 395, 483, 591, 679, 780):
   - Remove the procedural call from `create()` (the `if (!this.textures.exists(...))` guard — just delete that line since the spritesheet load now provides the texture).
   - Delete the `_generate*Texture()` method entirely if nothing else uses it.
3. Update `_registerAnimations()`:
   - Real PixelLab template animation frame counts:
     - `walking-4-frames` → 4 frames
     - `running-4-frames` → 4 frames
     - `breathing-idle` → 8 frames
     - `fight-stance-idle-8-frames` → 8 frames
     - `taking-punch` → usually 4 frames (verify from staging)
     - `scary-walk` → verify from staging
   - The direction layout PixelLab produces: each direction is a row. For 8-direction characters: rows are S, SE, E, NE, N, NW, W, SW (verify against the staged README — PixelLab's direction order can vary).

### 4. Update the guide

Edit `planning/asset-generation-guide.md`:

- Change status column: `in-review` → `integrated`
- If it was a boss with a procedural placeholder, update that row so it no longer says "placeholder" and remove the `PreloadScene.ts:NNN` reference.

### 5. Verify

Run `npm run typecheck`. If it fails, fix the errors. Report the result to the user and suggest `npm run dev` to visually confirm the asset renders correctly.

---

## Style consistency rules (apply during Generate)

- **`mode: "pro"` only for Elise Voss.** 20–40× cost. She's the one character who must read as human, not robot — nobody else earns it.
- **Template animations over custom.** 1 gen/direction vs 20–40. Only reach for custom if no template fits the motion needed.
- **Map objects: 32px minimum.** 16px works for tile grids but is too small for legible object generation.
- **Same seed per region for tilesets.** Palette and variance stay coherent across adjacent tiles.
- **Chain tilesets** via `lower_base_tile_id` / `upper_base_tile_id` — the single biggest factor in regional coherence.
- **Batch per asset group.** 10 submits in one message == 1 submit worth of waiting.

---

## Sample prompts (starting points)

Adapt these; don't copy blindly. Character personalities and visual cues come from the `## Characters` table in `CLAUDE.md`.

### Characters

```
# Player (hero)
description: "weathered survivor in torn cargo pants and a worn jacket,
stubble, determined expression, carries a makeshift melee weapon"
size: 48
proportions: '{"type": "preset", "name": "default"}'
n_directions: 8

# Marcus
description: "ordinary middle-aged man in work clothes, electrician's belt
with tools, carries a flashlight, warm tired face, short dark hair"
size: 48
proportions: '{"type": "preset", "name": "default"}'

# Maya
description: "young woman in a MIT hoodie, dark hair in a tight bun,
carries a handheld EMP device, intense focused expression, practical clothes"
size: 48
proportions: '{"type": "preset", "name": "stylized"}'

# Elias
description: "tall lean older man in red flannel shirt, worn jeans, hunting
rifle slung on back, weathered Appalachian face, sparse gray beard"
size: 48
proportions: '{"type": "custom", "head_size": 0.9, "shoulder_width": 0.9}'

# Jerome
description: "enormous broad-shouldered man in a preacher's collar and work
clothes, carries a sledgehammer, gentle giant expression, massive frame"
size: 48
proportions: '{"type": "custom", "shoulder_width": 1.4, "legs_length": 1.1}'

# Deja
description: "small wiry teenage girl in streetwear, two short blades at her
hips, quick alert expression, natural hair, bright confident eyes"
size: 48
proportions: '{"type": "custom", "head_size": 1.1, "legs_length": 0.9}'

# Dr. Chen
description: "older Chinese man in his 60s, slightly stooped posture,
engineer's tool belt, reading glasses, thoughtful worried expression,
rumpled button-down shirt"
size: 48
proportions: '{"type": "preset", "name": "default"}'
```

### Enemies

```
# Compliance Drone
description: "small flying disc-shaped surveillance robot with a red glowing
sensor eye at center, smooth brushed metal body, thin spinning rotors,
compact camera array mounted below"
size: 48

# Enforcer Unit
description: "heavily armored bipedal robot, broad shoulders with mounted
stun weapon arrays, blank flat face plate with single orange horizontal visor,
industrial matte black plating, bulky chassis"
size: 56

# Sentinel
description: "tall sleek surveillance robot, smooth white chassis, narrow
build, multiple camera lenses across chest, thin limbs, moves with eerie
precision"
size: 52

# Converted Human
description: "ordinary person in plain muted clothes, slightly rigid upright
posture, small neural interface device visible at left temple, calm blank
expression, faint blue glow in eyes"
size: 32
proportions: '{"type": "preset", "name": "default"}'
```

### Bosses

```
# Warden Alpha — Ch.1 Boston
description: "oversized enforcement robot commander, scarred battle-worn
plating, dominant red sensor array, command insignia on chest, imposing
presence"
size: 64

# Excavator Prime — Ch.2 Appalachia
description: "massive industrial excavator robot repurposed for combat,
enormous drill arm, tracked base partially replaced with legs, cargo bay
converted to weapon platform, earth-caked plating"
size: 80

# The Governor — Ch.3 Deep South
description: "sleek administrative android in a tailored suit, politician's
smile etched into face plate, one arm concealing a retractable weapon,
confident stance, propaganda screens embedded in chest"
size: 32

# Sentinel Spire — Ch.4 Great Plains
description: "towering thin surveillance tower robot that walks on three
spindly legs, rotating sensor head with multiple dish arrays, broadcasts
signal, sterile white finish"
size: 48

# Gate Colossus — Ch.5 Rockies
description: "enormous gate guardian robot, two massive fists, impenetrable
layered armor plating, slow deliberate movement, glowing red eyes set deep
in a fortress-like head"
size: 80

# Elise Voss — Final Boss (USE mode: "pro")
description: "58-year-old woman in a clean fitted suit, silver hair pulled
back, calm intelligent face, neural interface crown, no visible weapons,
projects absolute certainty and conviction — not a monster, a true believer"
size: 32
mode: "pro"
```

### Tilesets

```
# Boston ruins — pair 1
lower_description: "cracked and broken asphalt road with oil stains, tire
marks, scattered debris"
upper_description: "shattered concrete rubble, chunks of pavement and
building materials"
transition_description: "crumbled asphalt edge meeting loose gravel and dust"
transition_size: 0.25

# Boston ruins — pair 2 (chain from pair 1)
lower_description: [use rubble base_tile_id from pair 1]
upper_description: "collapsed red brick building wall section with broken
windows and exposed rebar"
transition_description: "rubble meeting broken brick fragments"
transition_size: 0.25

# Subway tunnel
lower_description: "dark grey concrete tunnel floor, worn smooth, stained"
upper_description: "old ceramic subway wall tiles, cracked and dirty, some
missing, graffiti tags visible"
transition_description: "concrete floor meeting tiled wall base, grime buildup"
transition_size: 0.25

# Appalachian forest
lower_description: "packed dirt path through dense Appalachian forest,
exposed roots, leaf litter"
upper_description: "thick forest undergrowth, ferns and dense grass, dappled
shadow"
transition_description: "dirt path edge meeting wild grass and root systems"
transition_size: 0.5

# Deep South bayou
lower_description: "murky dark green swamp water with algae blooms, floating
debris, lily pads"
upper_description: "wet muddy bank with exposed cypress roots, dark earth"
transition_description: "water's edge, mud and small ripples"
transition_size: 0.25

# Great Plains
lower_description: "dry cracked earth, pale brown soil with deep fissures,
drought conditions"
upper_description: "dead wheat stubble field, yellowed stalks, sparse and flat"
transition_description: "cracked soil transitioning to dry compacted farmland"
transition_size: 0.25

# Rockies
lower_description: "exposed grey mountain rock, cracked and weathered, sparse
and unforgiving"
upper_description: "snow and ice covering rock, bright white, crisp edges"
transition_description: "snowline, rock meeting thin ice crust and snow pack"
transition_size: 0.25

# Silicon Valley
lower_description: "pristine polished white floor tile, perfect and immaculate,
no marks or wear"
upper_description: "seamless transparent glass floor panel over white substrate,
clean and clinical"
transition_description: "faint hairline seam, no dirt, sterile precision"
transition_size: 0
```

### Map objects

```
# Terminal / computer station
description: "post-apocalyptic computer terminal on a metal stand, cracked
screen with green glow, wires exposed, jury-rigged power supply"
width: 32, height: 48

# Supply crate
description: "weathered wooden supply crate with metal corner brackets, rope
handle, partially opened lid showing supplies inside"
width: 32, height: 32

# Car wreck
description: "burned out sedan shell, windows smashed, tires flat, rust and
scorch marks, top partially caved in"
width: 64, height: 48

# Vending machine (looted)
description: "battered vending machine leaning against wall, glass front
smashed, mostly empty, power cord ripped out, graffiti on side"
width: 32, height: 48
```

### Animations (queue per character)

```
All playable characters:
- template_animation_id: "walking-4-frames"
- template_animation_id: "breathing-idle"
- template_animation_id: "fight-stance-idle-8-frames"
- template_animation_id: "taking-punch"

Deja only (fastest ATB, rogue):
- template_animation_id: "running-4-frames"

All bosses:
- template_animation_id: "scary-walk"
- template_animation_id: "fight-stance-idle-8-frames"
```

---

## Anti-patterns

- **Don't integrate without explicit approval.** Staging → review → integrate is a hard three-step gate.
- **Don't skip `ToolSearch`.** PixelLab tools are deferred every session. Calling them without hydrating schemas returns `InputValidationError`.
- **Don't poll for job status.** Use `ScheduleWakeup` — cheaper, doesn't burn context.
- **Don't hand-edit `PreloadScene.ts` during Generate phase.** Even if you know the answer, hold the edit until Integrate.
- **Don't submit single-item jobs.** Batch the whole group (all 7 playable characters, or all 4 enemies) in one submission if the user asks for a set.
- **Don't use `mode: "pro"` outside Elise Voss.** Hard rule.
- **Don't write the README.md in the final asset tree** — it belongs in the staging folder, next to the PNGs during review.
