import type { CharacterDef, CharacterStats } from '../types.js';

/**
 * NPC stat blocks are mostly narrative — these characters are not playable.
 * Chapter streams MAY override these fields when filling their assigned NPC
 * bodies. Keep stats present so any code that indexes chapterStats doesn't
 * crash when passing these defs through battle-adjacent helpers.
 */
const FLAT_CIVILIAN_STATS: CharacterStats = {
  hp:   100,
  maxHp: 100,
  str:  10,
  def:  10,
  int:  10,
  spd:  10,
  lck:  10,
};

/** Build a 6-chapter stats array with the same civilian block. */
export const CIVILIAN_STATS_6: CharacterStats[] = [
  FLAT_CIVILIAN_STATS,
  FLAT_CIVILIAN_STATS,
  FLAT_CIVILIAN_STATS,
  FLAT_CIVILIAN_STATS,
  FLAT_CIVILIAN_STATS,
  FLAT_CIVILIAN_STATS,
];

/** Produce a minimal NPC CharacterDef stub. Chapter streams overwrite as needed. */
export function npcStub(
  id: string,
  name: string,
  color: number,
  joinChapter: number,
  passive = '',
): CharacterDef {
  return {
    id,
    name,
    color,
    joinChapter,
    chapterStats: CIVILIAN_STATS_6.slice(joinChapter),
    techs: [],
    passive,
  };
}
