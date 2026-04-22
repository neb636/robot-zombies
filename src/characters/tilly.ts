/**
 * Tilly — Ridge Camp NPC. Campfire companion.
 *
 * Her grandmother was from Harlan County. She carries that weight lightly.
 * The campfire bond scene sets TILLY_BOND_1; accepting her gift sets TILLY_TRUSTED.
 * Both flags may affect late-game dialogue (planned Ch.3+).
 *
 * Not a party member. Camp NPC only.
 */
export interface NpcDef {
  id: string;
  name: string;
  color: number;
  width: number;
  height: number;
  description: string;
}

export const TILLY_DEF: NpcDef = {
  id:          'tilly',
  name:        'TILLY',
  color:       0x88aa66,
  width:       14,
  height:      24,
  description: 'Ridge Camp survivor. Appalachian roots, practical warmth. '
             + 'Campfire bond and gift exchange gates TILLY_BOND_1 and TILLY_TRUSTED flags.',
};

/** Set after the campfire bond conversation completes. */
export const TILLY_BOND_1   = 'tilly_bond_1'   as const;
/** Set when the player accepts Tilly\'s gift. */
export const TILLY_TRUSTED  = 'tilly_trusted'   as const;
