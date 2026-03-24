# Silicon Requiem — Task Board

> Work through this top to bottom. Each section is a milestone. Don't start the next until the current one feels solid.

---

## MILESTONE 0 — Align current code with new story plan

These are quick fixes to bring existing code in line with the planning docs before building anything new.

- [ ] **Fix prologue city** — Change `PrologueScene` setting from Austin TX to Boston. Update any dialogue/text that references Austin.
- [ ] **Fix player default name** — Change default from `'KAI'` to something generic (e.g. `'YOU'`) since the player names themselves in the game.
- [ ] **Fix friend's name** — Code currently uses "Dario". Rename to MARCUS throughout (phone call dialogue, any references).
- [ ] **Fix WorldMapScene placeholder dialogue** — Remove the generic "robots have sentience / they only want to HELP" lines and replace with proper lore-based framing for after the prologue.
- [ ] **Fix enemy key** — `BattleScene` uses `'robot_zombie'` as enemy key. Rename to `'compliance_drone'` to match the planned Tier 1 enemy.

---

## MILESTONE 1 — Prologue rewrite: "Static"

Expand the existing prologue from a small apartment to the full planned prologue arc.

### 1A — The Broadcast (already partially built — polish it)
- [ ] Write final broadcast text matching the planning doc verbatim
- [ ] Update phone call: caller is MARCUS, not "Dario". Dialogue: "Go outside. You need to see this."
- [ ] Add the "TWO YEARS LATER" black screen fade (10 second hold, then text overlay)

### 1B — The New Boston (new scene)
- [ ] Create `NewBostonScene.ts` — top-down exterior scene
- [ ] Build ruined Beacon Hill environment with placeholder colored rectangles (no art yet)
- [ ] Player finds Marcus standing on the corner outside — he joins the party as a second character
- [ ] Marcus dialogue: a dark joke that doesn't quite land. Warm but scared underneath.
- [ ] Add converted citizen NPCs that walk in eerie synchronized patterns (simple path loop)
- [ ] Add movement tutorial prompts — frame them around Marcus being there ("Marcus says: try moving with...")
- [ ] Marcus has no techs in battle — just a basic attack (screwdriver). Make this visible in the HUD so player notices he's different.

### 1C — The Checkpoint (tutorial battle)
- [ ] Trigger battle when player reaches checkpoint zone in New Boston
- [ ] Marcus fights beside the player in this battle
- [ ] Make this battle scripted (player cannot lose — enemy HP artificially limited)
- [ ] After battle: continue toward harbor district, approaching Compliance Warden Alpha

### 1D — Compliance Warden Alpha (prologue boss) + Marcus loss
- [ ] Create boss encounter for Compliance Warden Alpha
- [ ] Phase structure: 3 phases (Phase 2 and 3 can be simple HP thresholds for now)
- [ ] Marcus conversion scene: cutscene triggers when Warden reaches ~40% HP
  - Marcus pulls aggro — a quick scripted animation
  - Conversion beam hits him
  - He stands, eyes glow (subtle — just a color shift on the sprite)
  - He walks away toward the harbor in a straight line, out of frame
  - No dialogue. No death screen. His HUD portrait goes dark.
  - Player regains control to finish the fight — now alone
- [ ] After boss: player flees into the subway tunnels

### 1E — Red Line Tunnels (safe house + Maya recruit)
- [ ] Create `SubwayScene.ts` — underground survivor hideout
- [ ] Place NPCs representing the survivor cell
- [ ] Write and trigger Maya's introduction dialogue (bitter, brilliant, establishing her voice)
- [ ] Add Maya to party after cutscene completes
- [ ] Story beat: Maya gives player the EMP device hint
- [ ] Optional: player can ask Maya "did you see what happened to my friend?" — she says she knows what conversion is. She doesn't sugarcoat it.

### 1F — Marcus sprite and portrait
- [ ] Generate Marcus sprite: ordinary guy, work clothes, carries a flashlight and screwdriver
- [ ] Idle, walk, basic attack animation
- [ ] HUD portrait (~48×48px) — warm, a little tired
- [ ] "Dark" version of portrait for post-conversion HUD (desaturated, eyes faintly lit)

### 1G — Marcus: Harvest Town reappearance (Ch.3)
- [ ] In `HarvestTownScene` (Ch.3): place Marcus as an NPC in the community garden
- [ ] Interaction trigger: player walks near him, he looks up one beat too long
- [ ] Dialogue: "This is a good place. You should consider the program." Then back to weeding.
- [ ] Maya walks the player away — no prompt, she just does it
- [ ] No battle, no cure option, no resolution. Player has to leave.
- [ ] Flag this scene as seen (used later for Elise Voss Phase 3 dialogue check)

### 1H — Marcus: Elise Voss Phase 3 dialogue hook
- [ ] In final boss Phase 3 (talk-down route): check if player has seen the Harvest Town Marcus scene
- [ ] If yes: Elise speaks his name — "Your friend Marcus is alive. He's well-fed. He's at peace. He's not running. Can you say the same for yourself?"
- [ ] This line only fires if player chose talk-down AND visited Harvest Town Marcus. If neither: she references "the people you converted back" generically instead.

---

## MILESTONE 2 — Battle system overhaul

Replace the current basic HP/attack system with the planned ATB battle system.

### 2A — Stats and types
- [ ] Expand `types.ts` with full character stat interface: `hp, maxHp, str, def, int, spd, lck, atb`
- [ ] Add `EnemyTag` type: `'Electronic' | 'Armored' | 'Organic'`
- [ ] Add `StatusEffect` type: `'Stunned' | 'Burning' | 'Hacked' | 'Shielded' | 'Panicked'`
- [ ] Add `Tech` interface with ATB cost, effect type, and targeting

### 2B — ATB gauge
- [ ] Add ATB fill loop to `BattleManager` — `setInterval` at 60ms
- [ ] Each character's ATB fills at rate proportional to their `spd` stat
- [ ] Pause ATB when player menu is open, resume on close
- [ ] Display ATB bars in `BattleHUD` (fill left to right, pulse animation when full)

### 2C — Damage formula
- [ ] Implement `calcDamage(attacker, defender, skill)` as specified in `battle_system.md`
- [ ] Implement `getTypeMultiplier(skillType, enemyTags)` with EMP/Electronic, Fire/Organic, Physical/Armored
- [ ] Add ±15% variance using integer math

### 2D — Techs menu
- [ ] Add "Techs" option to battle action menu (alongside Attack / Items / Defend)
- [ ] Load available techs from character definition
- [ ] Wire tech effects: Hack (stun), Analyze (reveal tags), EMP Grenade (row damage)

### 2E — Status effects
- [ ] Implement all 5 status effects with correct durations and visual indicator
- [ ] Show status icons next to character name in HUD (max 2 visible per character)

### 2F — Enemy AI state machine
- [ ] Refactor enemy AI to `IDLE → CHARGING → ACTING → COOLDOWN` states
- [ ] Each enemy tier has different charge times and attack patterns
- [ ] Sentinel: calls reinforcement if not killed within 4 turns

### 2G — Combo system (can come after core ATB works)
- [ ] Store timestamp of last action per character
- [ ] On new action: check if within 200ms of another character's last action and if a valid combo pair exists
- [ ] Flash combo name center screen for 0.5s on first discovery
- [ ] Implement Blackout (Maya + Player) as the first discoverable combo

---

## MILESTONE 3 — Party members

Add Maya as a real party member in battle. Others follow as you reach their chapters.

### 3A — Character data
- [ ] Create `characters/` folder with one file per character
- [ ] Implement `Player` stat sheet (stats from `character_stats.md`, all 6 chapters)
- [ ] Implement `Maya` stat sheet + techs
- [ ] Implement `Elias` stat sheet + techs (mark as lost in Ch.2)
- [ ] Implement `Deja` stat sheet + techs (mark as lost in Ch.4)
- [ ] Implement `Jerome` stat sheet + techs
- [ ] Implement `DrChen` stat sheet + techs

### 3B — Party state
- [ ] Create `PartyManager.ts` — tracks who is currently in the party, their stats, equipment
- [ ] Store party state in Phaser registry so it persists across scene changes
- [ ] Add Maya to party after prologue completes
- [ ] Enforce max 3 in battle — player can select active 3 when party is larger

### 3C — Back row / front row
- [ ] Add row concept to battle — front row takes full damage, back row takes reduced physical damage
- [ ] HUD layout shows row position

---

## MILESTONE 4 — Sprites and visual art

Generate and integrate all character and enemy sprites. Do these in batches.

### 4A — Marcus sprite *(moved to M1F — do it during prologue work, not here)*

> See Milestone 1F. Marcus's sprite is needed before the prologue is playable so handle it there.

### 4B — Player character sprite
- [ ] Generate player sprite sheet: idle, walk (4 directions), attack, hit, defeat
- [ ] Style guide: SNES-scale pixel art, ~16×24px character size, 3–4 color palette per character
- [ ] Integrate into `Player.ts` replacing the colored rectangle placeholder

### 4C — Maya sprite
- [ ] Generate Maya sprite: MIT grad student energy, practical clothes, carries EMP device
- [ ] Idle, walk, tech-cast animation frames
- [ ] Battle portrait (close-up face, ~48×48px) for HUD display

### 4D — Elias sprite
- [ ] Generate Elias sprite: older mountain man, flannel, carries hunting rifle
- [ ] Walk, idle, Cover animation, heavy strike

### 4D — Deja sprite
- [ ] Generate Deja sprite: young, fast-looking, knives visible, streetwear
- [ ] Idle, walk, Steal animation, Smoke vanish

### 4E — Jerome sprite
- [ ] Generate Jerome sprite: enormous, gentle giant, carries sledgehammer, preacher collar
- [ ] Idle, walk, Inspire gesture, Smite swing

### 4F — Dr. Chen sprite
- [ ] Generate Dr. Chen sprite: older engineer, tinkerer vibe, tools hanging off belt
- [ ] Idle, walk, Rewire animation, Shield Drone deploy

### 4G — Enemy sprites
- [ ] **Compliance Drone** — small, fast, flying disc-like robot. Red glow. 3-frame idle.
- [ ] **Enforcer Unit** — bulkier, armored plating, intimidating. Charge animation.
- [ ] **Sentinel** — tall, sleek, surveillance-style. Summon reinforcement animation.
- [ ] **Converted Human** — walks in synchronized pattern. Subtle glow on eyes. Distinct from regular NPCs.

### 4H — Boss sprites
- [ ] **Compliance Warden Alpha** (Prologue boss) — enforcer bot, larger than standard. Harbor district aesthetic.
- [ ] **Excavator Prime** (Ch.1 boss) — massive mining bot. Two phases: upright and damaged.
- [ ] **The Governor** (Ch.2 boss) — human collaborator. Suit. No weapons — fight is political theater.
- [ ] **Sentinel Spire** (Ch.3 boss) — tower-sized, grain silo-mounted. Broadcast dishes as arms.
- [ ] **Gate Colossus** (Ch.4 boss) — titan-class border guardian. Intimidating silhouette.
- [ ] **Elise Voss** (Final boss) — human, 58, composed. Three phases: professional → grief-stricken → resolved.

### 4I — Environment tiles
- [ ] Boston ruins tileset: cracked streets, destroyed cars, overgrown buildings
- [ ] Subway tunnel tileset: dark, worn, survivor-decorated
- [ ] Appalachian forest tileset: dense trees, dirt paths, farmsteads
- [ ] Deep South tileset: bayou, Spanish moss, warm decay
- [ ] Great Plains tileset: flat horizon, grain silos, radio towers
- [ ] Rockies tileset: snow, rock, altitude isolation
- [ ] Silicon Valley tileset: pristine, clean, uncanny utopia

---

## MILESTONE 5 — World map node system

Replace the current basic tile map overworld with the region-based node map.

- [ ] Design world map layout: 6 regions, nodes per region (see `world_map_lore.md`)
- [ ] Create `WorldMapManager.ts` — tracks which nodes are visited, locked, unlocked
- [ ] Render node map with color-coded node types (green/red/amber/purple/blue/gray)
- [ ] Path segments between nodes — each segment = 1 travel day (triggers survival tick)
- [ ] Story nodes lock the path ahead until completed
- [ ] Fast travel hub unlock after first physical visit

---

## MILESTONE 6 — Survival layer

Add the Oregon Trail overlay on top of world map travel.

- [ ] Create `SurvivalManager.ts` with state object from `survival-mechanic.md`
- [ ] Implement `travelTick()` — food/fuel drain per node crossed
- [ ] Implement hunger cascade (8+/3–7/1–2/0 thresholds with stat penalties)
- [ ] Random event table — 40% trigger chance per travel day, region-filtered
- [ ] Implement positive events: hunting opportunity, abandoned store, survivor camp, lucky find
- [ ] Implement negative events: vehicle breakdown, illness, ambush, rain spoils supplies
- [ ] Implement morale flavor events: campfire night, Jerome preaches, found a record player
- [ ] Trade screen UI — triggered when entering safe house nodes
- [ ] Hunting mini-game — target arc across screen, action button timing window (only when Elias in party)
- [ ] Morale → battle stat modifier (below 30 morale: –10% all stats)

---

## MILESTONE 7 — Story chapters

Write and implement each chapter's scenes, dialogue, and boss fights. Do one chapter at a time.

### Chapter 1 — "Into the Hills" (Appalachia)
- [ ] Scene: Road out of Boston — stealth escape sequence, avoid sentinels
- [ ] Scene: The Farmstead — scavenge event, meet cellar family
- [ ] Scene: Ridge Camp safe house — NPCs, trade, campfire morale event
- [ ] Scene: Harlan Mine dungeon — 4 floors, scripted encounters
- [ ] Recruit Elias (Blue Ridge Passage)
- [ ] Boss: Excavator Prime

### Chapter 2 — "Sweet Home" (Deep South)
- [ ] Scene: Convoy ambush — narrow escape
- [ ] Scene: New Memphis — no combat truce zone, Deja recruited
- [ ] Scene: Bayou Run — night travel, no drones, random events dominate
- [ ] Scene: Vault 49 — full lore dump, optional puzzle room
- [ ] Elias loss scene in the bayou — handle mechanically (survival drain doubles, hunting harder)
- [ ] Boss: The Governor — human collaborator fight

### Chapter 3 — "Flat Earth" (Great Plains)
- [ ] Scene: Open Highway — aerial sentinels, stealth movement mechanic
- [ ] Scene: Harvest Town — voluntary conversion settlement, eerie trade
- [ ] Scene: Storm Corridor — weather mechanic during battle (lightning = –50% encounter, storm damage/turn)
- [ ] Scene: Radio Tower — fight up a transmission tower
- [ ] Recruit Jerome
- [ ] Boss: Sentinel Spire

### Chapter 4 — "Above the Cloud" (Rockies/Utah)
- [ ] Scene: The Ascent — robots thin here, party breathes
- [ ] Scene: Ghost Town — journals, one survivor, morale event
- [ ] Scene: Hermit's Peak — Dr. Chen recruited, lore terminals
- [ ] Scene: The Pass — blockade dungeon, 5 rooms gauntlet
- [ ] Deja loss scene at The Pass — bad luck, not sacrifice
- [ ] Boss: Gate Colossus

### Chapter 5 — "Silicon Requiem" (Silicon Valley)
- [ ] Scene: The Valley — pristine suburb, robots ignore unless provoked
- [ ] Scene: SI Inc. Campus — stealth sections per character, Dr. Chen opens back entrance
- [ ] Scene: The Core — mainframe vault, final moral choice
- [ ] Scene: The Boardroom — final boss chamber
- [ ] Final boss: Elise Voss — 3 phases, argument-driven mechanics
- [ ] Talk-down route: dialogue tree in Phase 3 if player cured more Converted than fought
- [ ] Track cure vs. fight choices throughout whole game (feeds into Chen ending dialogue too)
- [ ] Epilogue: road east, credits

---

## MILESTONE 8 — Audio

- [ ] Compose or source title screen music
- [ ] Compose or source overworld theme per region (6 tracks — tone shifts by region)
- [ ] Compose or source battle theme (standard + boss variant)
- [ ] Compose or source prologue ambient theme ("Static")
- [ ] Add silence/ambient sound for Silicon Valley scenes (unsettling contrast)
- [ ] Battle sound effects: attack, tech cast, hit, status effects, combo flash
- [ ] UI sounds: menu move, menu confirm, dialogue advance

---

## MILESTONE 9 — Polish and balance

Only after all chapters are playable.

- [ ] Balance playtest: stats, damage formula, ATB tick rate per difficulty
- [ ] Equipment item list — fill all 3 slots per character with items found in game
- [ ] Achievement: track moral choices (cure vs. fight Converted)
- [ ] Difficulty settings — adjust ATB tick rate (Easy/Normal/Hard)
- [ ] Save/load system — save to browser localStorage at chapter transitions
- [ ] Mobile controls (optional — decide if targeting mobile at all)

---

## Backlog / ideas to revisit later

- Dual-tech Combo animations (currently just a flash + name)
- Maya's Ch.5 stealth section using her old code to unlock systems
- Chen's guilt arc personal choice at The Core
- Jerome / Elise Voss talk-down dialogue (described as best scene in the game — make it count)
- Hunting mini-game feels like a breath, not a chore — playtest calibration
- Morale item flavor per region (Elias's pipe tobacco, fresh coffee, etc.)
