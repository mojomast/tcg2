# DEVPLAN 14: Energy System

**Goal**: Implement the secondary resource system (Energy), which is persistent and used for specific abilities.

## Tasks

### Energy Data Structure
- [ ] Ensure the `energy` counter property exists within the player state in `GameState` (defined in `DEVPLAN_02`).

### Energy Generation
- [ ] Create a placeholder mechanism or function `gainEnergy(playerState, amount)` to increase a player's energy counter.
    - This will be triggered by specific card effects later, but the core function can be built now.
- [ ] Ensure energy generation updates the `GameState`.

### Energy Spending
- [ ] Implement a function `canSpendEnergy(playerState, amount)` to check if a player has sufficient energy.
- [ ] Implement a function `spendEnergy(playerState, amount)` to deduct energy from the player's counter.
- [ ] This will be linked to specific card ability activations later.

### Persistence
- [ ] Verify that the player's `energy` counter is *not* reset during the normal turn progression or phase changes (unlike the mana pool).

### Integration & Logging
- [ ] Add logging for energy gains and expenditures.
- [ ] Prepare integration points for future card effects that generate or consume energy.
