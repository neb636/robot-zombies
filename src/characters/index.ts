import type { CharacterDef } from '../types.js';

// Party members
import { MARCUS_DEF }  from './marcus/index.js';
import { PLAYER_DEF }  from './player/index.js';
import { MAYA_DEF }    from './maya/index.js';
import { ELIAS_DEF }   from './elias/index.js';
import { DEJA_DEF }    from './deja/index.js';
import { JEROME_DEF }  from './jerome/index.js';
import { DR_CHEN_DEF } from './drChen/index.js';

// Side-character NPCs
import { SAM_DEF }     from './npcs/sam/index.js';
import { TILLY_DEF }   from './npcs/tilly/index.js';
import { CORA_DEF }    from './npcs/cora/index.js';
import { ROOK_DEF }    from './npcs/rook/index.js';
import { TOMAS_DEF }   from './npcs/tomas/index.js';
import { GIDEON_DEF }  from './npcs/gideon/index.js';
import { LILA_DEF }    from './npcs/lila/index.js';
import { MR_GRAY_DEF } from './npcs/mrGray/index.js';
import { ELENA_DEF }   from './npcs/elena/index.js';
import { GHOST_DEF }   from './npcs/ghost/index.js';
import { ECHO_DEF }    from './npcs/echo/index.js';

export {
  MARCUS_DEF, PLAYER_DEF, MAYA_DEF, ELIAS_DEF, DEJA_DEF, JEROME_DEF, DR_CHEN_DEF,
  SAM_DEF, TILLY_DEF, CORA_DEF, ROOK_DEF, TOMAS_DEF, GIDEON_DEF, LILA_DEF,
  MR_GRAY_DEF, ELENA_DEF, GHOST_DEF, ECHO_DEF,
};

/** Lookup map from character id to CharacterDef. */
export const CHARACTER_REGISTRY: Readonly<Record<string, CharacterDef>> = {
  [MARCUS_DEF.id]:  MARCUS_DEF,
  [PLAYER_DEF.id]:  PLAYER_DEF,
  [MAYA_DEF.id]:    MAYA_DEF,
  [ELIAS_DEF.id]:   ELIAS_DEF,
  [DEJA_DEF.id]:    DEJA_DEF,
  [JEROME_DEF.id]:  JEROME_DEF,
  [DR_CHEN_DEF.id]: DR_CHEN_DEF,
  [SAM_DEF.id]:     SAM_DEF,
  [TILLY_DEF.id]:   TILLY_DEF,
  [CORA_DEF.id]:    CORA_DEF,
  [ROOK_DEF.id]:    ROOK_DEF,
  [TOMAS_DEF.id]:   TOMAS_DEF,
  [GIDEON_DEF.id]:  GIDEON_DEF,
  [LILA_DEF.id]:    LILA_DEF,
  [MR_GRAY_DEF.id]: MR_GRAY_DEF,
  [ELENA_DEF.id]:   ELENA_DEF,
  [GHOST_DEF.id]:   GHOST_DEF,
  [ECHO_DEF.id]:    ECHO_DEF,
};
