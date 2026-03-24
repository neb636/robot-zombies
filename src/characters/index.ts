import type { CharacterDef } from '../types.js';
import { MARCUS_DEF }  from './marcus.js';
import { PLAYER_DEF }  from './player.js';
import { MAYA_DEF }    from './maya.js';
import { ELIAS_DEF }   from './elias.js';
import { DEJA_DEF }    from './deja.js';
import { JEROME_DEF }  from './jerome.js';
import { DR_CHEN_DEF } from './drChen.js';

export { MARCUS_DEF, PLAYER_DEF, MAYA_DEF, ELIAS_DEF, DEJA_DEF, JEROME_DEF, DR_CHEN_DEF };

/** Lookup map from character id to CharacterDef. */
export const CHARACTER_REGISTRY: Readonly<Record<string, CharacterDef>> = {
  [MARCUS_DEF.id]:  MARCUS_DEF,
  [PLAYER_DEF.id]:  PLAYER_DEF,
  [MAYA_DEF.id]:    MAYA_DEF,
  [ELIAS_DEF.id]:   ELIAS_DEF,
  [DEJA_DEF.id]:    DEJA_DEF,
  [JEROME_DEF.id]:  JEROME_DEF,
  [DR_CHEN_DEF.id]: DR_CHEN_DEF,
};
