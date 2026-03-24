import { BattleState } from '../BattleState.js';

export class DefeatState extends BattleState {
  enter(): void {
    const { dialogueManager, audioManager } = this.manager;
    audioManager.stopMusic();
    dialogueManager.show('SYSTEM', [
      'CONNECTION LOST.',
      'The robots have optimized you out of existence.',
      'Initiating temporal reboot...',
    ], () => {
      this.manager.endBattle(false);
    });
  }
}
