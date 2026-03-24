/**
 * TechExecutor — executes a Tech's effect when a player or ally uses it.
 *
 * After execution, drains atbCost from the caster's ATB gauge (minimum 0).
 */
import { calcDamage }       from './CombatEngine.js';
import * as SE              from './StatusEffectSystem.js';
import type { Tech, ATBCombatant, TechEffect } from '../types.js';
import type { Enemy }       from '../entities/Enemy.js';
import type { BattleManager } from './BattleManager.js';

export interface TechTarget {
  /** Primary target — single enemy or self for most techs. */
  enemy:  Enemy;
  /** For ally-targeting techs, the chosen ally (or the caster for 'self'). */
  ally?:  ATBCombatant;
}

export function execute(
  tech:    Tech,
  caster:  ATBCombatant,
  target:  TechTarget,
  manager: BattleManager,
): void {
  _applyEffect(tech.effect, tech, caster, target, manager);

  // Drain ATB cost from caster
  caster.atb = Math.max(0, caster.atb - tech.atbCost);
}

function _applyEffect(
  effect:  TechEffect,
  tech:    Tech,
  caster:  ATBCombatant,
  target:  TechTarget,
  manager: BattleManager,
): void {
  const { dialogueManager } = manager;

  switch (effect.kind) {
    case 'damage': {
      // INT-scaling techs (EMP, Tech type) use caster.int; others use str
      const stat = (effect.skillType === 'EMP' || effect.skillType === 'Tech')
        ? caster.int
        : caster.str;

      if (tech.targeting === 'all_enemies') {
        // Apply to the single enemy for now (multi-enemy system pending)
        const dmg  = calcDamage(stat, target.enemy.def, effect.skillType, target.enemy.tags);
        const adj  = Math.floor(dmg * effect.multiplier);
        const dead = target.enemy.takeDamage(adj);
        dialogueManager.show(caster.name, [`${tech.label}! ${adj} damage to ${target.enemy.name}!`]);
        if (dead) manager.goTo('VICTORY');
      } else {
        const dmg  = calcDamage(stat, target.enemy.def, effect.skillType, target.enemy.tags);
        const adj  = Math.floor(dmg * effect.multiplier);
        const dead = target.enemy.takeDamage(adj);
        dialogueManager.show(caster.name, [`${tech.label}! ${adj} damage!`]);
        if (dead) manager.goTo('VICTORY');
      }
      return;
    }

    case 'status': {
      if (effect.targetEnemy) {
        // Apply status to enemy
        SE.apply(target.enemy as unknown as ATBCombatant, effect.apply);
        dialogueManager.show(caster.name, [`${tech.label}! ${target.enemy.name} is ${effect.apply}!`]);
      } else {
        // Apply status to ally / self  (or CURE Panicked/Burning via Preach/Patch)
        const allyTarget = target.ally ?? caster;
        if (effect.apply === 'Panicked') {
          // Preach: cure Panicked, not apply it
          SE.remove(allyTarget, 'Panicked');
          dialogueManager.show(caster.name, [`${tech.label}! ${allyTarget.name}'s fear subsides.`]);
        } else if (effect.apply === 'Burning' && tech.id === 'patch') {
          SE.remove(allyTarget, 'Burning');
          dialogueManager.show(caster.name, [`${tech.label}! Burns treated.`]);
        } else {
          SE.apply(allyTarget, effect.apply);
          dialogueManager.show(caster.name, [`${tech.label}! ${allyTarget.name} gains ${effect.apply}.`]);
        }
      }
      return;
    }

    case 'heal': {
      const allyTarget = target.ally ?? caster;
      if (effect.allAllies) {
        const targets = [manager.player as ATBCombatant, ...manager.allies];
        targets.forEach(t => { t.heal(effect.amount); });
        dialogueManager.show(caster.name, [`${tech.label}! All allies recover ${effect.amount} HP!`]);
      } else {
        allyTarget.heal(effect.amount);
        dialogueManager.show(caster.name, [`${tech.label}! ${allyTarget.name} recovers ${effect.amount} HP.`]);
      }
      return;
    }

    case 'reveal': {
      target.enemy.tagsRevealed = true;
      const tagList = target.enemy.tags.join(', ');
      dialogueManager.show(caster.name, [
        `${tech.label}! ${target.enemy.name} is ${tagList || 'unknown type'}.`,
      ]);
      return;
    }

    case 'control': {
      // TODO in future milestone: actually add enemy as temporary ally
      dialogueManager.show(caster.name, [
        `${tech.label}! ${target.enemy.name} temporarily follows your commands.`,
      ]);
      return;
    }
  }
}
