import type { CharacterDef } from '../types.js';
import { npcStub } from './_npcStub.js';

/**
 * Sam "Shotgun" Calloway — Appalachia quartermaster NPC.
 * Recurring merchant across Ch.1–3. Not playable.
 */
export const SAM_DEF: CharacterDef = npcStub('sam', 'SAM', 0xcc8866, 1);

/** Flag set when the player returns Sam's husband's rifle. */
export const SAM_HUSBAND_RIFLE_FOUND = 'sam_husband_rifle_found' as const;
