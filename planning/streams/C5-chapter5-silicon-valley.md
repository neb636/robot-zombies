# Stream C5 — Chapter 5: Silicon Valley

## Scope

Build Silicon Valley — The Valley Approach, SI Inc. Campus Perimeter, Mainframe Core, Boardroom. Lila Chen encounter, Mr. Gray antechamber talk-down, Marcus silent beat-3, Warden Six secret fight (optional), Elise Voss 3-phase final boss with talk-down route, Nora Voss audio log.

**This is the narrative payoff. No cuts without orchestrator signoff.**

## Files you OWN

### Scenes
- `src/scenes/chapter5/ValleyApproachScene.ts` — neutral zone. Pristine suburb. Robots ignore the party unless provoked. New behavior.
- `src/scenes/chapter5/CampusPerimeterScene.ts` — story node. Party splits for stealth. Chen's solo route. Lila Chen encounter (east wing optional route). Ghost key consumption here skips one forced-combat encounter.
- `src/scenes/chapter5/MainframeCoreScene.ts` — final dungeon, elite enemies only. Survival drain stops here. Hack Assist buff fires first combat if `ECHO_CURED`. Warden Six secret encounter if `SIX_BEATEN_CH1 && SIX_BEATEN_CH3` — drops `Six's Core`.
- `src/scenes/chapter5/BoardroomAntechamberScene.ts` — Mr. Gray dialogue-only encounter. Talk-down or fight.
- `src/scenes/chapter5/BoardroomScene.ts` — final boss. Elise Voss 3-phase fight. Phase 3 plays Nora audio log. Talk-down route available if `convertedCured > convertedFought`. Credits launch post-fight.
- `src/scenes/chapter5/index.ts`

### Dialogue
- `src/data/dialogue/chapter5/valley_approach.json`
- `src/data/dialogue/chapter5/campus_perimeter.json`
- `src/data/dialogue/chapter5/mainframe_core.json`
- `src/data/dialogue/chapter5/boardroom_antechamber.json`
- `src/data/dialogue/chapter5/boardroom.json`

Required anchors:
- `campus_perimeter.lila.approach` (choice row — §4)
- `boardroom_antechamber.gray.final` (choice row — §5)
- `boardroom.elise.phase1` / `phase2` / `phase3`
- `boardroom.elise.talkdown.seq_1` through `seq_6` (talk-down sub-tree — §6)
- `boardroom.nora_voicemail`

### Enemies
- `src/entities/enemies/chapter5/eliseVoss.ts` (existing in Enemy.ts — migrate to per-file. Three phases via BossConfig.)
- `src/entities/enemies/chapter5/mrGray.ts` (human — physical damage only, no hack/EMP)
- `src/entities/enemies/chapter5/wardenSixCh5.ts` (hardest variant)
- `src/entities/enemies/chapter5/eliteSecurityBot.ts`
- `src/entities/enemies/chapter5/index.ts`

### NPCs — fill stubs
- `src/characters/lila.ts`
- `src/characters/mrGray.ts`

## Flags set/read

- Reads: `MARCUS_CONVERTED`, `CORA_CURED`, `CORA_LEFT`, `ECHO_CURED`, `SIX_BEATEN_CH1`, `SIX_BEATEN_CH3`, `GHOST_KEY_OBTAINED`, `VAULT49_TERMINALS_READ`, `TILLY_SPOKE`, `TILLY_FATHER_HEARD`, `convertedCured`, `convertedFought`.
- Sets: `LILA_CURED` / `LILA_FOUGHT` / `LILA_SEEN_NOT_ENGAGED`, `MR_GRAY_TALKDOWN` / `MR_GRAY_DEFEATED`, `SIX_BEATEN_CH5`, `USED_GHOST_KEY_CH5`, `ELISE_TALKDOWN` / `ELISE_DEFEATED`, `MARCUS_NAMED_BY_ELISE` (existing, set during Phase 3 if talk-down primed).

## Critical beats

### Marcus silent beat-3
Campus Perimeter. During infiltration, Marcus stands at a maintenance door. He sees the player. He opens the door and walks past. No dialogue. No speech. Do not add speech. The scene's power is the absence.

### Lila Chen
Three-option choice (Cure / Fight / Leave). See `dialogue_choices.md` §4. Chen's epilogue has three distinct lines based on this.

### Mr. Gray
Dialogue-only encounter with a talk-down option gated on `convertedCured > convertedFought`. If talked down, he is found peacefully dead in the epilogue. See `dialogue_choices.md` §5.

### Elise Voss 3-phase fight
Existing `BossConfig` for `elise_voss` — extend to match `planning/world_map_lore.md` spec:
- **Phase 1** (100%→60%): "Look how peaceful it is." Summons Converted humans — cure or fight.
- **Phase 2** (60%→30%): "You can't go back." Disables Hack/Rewire. If `VAULT49_TERMINALS_READ`, Elise invokes Elena Ortega by name.
- **Phase 3** (30%→0%): "You'd do the same thing if you were me." Low-morale = higher damage output. Nora audio log plays. Talk-down option available if `convertedCured > convertedFought`.

### Talk-down sub-tree
See `dialogue_choices.md` §6 — six exchanges, player responses from 3-option menus on #2 and #4. Final response at #6 is ONE option, determined by `MR_GRAY_TALKDOWN`. Successful talk-down sets `ELISE_TALKDOWN`.

### Nora Voss audio log
Plays at start of Phase 3 regardless of route. A 14-second voicemail from 2014: *"Mom — I know. I'll be back by ten. I know. I love you. I know. Bye."*

### Warden Six secret
Maintenance corridor. Gated on both prior wins. Drops `Six's Core` — a one-time-use combo item usable in the Elise fight only.

### Credits
Post-fight credits play on the road east. If `ELISE_TALKDOWN` and `MARCUS_NAMED_BY_ELISE`, credits include an extra 4 seconds of the Boston apartment music over the final fade.

## Reference reading

- `planning/game_outline.md` Ch.5 + 2026-04 expansion
- `planning/world_map_lore.md` Elise Voss + 2026-04 lore section (Nora, Mr. Gray, Lila)
- `planning/side_characters.md` Mr. Gray, Lila, Warden Six entries
- `planning/dialogue_choices.md` §4, §5, §6
- `src/entities/Enemy.ts` existing `elise_voss` BossConfig
- `src/battle/states/BossPhaseTransitionState.ts`
