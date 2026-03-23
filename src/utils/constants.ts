export const GAME_WIDTH  = 800 as const;
export const GAME_HEIGHT = 600 as const;
export const TILE_SIZE   = 32 as const;

export const BATTLE_STATES = {
  PLAYER_TURN: 'PLAYER_TURN',
  ENEMY_TURN:  'ENEMY_TURN',
  ANIMATING:   'ANIMATING',
  VICTORY:     'VICTORY',
  DEFEAT:      'DEFEAT',
} as const;
export type BattleStateKey = typeof BATTLE_STATES[keyof typeof BATTLE_STATES];

export const EVENTS = {
  BATTLE_START:     'battle:start',
  BATTLE_END:       'battle:end',
  DIALOGUE_OPEN:    'dialogue:open',
  DIALOGUE_CLOSE:   'dialogue:close',
  SCENE_TRANSITION: 'scene:transition',
} as const;
export type EventKey = typeof EVENTS[keyof typeof EVENTS];

export const PLAYER_ACTIONS = {
  ATTACK:  'ATTACK',
  HEAL:    'HEAL',
  SPECIAL: 'SPECIAL',
  FLEE:    'FLEE',
} as const;
export type PlayerAction = typeof PLAYER_ACTIONS[keyof typeof PLAYER_ACTIONS];

export const BASE_PLAYER_HP  = 100 as const;
export const BASE_ENEMY_HP   = 60 as const;
export const BASE_PLAYER_ATK = 18 as const;
export const BASE_ENEMY_ATK  = 12 as const;
