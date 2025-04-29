# Development Plan - Testing Strategy

This document outlines the testing strategy and setup for the TCG project.

## Framework

- **Test Runner:** [Jest](https://jestjs.io/)
- **TypeScript Support:** [ts-jest](https://kulshekhar.github.io/ts-jest/)

## Test File Location and Naming

- Tests are located within `__tests__` subdirectories, placed alongside the source code files they are testing.
  - Example: Tests for `src/game/gameEngine.ts` reside in `src/game/__tests__/gameEngine.test.ts`.
- Test files follow the naming convention `*.test.ts` or `*.spec.ts`.

## Testing Utilities

- Helper functions for creating mock data (cards, game states, players) are located in `src/utils/testingUtils.ts`.
- These utilities help streamline the setup process for individual test cases.

## Running Tests

- Tests can be executed using the following npm script:
  ```bash
  npm test
  ```

## Current Status and Focus

- **Module Resolution:** Successfully resolved module import issues by correctly structuring imports from `card.ts` and `gameState.ts`.
- **Combat System:** Completed basic combat testing, successfully validating that unblocked attackers deal damage to defending players.
- **Type Safety:** Fixed type errors in testing utilities by ensuring proper implementation of interfaces (BattlefieldCard, Card, GameState).
- **Next Focus:** Implementing tests for more complex combat scenarios (blocking, first strike) and edge cases.

## Testing Combat Logic

Combat testing is particularly challenging due to the complex state transitions and interactions between game phases, steps, and objects. Our approach includes:

1. **Phase/Step Verification:** Tests explicitly verify the game state's current phase and step at each point in the test to ensure proper game flow.
2. **Damage Assignment:** Tests check that combat damage is properly calculated and assigned to:
   - Defending players (when attackers are unblocked)
   - Creatures (when attackers are blocked or when blockers assign damage)
3. **State-Based Actions:** Tests verify that state-based actions (SBAs) are properly checked after damage assignment, including:
   - Moving creatures with lethal damage to the graveyard
   - Ending the game if a player's life total reaches zero
4. **Special Abilities:** Tests handle keyword abilities that modify combat, such as:
   - First Strike (damage being assigned in the appropriate step)
   - Trample (excess damage being assigned to defending player)

### Testing Challenges

The primary challenge with combat testing is ensuring that the `GameEngine` correctly moves through combat steps and invokes damage assignment/SBA checking at the appropriate times. Debugging strategies include:

- Adding console logs at key points in the combat sequence
- Verifying gameState phase/step transitions
- Testing individual combat scenarios in isolation
- Checking game object states (tapped status, damage markers, life totals) at each step

## Testing Best Practices

Based on our experience implementing the combat system tests, we've established the following best practices:

1. **Test Fundamental Methods Directly**
   - When testing complex systems with many interacting parts, directly test core methods in isolation
   - Example: Testing `_assignCombatDamage` directly rather than through multiple step transitions

2. **Create Controlled Test States**
   - Use helper functions to create consistent, controlled starting states
   - Manually configure test conditions rather than relying on complex setup chains
   - Example: Manually setting up the attackers map rather than calling `declareAttackers`

3. **Isolate Test Dependencies**
   - Each test should validate one specific aspect of functionality
   - Minimize dependence on correct implementation of other methods
   - Example: Testing damage assignment independently from step transitions

4. **Verify State Before and After**
   - Explicitly verify the initial state before actions
   - Verify the final state after actions
   - Example: Checking player life totals both before and after combat damage

5. **Type Safety**
   - Ensure testing utilities and mocks properly implement the interfaces they represent
   - Avoid type casts unless absolutely necessary
   - When errors occur, verify the underlying type definitions before assuming implementation errors
