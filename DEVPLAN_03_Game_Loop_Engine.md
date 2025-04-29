# DEVPLAN 03: Game Loop Engine

**Goal**: Implement the server-side engine responsible for managing the game flow, turn structure, and phase transitions according to `game_loop_plan.md`.

## Tasks

### Game Engine Core
- [ ] Create `GameEngine` class/module (`src/engine/gameEngine.ts`).
- [ ] Initialize `GameEngine` with a `GameState` instance.
- [ ] Implement method to start the game (`startGame`).
    - Perform initial setup (shuffle decks - placeholder, draw opening hands).
    - Determine the first player.
    - Start the first turn (skipping player 1 draw step).

### Turn and Phase Management
- [ ] Implement tracking for current turn number and active player ID within `GameState`.
- [ ] Implement methods to advance turns (`nextTurn`).
- [ ] Define enums or constants for Phases (`BEGIN`, `MAIN`, `COMBAT`, `END`) and Steps (e.g., `UNTAP`, `UPKEEP`, `DRAW`).
- [ ] Implement logic to transition through phases in the correct order.
- [ ] Implement logic to transition through steps within each phase.
- [ ] Add basic state checks for phase/step transitions (e.g., ensuring stack is empty before moving).

### Priority Handling (Basic)
- [ ] Implement tracking for which player currently has priority within `GameState`.
- [ ] Implement method to pass priority (`passPriority`).
- [ ] Implement basic logic for granting priority at the start of relevant steps/phases.

### Integration & Logging
- [ ] Ensure `GameEngine` methods correctly update the `GameState` object.
- [ ] Add basic console logging for turn start, phase changes, and priority passes.
