import type { Region, TradePrices } from '../types.js';

/**
 * Region-specific buy/sell catalogs. PHASE B STUB — Stream A fills.
 */
export function pricesForRegion(region: Region): TradePrices {
  return {
    region,
    entries: [
      { item: 'food',     buyPrice: 5,  sellPrice: 3 },
      { item: 'fuel',     buyPrice: 12, sellPrice: 6 },
      { item: 'medicine', buyPrice: 8,  sellPrice: 4 },
      { item: 'ammo',     buyPrice: 6,  sellPrice: 3 },
    ],
  };
}
