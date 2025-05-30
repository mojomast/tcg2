# DEVPLAN 13: Win/Loss Conditions

**Goal**: Implement the core game win and loss condition checks, specifically for life depletion and deck depletion.

**Current Status: 90% Complete** (Updated 2025-05-30T21:22)
- State-Based Actions integration: ✅ COMPLETE
- Game end handling: ✅ COMPLETE
- Client communication: ⏳ PENDING (Only client-side UI handling remains)

## Tasks

### State-Based Action (SBA) Integration
- [X] Implement a mechanism within the `GameEngine` to check State-Based Actions whenever a player would receive priority.
    - **COMPLETED:** Comprehensive SBA system found in `StateManager.checkStateBasedActions()`
    - **LOCATION:** `src/game/stateManager.ts` with full implementation
    - **TIMING:** Called from TurnManager, CombatManager, ActionManager at appropriate times
- [X] This check should iterate through relevant conditions until no more SBAs apply.
    - **COMPLETED:** Loop-based checking with `continueChecking` flag until no actions occur

### Life Depletion Check
- [X] As part of the SBA checks, verify if any player's life total is 0 or less.
    - **COMPLETED 2025-05-30T21:15:** Already implemented in `StateManager` lines 34-44
    - **ENHANCED:** Added `engine.checkGameEnd()` call for immediate game termination
- [X] If a player's life is <= 0, mark them as having lost the game.
    - **COMPLETED:** `playerState.hasLost = true` set automatically in SBA checks
- [X] Implement logic to end the game and declare the winner when a loss condition is met.
    - **COMPLETED 2025-05-30T21:18:** `GameEngine.checkGameEnd()` and `endGame()` methods
    - **FEATURES:** Automatic winner determination, comprehensive logging, event emission
- [X] Update `GameState` with the game result (winner/loser).
    - **COMPLETED:** Added `gameEnded`, `winner`, `loser`, `endReason`, `endTime` fields
- [X] Ensure player life updates (e.g., from combat damage in `DEVPLAN_06`) trigger SBA checks.
    - **COMPLETED:** SBA checks are called after combat damage in existing system

### Deck Depletion Check (Drawing from Empty Deck)
- [X] Modify the `drawCard` function (`DEVPLAN_12`).
    - **COMPLETED 2025-05-30T21:12:** Enhanced `GameEngine.playerDrawCard()` method
- [X] Before drawing, check if the player's `deck_count` is 0.
    - **COMPLETED:** Check for `playerState.library.length === 0` before drawing
- [X] If a player attempts to draw from an empty deck, mark them as having lost the game.
    - **COMPLETED:** Set `playerState.hasLost = true` immediately
    - **LOGGING:** "Player {id} loses due to deck depletion (attempted draw from empty library)"
- [X] Trigger the game end logic as described above.
    - **COMPLETED:** Call `this.checkGameEnd('deck_depletion', playerId)` for immediate resolution

### Game End Handling
- [X] Implement a `endGame` function in `GameEngine`.
    - **COMPLETED 2025-05-30T21:18:** `endGame(reason, winnerId, loserId)` method in `GameEngine`
    - **FEATURES:** Comprehensive state management, statistics logging, event emission
- [X] This function should stop further game actions.
    - **COMPLETED:** `gameState.gameEnded = true` flag prevents further actions
    - **INTEGRATION:** All managers check this flag before processing actions
- [X] Broadcast a `game_over` event via WebSocket to clients, including the winner/loser information.
    - **COMPLETED:** `GAME_OVER` event with full game state and statistics
    - **PAYLOAD:** gameId, winner, loser, reason, turnNumber, endTime, complete gameState
- [ ] (Optional) Persist match results to the `matches` database table.
    - **PENDING:** Database persistence not yet implemented

### Integration & Logging
- [X] Ensure win/loss checks are performed at appropriate times (primarily during SBA checks).
    - **COMPLETED:** SBA integration with life depletion checks
    - **COMPLETED:** Deck depletion checks in `playerDrawCard` method
    - **COMPLETED:** Backup checks in StateManager after all SBAs resolve
- [X] Add logging for win/loss condition triggers and game end events.
    - **COMPLETED:** Comprehensive logging throughout win/loss detection
    - **EXAMPLES:** "Player {id} loses due to life depletion", "Game ending - Reason: {reason}"
    - **STATISTICS:** Game duration, turn count, final game state logging
