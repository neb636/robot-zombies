/**
 * ATBTickingState — the heart of the ATB battle system.
 *
 * While active, all combatants' ATB gauges fill in parallel via a Phaser
 * TimerEvent (60ms interval). When any gauge hits 100 the combatant is pushed
 * onto the CombatantQueue with a precise timestamp.
 *
 * Each frame, update() drains one entry from the queue:
 *  - Enemy  → resolve action inline, reset ATB, continue ticking
 *  - Player → pause ATB, set activeMenuCombatant, transition to PLAYER_TURN
 *  - Ally   → auto-attack inline (same as old AllyTurnState), reset ATB
 */
import Phaser from 'phaser';
import { BattleState }       from '../BattleState.js';
import { CombatantQueue }    from '../CombatantQueue.js';
import { calcDamage }        from '../CombatEngine.js';
import { BATTLE_STATES }     from '../../utils/constants.js';
import type { ATBCombatant } from '../../types.js';
import type { Enemy }        from '../../entities/Enemy.js';

/** ATB points added per 60ms tick: max(1, ceil(spd / 5)). */
function fillRate(spd: number): number {
  return Math.max(1, Math.ceil(spd / 5));
}

export class ATBTickingState extends BattleState {
  private _timer:  Phaser.Time.TimerEvent | null = null;
  private _queue:  CombatantQueue = new CombatantQueue();
  private _paused: boolean = false;

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  enter(): void {
    this._queue.clear();
    this._paused = false;
    this._timer  = this.manager.scene.time.addEvent({
      delay:         60,
      loop:          true,
      callback:      this._tick,
      callbackScope: this,
    });
  }

  exit(): void {
    if (this._timer) {
      this._timer.remove(false);
      this._timer = null;
    }
    this._queue.clear();
  }

  // ─── ATB pause / resume (called by PlayerTurnState) ───────────────────────

  pause(): void  { this._paused = true;  if (this._timer) this._timer.paused = true; }
  resume(): void { this._paused = false; if (this._timer) this._timer.paused = false; }

  // ─── Frame update — drain one queue entry per frame ───────────────────────

  update(_time: number, _delta: number): void {
    if (this._paused) return;
    const entry = this._queue.peek();
    if (!entry) return;

    const enemy = this.manager.enemy;

    // ── Enemy acts? Resolve inline, stay in ATB_TICKING ──
    if ((entry.combatant as unknown) === enemy) {
      this._queue.pop();
      this._resolveEnemyAction(enemy);
      return;
    }

    // ── Ally acts? Auto-attack inline ──
    const ally = this.manager.allies.find(a => (a as ATBCombatant) === entry.combatant);
    if (ally) {
      this._queue.pop();
      this._resolveAllyAction(ally as ATBCombatant);
      return;
    }

    // ── Player acts → pause, hand off to PLAYER_TURN ──
    this._queue.pop();
    this.manager.activeMenuCombatant = entry.combatant;
    this.manager.pauseATB();
    this.manager.goTo(BATTLE_STATES.PLAYER_TURN);
  }

  // ─── ATB tick (60ms heartbeat) ────────────────────────────────────────────

  private _tick(): void {
    if (this._paused) return;

    const now    = performance.now();
    const player = this.manager.player as ATBCombatant;
    const enemy  = this.manager.enemy;

    // Fill player ATB
    if (player.isAlive() && !this._inQueue(player)) {
      player.atb = Math.min(100, player.atb + fillRate(player.spd));
      if (player.atb >= 100) this._queue.push(player, now);
    }

    // Fill ally ATBs
    for (const a of this.manager.allies) {
      const ally = a as ATBCombatant;
      if (ally.isAlive() && !this._inQueue(ally)) {
        ally.atb = Math.min(100, ally.atb + fillRate(ally.spd));
        if (ally.atb >= 100) this._queue.push(ally, performance.now());
      }
    }

    // Fill enemy ATB
    if (enemy.isAlive() && !this._inQueueEnemy(enemy)) {
      enemy.atb = Math.min(100, enemy.atb + fillRate(enemy.spd));
      if (enemy.atb >= 100) {
        // Push enemy as ATBCombatant-compatible (duck type) using a cast
        // ATBTickingState.update() re-identifies enemies via reference check
        const pseudo = enemy as unknown as ATBCombatant;
        this._queue.push(pseudo, performance.now());
      }
    }
  }

  private _inQueue(c: ATBCombatant): boolean {
    return this._queue.has(c);
  }

  private _inQueueEnemy(enemy: Enemy): boolean {
    return this._queue.has(enemy as unknown as ATBCombatant);
  }

  // ─── Action resolution ────────────────────────────────────────────────────

  private _resolveEnemyAction(enemy: Enemy): void {
    enemy.atb = 0;
    const { player, dialogueManager, scripted } = this.manager;
    const p = player as ATBCombatant;

    let dmg = calcDamage(enemy.str, p.def, 'Physical', p.tags);

    // Scripted battles: player can't die
    if (scripted) dmg = Math.min(dmg, Math.max(0, p.hp - 1));

    const dead = p.takeDamage(dmg);
    dialogueManager.show(enemy.name, [`${enemy.getTauntLine()} (${dmg} damage)`]);

    if (dead) {
      this.manager.goTo(BATTLE_STATES.DEFEAT);
    }
  }

  private _resolveAllyAction(ally: ATBCombatant): void {
    ally.atb = 0;
    const { enemy, dialogueManager } = this.manager;

    const dmg  = calcDamage(ally.str, enemy.def, 'Physical', enemy.tags);
    const dead = enemy.takeDamage(dmg);
    dialogueManager.show(ally.name, [`${ally.name} attacks for ${dmg} damage!`]);

    if (dead) {
      this.manager.goTo(BATTLE_STATES.VICTORY);
      return;
    }

    const bossState = this.manager.checkBossThresholds();
    if (bossState) this.manager.goTo(bossState);
  }
}
