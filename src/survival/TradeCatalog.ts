import type { Region, TradePrices } from '../types.js';

// ─── Static trade catalogs (imported at build time) ────────────────────────

import bostonTrade      from '../data/survival/trade-boston.json'       assert { type: 'json' };
import appalachiaTrade  from '../data/survival/trade-appalachia.json'   assert { type: 'json' };
import deepSouthTrade   from '../data/survival/trade-deep-south.json'   assert { type: 'json' };
import greatPlainsTrade from '../data/survival/trade-great-plains.json' assert { type: 'json' };
import rockiesTrade     from '../data/survival/trade-rockies.json'      assert { type: 'json' };
import siliconValleyTrade from '../data/survival/trade-silicon-valley.json' assert { type: 'json' };

// ─── Raw JSON shape ────────────────────────────────────────────────────────

interface RawTradeEntry {
  item: 'food' | 'fuel' | 'medicine' | 'ammo' | 'morale_item';
  buyPrice: number;
  sellPrice: number;
}

interface RawTradeCatalog {
  region: string;
  description: string;
  entries: RawTradeEntry[];
  moraleItemName: string;
  moraleItemFlavor: string;
}

const REGION_CATALOGS: Record<Region, RawTradeCatalog> = {
  boston:         bostonTrade      as RawTradeCatalog,
  appalachia:     appalachiaTrade  as RawTradeCatalog,
  deep_south:     deepSouthTrade   as RawTradeCatalog,
  great_plains:   greatPlainsTrade as RawTradeCatalog,
  rockies:        rockiesTrade     as RawTradeCatalog,
  silicon_valley: siliconValleyTrade as RawTradeCatalog,
};

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Returns the buy/sell price list for a given region.
 * All prices are integers per the spec.
 */
export function pricesForRegion(region: Region): TradePrices {
  const catalog = REGION_CATALOGS[region];
  return {
    region,
    entries: catalog.entries.map(e => ({
      item:      e.item,
      buyPrice:  Math.floor(e.buyPrice),
      sellPrice: Math.floor(e.sellPrice),
    })),
  };
}

/**
 * Returns the morale item name and flavor text for a region.
 * Used by TradeScene to display the region-specific item.
 */
export function moraleItemForRegion(region: Region): { name: string; flavor: string } {
  const catalog = REGION_CATALOGS[region];
  return {
    name:   catalog.moraleItemName,
    flavor: catalog.moraleItemFlavor,
  };
}

/**
 * Human-readable description of the trading post for a region.
 */
export function tradeDescriptionForRegion(region: Region): string {
  return REGION_CATALOGS[region].description;
}

/**
 * Price range summary across all regions — buy min/max per item.
 * Used for reporting.
 */
export function globalPriceRanges(): Record<
  'food' | 'fuel' | 'medicine' | 'ammo',
  { buyMin: number; buyMax: number }
> {
  const items = ['food', 'fuel', 'medicine', 'ammo'] as const;
  const ranges: Record<string, { buyMin: number; buyMax: number }> = {};

  for (const item of items) {
    let buyMin = Infinity;
    let buyMax = -Infinity;

    for (const region of Object.keys(REGION_CATALOGS) as Region[]) {
      const entry = REGION_CATALOGS[region].entries.find(e => e.item === item);
      if (entry) {
        if (entry.buyPrice < buyMin) buyMin = entry.buyPrice;
        if (entry.buyPrice > buyMax) buyMax = entry.buyPrice;
      }
    }

    ranges[item] = { buyMin, buyMax };
  }

  return ranges as Record<'food' | 'fuel' | 'medicine' | 'ammo', { buyMin: number; buyMax: number }>;
}
