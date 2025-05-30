# DEVPLAN 05: Action - Play Card

**Goal**: Implement the core game action of a player playing a card from their hand, including validation and state changes.

**Current Status: 100% Complete** (Updated 2025-05-30T21:22)
- WebSocket integration: ✅ COMPLETE
- Core validation and state update: ✅ COMPLETE  
- Target validation: ✅ COMPLETE

## Tasks

### Action Definition & Handling
- [X] Define the `play_card` WebSocket event structure (payload: `cardId`, optional `targets`).
    - **COMPLETED 2025-05-30T21:16:** WebSocket event listener added to `server.ts` lines 561-590
    - **PAYLOAD:** `{ playerId: string, cardInstanceId: string, targets?: string[] }`
    - **VALIDATION:** Player ID matching, comprehensive error handling
- [X] Create a handler function within the `GameEngine` or related module to process the `play_card` action (`playCard` method added).
    - **COMPLETED 2025-05-30T21:18:** Enhanced `GameEngine.playCard()` method returns boolean status

### Validation Logic
- [X] Validate if the player has priority.
- [X] Validate if the player actually has the specified `cardId` in their hand.
- [X] Validate timing restrictions based on card type (e.g., Sorcery only in Main Phase, empty stack).
- [X] Validate if the player can pay the card's mana cost using `canPayCost` from `DEVPLAN_04`.
- [X] Add basic target validation placeholder (if applicable).
    - **COMPLETED 2025-05-30T21:22:** Comprehensive target validation system implemented
    - **FEATURES:** Smart rules text parsing, target requirement detection, existence validation
    - **METHODS:** `checkIfCardRequiresTargets()` and `validateBasicTargets()` in ActionManager
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
- [X] Integrate the `play_card` handler into the server's WebSocket event listener.
    - **COMPLETED 2025-05-30T21:16:** Full WebSocket integration with error handling
    - **FEATURES:** Player ID validation, success/failure broadcasting, error messages
    - **ERROR HANDLING:** Graceful failures with specific error messages to clients
- [X] Ensure action fails gracefully with appropriate error messages/events if validation fails (returns `false`, logs warnings/errors).
- [X] Add logging for card plays (player, card name, success/failure).
    - **ENHANCED:** Comprehensive logging throughout the play card pipeline
    - **INCLUDES:** Target validation logs, mana payment logs, success/failure tracking
