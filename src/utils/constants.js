export const GAME_WIDTH  = 800;
export const GAME_HEIGHT = 600;
export const TILE_SIZE   = 32;

export const BATTLE_STATES = {
  PLAYER_TURN: 'PLAYER_TURN',
  ENEMY_TURN:  'ENEMY_TURN',
  ANIMATING:   'ANIMATING',
  VICTORY:     'VICTORY',
  DEFEAT:      'DEFEAT',
};

export const EVENTS = {
  BATTLE_START:     'battle:start',
  BATTLE_END:       'battle:end',
  DIALOGUE_OPEN:    'dialogue:open',
  DIALOGUE_CLOSE:   'dialogue:close',
  SCENE_TRANSITION: 'scene:transition',
};

export const PLAYER_ACTIONS = {
  ATTACK:  'ATTACK',
  HEAL:    'HEAL',
  SPECIAL: 'SPECIAL',
  FLEE:    'FLEE',
};

export const BASE_PLAYER_HP  = 100;
export const BASE_ENEMY_HP   = 60;
export const BASE_PLAYER_ATK = 18;
export const BASE_ENEMY_ATK  = 12;
