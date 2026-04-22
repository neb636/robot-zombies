/**
 * Tomas Reyes — NPC. Mississippi Crossing gatekeeper.
 *
 * A fixer who controls access to the only safe Mississippi crossing.
 * Offers the party a choice (§7): carry a package to Vault 49 in exchange
 * for having their names cleared from the Governor's registry.
 *
 * Not a party member. No CharacterDef. Pure NPC data.
 */
export interface TomasNPC {
  id:          string;
  name:        string;
  /** TOMAS_DEBT_CLEARED — set if player accepts the deal. Deja morale +15. */
  acceptFlag:  string;
  /** TOMAS_REFUSED — set if player declines the deal. */
  declineFlag: string;
  /** Morale bonus applied to Deja when deal is accepted. Integer only. */
  dejaAcceptMoralBonus: number;
}

export const TOMAS: TomasNPC = {
  id:                   'tomas',
  name:                 'TOMAS REYES',
  acceptFlag:           'TOMAS_DEBT_CLEARED',
  declineFlag:          'TOMAS_REFUSED',
  dejaAcceptMoralBonus: 15,
};
