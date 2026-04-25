# Quiet Machines — Dialogue Choices

> Every branching point in the game. Each entry specifies: where the choice fires, what the options do, the flags they set, which later scenes read those flags, and the minimal JSON shape the `ChoiceEngine` (Stream G) must support.

The ChoiceEngine does **not** implement a tree engine. It extends existing dialogue JSON with an optional `choices` array on any line. When the choice is selected, the engine writes flags and jumps to a `nextId` dialogue entry. That's the entire feature. Complex branching is expressed as flag-gated linear paths, not trees.

---

## JSON schema extension

A dialogue line in `src/data/dialogue/**/*.json` currently looks like:

```json
{
  "speaker": "MAYA",
  "text": "We need to move."
}
```

With choices, any line may add:

```json
{
  "speaker": "CORA",
  "text": "You can take me with you if you want.",
  "choices": [
    {
      "label": "Cure her.",
      "nextId": "harvest_town.cora.cure",
      "setFlags": ["CORA_CURED"],
      "requireFlags": [],
      "requireItems": [{"item": "medicine", "count": 2}]
    },
    {
      "label": "Leave her here.",
      "nextId": "harvest_town.cora.leave",
      "setFlags": ["CORA_LEFT"]
    }
  ]
}
```

Contracts:
- `nextId` is a dotted path into the dialogue JSON namespace. The engine resolves it as `<file>.<object>.<key>`.
- `setFlags` writes to Phaser registry via `setFlag(registry, flag, true)`.
- `requireFlags` hides the option if any flag is missing.
- `requireItems` hides the option if the survival state lacks the item. (Checked via `SurvivalManager.has(item, count)`.)
- If all options are hidden, the line auto-advances as if choiceless.

Each chapter scene that needs a choice ADDS this object to its dialogue JSON. Scene code calls `dialogMgr.show(...)` as today; the box notices `choices` and renders the choice row.

---

## Enumerated choice points

### 1. Ch.3 — Cora Jerome, Harvest Town

- **Scene trigger:** Entering Cora's kitchen scene in Harvest Town.
- **Dialogue anchor:** `harvest_town.cora.offer`.
- **Choice row:** `[Cure her. | Leave her here.]`
- **Flags:** `CORA_CURED` XOR `CORA_LEFT` (exclusive — engine enforces by making each branch's flag mutually set on entry).
- **Item gate:** Cure option requires medicine ≥ 2.
- **Downstream readers:**
  - `great_plains.jerome.post_harvest_town` — Jerome's post-scene dialogue fork.
  - `rockies.jerome.ascent_campfire` — Ch.4 campfire line fork.
  - `silicon_valley.jerome.vault_approach` — Ch.5 Jerome line fork.
  - Epilogue.

### 2. Ch.3 — The Converted Child, Harvest Town

- **Scene trigger:** Walking past the school building in Harvest Town.
- **Dialogue anchor:** `harvest_town.child.approach`.
- **Choice row:** `[Cure. | Walk away.]` (**Attack option is explicitly omitted — the menu does not render it.**)
- **Flags:** `CONVERTED_CHILD_CURED` XOR `CONVERTED_CHILD_LEFT`.
- **Item gate:** Cure requires medicine ≥ 2. If player has < 2, the Cure option is replaced with `"You don't have enough supplies to cure her."` rendered as a disabled option with tooltip; choosing it forces the `LEFT` branch.
- **Downstream readers:**
  - `boardroom.elise.phase3` (talk-down route references this count).
  - Epilogue narration.

### 3. Ch.4 — Echo (satellite AI), Hermit's Peak

- **Scene trigger:** Activating the satellite console in Chen's bunker.
- **Dialogue anchor:** `rockies.echo.plea`.
- **Choice row:** `[Cure it. | Let it die.]`
- **Flags:** `ECHO_CURED` XOR `ECHO_REFUSED`.
- **Gate:** `requireFlags: ["DR_CHEN_RECRUITED"]` — the dialogue doesn't even fire without Chen.
- **Downstream readers:**
  - Ch.5 Mainframe Core — `ECHO_CURED` grants a one-time `Hack Assist` buff (auto-stuns all enemies on first combat of the Core).
  - Epilogue — Chen explicitly praises the player's choice either way, but the rationale changes.

### 4. Ch.5 — Lila Chen, Campus Perimeter

- **Scene trigger:** Chen's solo stealth route reaches the east wing. (If Chen is routed west, the scene skips.)
- **Dialogue anchor:** `campus_perimeter.lila.approach`.
- **Choice row:** `[Cure her. | Fight past. | Leave without approaching.]`
- **Flags:** `LILA_CURED` XOR `LILA_FOUGHT` XOR `LILA_SEEN_NOT_ENGAGED`.
- **Item gate:** Cure requires medicine ≥ 2.
- **Downstream readers:**
  - Epilogue — Chen has three distinct final lines.

### 5. Ch.5 — Mr. Gray, Boardroom antechamber

- **Scene trigger:** Reaching the antechamber. Automatic dialogue sequence.
- **Dialogue anchor:** `boardroom_antechamber.gray.final`.
- **Choice row:**
  - Always: `[Fight him. | Argue.]`
  - Argue-branch leads to three exchanges. After exchange 3, an additional option appears ONLY if `convertedCured > convertedFought`: `[You're not her, Mr. Gray.]`
  - Selecting the fourth option triggers `MR_GRAY_TALKDOWN`. Otherwise the dialogue auto-advances to the Elise fight (no talk-down flag set).
- **Flags:** `MR_GRAY_TALKDOWN` XOR `MR_GRAY_DEFEATED`.
- **Downstream readers:**
  - Epilogue note about the antechamber.
  - Elise Phase 1 — if `MR_GRAY_TALKDOWN`, Elise references him by name in her opening line.

### 6. Ch.5 — Elise Voss talk-down (final boss Phase 3)

- **Scene trigger:** Elise HP drops below 30% (Phase 3 entry).
- **Dialogue anchor:** `boardroom.elise.phase3`.
- **Availability:** The talk-down **choice row** appears only if `convertedCured > convertedFought`. Otherwise Phase 3 runs as a normal battle phase with no choice row.
- **Choice row:** `[Finish her. | Talk her down.]`
- **Talk-down sub-tree:** This is the one exception to "flag-gated linear." Selecting "Talk her down" launches a 6-exchange dialogue:
  1. Elise's first argument (peace).
  2. Player response from `["This isn't peace. This is sleep.", "My friend Marcus is not at peace. He has been erased.", "You did this because you gave up."]`.
  3. Elise's second argument (irreversibility).
  4. Player response from `["We lived with harder things.", "You don't get to decide that for us.", "Then undo it."]`.
  5. Elise's third argument (would-you-do-the-same).
  6. Final player response — ONE option only, determined by `MR_GRAY_TALKDOWN`. With the flag: `"No. I wouldn't. And neither would Elena."` Without: `"I don't have to answer that. I just have to stop you."`
- **Flags:** `ELISE_TALKDOWN` (on successful talk-down completion) XOR `ELISE_DEFEATED`.
- **Implementation note:** The 6-exchange branching is flat JSON with `nextId` chains — still no tree engine needed.
- **Downstream readers:**
  - Credits / epilogue — two distinct ending sequences.

### 7. Ch.3 — Tomás Reyes debt (optional)

- **Scene trigger:** Entering the New Memphis back-room. (Actually Ch.2 New Memphis — listed here under Ch.3 in error; implementation-wise this belongs to C2.)
- **Dialogue anchor:** `deep_south.tomas.offer`.
- **Choice row:** `[Take the job. | Refuse.]`
- **Flags:** `TOMAS_DEBT_CLEARED` XOR `TOMAS_REFUSED`.
- **Downstream readers:**
  - New Memphis trade screen reads the flag for a price discount.
  - Deja campfire line at Vault 49 forks on this flag.

### 8. Ch.1 + Ch.3 — Tilly bond

- **Scene 1 (Ch.1 Ridge Camp campfire):** offering Tilly a small food item sets `TILLY_TRUSTED`.
- **Scene 2 (Ch.3 Radio Tower campfire):** fires the speaking scene only if `TILLY_TRUSTED`. Dialogue anchor `great_plains.tilly.speaks`.
- **No choice row in either scene** — these are linear conditional scenes. The "choice" is whether the player initiates the campfire interaction at all.
- **Flags:** `TILLY_TRUSTED`, `TILLY_SPOKE`, `TILLY_FATHER_HEARD` (set if player later returns to Vault 49 post-Ch.3).

---

## Flag inventory (Phase B pre-adds all of these to `GAME_FLAGS`)

**Party / story progress:**
- `MARCUS_CONVERTED` (existing)
- `MAYA_RECRUITED` (existing)
- `TUTORIAL_BATTLE_COMPLETE` (existing)
- `WARDEN_ALPHA_DEFEATED` (existing)
- `SAW_MARCUS_HARVEST_TOWN` (existing)
- `MARCUS_NAMED_BY_ELISE` (existing)
- `ELIAS_RECRUITED`, `DEJA_RECRUITED`, `JEROME_RECRUITED`, `DR_CHEN_RECRUITED`
- `ELIAS_LOST`, `DEJA_LOST`

**Side character flags (new):**
- `SAM_MET_RIDGE`, `SAM_MET_VAULT49`, `SAM_MET_RADIO`, `SAM_HUSBAND_RIFLE_FOUND`
- `TILLY_BOND_1`, `TILLY_TRUSTED`, `TILLY_SPOKE`, `TILLY_FATHER_HEARD`
- `CORA_CURED`, `CORA_LEFT`
- `ROOK_MET`
- `TOMAS_MET`, `TOMAS_DEBT_CLEARED`, `TOMAS_REFUSED`
- `GIDEON_MET`, `GIDEON_ECHO_HINT`
- `LILA_CURED`, `LILA_FOUGHT`, `LILA_SEEN_NOT_ENGAGED`
- `SIX_BEATEN_CH1`, `SIX_BEATEN_CH3`, `SIX_BEATEN_CH5`
- `MR_GRAY_TALKDOWN`, `MR_GRAY_DEFEATED`
- `VAULT49_TERMINALS_READ`
- `STATIC_REAL_MET`, `GHOST_KEY_OBTAINED`

**Plotline flags:**
- `CONVERTED_CHILD_CURED`, `CONVERTED_CHILD_LEFT`
- `ECHO_CURED`, `ECHO_REFUSED`
- `ELISE_TALKDOWN`, `ELISE_DEFEATED`
- `USED_GHOST_KEY_CH5`

**Event-bus additions:**
- `EVENTS.WORLD_MAP_TRAVEL` — payload: `{fromNodeId, toNodeId, days}`.
- `EVENTS.SURVIVAL_TICK` — payload: `{state: SurvivalState, event?: TravelEvent}`.
- `EVENTS.SAVE_REQUESTED` — payload: `{slot: number}`.
- `EVENTS.DIALOGUE_CHOICE` — payload: `{choiceId, setFlags, nextId}`.
- `EVENTS.NODE_ENTER` — payload: `{nodeId, sceneKey}`.

All of the above are in-scope for Phase B pre-expansion. Chapter streams must not add new flags or events — if a chapter needs something missing, orchestrator patches after merge.
