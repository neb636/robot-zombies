# Stream A — Survival Layer

## Scope

Build the Oregon-Trail-style survival overlay that runs on the world map. Resources drain on travel, events fire on travel ticks, a trade screen handles buy/sell at safe houses, a hunting mini-game fires for Elias events.

**Primary spec:** `planning/survival-mechanic.md` is the canonical document. Read it first. Drain rates, event tables, trade prices, hunting rules all come from there.

## Files you OWN (create)

- `src/survival/SurvivalManager.ts` — persistent state, travelTick(), Phaser registry backing.
- `src/survival/TravelEvents.ts` — region-filtered event tables + rollRandomEvent().
- `src/survival/TradeCatalog.ts` — region price modifiers + buy/sell pricing.
- `src/survival/HuntingMiniGame.ts` — pure logic (no Phaser rendering here).
- `src/data/survival/events-boston.json`, `events-appalachia.json`, `events-deep-south.json`, `events-great-plains.json`, `events-rockies.json`, `events-silicon-valley.json`
- `src/data/survival/trade-<region>.json` per region
- `src/scenes/TradeScene.ts` — fills the pre-stubbed file. Must use MobileControls and tap-friendly menus.
- `src/scenes/HuntingScene.ts` — fills the pre-stubbed file. Arc-moving target + tap/space window.

## Files you MAY NOT TOUCH

- Anything outside `src/survival/`, `src/data/survival/`, `src/scenes/TradeScene.ts`, `src/scenes/HuntingScene.ts`. No exceptions.
- Do not edit `WorldMapScene.ts` — Stream B owns it and will listen for your events.
- Do not edit `constants.ts` — Phase B pre-added your flags/events.

## Event-bus contracts

You emit:
- `EVENTS.SURVIVAL_TICK` with payload `{state: SurvivalState, event?: TravelEvent}` — fire at the end of every `travelTick()` call.

You listen for:
- `EVENTS.WORLD_MAP_TRAVEL` with payload `{fromNodeId, toNodeId, days}` — call `travelTick(days)` in response.
- `EVENTS.BATTLE_END` — call `onBattleComplete()` to drain ammo and possibly medicine.

## Public API SurvivalManager must expose

```ts
class SurvivalManager {
  static instance(scene: Phaser.Scene): SurvivalManager;
  getState(): Readonly<SurvivalState>;
  travelTick(days?: number): { state: SurvivalState; event?: TravelEvent };
  applyEvent(event: TravelEvent): void;
  has(item: keyof SurvivalState, count: number): boolean; // used by ChoiceEngine
  consume(item: keyof SurvivalState, count: number): void;
  addItem(item: keyof SurvivalState, count: number): void;
  onBattleComplete(scripted: boolean): void;
  region(): Region;
  setRegion(region: Region): void;
}
```

`SurvivalState` is pre-defined in `src/types.ts` by Phase B. Use it as-is.

## Integration notes

- SurvivalManager stores state in the Phaser registry under key `'survivalState'` so `SaveManager` can serialize it (SaveManager already supports arbitrary registry blobs).
- All math **integer only**. Use `Math.floor` at every step.
- At `food = 0`: HP drains across overworld travel; morale drops −10/day.
- Morale < 30: emit a registry flag `MORALE_LOW` that BattleManager reads (−10% stat multiplier).
- Hunting mini-game: single arc, single press window, three outcome tiers (Perfect / Good / Miss). Do NOT make it rhythm-game complex.
- Trade: tap-friendly menu with +/− buttons. Keyboard support for desktop (arrows + enter).

## Acceptance

1. World map click triggers travel tick → food/fuel drop → survival HUD updates (Stream B renders HUD; you just emit event).
2. 40% of travel ticks emit an event payload.
3. Entering a safe house node fires `scene.launch('TradeScene')`; TradeScene reads/writes SurvivalManager state.
4. Hunting event triggers HuntingScene; success adds food; failure has 25% drone alert chance (sets a flag Stream B reads).
5. `npm run typecheck` clean.

## Reference reading

- `planning/survival-mechanic.md` (primary spec)
- `planning/world_map_lore.md` (node types and region flavor)
- `src/save/SaveManager.ts` (how to persist via registry)
- `src/utils/EventBus.ts` (event patterns)
- `src/utils/MobileControls.ts` (required on all interactive scenes)
