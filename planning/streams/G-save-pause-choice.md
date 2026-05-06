# Stream G — Save/Load UI + Pause Menu + Dialogue Choice Engine

## Scope

Three related UI features. None of them require a tree engine, a full ECS, or deep refactors.

1. **Save/Load UI** — 3-slot save system. Slot picker scene launchable from Title ("Continue") and from Pause ("Save / Load").
2. **Pause Menu** — overlays on any scene. Options: Resume, Save, Load, Settings, Quit to Title.
3. **Dialogue Choice Engine** — extend existing DialogueBox to render a choice row when a dialogue line carries `choices: [...]`.

## Files you OWN

### Save/Load UI
- `src/scenes/SaveLoadScene.ts` — fills the pre-stubbed file. 3-slot picker with timestamp, chapter name, player name, play time summary. Mobile-friendly tap targets.
- `src/save/SaveSlot.ts` — slot-aware save API over existing `SaveManager`. localStorage keys: `silicon-requiem-save-slot-0`, `-1`, `-2`.

### Pause Menu
- `src/scenes/PauseMenuScene.ts` — fills the pre-stubbed file. Launches as parallel overlay (like BattleScene). Pauses the caller scene. Options with keyboard + tap support.

### Dialogue Choice Engine
- `src/dialogue/ChoiceEngine.ts` — fills the pre-stubbed file. Handles `choices: [{label, nextId, setFlags, requireFlags, requireItems}]`.
- `src/dialogue/choiceTypes.ts` — type helpers (already mostly in `src/types.ts` from Phase B — re-export here for convenience).

## Files you MAY MODIFY

- `src/dialogue/DialogueBox.ts` — add choice row rendering. When current line has `choices`, pause typewriter, render up to 4 option buttons, wait for selection, call ChoiceEngine to resolve flags + jump.
- `src/dialogue/DialogueManager.ts` — pass choice-aware dialogue arrays through. Minor API extension only.

## Files you MAY NOT TOUCH

- `SaveManager.ts` — only extend via the new `SaveSlot` wrapper.
- Any scene other than SaveLoadScene / PauseMenuScene.
- Any dialogue JSON — those are each stream's responsibility.

## Public APIs

### SaveSlot
```ts
class SaveSlot {
  static list(): SaveSlotInfo[]; // 3 slots, may be empty
  static save(slot: number, game: Phaser.Game, currentScene: string): void;
  static load(slot: number): SaveData | null;
  static clear(slot: number): void;
}
interface SaveSlotInfo {
  slot: number;
  occupied: boolean;
  playerName?: string;
  chapter?: number;
  savedAt?: number;
  playTimeMs?: number;
}
```

### ChoiceEngine
```ts
class ChoiceEngine {
  static shouldRender(line: DialogueLine): boolean;
  static availableOptions(line: DialogueLine, registry: Phaser.Data.DataManager, survival: SurvivalManager): DialogueChoice[];
  static resolve(choice: DialogueChoice, registry: Phaser.Data.DataManager, survival: SurvivalManager): { nextId: string };
}
```

## Dialogue JSON contract

Dialogue lines gain an optional `choices` field:

```json
{
  "speaker": "CORA",
  "text": "...",
  "choices": [
    {
      "label": "Cure her.",
      "nextId": "harvest_town.cora.cure",
      "setFlags": ["CORA_CURED"],
      "requireFlags": [],
      "requireItems": [{"item": "medicine", "count": 2}]
    }
  ]
}
```

See `planning/dialogue_choices.md` for the full contract and examples.

## Acceptance

1. From Title, "Continue" launches SaveLoadScene. Tapping an occupied slot loads + jumps to the saved scene.
2. Pausing (ESC on desktop, dedicated button on mobile) opens PauseMenuScene over any gameplay scene. Save/Load from there writes to slot 1 by default.
3. Loading a save restores: player name, current scene, chapter, flags, converted counters, party state, survival state.
4. Dialogue JSON with `choices` renders a tap/click menu. Selecting writes flags, advances to nextId.
5. Disabled options (failed requireFlags/requireItems) render grayed out with a brief tooltip; cannot be selected — or if the option is the only one, it auto-selects its fallback (e.g., Converted Child "leave" branch when medicine insufficient).
6. `npm run typecheck` clean.

## Reference reading

- `src/save/SaveManager.ts` — existing API; extend via SaveSlot wrapper
- `src/dialogue/DialogueBox.ts`, `DialogueManager.ts`
- `planning/dialogue_choices.md` (READ FIRST — this is your specification)
- `src/scenes/BattleScene.ts` — reference for "launch as parallel overlay that pauses caller" pattern
