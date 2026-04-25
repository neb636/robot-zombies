# Stream B — World Map Travel + Node Entry Router

## Scope

Turn the existing world map from a passive overlay into an interactive travel system. Player clicks or taps a connected node → travel animation plays → SurvivalManager emits a tick → NodeEntryRouter launches the target scene for that node. Also render the survival HUD on the world map.

## Files you OWN

- **Create:** `src/world/NodeEntryRouter.ts`, `src/data/world/nodeEntryMap.json`, `src/ui/SurvivalHUD.ts`, `src/ui/TravelOverlay.ts`.
- **Modify (sole owner):** `src/scenes/WorldMapScene.ts`.

## Files you MAY NOT TOUCH

- SurvivalManager internals. Communicate via events only.
- Any chapter scene. You don't open them — you route to them by key.

## Event-bus contracts

Emit:
- `EVENTS.WORLD_MAP_TRAVEL` with `{fromNodeId, toNodeId, days}` when a travel is confirmed.
- `EVENTS.NODE_ENTER` with `{nodeId, sceneKey}` when NodeEntryRouter launches a scene.

Listen for:
- `EVENTS.SURVIVAL_TICK` — refresh the HUD.
- `EVENTS.BATTLE_END` — return flow to world map if battle was launched from a node.

## NodeEntryRouter API

```ts
class NodeEntryRouter {
  static fromNode(nodeId: string): { sceneKey: string; data?: NodeEntryData } | null;
  static launchFromNode(scene: Phaser.Scene, nodeId: string): void;
}
```

`nodeEntryMap.json` shape:

```json
{
  "ridge_camp": { "sceneKey": "RidgeCampScene" },
  "harlan_mine": { "sceneKey": "HarlanMineScene" },
  "mit_campus": { "sceneKey": "MitCampusScene" }
}
```

If a node has no sceneKey yet, the router opens a stub "[Node not yet implemented]" dialog and allows the player to leave. This keeps the world map playable even before all chapters are done.

## Travel flow

1. Player clicks/taps a connected, unlocked node.
2. Show a confirmation prompt ("Travel to Ridge Camp? (1 day, −4 food −1 fuel)"). Tap/click to confirm.
3. Emit `EVENTS.WORLD_MAP_TRAVEL`.
4. Play 1.5s travel overlay (animated dotted line from current to target).
5. After the overlay, listen for `EVENTS.SURVIVAL_TICK` once. Update HUD.
6. If the tick's event was a battle ambush, launch BattleScene with the region's standard encounter.
7. Otherwise call `NodeEntryRouter.launchFromNode(this, toNodeId)`.

## Survival HUD

Small top-right panel. Shows: food, fuel, medicine, ammo, morale (0-100 bar), day count, region name. Must re-render on `EVENTS.SURVIVAL_TICK`. Semi-transparent. Doesn't block world map interaction.

## Mobile

- Nodes are tappable. Minimum 44px touch target (expand click area if smaller).
- Mobile confirm prompt uses on-screen buttons.
- TravelOverlay animations stay under 2s (no skip UI needed at that length).

## Acceptance

1. Clicking an unlocked connected node launches travel flow end-to-end.
2. Clicking an unconnected or locked node shows a toast ("Path not yet open" / "Travel this path first from a connected node").
3. HUD updates on every travel tick.
4. Fast-travel hub node offers "Fast travel" option (2 fuel + 1 food cost) after first visit — reads existing WorldMapManager unlock state.
5. `npm run typecheck` clean; world map still boots correctly; prologue flow remains unaffected.

## Reference

- `src/world/WorldMapManager.ts` (existing graph loader)
- `src/data/world/regions/*.json` (Phase B split these)
- `planning/world_map_lore.md`
- `src/scenes/WorldMapScene.ts` current state
