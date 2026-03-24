# Silicon Requiem

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

```
src/
  scenes/          Phaser scenes — one file per scene, one class per file
  entities/        Player, Enemy, AnimatedSprite base class
  battle/          BattleManager, BattleStateMachine, ATB states, CombatEngine
  characters/      Static CharacterDef data files (one per character)
  party/           PartyManager — live party state across scenes
  save/            SaveManager — localStorage persistence with migrations
  world/           WorldMapManager — node graph for overworld travel
  dialogue/        DialogueManager, DialogueBox (HTML overlay)
  audio/           AudioManager (Howler wrapper), ProceduralMusic, TTS
  ui/              BattleHUD, MenuItem
  utils/           EventBus (pub/sub), constants (EVENTS, TILE_SIZE, flags)
  data/
    dialogue/      Dialogue lines as JSON — one file per scene/chapter
    world/         nodes.json — world map node graph (all 6 regions)
  types.ts         All shared interfaces
  config.ts        Phaser game config + scene registry

public/assets/
  sprites/         characters/, enemies/
  tilesets/        PNG tilesets for Tiled maps
  ui/              HUD/menu art
  audio/           music/, sfx/
  maps/            Tiled JSON map exports
  tilemaps/        world.json (Tiled tilemap, currently placeholder)
```

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

**Dialogue:** Lines live in `src/data/dialogue/*.json`, not in scene files. Import the JSON and pass arrays directly to `dialogMgr.show(speaker, lines)`. Add dialogue by editing JSON — no TypeScript changes.

**Characters:** Each character is a static `CharacterDef` in `src/characters/`. `PartyManager` reads these to build live `PartyMember` state. `PartyManager.toAllyConfigs()` converts active party to battle data.

**Battle:** `BattleManager` owns the FSM (`BattleStateMachine`). ATB ticks every 60ms via `ATBTickingState`. Pure logic lives in `CombatEngine` (damage math) and `StatusEffectSystem` — no Phaser dependency, fully testable. Boss phases and scripted battles are configured via `BattleInitData` passed at scene launch.

**World map:** `WorldMapManager` owns the node graph (loaded from `nodes.json`). Call `markVisited(id)` to unlock connected nodes. Persist with `getVisitedIds()` → registry → `SaveManager`.

---

## Docs

Story, characters, combat, and world design live in `planning/`. Build order in `tasks.md`.
