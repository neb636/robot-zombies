import type { CharacterDef } from '../types.js';
import { npcStub } from './_npcStub.js';

/** Tilly — 11-year-old at Ridge Camp. Mute until Ch.3. NPC. */
export const TILLY_DEF: CharacterDef = npcStub('tilly', 'TILLY', 0x88aa66, 1);

export const TILLY_BOND_1  = 'tilly_bond_1'  as const;
export const TILLY_TRUSTED = 'tilly_trusted' as const;
