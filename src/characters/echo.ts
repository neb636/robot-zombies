import type { CharacterDef } from '../types.js';
import { npcStub } from './_npcStub.js';

/** Echo — failing Earth-observation satellite AI (Ch.4 subplot). NPC. */
export const ECHO_DEF: CharacterDef = npcStub('echo', 'ECHO', 0x44aadd, 4);

export const ECHO_META = {
  id:    'echo',
  name:  'ECHO',
  displayName: 'ECHO',
  realName: 'Rachel',
  color: 0x6688aa,
  width: 32,
  height: 48,
  ttsProfile: { rate: 0.82, pitch: 0.95, volume: 0.9, voice: 'female' as const },
  requiresFlag: 'DR_CHEN_RECRUITED',
  curedFlag:    'ECHO_CURED',
  refusedFlag:  'ECHO_REFUSED',
  medicineCost: 1,
} as const;

/** Legacy alias expected by Ch.4 scenes. */
export const ECHO_NPC = ECHO_META;
