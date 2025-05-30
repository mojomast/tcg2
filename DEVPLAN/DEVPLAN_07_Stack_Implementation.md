# DEVPLAN 07: Stack Implementation

**Goal**: Implement the stack mechanism for handling spell and ability resolution using the LIFO (Last-In, First-Out) principle and manage priority passing related to stack operations.

## Tasks

### Stack Data Structure
- [X] Implement the `stack` array within `GameState` using the `StackItem` interface defined in `DEVPLAN_02` (now `frontend/src/types/gameState.ts`).
- [X] Each `StackItem` should store necessary info (e.g., card source, effect details, targets, controller).

### Adding to Stack
- [X] Modify the `play_card` logic (from `DEVPLAN_05`) for Instants and Sorceries to add them as `StackItem`s to the top of the `GameState.stack` instead of directly resolving or going to the battlefield. (Now handled by `ActionManager.performAction` called from `GameEngine.playCard`).
- [X] Create a similar mechanism for activated abilities (placeholder for now, to be integrated with `ActionManager`).
- [X] After adding an item to the stack, ensure the active player retains priority (Handled by `ActionManager` and `TurnManager`).

### Priority Passing & Resolution
- [X] Refine the `passPriority` logic: This is now primarily handled within `TurnManager.passPriority`, which interacts with `ActionManager` for stack resolution and advances the game state. Logic includes:
    - If player A passes, give priority to player B.
    - If player B passes (and player A passed previously):
        - Check if the stack is empty.
            - If empty: Proceed to the next game step/phase (via `TurnManager.advanceTurnState`).
            - If not empty: Resolve the top item of the stack (via `ActionManager.resolveNextStackItem`).
- [X] Implement the `resolveTopStackItem` function: This is now `ActionManager.resolveNextStackItem`. It removes the top `StackItem`, executes its effect (currently placeholder logging), and `TurnManager` subsequently grants priority to the active player after SBAs.

### Integration & Logging
- [X] Ensure phase/step transitions only occur when the stack is empty and both players have passed priority consecutively (Handled by `TurnManager.passPriority` and `TurnManager.advanceTurnState`).
- [X] Add logging for items being added to the stack, priority passes related to the stack, and stack item resolutions (Basic logging implemented across `ActionManager`, `TurnManager`, `GameEngine`).

## Detailed Progress & Recent Refinements (as of 2025-05-27)

- **Type System Enhancements (`src/interfaces/gameState.ts`):**
    - Added `PLAYER_ATTEMPTED_DRAW_FROM_EMPTY_LIBRARY` and `CARD_DRAWN` to `EventType`.
    - Defined and exported `Keyword`, `CardType`, `ActionType`.
    - Defined and exported `PlayerAction` and `GameEvent` interfaces.
    - Re-exported `Card` for easier access.
- **Method Signature Corrections:**
    - Corrected `moveCardZone` call in `TurnManager.ts`.
    - Aligned `HasKeywordFn` type in `CombatManager.ts` with `GameEngine.hasKeyword` (uses `Keyword` type).
- **`GameEngine.ts` Refactoring & Lint Fixes:**
    - **Constructor Calls:** Corrected argument mismatches for `StateManager`, `ResourceManager`, `ActionManager`, and `TurnManager` instantiations.
    - **Dependencies:** Updated `ResourceManagerDependencies` to match its interface and provide correct functions from `GameEngine`.
    - **`playCard` Method:** Refactored to correctly structure `PlayerAction` (with `payload`) and now calls `this.actionManager.performAction(action)` to put the card/spell on the stack.
    - **Duplicate Function Removal:** Attempted to remove a duplicate `getPlayerState` method (verification pending next lint check).
    - **Card Drawing:** Implemented `playerDrawCard` in `GameEngine` with event emissions.
- **Stack & Priority Logic Refinements:**
    - `ActionManager.resolveNextStackItem` now handles resolving stack items.
    - `TurnManager.passPriority` orchestrates priority changes, stack resolution calls, and game state advancement.
    - Removed `handleStackResolved` from `TurnManager` as its responsibilities are now within `ActionManager` and `TurnManager.passPriority`.
    - `StateManager.cleanupRequiresPriority` added as a placeholder for future complex cleanup interactions.

## Next Steps (Post-Refactor)

1.  **Verify Lint Status:** [X] Run linting to confirm all recent `GameEngine.ts` changes were successful and to identify any new or remaining errors (e.g., `ActionManager` constructor, duplicate `getPlayerState` if still present). *(Completed 2025-05-27)*
2.  **Address Remaining Lint Errors:** [X] Systematically fix any outstanding lint issues. *(Completed 2025-05-27 - All lint errors resolved across backend and frontend related to recent changes.)*
3.  **Unit Testing:** (Current Focus)
    - [X] Write unit tests for `ActionManager` focusing on `performAction` (now `playCard`) and `resolveNextStackItem`. *(Substantially completed, basic scenarios and edge cases for playCard and resolveNextStackItem covered)*
    - [X] Write unit tests for `TurnManager` focusing on `passPriority`, `advanceStep`, `advancePhase`, and interactions with `StateManager.cleanupRequiresPriority`. *(Substantially completed)*
4.  **Review Logic:**
    - Review combat resolution logic in `CombatManager` and its integration with `TurnManager`.
    - Further refine `StateManager.cleanupRequiresPriority` if specific cleanup-triggered abilities or actions are identified.
5.  **Documentation:** Keep this dev plan and other relevant documentation updated as development progresses.
