/**
 * Cora — Harvest Town NPC. Ch.3.
 *
 * Converted volunteer. Runs the communal kitchen.
 * Not hostile. Not quite herself.
 *
 * Dialogue anchor: harvest_town.cora.offer
 * Flag outcomes: CORA_CURED (medicine >= 2 spent) XOR CORA_LEFT
 */

export interface NpcDef {
  id: string;
  name: string;
  /** Hex color for placeholder rectangle sprite. */
  color: number;
  width: number;
  height: number;
  /** Whether this NPC can be cured (is Converted). */
  isConverted: boolean;
  /** Medicine cost to cure. */
  medicineCost: number;
  /** X position in scene. */
  x: number;
  /** Y position in scene. */
  y: number;
}

export const CORA_DEF: NpcDef = {
  id:           'cora',
  name:         'CORA',
  color:        0x8899aa,
  width:        16,
  height:       26,
  isConverted:  true,
  medicineCost: 2,
  x:            480,
  y:            320,
};
