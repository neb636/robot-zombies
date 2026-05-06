# Stream F — Audio (Procedural Themes + SFX)

## Scope

Extend `ProceduralMusic.ts` (currently only a title-screen harp) with per-region themes and battle music. Add procedural SFX for combat and UI events. No real audio files — everything synthesized via Web Audio API, same approach as the existing title theme.

## Files you OWN (create)

### Region themes
- `src/audio/themes/boston.ts` — survival horror; low drone + sparse piano.
- `src/audio/themes/appalachia.ts` — folk; acoustic arpeggio, warm but uneasy.
- `src/audio/themes/deep_south.ts` — jazz; walking bass, muted trumpet stab.
- `src/audio/themes/great_plains.ts` — existential dread; long held tones.
- `src/audio/themes/rockies.ts` — ambient; wind + soft pad.
- `src/audio/themes/silicon_valley.ts` — utopia horror; pristine bells, major-key but sour.
- `src/audio/themes/battle_normal.ts` — driving 4/4 rhythm.
- `src/audio/themes/battle_boss.ts` — tense, irregular meter.
- `src/audio/themes/battle_final.ts` — Elise theme; ties in a motif from boston.ts.
- `src/audio/themes/index.ts`

### SFX
- `src/audio/sfx/attack_physical.ts`
- `src/audio/sfx/attack_emp.ts`
- `src/audio/sfx/attack_fire.ts`
- `src/audio/sfx/heal.ts`
- `src/audio/sfx/status_apply.ts`
- `src/audio/sfx/status_expire.ts`
- `src/audio/sfx/ui_select.ts`
- `src/audio/sfx/ui_confirm.ts`
- `src/audio/sfx/ui_cancel.ts`
- `src/audio/sfx/dialogue_advance.ts`
- `src/audio/sfx/level_up.ts`
- `src/audio/sfx/victory.ts`
- `src/audio/sfx/defeat.ts`
- `src/audio/sfx/index.ts`

## Files you MAY MODIFY (sole owner)

- `src/audio/AudioManager.ts` — add a theme registry map so scenes can call `audioMgr.playTheme('appalachia')` etc. Keep the existing Howler-wrapped `playMusic`/`playSfx` API for eventual real audio files; add procedural paths alongside.

## Files you MAY NOT TOUCH

- Any scene.
- `ProceduralMusic.ts` itself — but you may create NEW procedural generators that follow the same pattern next to it.

## Constraint

Every theme must loop seamlessly (schedule notes on a Web Audio transport, use `AudioContext.currentTime`, schedule forward as done in existing ProceduralMusic). Keep each theme under ~200 lines.

SFX are one-shots — no looping. Each should fire in under 50ms (trigger a short envelope on an oscillator + brief tail).

## Acceptance

1. Each region theme plays seamlessly at least 30 seconds without clicks.
2. Theme change via AudioManager fades out current + fades in next over 600ms.
3. SFX fire reliably under battle load (multiple SFX in one tick don't cause audio dropouts).
4. Browser autoplay suspension handled via existing pattern (resume on first pointer/key).
5. `npm run typecheck` clean.

## Reference reading

- `src/audio/ProceduralMusic.ts` (read first — copy the pattern exactly)
- `src/audio/AudioManager.ts`
- `planning/game_outline.md` "Tone shifts by region" design notes (each theme's mood)
