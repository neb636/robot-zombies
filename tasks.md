# Silicon Requiem — Task Board

> **2026-04-21 update:** the milestone-style task board has been archived. The project is now being built out in a one-shot parallel orchestration. Work is organized as independent streams in `planning/streams/`. This file is now a thin index.

## Active orchestration

See plan: `/Users/renaji/.claude/plans/read-planning-survival-mechanic-md-plann-purrfect-eich.md`

Story expansion:
- `planning/game_outline.md` (extended with 2026-04 plot lines)
- `planning/world_map_lore.md` (extended Lore Bible)
- `planning/side_characters.md` (11 new NPCs)
- `planning/dialogue_choices.md` (all branching points + flag inventory)

## Stream briefs (one file per subagent)

| Stream | Brief | Owner |
|--------|-------|-------|
| A | `planning/streams/A-survival.md` | Survival layer, SurvivalManager, trade + hunting mini-game |
| B | `planning/streams/B-world-map-travel.md` | Click-to-travel, node entry router, survival HUD |
| C1 | `planning/streams/C1-chapter1-appalachia.md` | Blue Ridge / Ridge Camp / Harlan Mine / Mountain Pass |
| C2 | `planning/streams/C2-chapter2-deep-south.md` | New Memphis / Mississippi / Bayou / Vault 49 |
| C3 | `planning/streams/C3-chapter3-great-plains.md` | Open Highway / Harvest Town / Storm Corridor / Radio Tower |
| C4 | `planning/streams/C4-chapter4-rockies.md` | High Altitude / Ghost Town / Hermit's Peak / The Pass |
| C5 | `planning/streams/C5-chapter5-silicon-valley.md` | Valley / Campus Perimeter / Mainframe / Boardroom |
| D | `planning/streams/D-battle-gap-fill.md` | Tech specials, passives, combo bonuses, reinforcements |
| E | `planning/streams/E-art.md` | Region tilesets, NPC sprites, enemy sprites (procedural) |
| F | `planning/streams/F-audio.md` | Region themes, battle music, SFX (procedural) |
| G | `planning/streams/G-save-pause-choice.md` | Save/Load UI, Pause Menu, Dialogue Choice Engine |

## Phase ordering

1. **Phase A** — Storyline beef-up (docs) — *done*.
2. **Phase B** — Serial foundation (orchestrator alone): shatter shared registries, pre-stub subsystems, pre-expand types + flags + events, commit `chore: fan-out scaffolding`.
3. **Phase C** — Parallel fan-out (9 Sonnet subagents in worktrees, streams A–G above).
4. **Phase D** — Serial merge: F → E → D → A → B → G → C1 → C2 → C3 → C4 → C5. Typecheck + boot gate between each. End-to-end smoke per plan's verification section.

## Archived milestone history

The prior milestone-based task board is now history; prologue (Boot → Title → NameEntry → Apartment → New Boston → Subway → World Map) is complete and playable. ATB battle system is ~85% real. See git log for milestone completion.
