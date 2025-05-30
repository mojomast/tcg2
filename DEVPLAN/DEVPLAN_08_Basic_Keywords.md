# DEVPLAN 08: Basic Creature Keywords (Haste, Flying, Vigilance)

**Goal**: Implement the game logic for fundamental creature keywords: Haste, Flying, and Vigilance. This involves updating the card data model, creating sample card data, and ensuring correct handling during gameplay (combat, summoning).

**Estimated Effort**: 2-3 days

### Tasks

#### 1. Keyword Representation (Card Model & Data)
- [X] Ensure the `Card` data model (`DEVPLAN_02`) includes a way to represent keywords (e.g., an `abilities: string[]` array). *(Implemented as `keywords: Keyword[]` in `Card` interface)*
- [X] Update or create sample card data with Haste, Flying, and Vigilance for testing. *(Added to `actionManager.test.ts` `createMockCard` and test setup)*

#### 2. Haste Implementation
- [X] Modify the Summoning Sickness check in `play_card` (`DEVPLAN_05`) and `declare_attackers` (`DEVPLAN_06`) handlers.
    - When a creature enters the battlefield (`StateManager.moveCardToZone`), its `summoningSickness` flag is set to `false` if it has Haste, `true` otherwise.
    - When a creature is declared as an attacker (`CombatManager.declareAttackers`), it cannot attack if `summoningSickness` is `true`.
- [X] Creatures entering the battlefield should check for the 'Haste' keyword.
- [X] If a creature has Haste, it should bypass the Summoning Sickness restriction, allowing it to attack or activate tap abilities the turn it enters.

#### 3. Flying Implementation
- [X] Modify `declare_blockers` (`DEVPLAN_06`) handler (`CombatManager.declareBlockers`).
- [X] Creatures with Flying can only be blocked by other creatures with Flying or Reach.
- [X] Creatures without Flying or Reach cannot block creatures with Flying.
- [X] Ensure 'Reach' is part of the `Keyword` type and used correctly. *(Added 'Reach' to `Keyword` type in `card.ts` and ensured `gameState.ts` uses this definition)*

#### 4. Vigilance Implementation
- [X] Modify `declare_attackers` (`DEVPLAN_06`) handler (`CombatManager.declareAttackers`).
- [X] Creatures with Vigilance do not tap when declared as attackers.

#### 5. Integration and Logging
- [X] Ensure keyword checks are performed at appropriate points in the game logic (ETB, declare attackers, declare blockers).
- [X] Add logging for actions related to keywords. *(Basic console logging added during implementation)*

#### 6. Unit Testing
- [X] Create `combatManager.test.ts`.
- [X] Add unit tests for Haste (creatures can attack turn they enter, cannot if no haste).
- [X] Add unit tests for Flying (flying creatures can only be blocked by flying/reach; non-flying/reach cannot block flying).
- [X] Add unit tests for Vigilance (creatures with vigilance do not tap when attacking).
- [X] Consider tests for combinations of keywords if relevant to basic interactions. *(Basic interactions for non-flying attackers vs various blockers added)*

### Core Engine / Test Setup Fixes (Emergent)

- [ ] **Fix `GameEngine` Initialization for Card Instances:**
    - Modify `GameEngine.initializePlayers` to correctly create `BattlefieldCard` instances from input `decklists`.
    - Ensure `gameState.gameObjects` is populated with these instances.
    - Ensure player libraries (`PlayerState.library`) are populated with the `instanceId`s of these cards.
    - This is crucial for `actionManager.test.ts` and potentially other tests that rely on finding card instances after game setup.
- [ ] Address `TypeError: Cannot read properties of undefined (reading 'find')` in `turnManager.test.ts` related to `playerState.hand.find`.

### Acceptance Criteria
- All keyword logic (Haste, Flying, Vigilance) is correctly implemented.
- Sample cards with these keywords exist for testing.
- Unit tests cover the behavior of each keyword during relevant game phases (summoning, combat).
- The game correctly handles interactions based on these keywords (e.g., a creature with Haste can attack immediately, a flying creature cannot be blocked by a non-flying/non-reach creature).
