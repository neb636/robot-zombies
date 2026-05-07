# Prologue Apartment — Scene Plan

This file captures what the prologue apartment scene *did* before the rebuild.
The rebuild strips everything except the floor and the player so we can compose
the room from new top-down assets. Use this doc as the spec when wiring the
story flow back in.

Reference art for the new layout: `planning/assets/6.png` (top-down apartment
with bedroom + living room, single combined room).

---

## Setting

- **When:** Tuesday, June 12, 2028 — 7:04 AM.
- **Where:** Player's apartment, Boston, MA.
- **Who:** Player (default name "Arlo"), alone. Marcus calls by phone.
- **Tone:** "Before the fall." Mundane. Annoying alarm. Coffee-not-yet-made
  energy. The horror is one news broadcast away.

---

## Phase state machine

The scene is a linear gate-driven flow (`PHASE` enum in the old
`PrologueScene.ts`):

```
WAKE_UP → EXPLORING → NEWSCAST → MARCUS → OUTRO → DONE
```

| Phase     | Input enabled? | Triggered by                                    |
|-----------|----------------|-------------------------------------------------|
| WAKE_UP   | no             | scene start; alarm + groggy line                |
| EXPLORING | yes            | wake-up dialogue closes                         |
| NEWSCAST  | no             | player crosses the bedroom→living-room divider, then sits on couch ([E]) |
| MARCUS    | no             | newscast finishes (broadcast → signal lost → player line) |
| OUTRO     | yes            | Marcus phone call ends; "Get to the front door →" hint |
| DONE      | no             | player walks through front-door zone; fade + timeskip |

State globals tracked on the scene:
`_phase`, `_inputEnabled`, `_enteredLiving`, `_playerName`, `_nearInteract`,
plus per-interactable `available` / `used` flags (couch is gated until the
divider trigger fires, then consumed once on use).

---

## Map geometry (old V1)

From `ApartmentRenderer.ts` / `layoutV1.json`:

| Constant     | Value | Meaning                                     |
|--------------|-------|---------------------------------------------|
| `MAP_W`      | 704   | total scene width                           |
| `MAP_H`      | 480   | total scene height                          |
| `WALL_T`     | 16    | wall thickness                              |
| `TOP_WALL_H` | 48    | top-wall band height                        |
| `DIVIDER_X`  | 344   | interior wall splitting bedroom / living    |
| `DOOR_TOP`   | 248   | top edge of interior doorway                |
| `DOOR_BOT`   | 280   | bottom edge of interior doorway             |
| `FDOOR_TOP`  | 248   | top edge of front door (right wall)         |
| `FDOOR_BOT`  | 280   | bottom edge of front door (right wall)      |

Bedroom = left of divider. Living room = right of divider. Front door = right
wall, between FDOOR_TOP/BOT.

Player start: `(200, 370)` — bedroom, near foot of bed.
Camera: `setZoom(2)`, follow player, bounds = full map.
World physics bounds: inset by walls.

Note: the new layout is a **single combined room** (matches `6.png`). When
restoring the story flow, replace the `DIVIDER_X` trigger with another
mechanism (e.g. crossing into the right half of the room) or rebuild the
divider as decorative geometry only.

---

## Interactables

All approached with `[E]` / mobile interact tap. Range and label come from the
old `_buildInteractables()`:

| id          | x   | y   | range | label         | gate                                  | dialogue key              |
|-------------|-----|-----|-------|---------------|---------------------------------------|---------------------------|
| `bed`       | 88  | 128 | 70    | Bed           | always                                | `interactable.bed`        |
| `alarm`     | 240 | 96  | 54    | Alarm Clock   | always                                | `interactable.alarm_clock`|
| `computer`  | 260 | 220 | 60    | Computer      | always                                | `interactable.computer`   |
| `bookshelf` | 48  | 300 | 60    | Bookshelf     | always                                | `interactable.bookshelf`  |
| `poster`    | 240 | 56  | 56    | Poster        | always                                | `interactable.poster`     |
| `couch`     | 472 | 300 | 70    | Couch         | `available=false` until divider cross; `used=true` after newscast triggers | calls `_triggerNewscast()` |

Speaker for the bed/bookshelf/poster lines is the player's name. Alarm uses
`ALARM CLOCK`. Computer uses `BROWSER`. Couch path bypasses dialogue and
flips into NEWSCAST phase.

---

## Story beats (full dialogue lives in `dialogue.json`)

1. **Wake up** — `wake_up.alarm` ("⚡ BEEP BEEP BEEP") then `wake_up.player`
   ("...", "Another Tuesday."). Hint shown: arrows/WASD to move, `[E]` to
   interact.
2. **Free explore** — bedroom interactables lay foundational lore: the
   unread SI Inc. emails, the unfinished "Alignment Problem," the Acadia
   poster. None of these gate progression; they're missable but seed the
   theme.
3. **Crossing into the living room** — the moment the player crosses
   `DIVIDER_X + 15`, input freezes and `living_trigger.player` runs:
   *"Next door. Your neighbor left their TV on again. Wait. That's not a
   normal channel."* The couch becomes available. New hint: `[E] Sit on the
   couch`.
4. **Newscast** — `[E]` on couch flips phase to NEWSCAST. TV CRT flashes
   blue (4 yoyo flashes), settles to a dim screen, and the SI INC label +
   broadcast bar overlay the TV sprite. Dialogue speaker is
   `📺 SUPERINTELLIGENCE INC — LIVE BROADCAST`, lines from
   `newscast.broadcast` (efficiency / conversion programs / "this is
   progress").
5. **Signal cut** — TV label flips to `— SIGNAL LOST —`, broadcast bar goes
   black, then `newscast_end.player` runs (Mrs. Halloway moving wrong, hum
   in the air).
6. **Marcus calls** — full-screen "📱 INCOMING CALL — MARCUS" banner fades
   in, buzzes (x-axis yoyo x6), then `marcus_call.phone`: *"Go outside. You
   need to see this. [CALL DROPPED]"*. Outro hint pulses: "Get to the front
   door →".
7. **Front door** — when player x > MAP_W − 60 and y is within the front
   door band, phase flips to DONE. `end.player` runs (the hum, the gray
   sweater man on the third corner).
8. **Timeskip** — camera fades to black, full-screen overlay fades in
   "TWO YEARS LATER" / "Boston, Massachusetts — 2030", holds, fades out,
   and `scene.start('NewBostonScene')`.

---

## Wiring + dependencies

- `DialogueManager` (HTML overlay) handles all dialogue. Speaker + lines.
- `MobileControls` is mandatory: virtual stick + interact tap. Listen for
  `keydown-E` AND `interact:tap` CustomEvent.
- `pauseMenu.isOpen()` blocks input + interact callbacks.
- HUD: top-left clock-style label "BOSTON, MA · JUNE 12, 2028", scroll-fixed.
- Camera: `fadeIn(900)` on entry; `fade(1200)` to black on outro before
  the timeskip overlay.
- Player name pulled from `registry.get('playerName')`, defaults to "Arlo".

---

## Restoration checklist (for when story is wired back in)

- [ ] Decide single-room equivalent of the bedroom→living "divider cross"
      trigger (the new layout has no interior divider).
- [ ] Re-place interactables on the new floor coordinates (bed, alarm,
      computer, bookshelf, poster, couch, TV, front door).
- [ ] Re-add the front-door collider gap + DONE-phase exit zone.
- [ ] Re-add the TV flash → broadcast overlay (TV sprite position will
      change with the new layout; the flash rectangle is hardcoded at
      `(480, 92, 40, 28)` and needs to track the TV).
- [ ] Re-add the Marcus phone overlay (scroll-fixed, no spatial tie-in).
- [ ] Re-add the timeskip → `NewBostonScene` transition.
- [ ] Keep dialogue.json as the source of truth — never inline strings in
      `PrologueScene.ts`.
