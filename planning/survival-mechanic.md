# Silicon Requiem — Survival Layer

> Standalone mechanic. Plugs into any region overworld. Oregon Trail anxiety engine dropped into a Chrono Trigger world map.

---

## Overview

The survival layer runs as a persistent overlay on the world map — always active between scenes, never interrupting story. It is purely freeform and does not appear in scripted cutscenes or dungeon interiors. It is the texture of the journey, not the story of it.

**Core state object (required fields):**

```js
const survivalState = {
  food: 14,        // units (each person eats 1/day; party of 4 = -4/day)
  fuel: 8,         // tanks (costs 1 per map zone crossed by vehicle)
  medicine: 3,     // kits
  ammo: 40,        // rounds (bonus drain in battles)
  morale: 72,      // 0–100
  vehicleCondition: 85, // 0–100
  partySize: 4,
  region: 'appalachia',
  daysElapsed: 0,
};
```

---

## Resource Drain Rates

| Resource | Drain trigger | Rate | Party modifier |
|----------|--------------|------|----------------|
| Food | Each in-game day | 1 unit per person | Elias hunting: –50% drain |
| Fuel | Each map zone crossed | 1 tank per zone | On foot: no fuel drain |
| Medicine | Post-battle or illness event | 1 kit per wound | Maya medic passive: –1 kit/use |
| Ammo | Battle (bonus drain) | –5 to –20 rounds | Jerome passive: +ammo drop rate |
| Morale | Loss events, starvation, death | –5 to –25 | Jerome speech: +10 morale |

---

## Hunger / Starvation Cascade

| Food level | Effect |
|-----------|--------|
| 8+ days | Normal. Party at full stats. |
| 3–7 days | Morale drain begins (–2/day). Light penalty on battle stats. |
| 1–2 days | Hunger warning. All stats –15%. Jerome dialogue triggers. |
| 0 days | Starvation. HP drains daily. Morale collapses. Party may refuse to travel. |

---

## Random Travel Events

Triggered probabilistically on each travel tick (suggested: 40% chance per travel day). Roll from region-appropriate table.

### Positive events
- **Hunting opportunity** — A deer in the clearing. Choose to hunt (costs 1 hour / risks noise alerting drones) or pass. Elias present: +3–6 food on success.
- **Abandoned store** — Scavenge roll: find 0–8 food, 0–3 medicine, 0–2 fuel. Risk: 30% chance Drone patrol triggers.
- **Survivor camp** — Trade goods. Buy food/fuel with scrap. Optional side quest to earn better rates.
- **Lucky find** — Party stumbles on a supply cache. +4 food, +1 medicine, +1 fuel.

### Negative events
- **Vehicle breakdown** — Lose 1 fuel tank, travel halted 1 day. Dr. Chen (if recruited): auto-repair, skip penalty.
- **Illness** — One party member sick: –20% stats for 2 days. Cure: 1 medicine kit or wait 3 days.
- **Ambush** — Drone patrol found you. Fight, flee (burn 1 fuel), or hide (costs 1 day, morale –5).
- **Rain spoils supplies** — –2 food lost to the elements.

### Flavor / morale events
- **Campfire night** — Party talks. Morale +8. Flavor dialogue specific to who's alive in the party.
- **Jerome preaches** — Morale +10. Only triggers if morale < 50.
- **Found a record player** — Someone plays a song. Morale +5. Region-specific track.

---

## The Trade Screen

Triggered when entering a Safe House or settlement node on the world map.

**Currency:** Scrap (found by looting, won in battles, rewarded for quests).

### Buy prices (base — varies by region)
| Item | Cost |
|------|------|
| Food ration | 5 scrap |
| Fuel tank | 12 scrap |
| Medicine kit | 8 scrap |
| Ammo box | 6 scrap |
| Morale item* | 15 scrap |

### Sell prices (base)
| Item | Value |
|------|-------|
| Robot parts | 8 scrap |
| Rare tech | 20 scrap |
| Surplus food | 3 scrap |
| Weapons | 10–30 scrap |
| Intel data | 15 scrap |

### Regional price modifiers
| Region | Cheap | Scarce |
|--------|-------|--------|
| Appalachia | Food | Fuel |
| Deep South | Fuel | Medicine |
| Great Plains | Ammo | —|
| Rockies | — | Medicine |
| Silicon Valley | Nothing for sale | Everything |

*Morale items are flavor-specific per region: Elias's pipe tobacco (Appalachia), fresh coffee (Deep South), a paperback novel (Plains), a warm blanket (Rockies).*

---

## Hunting Mini-Game

**Triggers when:** Elias is in the party AND a hunting event fires.

**Mechanic:** A target (deer, rabbit, fish) moves across the screen on a simple arc. Player presses the action button in the highlighted window.

| Result | Outcome |
|--------|---------|
| Perfect timing | +5–6 food. No noise. |
| Good timing | +3–4 food. No noise. |
| Miss | +0 food. 25% chance drone alert. |
| No Elias | –1 success tier. Higher alert chance. |

Takes 30 seconds of real play time maximum. Designed to feel like a breath, not a chore.

---

## Implementation Notes

- The survival layer only needs access to `survivalState` — it has no dependencies on story state.
- Inject a `travelTick()` call at every map node transition.
- Random event table should be region-filtered: no hunting events in Silicon Valley, no aerial sentinel ambushes in the bayou.
- All drain calculations should use integer math. No floating point.
- The morale stat feeds into battle (below ~30 morale: –10% to all stats) and dialogue (character lines change when morale is low).

```js
function travelTick(state) {
  state.food = Math.max(0, state.food - state.partySize);
  state.fuel = Math.max(0, state.fuel - 1);
  state.daysElapsed += 1;
  if (state.food === 0) state.morale = Math.max(0, state.morale - 10);
  const event = rollRandomEvent(state.region);
  applyEvent(event, state);
  return { state, event };
}
```
