import { BattleState } from '../BattleState.js';

export class VictoryState extends BattleState {
  enter() {
    const { dialogueManager, audioManager, enemy } = this.manager;
    audioManager.stopMusic();
    dialogueManager.show('SYSTEM', [
      `${enemy.name} powered down.`,
      'Another overly helpful robot disabled.',
      'The timeline breathes again.',
    ]);

    document.addEventListener('dialogue:advance', () => {
      this.manager.endBattle(true);
    }, { once: true });
  }
}
