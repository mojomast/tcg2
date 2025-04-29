# DEVPLAN 12: Deck Management

**Goal**: Implement functionality for loading player decks at the start of a game, handling the deck within the game state, and basic validation.

## Tasks

### Deck Loading (Server-Side)
- [ ] Create a function/service to fetch a user's deck list (card IDs and quantities) from the database based on a deck ID.
- [ ] Integrate deck loading into the `GameEngine`'s `startGame` sequence.
    - For each player, fetch their selected deck.
    - Populate the `deck` representation within the player's state in `GameState` (e.g., an array of `Card` objects or IDs).
    - Store the initial `deck_count`.

### Deck Representation & Handling
- [ ] Ensure `GameState` includes a representation of each player's deck (likely an array of card objects/IDs).
- [ ] Implement a basic deck shuffling algorithm (e.g., Fisher-Yates shuffle) to randomize the deck order at game start.
- [ ] Implement the `drawCard` function:
    - Takes a card from the top of the `deck` array.
    - Adds it to the player's `hand` array.
    - Decrements `deck_count`.
    - Handles drawing from an empty deck (relates to `DEVPLAN_13`).
- [ ] Modify the `startGame` logic to use `drawCard` for drawing opening hands.

### Basic Deck Validation
- [ ] Implement a pre-game check for minimum deck size (e.g., 60 cards for standard format) based on `2_deck_building.md`.
- [ ] Prevent game start if decks are invalid (emit error).

### Integration & Logging
- [ ] Ensure deck data is correctly included in `GameState` updates sent to clients (only `deck_count`, not the full list).
- [ ] Add logging for deck loading, shuffling, and drawing cards.
