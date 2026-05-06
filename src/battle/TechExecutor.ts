/**
 * TechExecutor — executes a Tech's effect when a player or ally uses it.
 *
 * After execution, drains atbCost from the caster's ATB gauge (minimum 0).
 */
import { calcDamage }       from './CombatEngine.js';
import * as SE              from './StatusEffectSystem.js';
import {
  executeRally,
  tryLastStand,
  applyOverclock,
  executeSystemCrash,
  applyControl,
}                           from './specials/index.js';
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
      applyControl(caster, target.enemy, effect.turnsAsAlly, manager);
      return;
    }

    case 'special': {
      _applySpecial(tech.id, caster, target, manager);
      return;
    }
  }
}

/**
 * Dispatch for 'special' kind techs — routed by tech.id.
 */
function _applySpecial(
  techId:  string,
  caster:  ATBCombatant,
  target:  TechTarget,
  manager: BattleManager,
): void {
  switch (techId) {
    case 'rally': {
      const allyTarget = target.ally ?? caster;
      executeRally(caster, allyTarget, manager);
      break;
    }
    case 'last_stand': {
      // last_stand auto-triggers at <20% HP; if already active, no-op.
      const applied = tryLastStand(caster, manager, manager.lastStandActive);
      if (applied) manager.lastStandActive = true;
      break;
    }
    case 'overclock': {
      const allyTarget = target.ally ?? caster;
      applyOverclock(caster, allyTarget, manager);
      break;
    }
    case 'system_crash': {
      executeSystemCrash(caster, manager);
      break;
    }
    case 'steady_shot': {
      // Ignores enemy DEF — calculate damage with DEF = 0
      const dmg  = Math.max(1, Math.floor(caster.str * (0.85 + Math.random() * 0.30)));
      const dead = target.enemy.takeDamage(dmg);
      manager.dialogueManager.show(caster.name, [`STEADY SHOT! ${dmg} damage — DEF ignored!`]);
      if (dead) manager.goTo('VICTORY');
      break;
    }
    case 'cover': {
      // Redirect next hit aimed at the ally to Elias — approximated as Shielded on the ally
      const allyTarget = target.ally ?? caster;
      SE.apply(allyTarget, 'Shielded');
      manager.dialogueManager.show(caster.name, [
        `COVER! ${caster.name} steps in front of ${allyTarget.name}.`,
      ]);
      break;
    }
    case 'last_hunt':
      // Scripted — auto-triggers in loss scene; no-op here
      manager.dialogueManager.show(caster.name, ['...']);
      break;
    case 'steal': {
      // Item system pending — log intent
      manager.dialogueManager.show(caster.name, [
        `STEAL! ${caster.name} snatches something from ${target.enemy.name}!`,
      ]);
      break;
    }
    case 'smoke':
      // Guaranteed escape — end battle with no victory
      manager.dialogueManager.show(caster.name, ['SMOKE! Slipping away into the chaos...']);
      manager.endBattle(false);
      break;
    case 'dirty_hit': {
      // STR × 2.5 crit if enemy is Stunned, 0 damage otherwise
      const isStunned = target.enemy.statuses.some(s => s.key === 'Stunned');
      if (isStunned) {
        const baseDmg = Math.max(1, caster.str - Math.floor(target.enemy.def / 2));
        const dmg     = Math.floor(baseDmg * 2.5);
        const dead    = target.enemy.takeDamage(dmg);
        manager.dialogueManager.show(caster.name, [`DIRTY HIT! ${dmg} crit damage!`]);
        if (dead) manager.goTo('VICTORY');
      } else {
        manager.dialogueManager.show(caster.name, [
          `DIRTY HIT! ${target.enemy.name} isn't stunned — no effect!`,
        ]);
      }
      break;
    }
    case 'dead_drop': {
      // Hit all enemies (currently one), then shield self against next attack
      const dmg  = Math.max(1, Math.floor(caster.str - Math.floor(target.enemy.def / 2)));
      const dead = target.enemy.takeDamage(dmg);
      SE.apply(caster, 'Shielded');
      manager.dialogueManager.show(caster.name, [
        `DEAD DROP! ${dmg} damage — ${caster.name} vanishes before the counter!`,
      ]);
      if (dead) manager.goTo('VICTORY');
      break;
    }
    case 'preach': {
      // Remove Panicked from all living allies
      const allAllies = [manager.player as ATBCombatant, ...manager.allies];
      for (const ally of allAllies) {
        if (ally.isAlive()) SE.remove(ally, 'Panicked');
      }
      manager.dialogueManager.show(caster.name, [
        'PREACH! Fear lifts from all allies.',
      ]);
      break;
    }
    case 'testify': {
      // All allies: +20% STR and DEF for 4 turns — static boost (no duration tracking yet)
      const allAllies = [manager.player as ATBCombatant, ...manager.allies];
      for (const ally of allAllies) {
        if (ally.isAlive()) {
          ally.str = Math.floor(ally.str * 1.2);
          ally.def = Math.floor(ally.def * 1.2);
        }
      }
      manager.dialogueManager.show(caster.name, [
        'TESTIFY! All allies surge — STR and DEF raised!',
      ]);
      break;
    }
    case 'master_override': {
      // Stun all Electronic enemies for 1 turn (currently single enemy)
      if (target.enemy.tags.includes('Electronic')) {
        SE.apply(target.enemy as unknown as ATBCombatant, 'Stunned');
        manager.dialogueManager.show(caster.name, [
          `MASTER OVERRIDE! ${target.enemy.name} disabled for 1 turn!`,
        ]);
      } else {
        manager.dialogueManager.show(caster.name, [
          `MASTER OVERRIDE — no Electronic targets found!`,
        ]);
      }
      break;
    }
    default:
      // Unknown special — fallback description
      manager.dialogueManager.show(caster.name, [`${techId} — effect pending.`]);
      break;
  }
}
