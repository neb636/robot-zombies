import Phaser from 'phaser';

export const GAME_WIDTH  = 800 as const;
export const GAME_HEIGHT = 600 as const;
export const TILE_SIZE   = 32 as const;

export const BATTLE_STATES = {
  ATB_TICKING:           'ATB_TICKING',
  PLAYER_TURN:           'PLAYER_TURN',
  ALLY_TURN:             'ALLY_TURN',
  ENEMY_TURN:            'ENEMY_TURN',
  ANIMATING:             'ANIMATING',
  BOSS_PHASE_TRANSITION: 'BOSS_PHASE_TRANSITION',
  MARCUS_CONVERSION:     'MARCUS_CONVERSION',
  VICTORY:               'VICTORY',
  DEFEAT:                'DEFEAT',
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
  TECHS:   'TECHS',
  HEAL:    'HEAL',
  SPECIAL: 'SPECIAL',
  FLEE:    'FLEE',
} as const;
export type PlayerAction = typeof PLAYER_ACTIONS[keyof typeof PLAYER_ACTIONS];

export const BASE_PLAYER_HP  = 100 as const;
export const BASE_ENEMY_HP   = 60 as const;
export const BASE_PLAYER_ATK = 18 as const;
export const BASE_ENEMY_ATK  = 12 as const;

// ─── Prologue Battle Constants ──────────────────────────────────────────────

export const TUTORIAL_DRONE_HP  = 30 as const;
export const TUTORIAL_DRONE_ATK = 5 as const;
export const WARDEN_ALPHA_HP    = 300 as const;
export const WARDEN_ALPHA_ATK   = 22 as const;
export const MARCUS_HP          = 160 as const;
export const MARCUS_ATK         = 14 as const;

// ─── Game Flags ─────────────────────────────────────────────────────────────

export const GAME_FLAGS = {
  MARCUS_CONVERTED:        'marcus_converted',
  MAYA_RECRUITED:           'maya_recruited',
  TUTORIAL_BATTLE_COMPLETE: 'tutorial_battle_complete',
  WARDEN_ALPHA_DEFEATED:    'warden_alpha_defeated',
  SAW_MARCUS_HARVEST_TOWN:  'saw_marcus_harvest_town',
  MARCUS_NAMED_BY_ELISE:    'marcus_named_by_elise',
} as const;

// ─── Flag Helpers ───────────────────────────────────────────────────────────

export function getFlags(
  registry: Phaser.Data.DataManager,
): Record<string, boolean> {
  return (registry.get('flags') as Record<string, boolean> | undefined) ?? {};
}

export function setFlag(
  registry: Phaser.Data.DataManager,
  flag: string,
  value: boolean,
): void {
  const flags = getFlags(registry);
  flags[flag] = value;
  registry.set('flags', flags);
}
