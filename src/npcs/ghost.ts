/**
 * Ghost — Radio Tower NPC. Ch.3.
 *
 * Identity unknown. Speaks through static on the tower's frequency.
 * Knows the tower's wiring. Was there before the party arrived.
 * Not present as a physical sprite — voice only via DialogueManager.
 *
 * Dialogue anchor: radio_tower.ghost.reveal
 * Flag: STATIC_REAL_MET (player heard Ghost speak)
 * Flag: GHOST_KEY_OBTAINED (player used Ghost's panel hint — blue wire on floor 3)
 *
 * Phase B stub overwrite:
 *   Ghost is voice-only in Ch.3. Physical appearance deferred to Ch.4.
 *   GHOST_KEY_OBTAINED gates a shortcut in the tower climb (floor 3 panel bypass).
 */

export interface GhostDef {
  id: string;
  name: string;
  /** Ghost is audio-only in Ch.3 — no sprite. */
  hasSprite: false;
  /** The panel location hint Ghost provides. */
  hintPayload: {
    floor: number;
    wall: 'east';
    wire: 'blue';
  };
}

export const GHOST_DEF: GhostDef = {
  id:          'ghost',
  name:        'GHOST',
  hasSprite:   false,
  hintPayload: {
    floor: 3,
    wall:  'east',
    wire:  'blue',
  },
};
