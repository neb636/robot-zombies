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
  PAUSE_OPEN:       'pause:open',
  PAUSE_CLOSE:      'pause:close',
  // ─── Phase B additions ────────────────────────────────────────────────
  WORLD_MAP_TRAVEL: 'world:travel',
  SURVIVAL_TICK:    'survival:tick',
  SAVE_REQUESTED:   'save:requested',
  DIALOGUE_CHOICE:  'dialogue:choice',
  NODE_ENTER:       'node:enter',
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
  // ─── Prologue / existing ────────────────────────────────────────────
  MARCUS_CONVERTED:         'marcus_converted',
  MAYA_RECRUITED:           'maya_recruited',
  TUTORIAL_BATTLE_COMPLETE: 'tutorial_battle_complete',
  WARDEN_ALPHA_DEFEATED:    'warden_alpha_defeated',
  SAW_MARCUS_HARVEST_TOWN:  'saw_marcus_harvest_town',
  MARCUS_NAMED_BY_ELISE:    'marcus_named_by_elise',

  // ─── Party recruitment / loss ───────────────────────────────────────
  ELIAS_RECRUITED:          'elias_recruited',
  DEJA_RECRUITED:           'deja_recruited',
  JEROME_RECRUITED:         'jerome_recruited',
  DR_CHEN_RECRUITED:        'dr_chen_recruited',
  ELIAS_LOST:               'elias_lost',
  DEJA_LOST:                'deja_lost',
  ELIAS_DRAIN_ACTIVE:       'elias_drain_active',

  // ─── Side characters ───────────────────────────────────────────────
  SAM_MET_RIDGE:            'sam_met_ridge',
  SAM_MET_VAULT49:          'sam_met_vault49',
  SAM_MET_RADIO:            'sam_met_radio',
  SAM_HUSBAND_RIFLE_FOUND:  'sam_husband_rifle_found',
  TILLY_BOND_1:             'tilly_bond_1',
  TILLY_TRUSTED:            'tilly_trusted',
  TILLY_SPOKE:              'tilly_spoke',
  TILLY_FATHER_HEARD:       'tilly_father_heard',
  CORA_CURED:               'cora_cured',
  CORA_LEFT:                'cora_left',
  ROOK_MET:                 'rook_met',
  TOMAS_MET:                'tomas_met',
  TOMAS_DEBT_CLEARED:       'tomas_debt_cleared',
  TOMAS_REFUSED:            'tomas_refused',
  GIDEON_MET:               'gideon_met',
  GIDEON_ECHO_HINT:         'gideon_echo_hint',
  LILA_CURED:               'lila_cured',
  LILA_FOUGHT:              'lila_fought',
  LILA_SEEN_NOT_ENGAGED:    'lila_seen_not_engaged',
  SIX_BEATEN_CH1:           'six_beaten_ch1',
  SIX_BEATEN_CH3:           'six_beaten_ch3',
  SIX_BEATEN_CH5:           'six_beaten_ch5',
  MR_GRAY_TALKDOWN:         'mr_gray_talkdown',
  MR_GRAY_DEFEATED:         'mr_gray_defeated',
  VAULT49_TERMINALS_READ:   'vault49_terminals_read',
  STATIC_REAL_MET:          'static_real_met',
  GHOST_KEY_OBTAINED:       'ghost_key_obtained',
  USED_GHOST_KEY_CH5:       'used_ghost_key_ch5',

  // ─── Plotline flags ────────────────────────────────────────────────
  CONVERTED_CHILD_CURED:    'converted_child_cured',
  CONVERTED_CHILD_LEFT:     'converted_child_left',
  ECHO_CURED:               'echo_cured',
  ECHO_REFUSED:             'echo_refused',
  ELISE_TALKDOWN:           'elise_talkdown',
  ELISE_DEFEATED:           'elise_defeated',

  // ─── Derived / sensor flags ────────────────────────────────────────
  MORALE_LOW:               'morale_low',
  DRONE_ALERT:              'drone_alert',
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
