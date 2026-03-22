import Phaser from 'phaser';

/**
 * DialogueScene — always-active scene that forwards keyboard input
 * to the HTML dialogue overlay via a CustomEvent.
 */
export class DialogueScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogueScene', active: true });
  }

  create() {
    this.input.keyboard.on('keydown-SPACE', () => {
      document.dispatchEvent(new CustomEvent('dialogue:advance'));
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      document.dispatchEvent(new CustomEvent('dialogue:advance'));
    });
  }
}
