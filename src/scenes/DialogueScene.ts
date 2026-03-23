import Phaser from 'phaser';
import { tts } from '../audio/TTSManager.js';

/**
 * DialogueScene — always-active scene that forwards keyboard input
 * to the HTML dialogue overlay via a CustomEvent.
 *
 * Keybindings:
 *   SPACE / ENTER — advance dialogue
 *   M             — toggle TTS mute (also toggles the #tts-mute-btn icon)
 */
export class DialogueScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogueScene', active: true });
  }

  create(): void {
    this.input.keyboard!.on('keydown-SPACE', () => {
      document.dispatchEvent(new CustomEvent('dialogue:advance'));
    });
    this.input.keyboard!.on('keydown-ENTER', () => {
      document.dispatchEvent(new CustomEvent('dialogue:advance'));
    });
    this.input.keyboard!.on('keydown-M', () => {
      tts.toggleMute();
    });
  }
}
