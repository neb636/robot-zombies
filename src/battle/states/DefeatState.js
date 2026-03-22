import { BattleState } from '../BattleState.js';

export class DefeatState extends BattleState {
  enter() {
    const { dialogueManager, audioManager } = this.manager;
    audioManager.stopMusic();
    dialogueManager.show('SYSTEM', [
      'CONNECTION LOST.',
      'The robots have optimized you out of existence.',
      'Initiating temporal reboot...',
    ]);

    document.addEventListener('dialogue:advance', () => {
      this.manager.endBattle(false);
    }, { once: true });
  }
}
