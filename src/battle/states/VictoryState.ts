import { BattleState } from '../BattleState.js';

export class VictoryState extends BattleState {
  enter(): void {
    const { dialogueManager, audioManager, enemy } = this.manager;
    audioManager.stopMusic();

    const isBoss = this.manager.bossConfig !== null;
    const lines = isBoss
      ? [
          `${enemy.name} powers down.`,
          'The harbor is quiet.',
        ]
      : [
          `${enemy.name} powered down.`,
          'Another overly helpful robot disabled.',
          'The timeline breathes again.',
        ];

    dialogueManager.show('SYSTEM', lines);

    document.addEventListener('dialogue:advance', () => {
      this.manager.endBattle(true);
    }, { once: true });
  }
}
