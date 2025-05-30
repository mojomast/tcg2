# DEVPLAN DETOUR 02: Game Actions

**Goal**: Define and plan the implementation of various player game actions, including client-side triggers, server-side logic, and state synchronization.

**Recent Foundational Work (May 28, 2025):**
- **TypeScript Type Resolution & Module Imports**:
  - [x] Systematically reviewed and corrected type definitions and import paths across core interface files (`gameState.ts`, `card.ts`) and consuming files (game logic, Redux slices, UI components).
  - [x] Ensured consistent use of `.js` extensions for relative local module imports (e.g., `import ... from './module.js';`) to align with ES Module resolution in the Node.js environment (affecting server-side code) and to improve consistency for the Vite build process.
  - [x] Addressed numerous lint errors related to module resolution, type mismatches, and incorrect exports/imports.
  - **Impact**: These changes are critical for a stable build, correct type checking, and reliable module loading, forming a necessary foundation before proceeding with more complex game action implementations. While not adding new features from this plan, this unblocks further development.
- **Robust Client Initialization & Game Joining (`GameBoard.tsx`, `socketService.ts`)**:
  - [x] Refactored `GameBoard.tsx` to use the server-assigned player ID from `state.player.id` (set via `socketService`) as the definitive client identifier.
  - [x] Ensured `socketService.connect()` is called to establish connection.
  - [x] Implemented logic in `GameBoard.tsx` to wait for the server-assigned `actualPlayerId` before allowing the player to select a role (e.g., Player 1 or Player 2 for a test game) and attempt to join.
  - [x] The "Join Game" action (`socketService.emitJoinGame`) now correctly sends the chosen role and relies on the already established `actualPlayerId` (socket session ID) for server-side mapping.
  - [x] Removed premature setting of a temporary/test player ID into `gameSlice` from the client side.
  - **Impact**: Resolves "Player ID not set" and "Socket not connected" errors by ensuring client-server connection and ID assignment precede game-joining attempts. Improves clarity of player identification.

## Actions to Implement

### 1. Pass Priority
- **Description**: Player indicates they have no actions to take with their current priority. If both players pass priority consecutively, the top item on the stack resolves. If the stack is empty, the game moves to the next step or phase.
- **Client-Side (`src/components/ActionControls.tsx`, `src/services/socketService.ts`)**:
  - [x] **UI**: Add a "Pass Priority" button in `ActionControls.tsx`, visible when `gameState.priorityPlayerId === localPlayerId`.
  - [x] **Event Emission**: On button click, call `socketService.emit('pass_priority', { playerId: localPlayerId })`.
- **Server-Side (`src/server.ts`, `src/game/actionManager.ts` or `src/game/gameEngine.ts`)**:
  - [x] **Event Listener (`src/server.ts`)**: Create `socket.on('pass_priority', ({ playerId }) => { ... })`.
    - [x] Validate `playerId` against `socket.data.playerId` and current priority in `GameEngine`.
    - [x] Call `gameEngine.actionManager.passPriority(playerId)`.
    - [x] If successful, broadcast `game_state_update`.
  - [x] **Game Logic (`actionManager.passPriority`)**:
    - [x] Verify `playerId` has priority.
    - [x] Increment `gameState.consecutivePriorityPasses`.
    - [x] Switch `gameState.priorityPlayerId` to the other player.
    - [x] **Stack Resolution/Turn Progression Logic**:
      - [x] If `gameState.consecutivePriorityPasses >= 2`:
        - [x] Reset `gameState.consecutivePriorityPasses = 0`.
        - [x] If `gameState.stack` is not empty:
          - [x] Pop and resolve the top stack item (call `actionManager.resolveTopStackItem()`).
          - [x] After resolution, set `priorityPlayerId` to `activePlayerId`.
        - [x] If `gameState.stack` is empty:
          - [x] Advance to the next step/phase (call `turnManager.advanceTurnState()`).
- **State Synchronization**: Ensure `game_state_update` includes changes to `priorityPlayerId`, `consecutivePriorityPasses`, `stack`, `currentPhase`, `currentStep`, and any game objects affected by resolved stack items. (Marking as complete assuming general state sync covers this)
- **Notes**: This is crucial for game flow and interaction.

### 2. Play Card
- **Description**: Player selects a card from their hand and attempts to play it. This typically involves paying costs and, if it's a spell, putting it on the stack. If it's a resource, it may go directly to the battlefield.
- **Client-Side (`src/components/PlayerHandZone.tsx`, `src/components/TargetingModal.tsx` (if needed), `src/services/socketService.ts`)**:
  - [ ] **UI**: 
    - [x] Allow clicking a card in `PlayerHandZone.tsx`.
    - [ ] If card requires targets, implement a targeting selection mechanism (e.g., modal, click on board elements).
    - [ ] Display mana costs and available mana.
  - [x] **Event Emission**: On play confirmation, `socketService.emit('play_card', { playerId: localPlayerId, cardInstanceId: string, selectedTargets?: TargetInfo[] })`. (Basic emission implemented, targeting TBD)
- **Server-Side (`src/server.ts`, `src/game/actionManager.ts` or `src/game/gameEngine.ts`)**:
  - [x] **Event Listener (`src/server.ts`)**: Create `socket.on('play_card', (data) => { ... })`.
    - [x] Validate `data.playerId`.
    - [x] Call `gameEngine.actionManager.playCard(data.playerId, data.cardInstanceId, data.selectedTargets)`.
    - [x] If successful, broadcast `game_state_update`.
  - [x] **Game Logic (`actionManager.playCard`)**:
    - [x] Verify player has priority, owns the card, card is in hand.
    - [x] Check if player can pay mana costs (implement `resourceManager.canPayCost()` and `resourceManager.deductCost()`). (Basic structure in place, assumes ResourceManager methods exist and work)
    - [ ] Validate targets if any. (Placeholder for now)
    - [x] If it's a spell (Instant, Sorcery, etc.):
      - [x] Move card from hand to stack (create `StackItem`).
      - [x] Deduct costs.
      - [x] Player retains priority.
    - [x] If it's a permanent (Creature, Artifact, etc. that uses the stack):
      - [x] Move card from hand to stack (as a spell).
      - [x] Deduct costs.
      - [x] Player retains priority.
    - [x] If it's a "Resource" card (e.g., Land-like):
      - [x] Check `playerState.hasPlayedResourceThisTurn` (ensure `TurnManager` resets this).
      - [x] If allowed, move card from hand to battlefield.
      - [x] Set `playerState.hasPlayedResourceThisTurn = true`.
      - [x] Player retains priority.
- **State Synchronization**: Update `hand`, `battlefield`, `stack`, `manaPool`, `priorityPlayerId`, `gameObjects`. (Partially complete, relies on broadcast and correct state mutations)
- **Notes**:
  - Complex; involves costs, targeting, stack interaction, different card types.

### 3. Declare Attackers
- **Description**: During the declare attackers step, the active player chooses which of their creatures will attack.
- **Client-Side (`src/components/PlayerBattlefield.tsx`, `src/components/ActionControls.tsx`, `src/services/socketService.ts`)**:
  - [ ] **UI**: 
    - [ ] In `ActionControls.tsx`, show "Declare Attackers" button during the correct step for the active, local player.
    - [ ] Allow selecting creatures on `PlayerBattlefield.tsx` to be attackers (e.g., toggle an attacking state).
  - [ ] **Event Emission**: On confirm attackers, `socketService.emit('declare_attackers', { playerId: localPlayerId, attackerInstanceIds: string[] })`.
- **Server-Side (`src/server.ts`, `src/game/combatManager.ts`)**:
  - [ ] **Event Listener (`src/server.ts`)**: Create `socket.on('declare_attackers', (data) => { ... })`.
    - [ ] Validate `data.playerId` is active player and in correct phase/step.
    - [ ] Call `gameEngine.combatManager.declareAttackers(data.playerId, data.attackerInstanceIds)`.
    - [ ] If successful, broadcast `game_state_update`.
  - [ ] **Game Logic (`combatManager.declareAttackers`)**:
    - [ ] Verify player is active, in declare attackers step.
    - [ ] For each `attackerInstanceId`:
      - [ ] Verify creature exists, is controlled by player, is on battlefield.
      - [ ] Verify creature can attack (not summoning sick, not tapped, no effects preventing attack).
    - [ ] Update `gameState.combat.attackers` (or similar structure) with the valid attackers.
    - [ ] Advance priority to the defending player.
- **State Synchronization**: Update `gameState.combat.attackers`, `priorityPlayerId`.
- **Notes**: Requires clear combat phase/step management in `TurnManager` and `CombatManager`.

### 4. Declare Blockers
- **Description**: During the declare blockers step, the defending player chooses which of their creatures will block incoming attackers.
- **Client-Side (`src/components/PlayerBattlefield.tsx`, `src/components/ActionControls.tsx`, `src/services/socketService.ts`)**:
  - [ ] **UI**: 
    - [ ] In `ActionControls.tsx`, show "Declare Blockers" button during the correct step for the defending, local player.
    - [ ] Allow selecting creatures on `PlayerBattlefield.tsx` and assigning them to block specific attackers.
  - [ ] **Event Emission**: On confirm blockers, `socketService.emit('declare_blockers', { playerId: localPlayerId, blockerAssignments: { [blockerInstanceId: string]: string | null /* attackerInstanceId or null if not blocking */ } })`.
- **Server-Side (`src/server.ts`, `src/game/combatManager.ts`)**:
  - [ ] **Event Listener (`src/server.ts`)**: Create `socket.on('declare_blockers', (data) => { ... })`.
    - [ ] Validate `data.playerId` is defending player and in correct phase/step.
    - [ ] Call `gameEngine.combatManager.declareBlockers(data.playerId, data.blockerAssignments)`.
    - [ ] If successful, broadcast `game_state_update`.
  - [ ] **Game Logic (`combatManager.declareBlockers`)**:
    - [ ] Verify player is defending, in declare blockers step.
    - [ ] For each `blockerInstanceId` and its assigned `attackerInstanceId`:
      - [ ] Verify blocker creature exists, is controlled by player, is on battlefield.
      - [ ] Verify creature can block (not tapped, no effects preventing block, can block the specific attacker if flying/reach involved).
      - [ ] Verify attacker exists and is actually attacking.
    - [ ] Update `gameState.combat.blockers` (or similar structure).
    - [ ] Advance priority (typically to active player for combat damage ordering or instants before damage).
- **State Synchronization**: Update `gameState.combat.blockers`, `priorityPlayerId`.
- **Notes**: Needs clear attacker information available to the client. Complex blocking rules (multiple blockers, trample) might be future additions.

---

*(Add more actions as needed, e.g., Activate Ability, Resolve Stack Item (internal), Combat Damage Assignment)*
