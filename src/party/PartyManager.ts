import Phaser from 'phaser';
import { CHARACTER_REGISTRY }  from '../characters/index.js';
import type { PartyMember, AllyConfig, BattlePlayer } from '../types.js';

const PARTY_KEY        = 'party';
const PARTY_ACTIVE_KEY = 'partyActive';

/**
 * PartyManager — persists party state across scene transitions via Phaser registry.
 *
 * The player character is NOT tracked here (always present, managed separately by
 * BattleManager). PartyManager only tracks recruitable allies.
 *
 * Registry keys:
 *   'party'       → PartyMember[]   (all recruited members, including benched)
 *   'partyActive' → string[]        (IDs of up to 3 active battle members)
 */
export class PartyManager {
  constructor(private readonly registry: Phaser.Data.DataManager) {}

  // ─── Read ─────────────────────────────────────────────────────────────────

  getParty(): PartyMember[] {
    return (this.registry.get(PARTY_KEY) as PartyMember[] | undefined) ?? [];
  }

  getActiveIds(): string[] {
    return (this.registry.get(PARTY_ACTIVE_KEY) as string[] | undefined) ?? [];
  }

  // ─── Write ────────────────────────────────────────────────────────────────

  /**
   * Add a character to the party using stats for the given chapter.
   * No-op if the character is already in the party.
   *
   * @param id       Character id from CHARACTER_REGISTRY (e.g. 'maya')
   * @param chapter  Current story chapter (0 = prologue)
   */
  addMember(id: string, chapter = 0): void {
    const def = CHARACTER_REGISTRY[id];
    if (!def) {
      console.warn(`PartyManager.addMember: unknown character id "${id}"`);
      return;
    }

    const party = this.getParty();
    if (party.some(m => m.id === id)) return; // already recruited

    const statIndex = Math.min(
      Math.max(0, chapter - def.joinChapter),
      def.chapterStats.length - 1,
    );
    const stats = def.chapterStats[statIndex];
    if (!stats) {
      console.warn(`PartyManager.addMember: no stats for "${id}" at chapter ${chapter}`);
      return;
    }

    const member: PartyMember = {
      id,
      name:      def.name,
      hp:        stats.maxHp,
      maxHp:     stats.maxHp,
      str:       stats.str,
      def:       stats.def,
      int:       stats.int,
      spd:       stats.spd,
      lck:       stats.lck,
      row:       'front',
      equipment: {},
    };

    party.push(member);
    this._saveParty(party);

    // Auto-add to active slots if space remains
    const active = this.getActiveIds();
    if (active.length < 3) {
      active.push(id);
      this._saveActive(active);
    }
  }

  /**
   * Permanently remove a character from the party (Elias in Ch.2, Deja in Ch.4).
   */
  removeMember(id: string): void {
    const party = this.getParty().filter(m => m.id !== id);
    this._saveParty(party);
    const active = this.getActiveIds().filter(aid => aid !== id);
    this._saveActive(active);
  }

  /**
   * Manually select which party members are active in battle (max 3).
   * The player character is always in addition to these.
   */
  setActive(ids: string[]): void {
    const party = this.getParty();
    const valid = ids.filter(id => party.some(m => m.id === id)).slice(0, 3);
    this._saveActive(valid);
  }

  /**
   * Convert active party members to AllyConfig[] for use in BattleInitData.
   * Attack is mapped from STR for now (full ATB formula wired in M2).
   */
  toAllyConfigs(): AllyConfig[] {
    const party  = this.getParty();
    const active = this.getActiveIds();
    const def    = CHARACTER_REGISTRY;

    return active
      .map(id => party.find(m => m.id === id))
      .filter((m): m is PartyMember => m !== undefined)
      .map(m => ({
        id:     m.id,
        name:   m.name,
        hp:     m.hp,
        maxHp:  m.maxHp,
        attack: m.str,
        color:  def[m.id]?.color ?? 0x888888,
        row:    m.row,
      }));
  }

  /**
   * Sync current HP values back from battle results.
   * Called after BattleScene ends to persist HP loss.
   */
  syncHpFromBattle(battlers: BattlePlayer[]): void {
    const party = this.getParty();
    for (const battler of battlers) {
      const member = party.find(m => m.name === battler.name);
      if (member) {
        member.hp = battler.hp;
      }
    }
    this._saveParty(party);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _saveParty(party: PartyMember[]): void {
    this.registry.set(PARTY_KEY, party);
  }

  private _saveActive(ids: string[]): void {
    this.registry.set(PARTY_ACTIVE_KEY, ids);
  }
}
