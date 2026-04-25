# Stream C1 — Chapter 1: Appalachia

## Scope

Build the Chapter 1 Appalachian Trail Corridor. Four scenes, Elias recruitment, Excavator Prime boss, Warden Six first encounter, intro of Sam Calloway + Tilly, Rook cameo, Static subplot seed.

## Files you OWN

### Scenes (create all four)
- `src/scenes/chapter1/BlueRidgePassageScene.ts` — neutral zone, dense forest, Elias introduction + first hunting event. Rook cameo at mid-path.
- `src/scenes/chapter1/RidgeCampScene.ts` — safe house. Sam Calloway merchant, Tilly bond opportunity, side-quest giver NPC, campfire event, rumor about Marcus in Kansas.
- `src/scenes/chapter1/HarlanMineScene.ts` — hot-zone dungeon (4 floors of procedural-grid rooms, ~5 encounters, Excavator Prime boss, Warden Six first fight as a post-boss surprise).
- `src/scenes/chapter1/MountainPassScene.ts` — transition zone. First vehicle encounter. Survival drain +50%. Leads to Ch.2 entry node.
- `src/scenes/chapter1/index.ts` — exports all four as a scene bundle for `config.ts` aggregation.

### Dialogue JSON (create)
- `src/data/dialogue/chapter1/blue_ridge.json`
- `src/data/dialogue/chapter1/ridge_camp.json`
- `src/data/dialogue/chapter1/harlan_mine.json`
- `src/data/dialogue/chapter1/mountain_pass.json`

Dialogue anchors required (referenced by other streams):
- `ridge_camp.sam.intro`
- `ridge_camp.tilly.campfire_offer`
- `ridge_camp.marcus_rumor`
- `ridge_camp.rook.cameo`
- `harlan_mine.warden_six.taunt`

### Enemies (create)
- `src/entities/enemies/chapter1/excavatorPrime.ts`
- `src/entities/enemies/chapter1/wardenSixCh1.ts`
- `src/entities/enemies/chapter1/complianceSwarm.ts` (variant compliance drone)
- `src/entities/enemies/chapter1/index.ts` — bundle file referenced by the enemy registry

### NPCs — fill the pre-stubbed CharacterDefs
- `src/characters/sam.ts` (Phase B created empty stub — you fill the body)
- `src/characters/tilly.ts` (same)
- `src/characters/rook.ts` (same)

NPCs are not party members. Their `CharacterDef` should have `joinChapter: null` (or whatever Phase B's stub signals) and empty `techs` arrays. Stats fields can be default/minimal. The *point* of these defs is to have a canonical name, color, and voice-profile reference.

## Files you MAY NOT TOUCH

- Anything outside `src/scenes/chapter1/`, `src/data/dialogue/chapter1/`, `src/entities/enemies/chapter1/`, and your three assigned NPC files.
- `src/config.ts` — you register scenes via your chapter `index.ts`, orchestrator includes it in the aggregator. Do not edit config.ts directly.
- `src/characters/index.ts` — Phase B already wired your NPC imports.
- Elias `src/characters/elias.ts` — already complete; do not modify.

## Event-bus contracts

- Listen for `EVENTS.NODE_ENTER` — your scenes launch in response.
- Emit `EVENTS.BATTLE_START` via existing BattleScene launches.

## Gameplay requirements

### BlueRidgePassageScene
- Player + active party (Maya always present) explore a forest path.
- Elias appears at mid-path, triggers dialogue, offers to join. Call `PartyManager.addMember('elias', 1)` on acceptance.
- First hunting event fires here if Elias joined (emit `EVENTS.WORLD_MAP_TRAVEL`-adjacent event — actually just launch HuntingScene directly).
- Rook cameo at mid-path — optional dialogue + one-time purchase (Silencer Oil item).

### RidgeCampScene
- Safe-house: full heal on entry, TradeScene accessible via interact prompt with Sam Calloway.
- Tilly bond campfire event: interact with Tilly at dusk, optional small-food gift → `TILLY_BOND_1` + `TILLY_TRUSTED` flags.
- Sam side quest: find her husband's rifle in Harlan Mine. Sets `SAM_HUSBAND_RIFLE_FOUND` → unlocks discounted inventory on return.
- Ridge Camp overheard rumor NPC: "I saw someone like your friend in Kansas. Tending something that didn't need tending." Sets `SAW_MARCUS_HARVEST_TOWN` flag pre-read (primes Ch.3 Harvest Town recognition).

### HarlanMineScene
- Linear 4-floor dungeon. Mine-tile palette.
- Forced combats along the way. Compliance Swarm encounters.
- Optional room contains Sam's husband's rifle (interactable).
- Floor 4: Excavator Prime boss. BossConfig with 2 phases.
- Post-boss: Warden Six appears as a surprise encounter (one-shot fight). Sets `SIX_BEATEN_CH1` on victory. Warden Six's glitch-dialogue plays as the party walks away.

### MountainPassScene
- Transition to Ch.2. Vehicle encounter dialogue, storyline beat, leads to world map node transition.

## Mobile compliance

Every interactive scene must instantiate `MobileControls`, expose `mobileControls` on the scene, destroy on shutdown. Interact prompts use `mobileControls.showInteract(label)` / `hideInteract()` and listen for `interact:tap` alongside `keydown-E`. Menus must be tap-friendly.

## Reference

- `planning/game_outline.md` Ch.1 section (read first)
- `planning/world_map_lore.md` Appalachia section
- `planning/side_characters.md` Sam, Tilly, Rook, Warden Six entries
- `planning/dialogue_choices.md` flag inventory (for all flags listed above)
- `src/scenes/NewBostonScene.ts` — reference implementation for an exploration-plus-boss scene with Marcus companion
- `src/scenes/SubwayScene.ts` — reference for a safe-house scene with recruit dialogue
- `src/characters/elias.ts` — existing def to reference stats when enabling him
