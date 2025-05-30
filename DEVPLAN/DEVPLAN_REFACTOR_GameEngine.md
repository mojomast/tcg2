# Game Engine Refactoring Plan

**Goal:** Split the monolithic `GameEngine` class into smaller, focused modules to improve organization, maintainability, and testability.

**Current State:** `gameEngine.ts` is large and handles many aspects of the game. We are actively refactoring by moving specific responsibilities into dedicated manager classes (`TurnManager`, `CombatManager`, `ActionManager`, etc.).

**Proposed Modules:**

1.  **`TurnManager` (`turnManager.ts`)**
    *   **Responsibilities:** Managing game phases, steps, turn progression, and priority.
    *   **Methods:** `advanceStep`, `advancePhase`, `nextTurn`, `_advanceTurn`, `grantPriority`, `passPriority`, `getCurrentPhaseSteps`, `untapStep`.
    *   **Properties:** `phaseOrder`, `stepOrder`.
    *   **Status:** [x] Initial logic moved.

2.  **`CombatManager` (`combatManager.ts`)**
    *   **Responsibilities:** Manages combat phases (Begin Combat, Declare Attackers, Declare Blockers, Combat Damage, End Combat), handles attacker/blocker declarations, calculates combat damage (including first strike, double strike, trample, deathtouch, lifelink), and clears combat state.
    *   **Methods Moved/Created:**
        *   `declareAttackers` (Moved from `GameEngine`)
        *   `declareBlockers` (Moved from `GameEngine` - *In Progress*)
        *   `assignCombatDamage` (Logic moved from `GameEngine`)
        *   `cleanupCombat` (Logic moved from `GameEngine`)
        *   `checkKeywords` (Placeholder created, replaces need for private `_doesAnyCreatureHaveKeyword`)
    *   **Status:** [x] Complete for initial refactoring phase.

3.  **`ActionManager` (`actionManager.ts`)**
    *   **Responsibilities:** Handling player actions like playing cards and activating abilities (integrating stack resolution later).
    *   **Methods:** `playCard` (initial implementation done, needs cost payment logic).
    *   **Status:** [x] Initial logic moved and refined.

4.  **`ResourceManager` (`resourceManager.ts`)**
    *   **Responsibilities:** Managing player resources (mana), paying costs, tapping permanents for resources.
    *   **Methods:** `addMana`, `spendMana`, `canPayCost`, `canAffordCost`, `payCost`, `tapForMana`, `untapPermanents`, `playResource`.
    *   **Status:** [x] Initial logic moved. [x] Refined `payCost` and `tapForMana` (data-driven mana production).

5.  **`GameInitializer` (`gameInitializer.ts`)**
    *   **Responsibilities:** Setting up the initial game state before the first turn.
    *   **Methods:** `determineFirstPlayer`, `shuffleDeck`, `drawOpeningHand`, `startGame`.
    *   **Status:** [x] Initial logic moved.

6.  **`StateManager` (`stateManager.ts`)**
    *   **Responsibilities:** Managing game objects (creation, deletion, modification), card zone transitions, and player states.
    *   **Methods:** `createGameObject`, `moveCardToZone`, `getPlayerState`.
    *   **Status:** [x] Initial logic moved. [x] Added event triggering to `moveCardToZone`.

7.  **`GameEngine` (`gameEngine.ts`)**
    *   **Responsibilities:** Orchestrating the managers, holding the central `GameState`, providing helper methods used by multiple managers.
    *   **Methods:** `constructor`, `startGame`, `getPlayerState`, `getOpponentId`, `findBattlefieldCard`, `getBaseCardData`, `getCardFromInstanceId`, `createGameObject`, `moveCardZone`, `passPriority`, `emitGameEvent` (stub).
    *   **Status:** [x] Being actively refactored. Serves as the central hub.

**Implementation Steps:**

1.  **Create Files:** Create new `.ts` files for each manager module (`turnManager.ts`, `combatManager.ts`, etc.) in `src/game/`. - *Completed*
2.  **Define Interfaces (Optional):** Define TypeScript interfaces for each manager. *Skipped*
3.  **Move Code:** Move methods/properties from `gameEngine.ts` to the new manager files.
    *   [x] `GameInitializer` (Initial methods moved)
    *   [x] `TurnManager` (Turn/Priority methods moved)
    *   [x] `CombatManager`
    *   [x] `ActionManager`
    *   [x] `ResourceManager`
    *   [x] `StateManager`
4.  **Refactor `GameEngine`:** Update `gameEngine.ts` to import, instantiate, and delegate to the new managers. Pass `GameState` (or parts) to managers.
    *   [x] Instantiated all managers.
    *   [x] Updated relevant calls to delegate.
5.  **Address Dependencies:** Ensure managers have necessary access to `GameState` and other managers if required.
    *   [x] Managers now receive `GameState` and `GameEngine` reference in constructor.
    *   [x] Made necessary helper methods in `GameEngine` public.
6.  **Update Imports/Exports:** Adjust `import`/`export` statements. - *Completed as part of moving code*
7.  **Fix Lint Errors:** Address errors arising from refactoring. - *Mostly complete, see Next Steps*
8.  **Testing:** Test each module and the integrated system thoroughly. - *Pending*

## Progress Update (YYYY-MM-DD)

**Completed Tasks:**

*   **Type Standardization:**
    *   Unified `ManaColor` type definition in `gameState.ts` and updated all imports (`card.ts`, `gameEngine.ts`, `resourceManager.ts`).
    *   Updated `ManaCost` interface in `card.ts` to use `C` for colorless mana, replacing `colorless`.
    *   Updated `resourceManager.ts` to use `C` when referencing colorless costs.
    *   Defined and exported `Zone` type in `gameState.ts`.
    *   Added `currentZone: Zone` property to `BattlefieldCard` interface in `gameState.ts`.
    *   Exported `Ability` interface from `card.ts`.
*   **Method Stubs Implemented:**
    *   Added `moveCardToZone(playerId, cardObjectId, fromZone, toZone)` method stub to `StateManager`.
    *   Added `handleStackResolved()` method stub to `TurnManager`.
*   **Linting:** Resolved major lint errors related to type mismatches and missing methods/properties introduced during refactoring.

## Phase 2: Implementation Subplan

### 1. Implement Priority Passing (`TurnManager.handleStackResolved`)
   - [x] Define state needed to track priority (e.g., who has priority, has current player passed this round?). Add properties to `GameState` or `TurnManager` state.
     *Note: Updated `GameState` to use `priorityPlayerId: PlayerId | null` and `consecutivePriorityPasses: number`. Removed redundant `playerWithPriority`.* 
   - [x] Modify `handleStackResolved`: Instead of just logging, check if state-based actions need to run first.
     *Note: Implemented call to `stateManager.checkStateBasedActions()`.* 
   - [x] Implement logic to grant priority to the active player after stack resolution or state-based actions.
     *Note: Existing logic in `handleStackResolved` correctly grants priority via `grantPriority()` after SBA check.* 
   - [x] Implement `getOpponentId`: 
        - **Description:** Ensure a reliable way to get the opponent ID is available, likely as a helper in `GameEngine` and called via `engine` reference in `TurnManager`.
        - **Status:** DONE
        - **Notes:** Added `public getOpponentId(playerId: PlayerId): PlayerId` to `GameEngine.ts`. Updated calls in `TurnManager.ts` to use `this.engine.getOpponentId()`. Fixed resulting lint errors in `TurnManager`.
   - [x] Implement `passPriority` Logic: 
        - **Description:** Verify `TurnManager.passPriority` correctly increments `consecutivePriorityPasses` and calls `advanceTurnState` when enough passes occur.
        - **Status:** DONE
        - **Notes:** Confirmed `passPriority` increments `gameState.consecutivePriorityPasses` and compares against `gameState.players.length` before calling `advanceTurnState`. Verified `consecutivePriorityPasses` exists in `GameState` interface.
   - [ ] Modify `advanceTurnState`: Only advance if both players have passed priority in sequence for the current step/phase.
   - [x] Ensure `ActionManager` calls `TurnManager.grantPriority` for the acting player and resets `consecutivePriorityPasses` after successfully processing an action (e.g., adding to stack).

### 2. Implement Zone Change Logic (`StateManager.moveCardToZone`)
   - [ ] Add logic within `moveCardToZone` to check the `fromZone` and `toZone`.
   - [ ] Implement placeholder hooks/event emitters for zone changes (e.g., `onCardEntersZone(card, zone)`, `onCardLeavesZone(card, zone)`).
   - [ ] (Future) Create a system to register listeners for these events (e.g., for 'Enters the Battlefield' triggers).
   - [ ] Refine error handling and potential rollback logic if a move fails midway.

### 3. Refine Resource Management (`ResourceManager`)
   - [ ] Review `payCost` method: Ensure the logic correctly handles paying generic costs (`C`) using any available mana type after specific colored costs are paid.
   - [ ] Verify mana deduction logic in `payCost` is accurate and updates `ManaPool` correctly.
   - [ ] Address any TODOs within `ResourceManager.ts`.
   - [ ] Consider edge cases (e.g., costs involving alternative payments, Phyrexian mana - future).

### 4. Unit Testing
   - [ ] Run `turnManager.test.ts`. Identify and fix failures. (Previously failed on load due to instantiation dependencies, hopefully fixed now).
   - [ ] Write tests for `StateManager` (if necessary).
   - [ ] Write tests for `CombatManager` (if necessary).
   - [ ] Write tests for `ResourceManager.payCost` with various costs and mana pools.
   - [ ] Write tests for `ActionManager.resolveTopStackItem` covering different card types.
   - [ ] Ensure existing tests for refactored components still pass.

### 5. Integration and Review
   - [ ] Manually trace or add integration tests for a simple sequence (e.g., play land, play creature, pass turn).
   - [ ] Review interactions between managers to ensure data flows correctly and state remains consistent.

### Phase 2: Combat Refinement (Post-Core Logic)
 
### Phase 3: Advanced Features
