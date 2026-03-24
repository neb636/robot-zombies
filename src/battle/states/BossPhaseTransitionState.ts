import { BattleState }  from '../BattleState.js';
import { BATTLE_STATES } from '../../utils/constants.js';

export class BossPhaseTransitionState extends BattleState {
  enter(): void {
    const { bossConfig, dialogueManager, enemy } = this.manager;
    if (!bossConfig) {
      this.manager.goTo(BATTLE_STATES.PLAYER_TURN);
      return;
    }

    const phase = bossConfig.phases[this.manager.currentBossPhase];
    if (!phase) {
      this.manager.goTo(BATTLE_STATES.PLAYER_TURN);
      return;
    }

    // Apply attack boost
    enemy.attack += phase.atkBoost;
    this.manager.currentBossPhase += 1;

    // Show phase dialogue
    dialogueManager.show(enemy.name, phase.dialogue);

    // Flash enemy sprite to indicate phase shift
    const sprite = enemy.sprite;
    if (sprite) {
      this.manager.scene.tweens.add({
        targets: sprite,
        alpha: 0.3,
        duration: 150,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          sprite.setAlpha(1);
        },
      });
    }

    document.addEventListener('dialogue:advance', () => {
      this.manager.goTo(BATTLE_STATES.PLAYER_TURN);
    }, { once: true });
  }
}
