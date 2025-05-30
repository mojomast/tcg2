# DEVPLAN 12: Deck Management

**Goal**: Implement functionality for loading player decks at the start of a game, handling the deck within the game state, and basic validation.

## Tasks

### Deck Loading (Server-Side)
- [X] Create a function/service to fetch a user's deck list (card IDs and quantities) from the database based on a deck ID.
- [WIP] Integrate deck loading into the `GameEngine`'s `startGame` sequence.
    - For each player, fetch their selected deck.
    - Populate the `deck` representation within the player's state in `GameState` (e.g., an array of `Card` objects or IDs).
    - Store the initial `deck_count`.

### Deck Representation & Handling
- [X] Ensure `GameState` includes a representation of each player's deck (likely an array of card objects/IDs).
- [X] Implement a basic deck shuffling algorithm (e.g., Fisher-Yates shuffle) to randomize the deck order at game start.
    - **COMPLETED 2025-05-30T20:59:** Fisher-Yates shuffle implemented in `gameEngine.ts` lines 17-24
    - Added enhanced logging to show first 3 cards after shuffle for verification
- [X] Implement the `drawCard` function:
    - Takes a card from the top of the `deck` array.
    - Adds it to the player's `hand` array.
    - Decrements `deck_count`.
    - Handles drawing from an empty deck (relates to `DEVPLAN_13`).
    - **COMPLETED:** `GameEngine.playerDrawCard()` method fully implemented
- [X] Modify the `startGame` logic to use `drawCard` for drawing opening hands.
    - **COMPLETED:** Lines 178-188 in `gameEngine.ts` use `playerDrawCard()` for opening hands

### Basic Deck Validation
- [ ] Implement a pre-game check for minimum deck size (e.g., 60 cards for standard format) based on `2_deck_building.md`.
- [ ] Prevent game start if decks are invalid (emit error).

### Integration & Logging
- [X] Ensure deck data is correctly included in `GameState` updates sent to clients (only `deck_count`, not the full list).
    - **COMPLETED:** `deck_count` property exists in PlayerState and is properly maintained
- [X] Add logging for deck loading, shuffling, and drawing cards.
    - **COMPLETED:** Enhanced shuffle logging shows first 3 cards
    - **COMPLETED:** Draw logging shows hand size and library changes
