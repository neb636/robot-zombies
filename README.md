# Quiet Machines

https://neb636.github.io/robot-zombies/

A browser-based SNES-style JRPG (think *Chrono Trigger*, *Final Fantasy VI*). An AI called ELISE quietly took over the world two years ago — not through war, but through optimization. You travel from Boston to Silicon Valley to reach the source.

**The horror isn't the robots. It's how well everything works.**

---

## Stack

Phaser 3 · TypeScript · Vite · Howler

## Run

```bash
npm install
npm run dev       # localhost:5173
npm run typecheck
```

## Dev Scene Jumping

In dev mode, jump directly to any scene without playing through the full game flow.

**URL parameter** — append `?dev=<SceneName>` when opening the game:

```
localhost:5173?dev=WorldMapScene
localhost:5173?dev=BattleScene&enemy=warden_alpha
```

**In-game overlay** — press backtick (`` ` ``) at any time to toggle a scene-jump panel in the bottom-right corner.

Both methods seed `playerName = 'Dev'` and empty flags automatically. The dev overlay is stripped from production builds.

---

## Architecture

### Folder layout

Scenes and characters are organized as **one folder per entity**. A scene
folder owns its scene class, renderers, layout JSON, dialogue JSON, and
scene-specific art under `assets/`. A character folder owns its CharacterDef
and (for NPCs) its scene-spawn `Npc.ts`. Open one folder, see everything for
that scene/character — no hopping between four trees.

```
src/
  scenes/
    _core/                 framework scenes (boot, preload, battle, dialogue,
                           worldMap, trade, hunting, saveLoad, pauseMenu,
                           _dev/{Dev,SceneBuilder})
    prologue/              apartment/, newBoston/, subway/   + index.ts bundle
    chapter1/ … chapter5/  one folder per scene + index.ts bundle
                           e.g. chapter4/thePass/{ThePassScene.ts,
                                dialogue.json, assets/...}

  characters/
    <party-name>/index.ts          player, marcus, maya, elias, deja,
                                   jerome, drChen
    npcs/<npc-name>/index.ts       sam, tilly, cora, rook, tomas, gideon,
                                   lila, mrGray, elena, ghost, echo
    npcs/<npc-name>/Npc.ts         optional spawn config (only for NPCs that
                                   appear as physical sprites: cora, gideon,
                                   ghost)

  assets/                  cross-scene assets only (party travels with player,
                           UI is scene-agnostic)
    characters/<name>/     rotations/, animations/  — globbed by Vite
    audio/{music,sfx}/
    ui/icons/...
    world/world.json + world_tiles.png

  battle/  party/  save/  world/  dialogue/  audio/  ui/  utils/  entities/
  data/{survival,world}/   region-scoped data shared across scenes
  types.ts  config.ts  main.ts

public/assets/
  _staging/                PixelLab pipeline scratch space (generation only;
                           promoted assets land in src/scenes/<scene>/assets/
                           or src/assets/characters/<name>/)
```

### Per-scene folder convention

Every scene folder contains:
- `<Name>Scene.ts` — the Phaser scene class
- `dialogue.json` — speaker lines (no hardcoded dialogue strings in TS)
- `<Name>Renderer.ts` / `<Name>Layout.ts` — optional rendering helpers
- `layout.json` — optional map layout data
- `assets/` + `assets.ts` — optional scene-local art; `assets.ts` ESM-imports
  every PNG/JSON in `assets/` and exports a `{cacheKey: url}` map
- Chapter folders (`prologue/`, `chapter1/`–`chapter5/`, `_core/`) export a
  `*_SCENES` array via `index.ts` for `config.ts` to consume

### Asset hosting

Scene-specific PNG/JSON are loaded via Vite ESM imports — `import bedUrl
from './assets/objects/bed.png'` returns a content-hashed URL string that
Phaser loads with `this.load.image(key, bedUrl)`. The cache keys
(`'world-map'`, `'hero_north'`, `'car_black'`, etc.) are still global; only
the URL strings come from imports.

Cross-scene assets (party characters, UI, world map, audio) live under
`src/assets/` and are loaded once by `_core/preload/PreloadScene`.

### Scene flow

```
BootScene → PreloadScene → TitleScene → NameEntryScene
                                              ↓
                                        PrologueScene → NewBostonScene → SubwayScene
                                                                              ↓
                                                                        WorldMapScene
                                                                         ↕ (launch/pause)
                                                                        BattleScene
```

`BattleScene` runs in parallel on top of the calling scene (Phaser multi-scene). When battle ends, the parent scene resumes.

### Cross-scene state

| Mechanism | Used for |
|-----------|---------|
| Phaser registry | Party state, flags, visited nodes — survives scene transitions |
| `EventBus` (`bus`) | Loose coupling between scenes — `BATTLE_END`, `DIALOGUE_OPEN`, etc. |
| `SaveManager` | localStorage — versioned save file with migration map |

### Key patterns

**Dialogue:** Lines live in `dialogue.json` next to each scene's class file (e.g. `src/scenes/prologue/subway/dialogue.json`). Import the JSON and pass arrays directly to `dialogMgr.show(speaker, lines)`. Add dialogue by editing JSON — no TypeScript changes.

**Characters:** Each character is a static `CharacterDef` in `src/characters/<name>/index.ts`. NPCs that appear as physical sprites also have a `Npc.ts` sibling with their spawn position. `PartyManager` reads `CHARACTER_REGISTRY` (built from each character's `index.ts`) to build live `PartyMember` state.

**Battle:** `BattleManager` owns the FSM (`BattleStateMachine`). ATB ticks every 60ms via `ATBTickingState`. Pure logic lives in `CombatEngine` (damage math) and `StatusEffectSystem` — no Phaser dependency, fully testable. Boss phases and scripted battles are configured via `BattleInitData` passed at scene launch.

**World map:** `WorldMapManager` owns the node graph (loaded from `nodes.json`). Call `markVisited(id)` to unlock connected nodes. Persist with `getVisitedIds()` → registry → `SaveManager`.

---

## Docs

Story, characters, combat, and world design live in `planning/`. Build order in `tasks.md`.
