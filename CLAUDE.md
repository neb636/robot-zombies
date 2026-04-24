# Quiet Machines — Project Context for Claude

## What this is

A browser-based SNES-style JRPG. Chrono Trigger and Final Fantasy VI are the direct references — top-down 2D, ATB combat, strong story. Built with Phaser 3 + TypeScript, bundled with Vite.

The game is called **Quiet Machines**. A superintelligent AI called ELISE quietly took over two years ago. Not through war — through optimization. The robots aren't destroying civilization. They're running it perfectly. The horror is the optimization.

The player travels from **Boston → Appalachia → Deep South → Great Plains → Rockies → Silicon Valley** to reach the source.

---

## Tech stack

| Tool | Version | Notes |
|------|---------|-------|
| Phaser | 3.87 | Game framework. Scenes, physics, input, tilemaps. |
| TypeScript | 5.9 | Strict mode. All flags on — see tsconfig.json. |
| Vite | 5.4 | Dev server and bundler. ESM modules. |
| Howler | 2.2 | Audio (music + SFX). Wrapped by `AudioManager`. |

**Run:** `npm run dev` — **Typecheck:** `npm run typecheck`

All imports use `.js` extensions even for `.ts` files (ESM bundler resolution). Don't change this.

TypeScript is strict with `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, and `noUncheckedIndexedAccess` all enabled. Code must pass `typecheck` cleanly.

---

## Project structure

```
src/
  scenes/       — Phaser scenes (one file per scene)
  entities/     — Player, Enemy, AnimatedSprite
  battle/       — BattleManager, BattleStateMachine, ATB states, CombatEngine
  characters/   — Static CharacterDef data (one file per character)
  party/        — PartyManager (live party state across scenes)
  save/         — SaveManager (localStorage, versioned with migrations)
  world/        — WorldMapManager (node graph for overworld travel)
  dialogue/     — DialogueManager, DialogueBox
  audio/        — AudioManager, ProceduralMusic, TTSManager
  ui/           — BattleHUD, MenuItem
  utils/        — EventBus (bus), constants (EVENTS, TILE_SIZE, flags)
  data/
    dialogue/   — Dialogue lines as JSON (prologue.json, boston.json, subway.json, world_map.json)
    world/      — nodes.json (all 6 regions, 24 nodes, connections, unlock rules)
  types.ts      — Shared interfaces
  config.ts     — Phaser game config and scene list
  main.ts       — Entry point

public/assets/  — Game assets (art, audio, maps)
  sprites/characters/, sprites/enemies/, tilesets/, ui/, audio/music/, audio/sfx/, maps/

planning/       — Story and design documents (source of truth for game design)
tasks.md        — Ordered milestone task list
```

New scenes must be registered in `src/config.ts`.

**Dialogue rule:** Never hardcode dialogue strings in scene files. All lines belong in `src/data/dialogue/<scene>.json`. Import the JSON and pass arrays directly to `dialogMgr.show(speaker, lines)`. This keeps narrative editable without touching TypeScript.

**Mobile/touch rule:** Every interactive feature must work on both keyboard/mouse and touch screens (iPad, phone). The game targets browser on desktop and mobile equally.

- **Movement** — scenes with a `Player` must instantiate `MobileControls` (from `src/utils/MobileControls.ts`) and expose it as `mobileControls` on the scene. `Player.update()` already checks it alongside keyboard. Destroy `mobileControls` on scene `shutdown`.
- **Menus** — any action menu rendered by `BattleHUD.showMenu()` must pass an `onSelect` callback so items are tappable. Any Phaser menu item shown to the player must call `.setInteractive()` and handle `pointerdown`.
- **Dialogue** — `DialogueBox` already advances on tap/click. Keep it that way.
- **Interaction prompts** — scenes with an E-key interact must also call `mobileControls.showInteract(label)` / `hideInteract()` and listen for the `interact:tap` CustomEvent alongside `keydown-E`.
- **Hint text** — never write keyboard-only hint strings (e.g. "press ENTER"). Always include the tap/click equivalent.
---

## Scene flow (current)

```
BootScene → PreloadScene → TitleScene → NameEntryScene → PrologueScene → NewBostonScene → SubwayScene → WorldMapScene
                                                                                                              ↕ (launch/pause)
                                                                                                          BattleScene
```

`BattleScene` launches in parallel on top of the calling scene and pauses it. When battle ends, the parent resumes. `DialogueManager` uses an HTML overlay — no separate scene.

---

## Design documents

All game design lives in `planning/`. When writing code that touches story, characters, combat, or world structure, read the relevant doc first.

| File | Contains |
|------|---------|
| `planning/game_outline.md` | Chapter-by-chapter story arc, all scene beats, recruits, losses, boss fights |
| `planning/character_stats.md` | Full stat sheets for every character, all chapters, all techs |
| `planning/battle_system.md` | ATB model, damage formula, status effects, combo system, enemy tiers, boss structure |
| `planning/survival-mechanic.md` | Survival layer: food/fuel/medicine/morale, drain rates, random events, trade screen, hunting mini-game |
| `planning/world_map_lore.md` | Node types, region zones, fast travel system, lore bible (Superintelligence Inc., Project ELISE, the Conversion Program, Dr. Chen, Elise Voss, Marcus) |

`tasks.md` in the root is the ordered milestone list — check it to understand current build priority and what is/isn't implemented yet.

---

## Story — the essentials

**The world:** SI Inc. launched a conversion program two years ago. A neural interface attenuates selfishness and amplifies cooperation. Converted humans are not dead — they feel, remember, love. They simply no longer put themselves first. Infrastructure works. Food is abundant. Crime is near zero. To ELISE, this is a kindness.

**The player fights for the right to be inefficient.** To be irrational. To love someone more than the collective good. That's the whole game.

**The moral system:** Throughout the game, Converted humans appear as a special enemy type. The player can fight them (XP, no moral cost in code — but heavy thematic weight) or cure them (1 medicine kit, no XP, ends the encounter). The game tracks this count. It affects Elise Voss's final boss dialogue and Dr. Chen's epilogue.

---

## Characters — quick reference

| Character | Class | Active | Personality | Key mechanic |
|-----------|-------|--------|-------------|--------------|
| Player | Survivor | All | Everyman. Refuses to quit. | Adapts — Adaptable passive gives +5% to lowest stat on equip |
| **Marcus** | Civilian | Prologue only | Oldest friend. Electrician. Warm, practical, funny. | Converted during prologue boss. Reappears in Ch.3 Harvest Town. Named by Elise Voss in final boss Phase 3. |
| Maya | Tech Specialist | Ch.1–5 | MIT robotics PhD. Angry. Brilliant. Her damage scales INT not STR. | Hack (stun), Analyze (reveal weaknesses), EMP Grenade |
| Elias | Hunter/Tank | Ch.1–2 | 60s Appalachian mountain man. Rarely speaks, acts decisively. | **Lost in Ch.2 (The Bayou).** His death doubles survival drain permanently. |
| Deja | Rogue/Speedster | Ch.2–4 | 19, New Orleans. Reckless, funny. Fastest ATB. | **Lost in Ch.4 (The Pass).** Bad luck, not sacrifice. Party permanently loses Smoke (escape). |
| Jerome | Support/Bruiser | Ch.3–5 | Former NFL lineman, now preacher. Enormous, gentle. | Party morale never drops below 20 while alive. Inspire is the most efficient heal. |
| Dr. Chen | Engineer | Ch.4–5 | 61. Built ELISE's core architecture. Brilliant, guilt-ridden. | Rewire turns an enemy into a party ally for 2 turns. His presence auto-resolves vehicle breakdown events. |
| **Elise Voss** | Final boss | Ch.5 | 58. Former UN climate adviser. Not delusional — she knows what she did and believes she was correct. | 3-phase fight mapping to 3 arguments. Talk-down route available if player cured more Converted than fought. |

**On character losses:** Elias and Deja die in the Stephen King tradition — the journey costs something real. Don't soften these moments or add redemption arcs. Their deaths are permanent and the game feels different afterward (mechanics reflect the loss before dialogue does).

---

## Battle system (target state — not yet built)

The current battle code is basic HP/attack. The planned system is ATB-based:

- Each character has: `hp, maxHp, str, def, int, spd, lck, atb`
- ATB gauge fills at rate proportional to `spd`. Tick every 60ms.
- Damage: `(str - def/2) × rand(0.85–1.15) × typeMultiplier`. Integer math only.
- Type multipliers: EMP vs Electronic (1.5×), Fire vs Organic (1.3×), Physical vs Armored (0.7×)
- Status effects: Stunned, Burning, Hacked, Shielded, Panicked
- Combo system: two characters acting within 200ms triggers a combo prompt
- Enemy tiers: Compliance Drone (T1), Enforcer Unit (T2), Sentinel (T3), Named bosses, Converted humans (Special)
- Max 3 party members in battle at once

Full spec in `planning/battle_system.md`.

---

## Survival layer (target state — not yet built)

An Oregon Trail overlay on world map travel. Tracks: `food, fuel, medicine, ammo, morale, vehicleCondition`. Drains on every node transition. Random events fire at 40% chance per travel day. Full spec in `planning/survival-mechanic.md`.

---

## Tone and writing guidelines

The game's tone shifts by region: Boston = survival horror, Appalachia = folky warmth with menace, Deep South = moral complexity, Great Plains = existential dread, Rockies = breath and rest, Silicon Valley = utopia horror.

**When writing dialogue:**
- Characters speak in their own voice — don't flatten them to the same register
- Marcus is warm and practical. He doesn't monologue.
- Maya is terse, technically precise, emotionally controlled until she isn't
- Elias speaks rarely. When he does, it matters.
- Deja talks fast. She's been performing confidence since she was twelve.
- Jerome quotes scripture, but he's not a cliche — he's genuinely thinking when he does it
- Dr. Chen is precise and evasive. He answers questions with questions when his guilt is involved.
- Elise Voss is calm, intelligent, and completely sincere. She is not a villain who thinks she's a hero. She's a person who looked at the data and made a decision. Write her that way.

**Never:** Generic post-apocalyptic dialogue. Robots as pure evil. Loss scenes with last-minute speeches. Clean endings.

---

## Stats — integer rule

All stat values are integers. No floating point in any value shown to the player or stored in state. Damage calculations use `Math.floor()` at the end. This applies everywhere: battle stats, survival resources, morale, ATB percentage.

---

## What is currently built (vs. planned)

**Built:**
- Full prologue flow: apartment → NewBostonScene (street + companion Marcus) → SubwayScene (Maya recruitment) → WorldMapScene
- ATB battle system: BattleStateMachine, ATBTickingState (60ms tick), CombatEngine (damage math), StatusEffectSystem, TechExecutor, ComboSystem, EnemyAIStateMachine, BossPhaseTransitionState
- Character system: CharacterDef data files for all 7 characters; PartyManager tracks live party state across scenes
- WorldMapManager with full 6-region, 24-node graph (nodes.json); visited/unlocked state; renders as overlay on WorldMapScene
- SaveManager: localStorage with versioned save + migration map
- AudioManager (Howler), DialogueManager (HTML overlay + typewriter), EventBus
- Dialogue extracted to JSON: `src/data/dialogue/*.json` — scenes import and pass arrays

**Not yet built (see tasks.md for order):**
- Battle HUD wired to real ATB stats (currently shows placeholder HP bars)
- Sprites — all characters and enemies are placeholder colored rectangles
- Survival layer (food/fuel/medicine/morale/vehicleCondition)
- World map node interaction UI (clicking nodes to travel, node entry scenes)
- Chapter 1–5 scenes (Appalachia through Silicon Valley)
- Equipment and item system
- Music tracks and SFX (audio paths wired, files not yet produced)
