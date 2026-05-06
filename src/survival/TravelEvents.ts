import type { Region, TravelEvent, TravelEventKind } from '../types.js';

// ─── Raw JSON event shapes (before hydration) ─────────────────────────────

interface RawEvent {
  kind: TravelEventKind;
  weight: number;
  text: string;
  effect?: Partial<{
    food: number;
    fuel: number;
    medicine: number;
    ammo: number;
    scrap: number;
    morale: number;
  }>;
  triggersBattle?: boolean;
  enemyKey?: string;
  droneAlertChance?: number;
}

// ─── Static event tables (imported at build time) ──────────────────────────

import bostonRaw      from '../data/survival/events-boston.json'       assert { type: 'json' };
import appalachiaRaw  from '../data/survival/events-appalachia.json'   assert { type: 'json' };
import deepSouthRaw   from '../data/survival/events-deep-south.json'   assert { type: 'json' };
import greatPlainsRaw from '../data/survival/events-great-plains.json' assert { type: 'json' };
import rockiesRaw     from '../data/survival/events-rockies.json'      assert { type: 'json' };
import siliconValleyRaw from '../data/survival/events-silicon-valley.json' assert { type: 'json' };

const REGION_TABLES: Record<Region, RawEvent[]> = {
  boston:         bostonRaw      as RawEvent[],
  appalachia:     appalachiaRaw  as RawEvent[],
  deep_south:     deepSouthRaw   as RawEvent[],
  great_plains:   greatPlainsRaw as RawEvent[],
  rockies:        rockiesRaw     as RawEvent[],
  silicon_valley: siliconValleyRaw as RawEvent[],
};

// ─── Weighted random selection ─────────────────────────────────────────────

function pickWeighted(events: RawEvent[]): RawEvent | undefined {
  if (events.length === 0) return undefined;

  let total = 0;
  for (const e of events) {
    total += e.weight;
  }

  let roll = Math.floor(Math.random() * total);
  for (const e of events) {
    roll -= e.weight;
    if (roll < 0) return e;
  }

  // Fallback — should never reach here
  return events[events.length - 1];
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Roll for a random travel event for the given region.
 * The caller is responsible for the 40% chance gate — this function always
 * returns an event if called.
 *
 * Returns a `{ kind: 'none' }` event if the table is somehow empty.
 */
export function rollRandomEvent(region: Region): TravelEvent {
  const table = REGION_TABLES[region];
  const raw = pickWeighted(table);

  if (!raw) {
    return { kind: 'none', text: '' };
  }

  const event: TravelEvent = {
    kind:           raw.kind,
    text:           raw.text,
    ...(raw.effect         !== undefined && { effect: raw.effect }),
    triggersBattle: raw.triggersBattle ?? false,
    ...(raw.enemyKey       !== undefined && { enemyKey: raw.enemyKey }),
  };

  return event;
}

/**
 * Returns all events for a region (used by tests / debug tooling).
 */
export function eventsForRegion(region: Region): readonly RawEvent[] {
  return REGION_TABLES[region];
}

/**
 * Count of events per region — used by Stream A report.
 */
export function eventCountsPerRegion(): Record<Region, number> {
  return {
    boston:         REGION_TABLES.boston.length,
    appalachia:     REGION_TABLES.appalachia.length,
    deep_south:     REGION_TABLES.deep_south.length,
    great_plains:   REGION_TABLES.great_plains.length,
    rockies:        REGION_TABLES.rockies.length,
    silicon_valley: REGION_TABLES.silicon_valley.length,
  };
}
