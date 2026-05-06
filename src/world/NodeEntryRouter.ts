import Phaser from 'phaser';
import type { NodeEntryData } from '../types.js';
import { EVENTS } from '../utils/constants.js';
import { bus }    from '../utils/EventBus.js';

// Scenes that are actually registered in the game config.
// All other scene keys are stubs — the router will show a toast.
const IMPLEMENTED_SCENES = new Set<string>([
  'NewBostonScene',
  'SubwayScene',
  'BattleScene',
  'WorldMapScene',
]);

/**
 * Maps node IDs to scene keys for click-to-travel on the world map.
 * The JSON is loaded at WorldMapScene.create() via NodeEntryRouter.setMap().
 * Nodes whose sceneKey is not in IMPLEMENTED_SCENES get a stub toast instead
 * of a real scene launch, keeping the map playable before all chapters are done.
 */
export class NodeEntryRouter {
  private static _map: Readonly<Record<string, NodeEntryData>> = {};

  /**
   * Called once at WorldMapScene boot with the loaded nodeEntryMap.json.
   */
  static setMap(map: Readonly<Record<string, NodeEntryData>>): void {
    NodeEntryRouter._map = map;
  }

  /**
   * Look up the entry for a node.  Returns null if the node has no mapping.
   */
  static fromNode(nodeId: string): NodeEntryData | null {
    return NodeEntryRouter._map[nodeId] ?? null;
  }

  /**
   * Emit NODE_ENTER and launch the target scene, or show a toast if the
   * sceneKey is not yet implemented.
   */
  static launchFromNode(scene: Phaser.Scene, nodeId: string): void {
    const entry = NodeEntryRouter.fromNode(nodeId);

    if (!entry) {
      // Node has no mapping at all — should not normally happen once JSON is loaded
      NodeEntryRouter._showToast(scene, 'Node not yet implemented.');
      bus.emit(EVENTS.NODE_ENTER, { nodeId, sceneKey: '__unmapped__' });
      return;
    }

    bus.emit(EVENTS.NODE_ENTER, { nodeId, sceneKey: entry.sceneKey });

    if (!IMPLEMENTED_SCENES.has(entry.sceneKey)) {
      NodeEntryRouter._showToast(
        scene,
        `[${entry.sceneKey.replace('Scene', '')} — coming soon]`,
      );
      return;
    }

    // Real scene — launch over the world map (world map pauses via BATTLE_END
    // pattern; individual chapter scenes are responsible for resuming).
    scene.scene.launch(entry.sceneKey, entry.data ?? {});
    scene.scene.pause();
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private static _showToast(scene: Phaser.Scene, message: string): void {
    const { width, height } = scene.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    const bg = scene.add
      .rectangle(cx, cy - 40, Math.min(360, width - 40), 48, 0x000000, 0.78)
      .setDepth(100)
      .setScrollFactor(0);

    const txt = scene.add
      .text(cx, cy - 40, message, {
        fontFamily: 'monospace',
        fontSize:   '13px',
        color:      '#ccddcc',
        align:      'center',
        wordWrap:   { width: 340, useAdvancedWrap: true },
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setScrollFactor(0);

    scene.tweens.add({
      targets:  [bg, txt],
      alpha:    { from: 1, to: 0 },
      delay:    1800,
      duration: 400,
      onComplete: () => { bg.destroy(); txt.destroy(); },
    });
  }
}
