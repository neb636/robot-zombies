/**
 * CombatEngine — pure damage-calculation utilities.
 *
 * All arithmetic stays integer throughout: no floats stored or returned.
 * No Phaser dependencies — this module can be unit-tested in isolation.
 */
import type { EnemyTag, SkillType } from '../types.js';

/**
 * Returns a ×10 integer multiplier for a skill vs. a set of enemy tags.
 * Using ×10 integers avoids floating-point accumulation:
 *   EMP vs Electronic → 15  (represents 1.5×)
 *   Fire vs Organic   → 13  (1.3×)
 *   Physical vs Armored → 7 (0.7×)
 *   All others         → 10 (1.0×)
 */
export function getTypeMultiplierX10(skillType: SkillType, tags: readonly EnemyTag[]): number {
  if (skillType === 'EMP'      && tags.includes('Electronic')) return 15;
  if (skillType === 'Fire'     && tags.includes('Organic'))    return 13;
  if (skillType === 'Physical' && tags.includes('Armored'))    return 7;
  return 10;
}

/**
 * Calculate final integer damage for one hit.
 *
 * Formula:
 *   base       = max(1, attackerStr − floor(defenderDef / 2))
 *   variance   = random integer 85–115
 *   multiplier = getTypeMultiplierX10(…)
 *   damage     = floor(base × variance × multiplier / 1000)
 *
 * Minimum returned value is always 1.
 *
 * @param attackerStr  Attacker's STR (or INT for tech-based attacks)
 * @param defenderDef  Defender's DEF
 * @param skillType    Damage type driving the type-matchup check
 * @param defenderTags Enemy tags to check against
 */
export function calcDamage(
  attackerStr:  number,
  defenderDef:  number,
  skillType:    SkillType,
  defenderTags: readonly EnemyTag[],
): number {
  const base         = Math.max(1, attackerStr - Math.floor(defenderDef / 2));
  const variance     = 85 + Math.floor(Math.random() * 31);   // 85–115
  const multiplierX10 = getTypeMultiplierX10(skillType, defenderTags);
  return Math.max(1, Math.floor(base * variance * multiplierX10 / 1000));
}
