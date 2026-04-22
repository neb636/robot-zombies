import type { Region, TravelEvent } from '../types.js';

/**
 * Region-filtered travel-event tables.
 *
 * PHASE B STUB — Stream A populates the tables + exposes rollRandomEvent().
 * Until then every region returns a no-op event.
 */
export function rollRandomEvent(_region: Region): TravelEvent {
  return { kind: 'none', text: '' };
}
