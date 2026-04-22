import Phaser from 'phaser';
import type { DialogueChoice, DialogueLine } from '../types.js';
import type { SurvivalManager } from '../survival/SurvivalManager.js';
import { getFlags, setFlag } from '../utils/constants.js';

/**
 * Minimal dialogue-choice engine. Reads `choices` off a DialogueLine, renders
 * a tap/click option row via DialogueBox, writes flags, and returns the
 * selected option's `nextId`.
 *
 * PHASE B STUB — Stream G fills the DialogueBox integration. The resolve()
 * path below is canonical and safe to call from scenes.
 */
export class ChoiceEngine {
  static shouldRender(line: DialogueLine): boolean {
    return Array.isArray(line.choices) && line.choices.length > 0;
  }

  /** Return the options the player should actually see given flags + survival state. */
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

  /** Apply flags + consume items + return the next dialogue id. */
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
