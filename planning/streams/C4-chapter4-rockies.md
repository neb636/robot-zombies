# Stream C4 — Chapter 4: Rockies / Utah

## Scope

Build Colorado Rockies / Utah Desert — High Altitude Camp, Ghost Town, Hermit's Peak, The Pass. Dr. Chen recruitment, Gate Colossus boss, Deja loss, Echo subplot.

## Files you OWN

### Scenes
- `src/scenes/chapter4/HighAltitudeCampScene.ts` — safe house, altitude sickness mechanic (−10% stats unless rested 1 day).
- `src/scenes/chapter4/GhostTownScene.ts` — ruins. Story-only, no combat. Journals and photos. Morale event. Optional flashback sequence about the community.
- `src/scenes/chapter4/HermitsPeakScene.ts` — story node. Dr. Chen recruitment. Echo subplot choice. Lore terminals with full Superintelligence Inc. history.
- `src/scenes/chapter4/ThePassScene.ts` — hot zone gauntlet, 5 scripted rooms. Gate Colossus boss. **Deja loss triggers here** — bad luck, not sacrifice. Unhurried, cruel.
- `src/scenes/chapter4/index.ts`

### Dialogue
- `src/data/dialogue/chapter4/high_altitude_camp.json`
- `src/data/dialogue/chapter4/ghost_town.json`
- `src/data/dialogue/chapter4/hermits_peak.json`
- `src/data/dialogue/chapter4/the_pass.json`

Required anchors:
- `rockies.chen.recruitment`
- `rockies.echo.plea` (choice row — §3 of `dialogue_choices.md`)
- `rockies.deja.final` (Deja loss scene)
- `rockies.ghost_town.journals` (story beats)

### Enemies
- `src/entities/enemies/chapter4/gateColossus.ts` (titan-class boss)
- `src/entities/enemies/chapter4/blockadeSentry.ts`
- `src/entities/enemies/chapter4/desertScavenger.ts`
- `src/entities/enemies/chapter4/index.ts`

### NPCs — fill stubs
- No new NPCs in Ch.4 beyond Echo and a one-survivor-at-Ghost-Town (optional). Echo is an AI "character" — give it a minimal CharacterDef at `src/characters/echo.ts` with a robot-voice profile (eSpeak) for TTS.

## Flags set/read

- `DR_CHEN_RECRUITED`
- `ECHO_CURED` XOR `ECHO_REFUSED`
- `DEJA_LOST` (required after The Pass scene)

## Critical beats

### Dr. Chen recruitment
At Hermit's Peak. `PartyManager.addMember('dr_chen', 4)`. His existing `CharacterDef` is complete.

### Echo subplot
At Hermit's Peak, after Chen recruitment. Accessing Chen's satellite console fires the Echo dialogue. Chen warns against cure. Player chooses:
- **Cure** → `ECHO_CURED` → Ch.5 Mainframe Core opens with a one-time Hack Assist buff.
- **Refuse** → `ECHO_REFUSED`.

Implement the Hack Assist buff as a registry flag that Stream C5 reads; don't add cross-stream logic.

### Deja loss
The Pass, Room 4 of 5. Deja goes down to sentry fire mid-run. Party can't stop and carry her. She laughs once. "I thought I was supposed to die running something." She dies. Party keeps moving. Per CLAUDE.md: no softening, no speeches.

After scene: `PartyManager.removeMember('deja')`, set `DEJA_LOST`. Permanent loss of Smoke (escape tech — already defined in deja.ts, but no active ally → no access).

### Gate Colossus boss
Titan-class. High HP, multi-phase. Uses a new "Crushing Weight" ATB-delaying attack. BossConfig with 3 phases.

### Altitude sickness (High Altitude Camp)
On first entry: −10% stats until the party rests one day at the camp. Rest interaction fires a day-pass on SurvivalManager. After rest, stat multiplier restored.

## Reference reading

- `planning/game_outline.md` Ch.4 + 2026-04 expansion section
- `planning/world_map_lore.md` Rockies section
- `planning/dialogue_choices.md` §3 (Echo)
- `src/characters/deja.ts`, `src/characters/drChen.ts`
- `src/battle/MarcusConversionState.ts` — reference for scripted party-member-exit sequences; mirror its tone for Deja loss
