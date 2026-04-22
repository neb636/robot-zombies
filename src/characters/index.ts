import type { CharacterDef } from '../types.js';

// Party members (existing)
import { MARCUS_DEF }  from './marcus.js';
import { PLAYER_DEF }  from './player.js';
import { MAYA_DEF }    from './maya.js';
import { ELIAS_DEF }   from './elias.js';
import { DEJA_DEF }    from './deja.js';
import { JEROME_DEF }  from './jerome.js';
import { DR_CHEN_DEF } from './drChen.js';

// Side-character NPCs (Phase B pre-stubs — chapter streams fill bodies)
import { SAM_DEF }     from './sam.js';
import { TILLY_DEF }   from './tilly.js';
import { CORA_DEF }    from './cora.js';
import { ROOK_DEF }    from './rook.js';
import { TOMAS_DEF }   from './tomas.js';
import { GIDEON_DEF }  from './gideon.js';
import { LILA_DEF }    from './lila.js';
import { MR_GRAY_DEF } from './mrGray.js';
import { ELENA_DEF }   from './elena.js';
import { GHOST_DEF }   from './ghost.js';
import { ECHO_DEF }    from './echo.js';

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

  // Side characters
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
