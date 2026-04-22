/**
 * Rook — Ridge Camp NPC. Scout and tactical observer.
 *
 * Has been watching Harlan Mine for ten days. Doesn\'t quite have a plan.
 * Provides the party with floor-by-floor intel on the mine layout
 * and warns them about Warden Six before the descent.
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

export const ROOK_DEF: NpcDef = {
  id:          'rook',
  name:        'ROOK',
  color:       0x667788,
  width:       16,
  height:      26,
  description: 'Ridge Camp scout. Has detailed observations of Harlan Mine. '
             + 'Delivers Warden Six warning before boss floor descent.',
};
