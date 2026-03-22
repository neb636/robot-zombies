import { DialogueBox } from './DialogueBox.js';
import { bus }         from '../utils/EventBus.js';
import { EVENTS }      from '../utils/constants.js';

export class DialogueManager {
  constructor(_scene) {
    if (!DialogueManager._box) {
      DialogueManager._box = new DialogueBox();
    }
    this.box = DialogueManager._box;
  }

  show(speaker, lines, onClose) {
    bus.emit(EVENTS.DIALOGUE_OPEN, { speaker, lines });
    this.box.open(speaker, lines, () => {
      bus.emit(EVENTS.DIALOGUE_CLOSE, {});
      onClose?.();
    });
  }

  isActive() { return this.box.isActive(); }
}
