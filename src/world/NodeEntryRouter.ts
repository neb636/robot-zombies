import Phaser from 'phaser';
import type { NodeEntryData } from '../types.js';
import { EVENTS } from '../utils/constants.js';
import { bus }    from '../utils/EventBus.js';

/**
 * Maps node IDs to scene keys for click-to-travel on the world map.
 *
 * PHASE B STUB — Stream B fills the map from `src/data/world/nodeEntryMap.json`.
 * Returns `null` for unmapped nodes; WorldMapScene can show a
 * "[Not yet implemented]" prompt in that case to keep the map playable.
 */
const EMPTY_MAP: Readonly<Record<string, NodeEntryData>> = {};

export class NodeEntryRouter {
  private static _map: Readonly<Record<string, NodeEntryData>> = EMPTY_MAP;

  /** Stream B will call setMap(...) on scene load with the loaded JSON. */
  static setMap(map: Readonly<Record<string, NodeEntryData>>): void {
    NodeEntryRouter._map = map;
  }

  static fromNode(nodeId: string): NodeEntryData | null {
    return NodeEntryRouter._map[nodeId] ?? null;
  }

  static launchFromNode(scene: Phaser.Scene, nodeId: string): void {
    const entry = NodeEntryRouter.fromNode(nodeId);
    if (!entry) {
      // Unmapped node — emit NODE_ENTER with a placeholder key so the
      // world map can show a toast without crashing.
      bus.emit(EVENTS.NODE_ENTER, { nodeId, sceneKey: '__unmapped__' });
      return;
    }
    bus.emit(EVENTS.NODE_ENTER, { nodeId, sceneKey: entry.sceneKey });
    scene.scene.launch(entry.sceneKey, entry.data ?? {});
  }
}
