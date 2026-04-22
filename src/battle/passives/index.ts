import type { PassiveEffect } from '../../types.js';
import { PLAYER_PASSIVE }  from './player.js';
import { MAYA_PASSIVE }    from './maya.js';
import { ELIAS_PASSIVE }   from './elias.js';
import { DEJA_PASSIVE }    from './deja.js';
import { JEROME_PASSIVE }  from './jerome.js';
import { DR_CHEN_PASSIVE } from './drChen.js';
import { MARCUS_PASSIVE }  from './marcus.js';

export const PASSIVE_REGISTRY: Readonly<Record<string, PassiveEffect>> = {
  player:  PLAYER_PASSIVE,
  maya:    MAYA_PASSIVE,
  elias:   ELIAS_PASSIVE,
  deja:    DEJA_PASSIVE,
  jerome:  JEROME_PASSIVE,
  dr_chen: DR_CHEN_PASSIVE,
  marcus:  MARCUS_PASSIVE,
};
