# DEVPLAN 04: Resource System (Mana)

**Goal**: Implement the primary resource system (Mana), including generation, tracking, and spending mechanisms.

## Tasks

### Mana Data Structures
- [x] Define a structure/interface for mana costs (e.g., `{ generic: number, red: number, ... }`) if not fully covered in `DEVPLAN_02`.
- [x] Add a `manaPool` property to the player state within `GameState` to track available mana of each type.

### Mana Generation
- [x] Implement logic for the Resource Gain Step (Begin Phase) to refresh the `manaPool` based on controlled Resource Generators (placeholder logic initially, e.g., add 1 mana of a default color). (Added placeholder to Upkeep)
- [x] Implement a basic `tapResource` function (placeholder) that adds mana to the pool when a resource card is tapped (this will be linked to player actions later).

### Mana Spending
- [x] Implement a function `canPayCost(playerState, cost)` to check if a player has sufficient mana in their pool to pay a given cost.
- [x] Implement a function `spendMana(playerState, cost)` to deduct the specified mana cost from the player's `manaPool`.
    - [x] Handle generic mana costs appropriately (allowing any color to pay).
- [x] Ensure mana pool clears or resets correctly between turns/phases as per game rules (mana doesn't carry over). (Implemented `clearManaPool`)

### Integration & Logging
- [ ] Integrate mana checking/spending into future actions (like `play_card`).
- [x] Add logging for mana pool updates (gain, spend, clear).
