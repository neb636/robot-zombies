# Silicon Requiem — Battle System

> ATB-style, SNES-friendly. Inspired by Final Fantasy IV–VI. Simple enough to implement in JavaScript, deep enough to carry 20 hours of combat.

---

## Core Model — Active Time Battle (ATB)

Each character has a Speed stat that fills their ATB gauge continuously. When a gauge reaches 100%, that character's portrait lights up and the player may select an action. Enemy gauges fill simultaneously. The battle never fully pauses — tension without real-time chaos.

```js
const ATB_TICK_MS = 60; // milliseconds per tick (lower = faster battle pace)

function atbTick(character) {
  character.atb = Math.min(100, character.atb + character.speed / 100);
  return character.atb >= 100;
}
```

**Rules:**
- Menu opens: battle pauses (FF6-style active pause)
- Max 3 party members in battle at once
- Enemy gauges visible to player (transparent difficulty)
- Tick rate adjustable for Easy / Normal / Hard difficulty settings

---

## Damage Formula

```js
function calcDamage(attacker, defender, skill) {
  const base = attacker.atk - Math.floor(defender.def / 2);
  const variance = 0.85 + Math.random() * 0.30; // ±15%
  const typeBonus = getTypeMultiplier(skill.type, defender.tags);
  return Math.max(1, Math.floor(base * variance * typeBonus));
}

function getTypeMultiplier(skillType, enemyTags) {
  if (skillType === 'EMP' && enemyTags.includes('Electronic')) return 1.5;
  if (skillType === 'Fire' && enemyTags.includes('Organic')) return 1.3;
  if (skillType === 'Physical' && enemyTags.includes('Armored')) return 0.7;
  return 1.0;
}
```

**Design principles:**
- Integer stats only — no floating point in displayed values
- Variance ±15% — enough to feel alive, not enough to feel unfair
- Every enemy has one weakness tag exploitable by one specific character
- Maya's Analyze reveals enemy tags permanently

---

## Character Battle Roles

### Player (Protagonist)
- **Role:** Balanced fighter
- **Stats:** STR mid, SPD mid, HP mid
- **Techs:** One learnable tech per chapter (determined by story events)
- **Notes:** The everyman. Uses whatever weapon was last found. Versatile.

### Maya
- **Role:** Tech specialist
- **Stats:** INT high, STR low, SPD high, HP low
- **Techs:**
  - `Hack` — Stun one Electronic enemy for 2 turns (ATB: medium cost)
  - `Analyze` — Reveals enemy weakness tags permanently
  - `EMP Grenade` — 1.5× damage to all Electronic enemies, hits row
- **Passive:** Uses 1 fewer medicine kit per heal action

### Elias *(lost in Ch.2)*
- **Role:** Hunter / tank
- **Stats:** STR very high, SPD low, HP high, DEF high
- **Techs:**
  - `Heavy Strike` — Single target, 1.8× ATK damage
  - `Steady Shot` — Ranged, ignores DEF stat entirely
  - `Cover` — Redirects next hit aimed at any ally to Elias instead
- **Passive:** Hunting mini-game success rate +2 tiers

### Deja *(lost in Ch.4)*
- **Role:** Rogue / speedster
- **Stats:** SPD very high, STR low, HP low
- **Techs:**
  - `Steal` — Takes one item from enemy's drop table immediately
  - `Smoke` — Guarantees escape from any encounter
  - `Dirty Hit` — Deals critical damage only if enemy is Stunned; otherwise deals 0
- **Passive:** Fastest ATB fill in the party (Speed = 90)

### Jerome
- **Role:** Support / bruiser
- **Stats:** STR high, HP very high, SPD low, INT mid
- **Techs:**
  - `Inspire` — All allies regen 15 HP/turn for 3 turns
  - `Smite` — Massive single-target damage (2.2× ATK), slow charge time
  - `Preach` — Removes Panicked status from all allies; morale +5 out of battle
- **Passive:** Party morale never drops below 20 while Jerome is alive

### Dr. Chen
- **Role:** Engineer / controller
- **Stats:** INT very high, STR low, HP mid, SPD mid
- **Techs:**
  - `Rewire` — Turns one Electronic enemy into a party ally for 2 turns
  - `Overclock` — Doubles one ally's ATB fill speed for 3 turns
  - `Shield Drone` — Summons a drone that absorbs the next incoming hit for any ally
- **Passive:** Vehicle breakdown events auto-resolve (no survival penalty)

---

## Status Effects

Five maximum — keeps it readable on a SNES-scale UI.

| Status | Icon color | Effect | Duration | Cure |
|--------|-----------|--------|----------|------|
| Stunned | Red | Skip next turn | 1 turn | Wait it out |
| Burning | Amber | –10 HP/turn | 3 turns | Medicine kit |
| Hacked | Purple | Attacks own allies | 2 turns | Natural expire |
| Shielded | Blue | Absorbs one hit | Until triggered | — |
| Panicked | Gray | Random action each turn | Until cured | Jerome's Preach |

---

## Combo / Dual Tech System

When two characters act on the same turn tick within 200ms of each other, a Combo prompt flashes. The player can trigger it or let both actions resolve independently.

Combos are **discovered by playing** — they do not appear in any menu until first triggered. First trigger plays a short name-flash animation (one frame, white flash, name appears center screen — FF6 Desperation Attack energy).

### Known Combos

| Name | Characters | Trigger | Effect |
|------|-----------|---------|--------|
| **Blackout** | Maya + Player | EMP + Attack | Stun then guaranteed crit. Discovered Ch.1. |
| **Righteous Fire** | Jerome + Elias | Inspire + Heavy Strike | Jerome heals Elias mid-swing; full HP damage output. Discovered Ch.2. |
| **Dead Weight** | Deja + Player | Smoke + Attack | Player strikes while Deja vanishes; enemy can't counter. Discovered Ch.2. |
| **Ghost & Shell** | Deja + Dr. Chen | Smoke + Rewire | Deja vanishes; Dr. Chen turns an enemy simultaneously. Chaos combo. Discovered Ch.4. |
| **The Sermon** | Jerome + Maya | Preach + Analyze | Full party debuff-clear + all weaknesses revealed. Discovered Ch.3. |

---

## Enemy Types & Robot Tiers

| Tier | Enemy type | Tags | Weakness | Behavior |
|------|-----------|------|----------|----------|
| Tier 1 | Compliance Drone | Electronic | EMP | Basic attack only. High speed, low HP. Often appear in groups of 3. |
| Tier 2 | Enforcer Unit | Electronic, Armored | Physical (heavy) | Armored front. Charge attack every 3 turns. Ignores weak hits. |
| Tier 3 | Sentinel | Electronic | Hack (Maya) | Calls 1 reinforcement if not killed within 4 turns. |
| Boss | Named units | Varies | Unique | 3 phases. Phase change triggers a story beat cutscene. |
| Special | Converted human | Organic | None | Can be cured (1 medicine kit, ends encounter) or fought normally. Moral choice — no XP for curing. |

---

## Boss Fight Structure

All major bosses follow a 3-phase pattern:

```
Phase 1: Standard behavior. Learn the pattern.
Phase 2 (triggered at 60% HP): New attack introduced. Cutscene flash. Music shift.
Phase 3 (triggered at 30% HP): Desperate mode. Higher damage, new status effect spam.
         Story dialogue plays during Phase 3 — the boss speaks.
```

**Final Boss — Elise Voss (3 phases mapped to arguments):**
- Phase 1: "Look how peaceful it is." — summons Converted humans (cure or fight)
- Phase 2: "You can't go back." — disables Rewire/Hack skills temporarily
- Phase 3: "You'd do the same thing if you were me." — party morale mechanic inverted; low morale = high damage

---

## Battle UI Layout (SNES-style)

```
┌─────────────────────────────────────────────────┐
│  [Enemy sprite area — top 60% of screen]         │
├─────────────────────────────────────────────────┤
│ PLAYER   ████████░░  HP: 180/220  ATB: ████████ │
│ MAYA     ██████████  HP: 120/120  ATB: READY    │
│ JEROME   ████░░░░░░  HP: 280/340  ATB: ████░░░░ │
├─────────────────────────────────────────────────┤
│  > Attack    Techs    Items    Defend            │
└─────────────────────────────────────────────────┘
```

- ATB bar fills left to right, pulses when full
- Enemy HP bars visible (no numbers — just bar percentage)
- Status effect icons appear next to character name (max 2 visible)
- Combo flash overlays full screen for 0.5 seconds when triggered

---

## Implementation Notes

- All stat values are integers in range 1–100
- ATB tick runs on `setInterval(tick, 60)` — clear on menu open, resume on close
- Enemy AI is state-machine based: `IDLE → CHARGING → ACTING → COOLDOWN`
- Combo detection: store last-action timestamps; if two actions within 200ms and a valid combo pair exists, fire combo
- XP and leveling: flat milestone system (not per-battle). Characters level up at chapter transitions — removes grind incentive.

```js
// Combo detection example
function checkCombo(lastAction, newAction) {
  const timeDiff = newAction.timestamp - lastAction.timestamp;
  if (timeDiff > 200) return null;
  return COMBO_TABLE.find(c =>
    c.chars.includes(lastAction.char) &&
    c.chars.includes(newAction.char)
  ) || null;
}
```
