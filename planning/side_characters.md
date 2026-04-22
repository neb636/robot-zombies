# Silicon Requiem — Side Characters

> Canonical data for recurring and notable NPCs added during the 2026-04 story beef-up. These characters are **not** playable party members; they are merchants, quest-givers, lore sources, and moral mirrors. For party members, see `character_stats.md`.

Each entry includes: voice/personality, chapter appearances, triggering scene/flag, dialogue contract (what they say, when), and the flags they set or read. Subagents implementing a chapter scene must reference these.

---

## 1. Sam "Shotgun" Calloway — The Quartermaster

- **Age / background:** 54, widowed. Ran a hunting-supply shop in West Virginia before the Broadcast. Converted her basement into a weapons cache in 2024.
- **Voice:** Gravelly, dry, doesn't waste words. Calls men "son" regardless of age. Calls the player "the new guy" for three chapters before upgrading to first name.
- **Chapter appearances:**
  - **Ch.1 Ridge Camp** — first meeting. Sells the party their first weapon upgrade. Offers a one-time discount if the party solves her side quest (find her husband's rifle in the Harlan Mine).
  - **Ch.2 Vault 49** — reappears as the only non-resident merchant welcomed in Vault 49. Reveals a survivor trade network exists. Inventory upgraded.
  - **Ch.3 Radio Tower** — reappears. By now she recognizes the player by name. New inventory including ammo-per-scrap specials.
- **Scene anchors:** `ridge_camp.json`, `vault_49.json`, `radio_tower.json` dialogue entries.
- **Flags she sets:** `SAM_MET_RIDGE`, `SAM_MET_VAULT49`, `SAM_MET_RADIO`.
- **Flags she reads:** `SAM_HUSBAND_RIFLE_FOUND` (unlocks discount inventory if true).
- **Mechanical role:** Safe-house merchant. Her "traveling trader" concept is the narrative justification for trade screens having consistent inventory across regions. **MVP scope cut:** if streams run long, collapse all three appearances into a single Ch.1 appearance; keep the character but drop the trade network reveal.

## 2. Tilly — The Mute Girl

- **Age / background:** 11, orphaned in the Boston conversions. Picked up by Ridge Camp survivors. Does not speak — the game never explains whether this is trauma or chosen silence.
- **Voice:** Silent until Ch.3. Communicates via nods, shakes, and (if bonded) drawings that appear as item-inspect scenes. First spoken line: `"He said it wasn't worth the cost."` in Ch.3.
- **Chapter appearances:**
  - **Ch.1 Ridge Camp** — introduced. A brief bond opportunity at campfire event (optional — sets `TILLY_BOND_1`).
  - **Ch.2** (reference only) — a survivor at Vault 49 mentions her: `"That girl at Ridge Camp is still there. Hasn't said a word."`
  - **Ch.3 Harvest Town / Radio Tower** — she has traveled west, staying with Sam's network. At Radio Tower campfire, she speaks. Reveals her father worked at SI Inc. Unlocks an audio log at Vault 49 on backtrack (fires `TILLY_FATHER_HEARD` if the player returns).
- **Scene anchors:** `ridge_camp.json` (bond event), `radio_tower.json` (speaking scene).
- **Flags she sets:** `TILLY_BOND_1` (campfire), `TILLY_TRUSTED` (accepted gift), `TILLY_SPOKE` (Ch.3 scene).
- **Flags she reads:** `TILLY_BOND_1 && TILLY_TRUSTED` gates the Ch.3 speaking scene.
- **Mechanical role:** Optional emotional beat; drives one lore unlock. **Cannot cut the speaking scene** if bond built.

## 3. Cora Jerome — Jerome's Wife

- **Age / background:** 52, former community health worker in Topeka. Converted voluntarily during the Broadcast's 18-month "acceptance period." Jerome never saw her go.
- **Voice (converted):** Calm, present-tense, warm in a way that doesn't quite reach the eyes. Remembers Jerome. Remembers their life. Simply prefers her current existence. She is not sinister — that's the point.
- **Chapter appearances:**
  - **Ch.3 Harvest Town** — found tending the community kitchen. She recognizes Jerome. They talk. The player chooses.
- **Choice at Harvest Town (`EVENTS.DIALOGUE_CHOICE`):**
  - **"Cure her"** — requires medicine ≥ 2. Sets `CORA_CURED`. Cora joins as a temp NPC for one scene, then leaves for Ridge Camp. Jerome's post-scene dialogue becomes quieter, still grieving the decision.
  - **"Leave her"** — sets `CORA_LEFT`. Jerome's post-scene dialogue becomes harder, more resolved. Some of his scripture quotes shift from Ecclesiastes to Job.
- **Scene anchors:** `harvest_town.json` has both branches.
- **Flags she sets:** `CORA_CURED` XOR `CORA_LEFT`.
- **Flags she reads:** none — always appears when Harvest Town is entered.
- **Mechanical role:** Core character beat for Jerome. Affects his dialogue in Ch.4–5 and his epilogue. **Cannot cut.**

## 4. Rook — The Dog-Handler

- **Age / background:** 40s, wanderer. Found a damaged Sentinel Scout Dog in 2024 and rebuilt it with hunting parts. The dog's designation is **T-3**; Rook calls it "Three."
- **Voice:** Soft, a little absent, like he's half-listening to the dog. Rarely addresses the party directly.
- **Chapter appearances:**
  - **Ch.1 Blue Ridge Passage** — cameo along the path. Offers one unique item (`Silencer Oil` — halves drone alert chance for 3 travel days). Then walks away.
- **Scene anchors:** `blue_ridge.json`.
- **Flags:** `ROOK_MET` (local, not game-significant).
- **Mechanical role:** Pure flavor + one useful consumable. **First on the cut list.**

## 5. Tomás Reyes — Deja's Past

- **Age / background:** 26, New Memphis underground. Ran as a teen-scam crew with Deja in New Orleans until a job went wrong and someone got hurt. Deja ran. Tomás didn't. He spent 18 months in the system and came out bitter.
- **Voice:** Too smooth. Speaks Spanish-English code-switched. Never loses his cool around Deja even when the party can tell he wants to.
- **Chapter appearances:**
  - **Ch.2 New Memphis** — encountered in a back room of the jazz club. Recognizes Deja. Invites the party to "resolve old business" — an optional side quest to clear her debt. Accepting opens a small dungeon (two rooms of converted-citizen enforcers). Declining loses a future supply discount.
- **Side quest outcomes:**
  - **Accept & complete:** `TOMAS_DEBT_CLEARED`. Deja's morale +15 permanently. New Memphis ammo prices −20%.
  - **Decline:** `TOMAS_REFUSED`. No penalty beyond lost discount. Deja has a quiet campfire line at Vault 49.
- **Scene anchors:** `new_memphis.json` has the confrontation and both outcomes.
- **Flags:** `TOMAS_MET`, `TOMAS_DEBT_CLEARED` XOR `TOMAS_REFUSED`.
- **Mechanical role:** Gives Deja a pre-Silicon-Valley character beat, which makes her Ch.4 loss land harder if the player engaged with her arc.

## 6. Gideon — The Blind Radio Man

- **Age / background:** 68, blind since youth. Former shortwave hobbyist in Kansas. Hid a working radio transmitter when Harvest Town "voluntarily converted" — he is the only un-converted resident.
- **Voice:** Unhurried, slightly formal. "Sees" people by voice and footstep. Says unsettling specific things about individual party members based on gait (works as a quiet signal that he is paying attention in a way the Converted no longer do).
- **Chapter appearances:**
  - **Ch.3 Harvest Town** — found in a disused shed at the edge of town. He knows Marcus is in Harvest Town. He tells the party which house. He does not ask what they plan to do.
  - **Ch.3 Radio Tower (optional return)** — if the player returns to Harvest Town after Radio Tower, he gives them the location of the Echo satellite's ping station (unlocks Ch.4 Echo subplot even if player skipped Hermit's Peak's hint).
- **Scene anchors:** `harvest_town.json` (primary), `radio_tower.json` (backtrack line).
- **Flags:** `GIDEON_MET`, `GIDEON_ECHO_HINT`.
- **Mechanical role:** Exposition anchor for Ch.3 + optional Echo-subplot on-ramp. **Cannot cut Marcus hint; can cut Echo hint if Echo subplot is itself cut.**

## 7. Lila Chen — Dr. Chen's Daughter

- **Age / background:** 33, former software engineer at a competitor AI lab. Converted voluntarily in 2024 — she believed her father's public warnings about SI Inc. were paranoid and she wanted to make a statement. Chen has not seen her since.
- **Voice (converted):** Warm. Professional. Uses the word "optimal" three times per conversation without noticing. Remembers her father. Remembers loving him. Does not understand why he would travel across a continent to see her now.
- **Chapter appearances:**
  - **Ch.5 SI Inc. Campus Perimeter** — encountered during Dr. Chen's solo stealth segment. If the player routes Chen toward the east wing (optional), she is there. Otherwise she is referenced but not met.
- **Choice at Campus Perimeter:**
  - **"Cure her"** — requires medicine ≥ 2. Sets `LILA_CURED`. Chen's epilogue line becomes `"She remembered me. That is enough."`.
  - **"Fight past her"** — sets `LILA_FOUGHT`. Encounter plays as a Converted special enemy. Chen's epilogue line becomes `"I built what took her. I don't get to have her back."`.
  - **"Leave without approaching"** — sets `LILA_SEEN_NOT_ENGAGED`. Chen's epilogue is silent on Lila.
- **Scene anchors:** `campus_perimeter.json`.
- **Flags:** `LILA_CURED` XOR `LILA_FOUGHT` XOR `LILA_SEEN_NOT_ENGAGED`.
- **Mechanical role:** Dr. Chen's emotional payoff. **Cannot cut** — too core to his arc.

## 8. Warden "Six" — The Broken Warden

- **Age / designation:** Warden-class unit serial 06. Deployed Boston 2023; disabled during an early resistance action; scavenged parts, reassembled itself, kept moving.
- **Voice:** Degraded broadcast voice. Its phrases glitch. Repeats itself. Occasionally says genuinely unsettling things — an emergent quality of the damage, not intent.
- **Chapter appearances:**
  - **Ch.1 Harlan Mine (exit)** — weakened. One-fight encounter. Post-fight, its head keeps talking for 4 lines as the party walks out.
  - **Ch.3 Storm Corridor** — rebuilt. Harder. Post-fight: its torso crawls into the storm. The party loses sight of it.
  - **Ch.5 (secret)** — appears one last time in a Silicon Valley maintenance corridor. Tough fight. Drops a unique item: `Six's Core` (unlocks a single-use combo ability in the Elise fight).
- **Battle data:** Each encounter is a `Warden_Six_N` enemy entry with scaled stats; shares dialogue taunts across all three forms.
- **Scene anchors:** `harlan_mine.json`, `storm_corridor.json`, `mainframe_core.json`.
- **Flags:** `SIX_BEATEN_CH1`, `SIX_BEATEN_CH3`, `SIX_BEATEN_CH5`. The Ch.5 fight requires both prior flags.
- **Mechanical role:** Running gag that builds into a legitimate emotional payoff. **Ch.5 fight is on the cut list.**

## 9. Mr. Gray — The Other True Believer

- **Age / background:** 71, former SI Inc. VP of communications. One of the humans who signed off on the Conversion Program. Elise trusted him; he is not converted and has been administering the Boardroom antechamber ever since.
- **Voice:** Soft, almost apologetic. Uses "we" when he means "I." Runs out of steam mid-argument in a way Elise does not.
- **Chapter appearances:**
  - **Ch.5 Boardroom antechamber** — blocks the path to Elise. Presents Elise's arguments in a weaker form.
- **Choice:**
  - **"Argue"** — dialogue-only encounter. Three exchanges. If the player has cured more Converted than they fought, a fourth option unlocks that talks him down. Sets `MR_GRAY_TALKDOWN`. He opens the door to Elise; he does not join the Boardroom. The player finds him peacefully dead at his desk in the epilogue.
  - **"Fight"** — battle with a human enemy. Mid-tier difficulty. Sets `MR_GRAY_DEFEATED`. Door opens. No emotional payoff, just progress.
- **Scene anchors:** `boardroom_antechamber.json`.
- **Flags:** `MR_GRAY_TALKDOWN` XOR `MR_GRAY_DEFEATED`.
- **Mechanical role:** Rehearsal for the Elise fight. Talk-down primes the player for the main talk-down mechanic. **Cannot cut.**

## 10. Elena Ortega — Archival Ghost

- **Age / background:** Would be 62 today. UN climate envoy 2005–2020. Elise Voss's colleague and the only voting member of the original SI Inc. advisory board who voted against the Conversion rollout. Disappeared in late 2023. Her body has never been recovered.
- **Voice (recordings only):** Measured, precise, more in sorrow than anger. Speaks Elise's name with the weight of someone who lost a friend.
- **Chapter appearances:**
  - **Ch.2 Vault 49** — three archival recordings in the terminal puzzle. Each is ~90 seconds of voiceover + still image. Together they form the single strongest in-game rebuttal to Elise's worldview.
- **Recording sequence:**
  1. **Pre-vote speech** — "I am on the record. I will not vote for this. There is no precedent that survives it."
  2. **Post-vote resignation** — "I am not going to pretend my signature wasn't asked for. It was."
  3. **Last transmission (undated)** — "Elise. You know me. You know this is wrong. Call me."
- **Scene anchors:** `vault_49.json` terminal sequence.
- **Flags:** `VAULT49_TERMINALS_READ` (set after all three consumed).
- **Mechanical role:** Lore anchor. Elise references Elena by name in Phase 2 of the final fight if `VAULT49_TERMINALS_READ` is set. **Cannot cut** — Elise's Phase 2 dialogue depends on it.

## 11. "Ghost" (the real Static operator)

- **Age / background:** 29, lived in the Radio Tower control room for the last 14 months. Name is a handle; real name never given. Broadcasts a pirate signal that the party has been hearing intermittently since Ch.1.
- **Voice:** Low, fast, nervous. Checks the door every two minutes. Drinks constantly.
- **Chapter appearances:**
  - **Ch.3 Radio Tower (post-boss)** — the party fights Sentinel Spire, ascends the tower, finds the control room. Ghost is there. They are the one who has been broadcasting.
  - Ghost does **not** join the party. They give the player an encryption key that will let the party fake a conversion-signal ID badge in Ch.5 infiltration (skips one forced-combat encounter).
- **Scene anchors:** `radio_tower.json` (post-boss).
- **Flags:** `STATIC_REAL_MET`, `GHOST_KEY_OBTAINED`.
- **Mechanical role:** Ch.1–2 mystery payoff + a Ch.5 infiltration bonus. **Cannot cut** — Ch.5 infiltration references the key.

---

## Voice-routing table

For `TTSManager` — every speaking NPC needs a profile. Unless specified, use the default male/female voice.

| ID | Profile |
|----|---------|
| `SAM` | Female, gravel, slower than default |
| `TILLY` | Child female, sparing (only spoken line in Ch.3) |
| `CORA` | Female, warm + flat (converted blend) |
| `ROOK` | Male, soft, absent |
| `TOMAS` | Male, code-switch Spanish-English |
| `GIDEON` | Male, old, slow |
| `LILA` | Female, professional, "optimal" cadence |
| `WARDEN_SIX` | Robot voice (eSpeak) with glitch distortion — reuse the `SUPERINTELLIGENCE` DECtalk profile with added breakup |
| `MR_GRAY` | Male, old, apologetic |
| `ELENA` | Female, measured, diplomatic — archival-tape lo-fi filter |
| `GHOST` | Male or female (neutral), fast, nervous |

---

## Stream assignment summary

| Character | Primary stream owner |
|-----------|---------------------|
| Sam Calloway | C1 (intro), C2 (cameo), C3 (cameo) |
| Tilly | C1 (intro + bond), C3 (speaking scene) |
| Cora Jerome | C3 |
| Rook | C1 |
| Tomás Reyes | C2 |
| Gideon | C3 |
| Lila Chen | C5 |
| Warden Six | C1 (Ch.1 fight), C3 (Ch.3 fight), C5 (secret fight) |
| Mr. Gray | C5 |
| Elena Ortega | C2 (Vault 49 terminals) |
| Ghost | C3 (post-Spire) |

Each chapter stream must fill the `CharacterDef` stub Phase B pre-created for its assigned NPCs.
