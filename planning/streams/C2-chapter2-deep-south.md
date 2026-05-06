# Stream C2 — Chapter 2: Deep South

## Scope

Build Tennessee/Mississippi/Louisiana — New Memphis, Mississippi Crossing, The Bayou, Vault 49. Deja recruitment, The Governor boss, Elias loss, Tomás Reyes side quest, Sam Calloway cameo, Vault 49 terminal puzzle with Elena Ortega recordings + Tilly's father audio.

## Files you OWN

### Scenes
- `src/scenes/chapter2/NewMemphisScene.ts` — story node, no combat. Deja recruitment. Tomás Reyes back-room confrontation (optional side quest).
- `src/scenes/chapter2/MississippiCrossingScene.ts` — hot zone. Two routes: bridge (combat dungeon) or ferry (survival event).
- `src/scenes/chapter2/BayouScene.ts` — neutral zone. Night travel, fog. **Elias loss scene triggers here** — scripted, unhurried, devastating. Per CLAUDE.md do not soften this.
- `src/scenes/chapter2/Vault49Scene.ts` — safe house + terminal puzzle. Sam Calloway cameo at trade terminal.
- `src/scenes/chapter2/index.ts` — scene bundle.

### Dialogue
- `src/data/dialogue/chapter2/new_memphis.json`
- `src/data/dialogue/chapter2/mississippi_crossing.json`
- `src/data/dialogue/chapter2/bayou.json`
- `src/data/dialogue/chapter2/vault_49.json`

Required anchors (cross-stream):
- `deep_south.tomas.offer` (choice row — see `dialogue_choices.md` §7)
- `bayou.elias.last_stand` (Elias loss — must call `PartyManager.removeMember('elias')` after scene)
- `vault_49.terminal.seq_1` / `seq_2` / `seq_3` (Elena Ortega recordings)
- `vault_49.terminal.tilly_father` (gated on `TILLY_TRUSTED`)
- `vault_49.sam.cameo`

### Enemies
- `src/entities/enemies/chapter2/theGovernor.ts` (human collaborator boss — morally complicated fight)
- `src/entities/enemies/chapter2/bridgeEnforcer.ts`
- `src/entities/enemies/chapter2/bayouSwimmer.ts`
- `src/entities/enemies/chapter2/index.ts`

### NPCs — fill stubs
- `src/characters/tomas.ts`
- `src/characters/elena.ts` (she's archival only — minimal def, voice profile only)

## Event-bus / flags

Set/read per `dialogue_choices.md`:
- `TOMAS_MET`, `TOMAS_DEBT_CLEARED`, `TOMAS_REFUSED`
- `ELIAS_LOST` (must be set after bayou scene)
- `VAULT49_TERMINALS_READ` (set after all three Elena recordings consumed)
- `TILLY_FATHER_HEARD` (gated on `TILLY_TRUSTED`)
- `SAM_MET_VAULT49`

## Critical beats

### Deja recruitment
Standard party-add flow. `PartyManager.addMember('deja', 2)` after her recruitment dialogue. Her existing `CharacterDef` is complete.

### Elias loss (Bayou)
- Scripted sequence: party is ambushed in fog, Elias stays behind to cover retreat. No redemption arc, no last-minute speech. Do NOT soften this.
- After scene: `PartyManager.removeMember('elias')`, set `ELIAS_LOST`.
- Survival drain doubles permanently from this point (doubled food drain rate). Emit a flag `ELIAS_DRAIN_ACTIVE`; SurvivalManager reads it.

### The Governor boss
Human collaborator — no robot tags. Cannot be hacked, cannot be EMP'd. Forces the player to rely on physical damage. Morally complex victory dialogue.

### Vault 49 terminal puzzle
Three sequential terminals. Each plays a lore audio log + shows a still-image overlay. After all three, `VAULT49_TERMINALS_READ` is set. A fourth terminal (Tilly's father audio) is gated on `TILLY_TRUSTED` — if the player didn't build the bond in Ch.1, it remains locked with a "[UNREADABLE]" label.

### Tomás Reyes side quest
Optional 2-room back-room dungeon. Completing it sets `TOMAS_DEBT_CLEARED`, Deja's morale +15, New Memphis ammo prices −20%. Refusing sets `TOMAS_REFUSED`.

## Reference reading

- `planning/game_outline.md` Ch.2
- `planning/world_map_lore.md` Deep South + Elena Ortega + Tilly thread sections
- `planning/side_characters.md` Tomás, Elena, Sam entries
- `planning/dialogue_choices.md` §7 and §8
- `src/characters/deja.ts`, `src/characters/elias.ts` — existing defs
