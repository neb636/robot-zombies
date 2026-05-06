# Stream D — Battle Gap-Fill

## Scope

Fill the remaining stubs in the ATB battle system: tech "special" effects, character passives, combo bonus effects, enemy reinforcement spawning. Existing ATB/damage/status infrastructure is complete — do NOT refactor it. Only fill stubs.

## Files you OWN

### Specials (fill pre-stubbed bodies)
- `src/battle/specials/Rally.ts` — Rally tech. Targets ally; fills their ATB gauge by `amount` (30-50). Used by Player (Overrun not Rally — check `src/characters/player.ts`), Chen (Overclock).
- `src/battle/specials/LastStand.ts` — passive-trigger. When caster HP drops below 20%, auto-cast next turn with +50% STR for 1 turn. Currently the tech exists as a menu option; convert to a *trigger* instead of a menu item (register in a turn-tick hook).
- `src/battle/specials/Overclock.ts` — Maya/Chen tech. +ATB gauge fill rate on ally for 2 turns (visual: faster bar fill).
- `src/battle/specials/SystemCrash.ts` — Maya ultimate. Against boss: skip one phase transition (directly drop to next threshold). No-op if not boss.
- `src/battle/specials/Control.ts` — Chen Rewire tech. For 2 turns, target enemy attacks its allies (flag `Hacked` already exists — extend to enemies attacking own).
- `src/battle/specials/index.ts` — dispatch map keyed by tech id.

### Passives (fill pre-stubbed bodies)
- `src/battle/passives/player.ts` — Adaptable: +5% to lowest stat on equip change. For now, apply once at battle start based on current equipment.
- `src/battle/passives/maya.ts` — Field Medic: Patch (existing tech) heals 30% more.
- `src/battle/passives/elias.ts` — Hunting Instinct: outside battle, boosts hunting mini-game success tier (SurvivalManager reads flag).
- `src/battle/passives/deja.ts` — Lucky Break: crit chance +10% (apply in CombatEngine variance calc — just raises the upper bound).
- `src/battle/passives/jerome.ts` — Anchor: while Jerome alive, morale never drops below 20 (SurvivalManager reads flag).
- `src/battle/passives/drChen.ts` — Field Engineer: +20% scrap drop rate (SurvivalManager reads flag on battle end).
- `src/battle/passives/marcus.ts` — Old Friend: +8 LCK to player while Marcus alive. Removed on conversion.
- `src/battle/passives/index.ts` — register/apply hooks.

### Combo bonuses (fill pre-stubbed bodies)
- `src/battle/combo/bonuses/Blackout.ts` — Maya + Player. +1.5× damage multiplier + guaranteed Stun on target.
- `src/battle/combo/bonuses/RighteousFire.ts` — Jerome + Elias. AoE fire damage to all enemies.
- `src/battle/combo/bonuses/DeadWeight.ts` — Deja + Player. Bonus damage scaling with enemy's stacked statuses.
- `src/battle/combo/bonuses/GhostAndShell.ts` — Deja + Dr. Chen. Damage + apply Shielded to caster.
- `src/battle/combo/bonuses/TheSermon.ts` — Jerome + Maya. Heal all allies + remove Panicked.
- `src/battle/combo/bonuses/index.ts` — map keyed by combo id. Hook into `ComboSystem.ts` via a bonus dispatch.

### Enemy Reinforcement
- `src/battle/EnemyReinforcement.ts` — implement the spawn flow. `EnemyAIStateMachine` currently sets `reinforcementCalled` on Sentinel; wire it so a second enemy gets added to `manager.enemies` and BattleHUD rebinds. Add `BattleManager.spawnReinforcement(enemyKey)` method.

## Files you MAY MODIFY (sole owner)

- `src/battle/TechExecutor.ts` — extend the `special`/`control` branches of the `execute()` function with a dispatch table that imports from `src/battle/specials/index.ts`. Do not touch other branches.
- `src/battle/EnemyAIStateMachine.ts` — replace the reinforcement-call stub with a real `manager.spawnReinforcement(...)` call. Don't touch charge/cooldown timing.
- `src/battle/ComboSystem.ts` — in `checkCombo()`, after a combo is discovered, dispatch the bonus effect from `src/battle/combo/bonuses/index.ts`. Don't touch detection logic.
- `src/battle/BattleManager.ts` — add `spawnReinforcement(key: string)` method only. Don't touch state machine transitions.

## Files you MAY NOT TOUCH

- Any scene, any character def, any enemy config.
- CombatEngine.ts (damage math is final).
- StatusEffectSystem.ts (effects are final; `Hacked` semantics for enemies-attacking-own is already wired).

## Acceptance

Verify via DevScene or unit harness:
1. Rally ally → ATB bar jumps visibly.
2. Player HP dropped below 20% → next turn triggers Last Stand automatically with +50% STR.
3. Maya casts Overclock on Jerome → Jerome's ATB fill rate doubles for 2 turns.
4. Maya casts System Crash on boss at Phase 1 → jumps directly to Phase 2 entry.
5. Chen Rewire → enemy shows Hacked status → enemy next turn attacks its own allies.
6. Sentinel survives 4 turns → second enemy spawns and HUD rebinds.
7. Each of 5 combos triggers distinct visible effect beyond HUD flash.
8. Passives apply visibly (player +5% lowest stat at start; Maya Patch heals more).
9. `npm run typecheck` clean.

## Reference reading

- `src/battle/*` — existing system (READ FIRST — don't duplicate infrastructure)
- `src/characters/*.ts` — tech definitions and `kind: 'special'` markers
- `planning/battle_system.md`
- `planning/character_stats.md`
