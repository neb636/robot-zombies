/**
 * Apartment scene asset URL map. Imported by ApartmentRenderer / ApartmentV3
 * and registered by _core/preload/PreloadScene before scene start.
 */

// V1 tilesets
import floorPng         from './assets/tilesets/apartment_floor.png';
import floorMetaUrl     from './assets/tilesets/apartment_floor.json?url';
import floorTexturePng  from './assets/tilesets/apartment_floor_texture.png';
import wallPng          from './assets/tilesets/apartment_wall.png';
import wallMetaUrl      from './assets/tilesets/apartment_wall.json?url';

// V3 tilesets
import v3FloorPng       from './assets/tilesetsV3/apartment_v3_floor.png';
import v3FloorMetaUrl   from './assets/tilesetsV3/apartment_v3_floor.json?url';
import v3WallPng        from './assets/tilesetsV3/apartment_v3_wall.png';
import v3WallMetaUrl    from './assets/tilesetsV3/apartment_v3_wall.json?url';

// Interior objects (V1) — globbed so adding a PNG here registers automatically.
const OBJECT_GLOBS = import.meta.glob<string>('./assets/objects/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const APARTMENT_TILESET_URLS = {
  apartment_floor:         floorPng,
  apartment_floor_texture: floorTexturePng,
  apartment_wall:          wallPng,
} as const;

export const APARTMENT_TILESET_META_URLS = {
  apartment_floor: floorMetaUrl,
  apartment_wall:  wallMetaUrl,
} as const;

export const APARTMENT_V3_TILESET_URLS = {
  apartment_v3_floor: v3FloorPng,
  apartment_v3_wall:  v3WallPng,
} as const;

export const APARTMENT_V3_TILESET_META_URLS = {
  apartment_v3_floor: v3FloorMetaUrl,
  apartment_v3_wall:  v3WallMetaUrl,
} as const;

/** Map of object name (filename without extension) → URL. */
export const APARTMENT_OBJECT_URLS: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(OBJECT_GLOBS)) {
    const m = path.match(/\/([^/]+)\.png$/);
    if (m && m[1]) out[m[1]] = url;
  }
  return out;
})();
