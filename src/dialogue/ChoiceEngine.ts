import Phaser from 'phaser';
import type { DialogueChoice, DialogueLine } from '../types.js';
import type { SurvivalManager } from '../survival/SurvivalManager.js';
import { getFlags, setFlag } from '../utils/constants.js';

/**
 * Minimal dialogue-choice engine. Reads `choices` off a DialogueLine, checks
 * requireFlags + requireItems, writes flags on resolve, and returns nextId.
 *
 * DialogueBox calls shouldRender() to decide whether to show a choice row
 * after typewriter completes. Scenes never touch ChoiceEngine directly —
 * all wiring goes through DialogueBox / DialogueManager.
 */
export class ChoiceEngine {
  /** True if this line should display a choice row. */
  static shouldRender(line: DialogueLine): boolean {
    return Array.isArray(line.choices) && line.choices.length > 0;
  }

  /**
   * Return the options the player should actually see given current flags +
   * survival state. Options whose requireFlags or requireItems are not met
   * are filtered out. If ALL options are filtered, the caller should treat the
   * line as choiceless and auto-advance.
   */
  static availableOptions(
    line: DialogueLine,
    registry: Phaser.Data.DataManager,
    survival: SurvivalManager,
  ): DialogueChoice[] {
    if (!line.choices) return [];
    const flags = getFlags(registry);
    return line.choices.filter(c => {
      if (c.requireFlags) {
        for (const f of c.requireFlags) {
          if (!flags[f]) return false;
        }
      }
      if (c.requireItems) {
        for (const { item, count } of c.requireItems) {
          if (!survival.has(item, count)) return false;
        }
      }
      return true;
    });
  }

  /**
   * Apply setFlags, consume requireItems, and return the next dialogue id.
   * Call this once the player has confirmed a choice.
   *
   * Emits EVENTS.DIALOGUE_CHOICE on the event bus (imported lazily to avoid
   * circular deps — bus is used by many systems).
   */
  static resolve(
    choice: DialogueChoice,
    registry: Phaser.Data.DataManager,
    survival: SurvivalManager,
  ): { nextId: string } {
    if (choice.setFlags) {
      for (const f of choice.setFlags) setFlag(registry, f, true);
    }
    if (choice.consumeItems) {
      for (const { item, count } of choice.consumeItems) survival.consume(item, count);
    }
    return { nextId: choice.nextId };
  }
}
