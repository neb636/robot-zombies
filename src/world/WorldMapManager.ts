/**
 * WorldMapManager — owns the node graph for the overworld.
 *
 * Loads node definitions from src/data/world/nodes.json and tracks
 * which nodes have been visited/unlocked. Call markVisited() after
 * the player completes a node's content — it auto-unlocks connected nodes.
 *
 * Node type colour reference (for rendering):
 *   safe_house      → 0x44cc44  green
 *   hot_zone        → 0xcc3333  red
 *   neutral_zone    → 0xddaa22  amber
 *   story_node      → 0xaa44cc  purple
 *   fast_travel_hub → 0x4488ff  blue
 *   ruins           → 0x888888  grey
 */

export type NodeType =
  | 'safe_house'
  | 'hot_zone'
  | 'neutral_zone'
  | 'story_node'
  | 'fast_travel_hub'
  | 'ruins';

export const NODE_COLORS: Record<NodeType, number> = {
  safe_house:      0x44cc44,
  hot_zone:        0xcc3333,
  neutral_zone:    0xddaa22,
  story_node:      0xaa44cc,
  fast_travel_hub: 0x4488ff,
  ruins:           0x888888,
};

export interface WorldNode {
  id: string;
  name: string;
  type: NodeType;
  /** Pixel position on the world map canvas. */
  mapX: number;
  mapY: number;
  /** IDs of directly connected nodes. */
  connections: readonly string[];
  /** Whether the node is accessible from the start (before visiting any neighbour). */
  startUnlocked: boolean;
  /** Optional Phaser scene key to launch when the player enters this node. */
  sceneKey?: string;
}

export interface WorldRegion {
  id: string;
  name: string;
  /** Story chapter this region belongs to (0 = prologue). */
  chapter: number;
  nodes: readonly WorldNode[];
}

interface NodeData {
  regions: Array<{
    id: string;
    name: string;
    chapter: number;
    nodes: Array<{
      id: string;
      name: string;
      type: string;
      mapX: number;
      mapY: number;
      connections: readonly string[];
      startUnlocked: boolean;
      sceneKey?: string;
    }>;
  }>;
}

export class WorldMapManager {
  private readonly _regions: WorldRegion[];
  private readonly _nodeIndex: Map<string, WorldNode>;
  private readonly _visited: Set<string>;
  private readonly _unlocked: Set<string>;

  constructor(data: NodeData, savedVisited: readonly string[] = []) {
    this._visited  = new Set(savedVisited);
    this._unlocked = new Set<string>();
    this._nodeIndex = new Map<string, WorldNode>();

    // Cast and index nodes; unlock startUnlocked ones
    this._regions = data.regions.map(r => ({
      id:      r.id,
      name:    r.name,
      chapter: r.chapter,
      nodes:   r.nodes.map(n => {
        const node: WorldNode = {
          id:            n.id,
          name:          n.name,
          type:          n.type as NodeType,
          mapX:          n.mapX,
          mapY:          n.mapY,
          connections:   n.connections,
          startUnlocked: n.startUnlocked,
          ...(n.sceneKey !== undefined && { sceneKey: n.sceneKey }),
        };
        this._nodeIndex.set(node.id, node);
        if (node.startUnlocked) this._unlocked.add(node.id);
        return node;
      }),
    }));

    // Restore unlocked state from visited history
    for (const id of this._visited) {
      this._unlockNeighbours(id);
    }
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  getNode(id: string): WorldNode | undefined {
    return this._nodeIndex.get(id);
  }

  getAllNodes(): WorldNode[] {
    return [...this._nodeIndex.values()];
  }

  getRegions(): WorldRegion[] {
    return this._regions;
  }

  isVisited(id: string): boolean {
    return this._visited.has(id);
  }

  isUnlocked(id: string): boolean {
    return this._unlocked.has(id);
  }

  canTravel(fromId: string, toId: string): boolean {
    const from = this._nodeIndex.get(fromId);
    if (!from) return false;
    return from.connections.includes(toId) && this._unlocked.has(toId);
  }

  // ─── Mutations ────────────────────────────────────────────────────────────

  /** Mark a node visited and unlock its direct neighbours. */
  markVisited(id: string): void {
    this._visited.add(id);
    this._unlocked.add(id);
    this._unlockNeighbours(id);
  }

  /** Returns visited node IDs for persistence (save to registry / SaveData). */
  getVisitedIds(): string[] {
    return [...this._visited];
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private _unlockNeighbours(id: string): void {
    const node = this._nodeIndex.get(id);
    if (!node) return;
    for (const connId of node.connections) {
      this._unlocked.add(connId);
    }
  }
}
