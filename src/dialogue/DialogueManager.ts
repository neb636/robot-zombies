import Phaser from 'phaser';
import { DialogueBox }  from './DialogueBox.js';
import { bus }          from '../utils/EventBus.js';
import { EVENTS }       from '../utils/constants.js';
import type { DialogueLine } from '../types.js';
import type { SurvivalManager } from '../survival/SurvivalManager.js';

export class DialogueManager {
  private static _box: DialogueBox | null = null;
  private readonly box: DialogueBox;

  constructor(_scene: Phaser.Scene) {
    if (!DialogueManager._box) {
      DialogueManager._box = new DialogueBox();
    }
    this.box = DialogueManager._box;
  }

  /**
   * Original string-based API — unchanged for backwards compat.
   * All existing scenes use this path; do not remove.
   */
  show(speaker: string, lines: readonly string[], onClose?: () => void): void {
    bus.emit(EVENTS.DIALOGUE_OPEN, { speaker, lines: [...lines] });
    this.box.open(speaker, lines, () => {
      bus.emit(EVENTS.DIALOGUE_CLOSE, {});
      onClose?.();
    });
  }

  /**
   * Extended API (Stream G) — accepts structured DialogueLine objects that
   * may carry `choices` arrays. Chapter scenes use this for branching dialogue.
   * `onChoice` is called with the selected option's `nextId` after selection.
   *
   * `registry` and `survival` are optional. If omitted, all options render as
   * available (useful for scenes without survival state).
   */
  showLines(
    speaker: string,
    lines: readonly DialogueLine[],
    onClose?: () => void,
    onChoice?: (nextId: string) => void,
    registry?: Phaser.Data.DataManager,
    survival?: SurvivalManager,
  ): void {
    bus.emit(EVENTS.DIALOGUE_OPEN, { speaker, lines: lines.map(l => l.text) });
    this.box.openLines(speaker, lines, () => {
      bus.emit(EVENTS.DIALOGUE_CLOSE, {});
      onClose?.();
    }, onChoice, registry, survival);
  }

  isActive(): boolean { return this.box.isActive(); }
}
