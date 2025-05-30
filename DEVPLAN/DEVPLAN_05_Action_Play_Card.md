# DEVPLAN 05: Action - Play Card

**Goal**: Implement the core game action of a player playing a card from their hand, including validation and state changes.

## Tasks

### Action Definition & Handling
- [ ] Define the `play_card` WebSocket event structure (payload: `cardId`, optional `targets`).
- [x] Create a handler function within the `GameEngine` or related module to process the `play_card` action (`playCard` method added).

### Validation Logic
- [x] Validate if the player has priority.
- [x] Validate if the player actually has the specified `cardId` in their hand.
- [x] Validate timing restrictions based on card type (e.g., Sorcery only in Main Phase, empty stack).
- [x] Validate if the player can pay the card's mana cost using `canPayCost` from `DEVPLAN_04`.
- [ ] Add basic target validation placeholder (if applicable).
*(Unit testing for these validation steps is substantially complete as part of ActionManager tests)*

### State Update Logic (On Success)
- [x] Retrieve the full `Card` data from the database/cache using `cardId` (retrieved from `gameState.gameObjects`).
- [x] Spend the card's mana cost using `spendMana` from `DEVPLAN_04`.
- [x] Remove the card from the player's `hand` in `GameState`.
- [x] Determine card destination based on type:
    - [x] **Creature/Enchantment/Resource Generator**: Add card object to the appropriate `battlefield` zone in `GameState`.
    - [x] **Instant/Sorcery**: Add card object to the `stack` in `GameState` (stack implementation in `DEVPLAN_07`).
- [x] Handle Summoning Sickness for creatures (add a flag/property to the card instance on the battlefield).
*(Unit testing for these state updates, particularly placing items on stack, is substantially complete as part of ActionManager tests)*

### Integration & Logging
- [ ] Integrate the `play_card` handler into the server's WebSocket event listener.
- [x] Ensure action fails gracefully with appropriate error messages/events if validation fails (returns `false`, logs warnings/errors).
- [x] Add logging for card plays (player, card name, success/failure).
