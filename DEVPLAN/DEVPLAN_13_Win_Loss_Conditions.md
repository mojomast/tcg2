# DEVPLAN 13: Win/Loss Conditions

**Goal**: Implement the core game win and loss condition checks, specifically for life depletion and deck depletion.

## Tasks

### State-Based Action (SBA) Integration
- [ ] Implement a mechanism within the `GameEngine` to check State-Based Actions whenever a player would receive priority.
- [ ] This check should iterate through relevant conditions until no more SBAs apply.

### Life Depletion Check
- [ ] As part of the SBA checks, verify if any player's life total is 0 or less.
- [ ] If a player's life is <= 0, mark them as having lost the game.
- [ ] Implement logic to end the game and declare the winner when a loss condition is met.
- [ ] Update `GameState` with the game result (winner/loser).
- [ ] Ensure player life updates (e.g., from combat damage in `DEVPLAN_06`) trigger SBA checks.

### Deck Depletion Check (Drawing from Empty Deck)
- [ ] Modify the `drawCard` function (`DEVPLAN_12`).
- [ ] Before drawing, check if the player's `deck_count` is 0.
- [ ] If a player attempts to draw from an empty deck, mark them as having lost the game.
- [ ] Trigger the game end logic as described above.

### Game End Handling
- [ ] Implement a `endGame` function in `GameEngine`.
- [ ] This function should stop further game actions.
- [ ] Broadcast a `game_over` event via WebSocket to clients, including the winner/loser information.
- [ ] (Optional) Persist match results to the `matches` database table.

### Integration & Logging
- [ ] Ensure win/loss checks are performed at appropriate times (primarily during SBA checks).
- [ ] Add logging for win/loss condition triggers and game end events.
