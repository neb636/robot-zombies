# Stream C3 — Chapter 3: Great Plains

## Scope

Build Kansas/Nebraska/Oklahoma — Open Highway, Harvest Town, Storm Corridor, Radio Tower. Jerome recruitment, Sentinel Spire boss, Marcus Harvest Town beat, Cora Jerome choice, Converted Child encounter, Gideon, Ghost reveal, Warden Six second fight, Tilly speaking scene, Sam Calloway third cameo.

**This is the densest chapter. Plan carefully. Cut Rook cameo or secret Six fight before cutting any Ch.3 beat.**

## Files you OWN

### Scenes
- `src/scenes/chapter3/OpenHighwayScene.ts` — hot zone, aerial Sentinel patrol, teaches stealth movement.
- `src/scenes/chapter3/HarvestTownScene.ts` — neutral zone. Marcus encounter (existing dialogue already references this in Harvest Town wording — reuse), Cora Jerome cure/leave choice, Converted Child encounter, Gideon meeting.
- `src/scenes/chapter3/StormCorridorScene.ts` — hot zone. Weather mechanic: lightning reduces encounter rate −50% but storm damage per turn. Warden Six Ch.3 fight here.
- `src/scenes/chapter3/RadioTowerScene.ts` — fast travel hub. Jerome recruitment BEFORE the tower. Sentinel Spire boss. Post-boss: Ghost meeting (encryption key), Sam Calloway third cameo, Tilly speaking scene (gated on `TILLY_TRUSTED`).
- `src/scenes/chapter3/index.ts`

### Dialogue
- `src/data/dialogue/chapter3/open_highway.json`
- `src/data/dialogue/chapter3/harvest_town.json`
- `src/data/dialogue/chapter3/storm_corridor.json`
- `src/data/dialogue/chapter3/radio_tower.json`

Required anchors:
- `harvest_town.cora.offer` (choice row — see `dialogue_choices.md` §1)
- `harvest_town.cora.cure`, `harvest_town.cora.leave` (branch targets)
- `harvest_town.child.approach` (choice row — see §2)
- `harvest_town.marcus.encounter` (existing Marcus beat 2 — one second too long)
- `harvest_town.gideon.intro`
- `radio_tower.jerome.recruitment`
- `radio_tower.ghost.reveal`
- `radio_tower.sam.cameo`
- `radio_tower.tilly.speaks` (gated on `TILLY_TRUSTED`)
- `storm_corridor.warden_six.return`

### Enemies
- `src/entities/enemies/chapter3/sentinelSpire.ts`
- `src/entities/enemies/chapter3/wardenSixCh3.ts` (rebuilt, stronger stats)
- `src/entities/enemies/chapter3/aerialSentinel.ts`
- `src/entities/enemies/chapter3/convertedCitizen.ts` (variant for Harvest Town ambient encounters)
- `src/entities/enemies/chapter3/index.ts`

### NPCs — fill stubs
- `src/characters/cora.ts`
- `src/characters/gideon.ts`
- `src/characters/ghost.ts`

## Flags set/read

Per `dialogue_choices.md`:
- `CORA_CURED` XOR `CORA_LEFT` (§1)
- `CONVERTED_CHILD_CURED` XOR `CONVERTED_CHILD_LEFT` (§2)
- `SIX_BEATEN_CH3`
- `GIDEON_MET`, `GIDEON_ECHO_HINT` (optional on backtrack)
- `STATIC_REAL_MET`, `GHOST_KEY_OBTAINED`
- `TILLY_SPOKE` (scene gated on `TILLY_TRUSTED`)
- `SAM_MET_RADIO`
- `JEROME_RECRUITED`
- `SAW_MARCUS_HARVEST_TOWN` (existing flag — already primed by Ridge Camp rumor)

## Critical beats

### Jerome recruitment
`PartyManager.addMember('jerome', 3)` at Radio Tower before boss climb.

### Marcus Harvest Town beat (existing spec)
One second too long. "This is a good place. You should consider the program." He goes back to weeding. Maya walks the player away. Non-combat. Cannot cure him here. Neither of you brings it up at camp that night.

### Cora Jerome (see side_characters.md)
Choice row. Medicine ≥ 2 gate on cure. Jerome's post-scene dialogue forks permanently.

### The Converted Child
Attack menu suppressed. Cure requires medicine ≥ 2 — if insufficient, the cure option is replaced with a disabled-state "You don't have enough supplies" line that forces the LEFT branch.

### Gideon
Blind, "sees" the party by gait, tells them which house Marcus is in. Optional Echo hint on backtrack.

### Ghost at Radio Tower
Post-Spire. One scene. Hands over encryption key. Does not join party.

### Tilly speaks
Only fires if `TILLY_TRUSTED`. Her line: *"He said it wasn't worth the cost."*

### Warden Six return
Storm Corridor. Harder version. `SIX_BEATEN_CH3` on victory. Post-fight: torso crawls into the storm.

## Reference reading

- `planning/game_outline.md` Ch.3 + 2026-04 expansion section
- `planning/world_map_lore.md` Great Plains + Ghost + Warden Six + Tilly thread
- `planning/side_characters.md` Cora, Gideon, Ghost, Warden Six entries
- `planning/dialogue_choices.md` §1, §2, §8
- Existing prologue Marcus conversion code (`src/battle/states/MarcusConversionState.ts`) — reference for the tone of Marcus beats
