import { BattleState }  from '../BattleState.js';
import { calcDamage }   from '../CombatEngine.js';
import { BATTLE_STATES } from '../../utils/constants.js';

export class AllyTurnState extends BattleState {
  private _timer = 0;
  private readonly _delay = 800;
  private _acted = false;

  enter(): void {
    this._timer = 0;
    this._acted = false;

    const ally = this.manager.allies.find(a => a.isAlive());
    if (!ally) {
      this.manager.goTo(BATTLE_STATES.ENEMY_TURN);
      return;
    }

    this.manager.dialogueManager.show(ally.name, [`${ally.name} readies an attack.`]);
  }

  update(_time: number, delta: number): void {
    if (this._acted) return;
    this._timer += delta;
    if (this._timer >= this._delay) {
      this._acted = true;
      this._act();
    }
  }

  private _act(): void {
    const ally = this.manager.allies.find(a => a.isAlive());
    if (!ally) {
      this.manager.goTo(BATTLE_STATES.ENEMY_TURN);
      return;
    }

    const { enemy, audioManager, dialogueManager } = this.manager;
    const dmg  = calcDamage(ally.str, enemy.def, 'Physical', enemy.tags);
    const dead = enemy.takeDamage(dmg);
    audioManager.playSfx('sfx-attack');
    dialogueManager.show(ally.name, [`${ally.name} attacks for ${dmg} damage!`]);

    if (dead) {
      this.manager.goTo(BATTLE_STATES.VICTORY);
      return;
    }

    // Check boss thresholds after ally damage
    const bossState = this.manager.checkBossThresholds();
    if (bossState) {
      this.manager.goTo(bossState);
      return;
    }

    this.manager.goTo(BATTLE_STATES.ENEMY_TURN);
  }
}
