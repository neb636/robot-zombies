/**
 * Sam — Ridge Camp NPC. Survivor. Widow.
 *
 * Her husband went out on a hunting trip three weeks ago and didn't come back.
 * She feeds people without ceremony and doesn't ask for anything in return.
 * The rifle side quest (SAM_HUSBAND_RIFLE_FOUND) is gated off her intro dialogue.
 *
 * Not a party member. Camp NPC only.
 */
export interface NpcDef {
  id: string;
  name: string;
  color: number;
  width: number;
  height: number;
  /** Short bio used internally for scene reference. */
  description: string;
}

export const SAM_DEF: NpcDef = {
  id:          'sam',
  name:        'SAM',
  color:       0xcc8866,
  width:       16,
  height:      26,
  description: 'Ridge Camp cook and de facto quartermaster. Husband missing three weeks. '
             + 'His rifle is at the old lookout on the east trail.',
};

/** Flag set when the player returns Sam\'s husband\'s rifle. */
export const SAM_HUSBAND_RIFLE_FOUND = 'sam_husband_rifle_found' as const;
