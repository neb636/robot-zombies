/**
 * Mr. Gray — human antagonist (dialogue-only encounter).
 * Physical-only damage, no electronics tags.
 * Appears in BoardroomAntechamberScene as a forced combat if MR_GRAY_TALKDOWN
 * is not set and player attempts to bypass the dialogue gauntlet.
 *
 * In normal flow this fight never triggers — Mr. Gray is a dialogue-only NPC.
 * The combat definition is kept here for completeness and edge-case fallback.
 */
export const MR_GRAY_ENEMY_KEY = 'mr_gray' as const;

export const MR_GRAY_BOSS_CONFIG = {
  name:   'MR. GRAY',
  hp:     280,
  atk:    24,
  str:    24,
  def:    20,
  int:    30,
  spd:    16,
  lck:    22,
  tags:   ['Organic'] as const,
  tier:   'boss' as const,
  width:  32,
  height: 48,
  color:  0x555566,
  taunts: [
    "I wrote the words. That doesn't mean I was wrong.",
    "You've made it this far. That tells me something about you.",
    "I still believe the math.",
    "That's the worst part, isn't it — I still believe the math.",
  ],
};

/** Battle init data for the Mr. Gray fallback combat. */
export const MR_GRAY_BATTLE_DATA = {
  enemyKey:    MR_GRAY_ENEMY_KEY,
  returnScene: 'BoardroomAntechamberScene',
  scripted:    true,
  bossConfig:  {
    phases: [
      {
        hpThreshold: 0.5,
        atkBoost:    4,
        dialogue: [
          "You really are going through with it.",
          "Then I'll stop holding back.",
        ],
      },
    ],
  },
};
