# DEVPLAN 03: Game Loop Engine

**Goal**: Implement the server-side engine responsible for managing the game flow, turn structure, and phase transitions according to `game_loop_plan.md`.

## Tasks

### Game Engine Core
- [x] Create `GameEngine` class/module (`src/engine/gameEngine.ts`).
- [x] Initialize `GameEngine` with a `GameState` instance.
- [x] Implement method to start the game (`startGame`).
    - Perform initial setup (shuffle decks - placeholder, [x] draw opening hands - Implemented in `_asyncInitialize` after player state creation).
    - Determine the first player.
    - Start the first turn (skipping player 1 draw step).

### Turn and Phase Management
- [x] Implement tracking for current turn number and active player ID within `GameState`.
- [x] Implement methods to advance turns (`nextTurn`).
- [x] Define enums or constants for Phases (`BEGIN`, `MAIN`, `COMBAT`, `END`) and Steps (e.g., `UNTAP`, `UPKEEP`, `DRAW`).
- [x] Implement logic to transition through phases in the correct order.
- [x] Implement logic to transition through steps within each phase.
- [ ] Add basic state checks for phase/step transitions (e.g., ensuring stack is empty before moving).

### Priority Handling (Basic)
- [x] Implement tracking for which player currently has priority within `GameState`.
- [x] Implement method to pass priority (`passPriority`).
- [x] Implement basic logic for granting priority at the start of relevant steps/phases.

### Integration & Logging
- [x] Ensure `GameEngine` methods correctly update the `GameState` object.
- [x] Add basic console logging for turn start, phase changes, and priority passes.
