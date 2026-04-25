/**
 * Gideon — Harvest Town NPC. Ch.3.
 *
 * Fuel depot operator. Human, not Converted. Collaborator.
 * Optional: hints at the Echo signal if player asks (Ch.4 backtrack hook).
 *
 * Dialogue anchor: harvest_town.gideon.intro
 * Flag: GIDEON_MET
 * Optional flag: GIDEON_ECHO_HEARD (triggers if player selects echo choice)
 */

import type { NpcDef } from './cora.js';

export const GIDEON_DEF: NpcDef = {
  id:           'gideon',
  name:         'GIDEON',
  color:        0x887766,
  width:        18,
  height:       28,
  isConverted:  false,
  medicineCost: 0,
  x:            680,
  y:            400,
};
