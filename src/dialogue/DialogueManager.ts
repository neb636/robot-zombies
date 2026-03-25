import Phaser from 'phaser';
import { DialogueBox } from './DialogueBox.js';
import { bus }         from '../utils/EventBus.js';
import { EVENTS }      from '../utils/constants.js';

export class DialogueManager {
  private static _box: DialogueBox | null = null;
  private readonly box: DialogueBox;

  constructor(_scene: Phaser.Scene) {
    if (!DialogueManager._box) {
      DialogueManager._box = new DialogueBox();
    }
    this.box = DialogueManager._box;
  }

  show(speaker: string, lines: readonly string[], onClose?: () => void): void {
    bus.emit(EVENTS.DIALOGUE_OPEN, { speaker, lines: [...lines] });
    this.box.open(speaker, lines, () => {
      bus.emit(EVENTS.DIALOGUE_CLOSE, {});
      onClose?.();
    });
  }

  isActive(): boolean { return this.box.isActive(); }
}
