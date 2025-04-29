# DEVPLAN 05: Action - Play Card

**Goal**: Implement the core game action of a player playing a card from their hand, including validation and state changes.

## Tasks

### Action Definition & Handling
- [ ] Define the `play_card` WebSocket event structure (payload: `cardId`, optional `targets`).
- [ ] Create a handler function within the `GameEngine` or related module to process the `play_card` action.

### Validation Logic
- [ ] Validate if the player has priority.
- [ ] Validate if the player actually has the specified `cardId` in their hand.
- [ ] Validate timing restrictions based on card type (e.g., Sorcery only in Main Phase, empty stack).
- [ ] Validate if the player can pay the card's mana cost using `canPayCost` from `DEVPLAN_04`.
- [ ] Add basic target validation placeholder (if applicable).

### State Update Logic (On Success)
- [ ] Retrieve the full `Card` data from the database/cache using `cardId`.
- [ ] Spend the card's mana cost using `spendMana` from `DEVPLAN_04`.
- [ ] Remove the card from the player's `hand` in `GameState`.
- [ ] Determine card destination based on type:
    - **Creature/Enchantment/Resource Generator**: Add card object to the appropriate `battlefield` zone in `GameState`.
    - **Instant/Sorcery**: Add card object to the `stack` in `GameState` (stack implementation in `DEVPLAN_07`).
- [ ] Handle Summoning Sickness for creatures (add a flag/property to the card instance on the battlefield).

### Integration & Logging
- [ ] Integrate the `play_card` handler into the server's WebSocket event listener.
- [ ] Ensure action fails gracefully with appropriate error messages/events if validation fails.
- [ ] Add logging for card plays (player, card name, success/failure).
