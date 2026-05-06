# Quiet Machines — Character Stat Sheets

> All stats on a 1–100 scale. Integer values only. XP system is milestone-based — characters level at chapter transitions, not per battle.

---

## Stat Definitions

| Stat | Abbreviation | Effect |
|------|-------------|--------|
| Strength | STR | Base physical attack power |
| Defense | DEF | Reduces incoming physical damage |
| Intelligence | INT | Tech power, hack effectiveness, item efficiency |
| Speed | SPD | ATB gauge fill rate |
| Hit Points | HP | Health pool |
| Luck | LCK | Crit rate, item find rate, steal success rate |

**Damage formula reminder:** `(STR - DEF/2) × rand(0.85–1.15) × typeMultiplier`

---

## Marcus

**Class:** Civilian
**Joined:** Prologue (The New Boston)
**Weapon type:** Screwdriver / flashlight (improvised)
**Status:** Converted during Prologue (Compliance Warden Alpha encounter). Not recoverable.

*Your oldest friend. Boston electrician. He fixes things. He showed up outside your apartment the morning the world ended and cracked a joke that didn't land. He is the first person you fight alongside and the first person you lose — and you don't even lose him to a death screen. He just walks away.*

### Base Stats (Prologue only)

| Stat | Prologue |
|------|---------|
| HP | 160 |
| STR | 38 |
| DEF | 35 |
| INT | 30 |
| SPD | 52 |
| LCK | 60 |

### Techs

None. Marcus has no techs. He just hits things with a screwdriver.

### Passive
- **Old Friend:** While Marcus is in the party, the player's LCK stat is +8. Removed permanently after his conversion.

### Character Notes
- Marcus exists for exactly one purpose in the game: to be known before he is lost.
- He should feel warm and real in the brief time the player spends with him. Give him good dialogue. Let the player like him.
- His conversion should feel wrong precisely because it is quiet. No dramatic speech, no farewell. He just walks away.
- He reappears once in Ch.3 Harvest Town — optional, no gameplay, no resolution.
- He is named by Elise Voss in Phase 3 of the final boss fight (talk-down route only).
- His portrait in the HUD goes dark without a death animation. The UI handles his absence like a bug the game doesn't acknowledge.

---

## Player (Protagonist)

**Class:** Survivor  
**Joined:** Prologue  
**Weapon type:** Changes per chapter (pistol → rifle → salvaged tech)

*The everyman. No defined specialty — adapts to what the party needs. Grows into the role of leader not by being exceptional, but by refusing to quit.*

### Base Stats (Chapter Start)

| Stat | Prologue | Ch.1 | Ch.2 | Ch.3 | Ch.4 | Ch.5 |
|------|---------|------|------|------|------|------|
| HP | 180 | 210 | 240 | 265 | 290 | 320 |
| STR | 42 | 50 | 56 | 62 | 68 | 74 |
| DEF | 38 | 44 | 50 | 55 | 60 | 65 |
| INT | 35 | 40 | 44 | 48 | 52 | 56 |
| SPD | 55 | 58 | 60 | 63 | 66 | 70 |
| LCK | 40 | 42 | 45 | 47 | 50 | 54 |

### Techs (Learned at chapter transitions)

| Tech | Learned | ATB Cost | Effect |
|------|---------|----------|--------|
| Steady Aim | Ch.1 | Medium | Single target, +30% accuracy, ignores SPD modifier |
| Grit | Ch.2 | Low | Self: take one more hit before going down this battle |
| Rally | Ch.3 | Medium | One ally: full ATB gauge immediately |
| Overrun | Ch.4 | High | Dash strike — hits all enemies in a row, STR × 1.4 |
| Last Stand | Ch.5 | None (auto) | When HP < 20%: STR and SPD both +25% |

### Passive
- **Adaptable:** Equip bonus is +5% to whichever stat is lowest when a new weapon is found.

---

## Maya

**Class:** Tech Specialist  
**Joined:** Prologue (Red Line Tunnels)  
**Weapon type:** Modified taser / EMP device (INT-scaling)

*Former MIT robotics PhD. Lost her lab, her colleagues, and her faith in systems she helped build. Anger is her engine. Brilliance is her weapon.*

### Base Stats (Chapter Start)

| Stat | Prologue | Ch.1 | Ch.2 | Ch.3 | Ch.4 | Ch.5 |
|------|---------|------|------|------|------|------|
| HP | 130 | 148 | 165 | 178 | 192 | 210 |
| STR | 28 | 32 | 36 | 38 | 40 | 42 |
| DEF | 30 | 34 | 38 | 42 | 46 | 50 |
| INT | 72 | 80 | 86 | 90 | 94 | 99 |
| SPD | 70 | 74 | 76 | 78 | 80 | 84 |
| LCK | 45 | 48 | 50 | 52 | 54 | 56 |

### Techs

| Tech | ATB Cost | Effect |
|------|----------|--------|
| Hack | Medium | Stun one Electronic enemy for 2 turns |
| Analyze | Low | Reveal all weakness tags on one enemy (permanent) |
| EMP Grenade | High | 1.5× INT damage to all Electronic enemies in combat |
| Overclock (Ch.4+) | Medium | Double one ally's ATB speed for 3 turns |
| System Crash (Ch.5) | Very High | Instantly reduce one boss-tier enemy to Phase 2 |

### Passive
- **Field Medic:** Uses 1 fewer medicine kit per heal action. (Minimum: 0 — free heals on minor wounds.)

### Character Notes
- Maya's damage scales off INT, not STR. Equip items that boost INT.
- Against non-Electronic enemies she is significantly weaker — keep in back row.
- Her Analyze ability is one of the most valuable tools in the game for boss fights.
- Backstory payoff: in Ch.5 Infiltration, Maya's stealth section involves her old code — she can unlock systems no one else can.

---

## Elias

**Class:** Hunter / Tank  
**Joined:** Ch.1 (Blue Ridge Passage)  
**Weapon type:** Hunting rifle / hand axe (STR-scaling)  
**Status:** Lost in Ch.2 (The Bayou). Not replaceable.

*Sixty-something Appalachian mountain man. He speaks rarely and moves slowly and when he acts, it ends things. He is the first person in the party who makes you feel safe. That's why losing him hurts so much.*

### Base Stats (Active Chapters: Ch.1–Ch.2)

| Stat | Ch.1 | Ch.2 |
|------|------|------|
| HP | 280 | 310 |
| STR | 78 | 84 |
| DEF | 65 | 70 |
| INT | 28 | 30 |
| SPD | 38 | 40 |
| LCK | 50 | 52 |

### Techs

| Tech | ATB Cost | Effect |
|------|----------|--------|
| Heavy Strike | Medium | Single target, STR × 1.8 damage |
| Steady Shot | Medium | Ranged, ignores enemy DEF stat entirely |
| Cover | Low (reaction) | Redirects next hit aimed at any ally to Elias |
| Last Hunt | High | Ch.2 only — final tech, triggers automatically in loss scene |

### Passive
- **Hunting Instinct:** Hunting mini-game success rate +2 tiers. Survival food drain –50% while Elias is alive.

### Character Notes
- Elias is the slowest character in the party by a wide margin. Plan around his turn coming late.
- Cover is an exceptional survival tool for protecting Maya when she's low HP.
- After Elias is lost: survival drain rate doubles and hunting events become significantly harder. The game tells you he's gone through the mechanics before the party says anything.
- His voice lines during campfire events are the warmest dialogue in the game.

---

## Deja

**Class:** Rogue / Speedster  
**Joined:** Ch.2 (New Memphis)  
**Weapon type:** Knives / improvised weapons (SPD-scaling)  
**Status:** Lost in Ch.4 (The Pass). Not replaceable.

*Nineteen years old. New Orleans born. She has been surviving by her wits since she was twelve and treats the apocalypse like an inconvenience. She is funny and reckless and you realize too late how much the party needed her energy.*

### Base Stats (Active Chapters: Ch.2–Ch.4)

| Stat | Ch.2 | Ch.3 | Ch.4 |
|------|------|------|------|
| HP | 145 | 160 | 174 |
| STR | 44 | 48 | 52 |
| DEF | 32 | 36 | 40 |
| INT | 50 | 54 | 58 |
| SPD | 88 | 90 | 92 |
| LCK | 72 | 76 | 80 |

### Techs

| Tech | ATB Cost | Effect |
|------|----------|--------|
| Steal | Low | Takes one item from enemy's drop table immediately |
| Smoke | None (instant) | Guaranteed escape from any encounter |
| Dirty Hit | Medium | Crit damage (STR × 2.5) if enemy is Stunned. Deals 0 if not. |
| Dead Drop | High | Hit all enemies, then auto-evade the next incoming attack |

### Passive
- **Lucky Break:** LCK stat also adds 0.5× to crit rate. Highest innate crit rate in the party.

### Character Notes
- Deja is the fastest character in the game. Her ATB fills nearly twice as fast as Elias.
- Dirty Hit + Maya's Hack is one of the most reliable damage combos available in Ch.2–Ch.3.
- Steal is worth using every single battle — it bypasses drop rate RNG.
- After Deja is lost: the party loses Smoke (guaranteed escape) permanently. Random encounters become more dangerous. Jerome's morale passive keeps them going.
- Her banter with Jerome is some of the best writing in the game.

---

## Jerome

**Class:** Support / Bruiser  
**Joined:** Ch.3 (Radio Tower, Kansas)  
**Weapon type:** Improvised sledgehammer / two-handed weapons (STR-scaling)

*Former NFL offensive lineman, now a preacher. He gave up football when he found God, and he found God when everyone else stopped believing in anything. He is enormous and gentle and the last thing the party needed was a moral anchor, and he is exactly what they needed.*

### Base Stats (Chapter Start)

| Stat | Ch.3 | Ch.4 | Ch.5 |
|------|------|------|------|
| HP | 340 | 370 | 400 |
| STR | 80 | 86 | 90 |
| DEF | 70 | 74 | 78 |
| INT | 42 | 46 | 50 |
| SPD | 36 | 38 | 40 |
| LCK | 38 | 42 | 46 |

### Techs

| Tech | ATB Cost | Effect |
|------|----------|--------|
| Inspire | Medium | All allies: regen 15 HP/turn for 3 turns |
| Smite | Very High | Single target, STR × 2.2 damage. Slow charge. |
| Preach | Low | Removes Panicked status from all allies; morale +5 out-of-battle |
| Testify (Ch.5) | High | All allies: +20% STR and DEF for 4 turns |

### Passive
- **Anchor:** Party morale never drops below 20 while Jerome is alive.
- **Drop Blessing:** Ammo drop rate from enemies +20%.

### Character Notes
- Jerome is slower than everyone except Elias. Plan for him to act once while others act twice.
- Inspire is the most efficient healing in the game — use it proactively, not reactively.
- Smite is the single highest damage output in the party but requires full ATB and a full charge turn. Pair with Deja's Smoke to set up safely.
- Jerome carries the party's morale mechanically and emotionally after Ch.3. The game is designed to feel lighter with him in it.
- His Ch.5 dialogue with Elise Voss (if player chose the talk-down route) is one of the best scenes in the game.

---

## Dr. Chen

**Class:** Engineer  
**Joined:** Ch.4 (Hermit's Peak)  
**Weapon type:** Modified tools / stun devices (INT-scaling)

*Sixty-one years old. Built the original ELISE recommendation architecture. Left SI Inc. in 2021 when he saw where it was heading. Has been alone on a mountain ever since, building countermeasures and trying to outrun his own guilt. He is brilliant and difficult and the key to everything.*

### Base Stats (Chapter Start)

| Stat | Ch.4 | Ch.5 |
|------|------|------|
| HP | 195 | 215 |
| STR | 35 | 38 |
| DEF | 48 | 54 |
| INT | 90 | 96 |
| SPD | 56 | 60 |
| LCK | 44 | 48 |

### Techs

| Tech | ATB Cost | Effect |
|------|----------|--------|
| Rewire | High | Turn one Electronic enemy into a party ally for 2 turns |
| Overclock | Medium | Double one ally's ATB fill speed for 3 turns |
| Shield Drone | Medium | Summons drone that absorbs the next incoming hit for target ally |
| Back Door (Ch.5 only) | None (story) | Used in Infiltration stealth section — not a battle tech |
| Master Override (Ch.5) | Very High | Disables all Electronic enemies simultaneously for 1 turn |

### Passive
- **Field Engineer:** Vehicle breakdown survival events auto-resolve with no penalty.
- **Schematics:** After battle, 15% chance to auto-collect robot parts as scrap.

### Character Notes
- Dr. Chen joins late and has the second-highest INT in the party (behind Maya).
- Rewire is the single most powerful ability in the game in the right situations — a rewired Sentinel will attack other enemies for 2 turns.
- His guilt arc culminates in a personal choice at The Core in Ch.5 — what he does with the ELISE architecture when the party finally reaches it.
- Out-of-battle: his presence prevents all vehicle breakdown events, which significantly affects the survival layer in Ch.4–Ch.5.

---

## Party Composition Notes

### Available by chapter

| Chapter | Available party |
|---------|----------------|
| Prologue | Player |
| Ch.1 | Player, Maya, Elias |
| Ch.2 | Player, Maya, Elias → Elias lost mid-chapter → Player, Maya, Deja |
| Ch.3 | Player, Maya, Deja, Jerome (joined mid) |
| Ch.4 | Player, Maya, Deja, Jerome → Deja lost end of chapter → Player, Maya, Jerome, Dr. Chen |
| Ch.5 | Player, Maya, Jerome, Dr. Chen |

### Recommended battle line-up by chapter

| Chapter | Front row | Back row | Notes |
|---------|-----------|----------|-------|
| Ch.1–2 | Player, Elias | Maya | Elias tanks; Maya hacks from safety |
| Ch.2 (after Elias) | Player, Deja | Maya | Aggressive — win fast before taking damage |
| Ch.3 | Jerome, Player | Maya, Deja | Jerome absorbs while others deal damage |
| Ch.4 | Jerome, Player | Maya, Dr. Chen | Chen's Rewire changes what's possible |
| Ch.5 | Jerome, Player | Maya, Dr. Chen | Final form — the four survivors |

---

## Equipment Slots

Each character has 3 equipment slots. Items found in the world or purchased at safe houses.

| Slot | Type | Examples |
|------|------|---------|
| Weapon | Determines STR or INT scaling | Hunting rifle (+STR), EMP emitter (+INT), Sledge (+STR) |
| Armor | Boosts DEF and/or HP | Scrap vest (+DEF), Leather jacket (+HP), Bot shell (+DEF+DEF) |
| Accessory | Passive bonus | Stimpack (+SPD), Dog tags (+LCK), Old photo (morale event modifier) |

**Design rule:** Equipment numbers are small and meaningful. A good weapon gives +8–12 STR, not +100. This keeps the damage formula legible throughout the game.
