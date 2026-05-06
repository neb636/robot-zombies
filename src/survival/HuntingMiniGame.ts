import type { HuntingResult } from '../types.js';

// ─── Arc timing constants ──────────────────────────────────────────────────

/**
 * Total arc duration in milliseconds (30 seconds max per spec).
 * The arc runs from 0 → ARC_DURATION_MS.
 */
export const ARC_DURATION_MS = 8000 as const;

/**
 * The press window is the portion of the arc where timing is evaluated.
 * Window boundaries are 0–1 fractions of ARC_DURATION_MS.
 */
export interface PressWindow {
  /** Fraction of arc at which the window opens (0–1). */
  openAt: number;
  /** Fraction of arc at which the window closes (0–1). */
  closeAt: number;
  /** Center fraction — timing closest to this yields Perfect. */
  centerAt: number;
}

/**
 * Returns a press window for this hunt session.
 * Randomised so the player can't memorise a fixed timing.
 */
export function generatePressWindow(): PressWindow {
  // Window opens between 30% and 55% through the arc
  const openFrac  = 0.30 + Math.random() * 0.25;
  // Window is 15–25% of arc wide
  const widthFrac = 0.15 + Math.random() * 0.10;
  const closeFrac = Math.min(openFrac + widthFrac, 0.90);
  const centerFrac = (openFrac + closeFrac) / 2;

  return {
    openAt:   openFrac,
    closeAt:  closeFrac,
    centerAt: centerFrac,
  };
}

/**
 * Compute the target X position on the arc (0–1 normalised) at a given
 * elapsed time. Uses a simple parabolic arc shape that peaks in the middle.
 *
 * @param elapsedMs  Milliseconds since the arc started.
 * @returns          Normalised horizontal position 0–1.
 */
export function arcPosition(elapsedMs: number): number {
  const t = Math.min(elapsedMs / ARC_DURATION_MS, 1);
  // Normalise to a smooth 0→1 curve
  return t;
}

/**
 * Compute the target Y position (vertical arc, 0 = top, 1 = bottom).
 * Parabolic: starts high, peaks at center, descends.
 */
export function arcYPosition(elapsedMs: number): number {
  const t = Math.min(elapsedMs / ARC_DURATION_MS, 1);
  // Inverted parabola: y = 1 - 4t(1-t) → peaks at 1.0 at t=0.5, min at edges
  return 1 - 4 * t * (1 - t);
}

// ─── Result resolution ─────────────────────────────────────────────────────

/**
 * Resolve a hunting attempt.
 *
 * @param eliasPresent  Whether Elias is in the active party.
 * @param timingMs      Elapsed milliseconds when the player pressed (or -1 for miss/timeout).
 * @param window        The press window generated at hunt start.
 * @returns             'perfect' | 'good' | 'miss'
 */
export function resolveHunt(
  eliasPresent: boolean,
  timingMs: number,
  window: PressWindow,
): HuntingResult {
  if (timingMs < 0) return 'miss';

  const t = timingMs / ARC_DURATION_MS;

  // Outside window entirely → miss
  if (t < window.openAt || t > window.closeAt) return 'miss';

  // Distance from center, normalised to half-window width
  const halfWidth = (window.closeAt - window.openAt) / 2;
  const distFromCenter = Math.abs(t - window.centerAt);
  const normalised = halfWidth > 0 ? distFromCenter / halfWidth : 1;

  // Without Elias, drop one tier
  if (eliasPresent) {
    if (normalised <= 0.35) return 'perfect';
    return 'good';
  } else {
    // No Elias: perfect → good, good → miss
    if (normalised <= 0.35) return 'good';
    return 'miss';
  }
}

/**
 * Calculate food gain and drone-alert chance from a hunt result.
 * All values are integers per spec.
 */
export function huntRewards(result: HuntingResult): {
  food: number;
  droneAlertChance: number;
} {
  switch (result) {
    case 'perfect':
      return { food: 5 + Math.floor(Math.random() * 2), droneAlertChance: 0 };
    case 'good':
      return { food: 3 + Math.floor(Math.random() * 2), droneAlertChance: 0 };
    case 'miss':
      return { food: 0, droneAlertChance: 25 };
  }
}
