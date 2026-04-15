// Shared types for the level builder tool (used by server.ts only)

export interface AssetEntry {
  path: string;   // full metadata.json key, e.g. "extracted-assets/Interior/Office/..."
  type: string;   // suggestedType from metadata
  w: number;
  h: number;
  perspective: string;
  dominantColor: string;
}

export interface CatalogGroup {
  label: string;   // human-readable, e.g. "Office — Chairs, Tables & Shelves"
  room: string;    // pathHints.room
  category: string; // pathHints.category
  assets: AssetEntry[];
}

export interface Catalog {
  groups: Record<string, CatalogGroup>; // key: "room/category"
}

// What Claude must return (3 of these per generate call)
export interface PlacedObject {
  id: string;
  assetPath: string;
  x: number;
  y: number;
  layer: 'floor' | 'object' | 'overlay';
  label?: string;
}

export interface LayoutVariation {
  id: string;         // "variation-1" | "variation-2" | "variation-3"
  name: string;
  description: string;
  canvasWidth: number;
  canvasHeight: number;
  objects: PlacedObject[];
}

export interface GenerateResponse {
  variations: LayoutVariation[];
}

// Game-ready export format
export interface LayoutObject {
  assetPath: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

export interface LevelLayout {
  version: 1;
  name: string;
  description: string;
  generatedAt: string;
  promptUsed: string;
  width: number;
  height: number;
  layers: {
    floor: LayoutObject[];
    object: LayoutObject[];
    overlay: LayoutObject[];
  };
}

// Raw metadata.json shape (per entry)
export interface MetadataEntry {
  width: number;
  height: number;
  aspectRatio: number;
  hasAlpha: boolean;
  perspective: string;
  perspectiveConfidence: string;
  suggestedType: string;
  dominantColor: string;
  transparencyDistribution: { top: number; bottom: number; left: number; right: number };
  pathHints: { room: string; category: string };
  needsReview?: boolean;
}
