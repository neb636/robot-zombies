/**
 * EnemyAIStateMachine — per-enemy IDLE → CHARGING → ACTING → COOLDOWN loop.
 *
 * Each Enemy instance owns one of these. The machine is ticked by
 * ATBTickingState._tick() each time the enemy's ATB hits 100.
 *
 * Charge ticks (each = one ATB cycle ~60ms × tick-fills-to-100):
 *   Drone     = 1  (acts almost immediately after ATB fills)
 *   Enforcer  = 2
 *   Sentinel  = 3  (also calls reinforcement if alive ≥ 4 turns)
 *   Boss      = 0  (no charge delay)
 *   Converted = 1
 *
 * Cooldown ticks keep the enemy from chain-acting every ATB refill.
 */
import { calcDamage }         from './CombatEngine.js';
import * as SE                from './StatusEffectSystem.js';
import { BATTLE_STATES }      from '../utils/constants.js';
import type { ATBCombatant }  from '../types.js';
import type { Enemy }         from '../entities/Enemy.js';
import type { BattleManager } from './BattleManager.js';

type EnemyAIPhase = 'IDLE' | 'CHARGING' | 'ACTING' | 'COOLDOWN';

type EnemyTier = 'drone' | 'enforcer' | 'sentinel' | 'boss' | 'converted';

const CHARGE_TICKS: Record<EnemyTier, number> = {
  drone:     1,
  enforcer:  2,
  sentinel:  3,
  boss:      0,
  converted: 1,
};

const COOLDOWN_TICKS: Record<EnemyTier, number> = {
  drone:     3,
  enforcer:  5,
  sentinel:  8,
  boss:      2,
  converted: 4,
};

export class EnemyAIStateMachine {
  phase:               EnemyAIPhase = 'IDLE';
  chargeTicks:         number = 0;
  cooldownTicks:       number = 0;
  turnsAlive:          number = 0;
  reinforcementCalled: boolean = false;

  private readonly _maxCharge:   number;
  private readonly _maxCooldown: number;

  constructor(tier: EnemyTier) {
    this._maxCharge   = CHARGE_TICKS[tier];
    this._maxCooldown = COOLDOWN_TICKS[tier];
  }

  /**
   * Called by ATBTickingState each time this enemy's ATB hits 100.
   * Returns true if the enemy took an action this tick (so the caller
   * can skip re-queuing the enemy until cooldown expires).
   */
  tick(enemy: Enemy, manager: BattleManager): void {
    switch (this.phase) {
      case 'IDLE':
        if (enemy.atb >= 100) {
          enemy.atb   = 0;
          this.turnsAlive++;
          this.chargeTicks = 0;
          this.phase  = 'CHARGING';
          // Fall through to process CHARGING immediately (charge=0 for bosses)
          this._processCharging(enemy, manager);
        }
        break;

      case 'CHARGING':
        this._processCharging(enemy, manager);
        break;

      case 'COOLDOWN':
        this.cooldownTicks++;
        if (this.cooldownTicks >= this._maxCooldown) {
          this.cooldownTicks = 0;
          this.phase         = 'IDLE';
        }
        break;

      case 'ACTING':
        // Should not linger here — resolved synchronously in _act()
        this.cooldownTicks = 0;
        this.phase         = 'COOLDOWN';
        break;
    }
  }

  private _processCharging(enemy: Enemy, manager: BattleManager): void {
    this.chargeTicks++;
    if (this.chargeTicks >= this._maxCharge) {
      this.phase = 'ACTING';
      this._act(enemy, manager);
      this.cooldownTicks = 0;
      this.phase         = 'COOLDOWN';
    }
  }

  private _act(enemy: Enemy, manager: BattleManager): void {
    const { dialogueManager, scripted } = manager;

    // Sentinel: call reinforcement at turn 4
    if (
      enemy.tier === 'sentinel' &&
      this.turnsAlive >= 4 &&
      !this.reinforcementCalled
    ) {
      this.reinforcementCalled = true;
      dialogueManager.show(enemy.name, ['REINFORCEMENT REQUESTED. STAND BY.']);
      this._spawnReinforcement(manager);
    }

    // Hacked: attack own allies if any
    if (SE.hasStatus(enemy as unknown as ATBCombatant, 'Hacked')) {
      const target = manager.allies[0];
      if (target) {
        const dmg  = calcDamage(enemy.str, target.def, 'Physical', []);
        const dead = target.takeDamage(dmg);
        dialogueManager.show(enemy.name, [`HACKED — ${enemy.name} strikes ${target.name} for ${dmg}!`]);
        if (dead) manager.removeAlly(target.name);
      }
      return;
    }

    // Normal attack on player
    const player = manager.player;
    let dmg = calcDamage(enemy.str, player.def, 'Physical', player.tags);

    if (scripted) dmg = Math.min(dmg, Math.max(0, player.hp - 1));

    // Shield check
    if (SE.tryAbsorbWithShield(player as ATBCombatant)) {
      dialogueManager.show(enemy.name, [`${enemy.name} attacks! Shield absorbs the hit.`]);
      return;
    }

    const dead = player.takeDamage(dmg);
    dialogueManager.show(enemy.name, [`${enemy.getTauntLine()} (${dmg} damage)`]);

    if (dead) {
      manager.goTo(BATTLE_STATES.DEFEAT);
    }
  }

  private _spawnReinforcement(manager: BattleManager): void {
    manager.spawnReinforcement('compliance_drone');
  }
}
