# DEVPLAN 08: Basic Keywords

**Goal**: Implement the game logic for a few fundamental creature keywords: Haste, Flying, and Vigilance.

## Tasks

### Keyword Representation
- [ ] Ensure the `Card` data model (`DEVPLAN_02`) includes a way to represent keywords (e.g., an `abilities: string[]` array).
- [ ] Update or create sample card data with these keywords for testing.

### Haste Implementation
- [ ] Modify the Summoning Sickness check in `play_card` (`DEVPLAN_05`) and `declare_attackers` (`DEVPLAN_06`) handlers.
- [ ] Creatures entering the battlefield should check for the 'Haste' keyword.
- [ ] If a creature has Haste, it should bypass the Summoning Sickness restriction, allowing it to attack or activate tap abilities the turn it enters.

### Flying Implementation
- [ ] Modify the `declare_blockers` validation logic (`DEVPLAN_06`).
- [ ] If an attacking creature has 'Flying', it can only be blocked by creatures that also have 'Flying' (or 'Reach' - add placeholder check).
- [ ] Add validation to prevent non-Flying creatures from blocking Flying creatures.

### Vigilance Implementation
- [ ] Modify the `declare_attackers` state update logic (`DEVPLAN_06`).
- [ ] When a creature is declared as an attacker, check if it has the 'Vigilance' keyword.
- [ ] If it has Vigilance, do *not* mark the creature as tapped in the `GameState`.

### Integration & Logging
- [ ] Ensure keyword checks are performed at the correct points in the game logic (card play, combat steps).
- [ ] Add logging to indicate when a keyword affects game rules (e.g., "Creature X attacks without tapping due to Vigilance", "Blocker Y cannot block Attacker Z due to Flying").
