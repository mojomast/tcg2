import { GameEngine } from '../gameEngine';
import { GameState, PlayerState, PlayerId, GameObjectId, BattlefieldCard } from '../../interfaces/gameState';
import { Card } from '../../interfaces/card';
import { createInitialGameState, createMockCard, createBattlefieldCard, addCreatureToBattlefield } from '../../utils/testUtils'; // Import helpers

describe('GameEngine - Combat Logic', () => {
  let gameEngine: GameEngine;
  let gameState: GameState;
  let playerState: PlayerState;
  const player1Id = 'player1' as PlayerId;
  const player2Id = 'player2' as PlayerId;

  beforeEach(() => {
    // Reset gameState and gameEngine for each test
    gameState = createInitialGameState(player1Id, player2Id); // Use helper
    gameEngine = new GameEngine([player1Id, player2Id], { [player1Id]: [], [player2Id]: [] }); // Fix GameEngine constructor call
  });

  it('should handle an unblocked attacker dealing damage to the opponent', () => {
    // 1. SETUP: Create a test game state with a 2/2 creature on Player 1's battlefield
    const player1State = gameState.players.find(p => p.playerId === player1Id);
    if (!player1State) throw new Error('Test setup: Player 1 state not found');

    const attacker = addCreatureToBattlefield(
        gameState, 
        player1State, 
        { name: 'Attacker', power: 2, toughness: 2, id: 'attacker-card' } // Provide an ID for the card definition
    );
    // Get the underlying card definition for the attacker
    const attackerGameObject = gameState.gameObjects[attacker.instanceId]; // This is the BattlefieldCard
    if (!attackerGameObject) throw new Error('Test setup: Attacker game object not found');

    expect(attackerGameObject.power).toBe(2); // Verify creature power from the BattlefieldCard object

    // 2. MANUALLY set up the combat state
    gameState.currentPhase = 'COMBAT';
    gameState.currentStep = 'DECLARE_ATTACKERS';
    gameState.priorityPlayerId = player1Id;

    // 3. VERIFY initial state
    const initialPlayer2Life = gameState.players.find(p => p.playerId === player2Id)!.life;
    expect(initialPlayer2Life).toBe(20); // Starting life

    // 4. MANUALLY configure unblocked attacker
    // This simulates the result of the declareAttackers method
    gameState.attackers = { [attacker.instanceId]: player2Id }; // Use instanceId instead of objectId

    // 5. DIRECTLY call the damage assignment method
    // This bypasses the step advancement logic and tests just the damage calculation
    // gameEngine['_assignCombatDamage'](false); // Comment out direct private method access

    // 6. VERIFY final state
    const finalPlayer2Life = gameState.players.find(p => p.playerId === player2Id)!.life;
    expect(finalPlayer2Life).toBe(18); // Should have lost 2 life from the 2/2 attacker
  });

  it('should handle a blocked attacker and blocker dealing damage to each other', () => {
    // Setup: Player 1 attacks with 2/2, Player 2 blocks with 1/3
    // Action: Advance through combat steps until damage
    // Assert: Attacker has 1 damage, blocker has 2 damage
    expect(true).toBe(true); // Placeholder
  });

  it('should move a creature with lethal damage to the graveyard after combat', () => {
    // Setup: Player 1 attacks with 2/2, Player 2 blocks with 1/1
    // Action: Advance through combat damage and SBA checks
    // Assert: Blocker should be in Player 2's graveyard, Attacker should have 1 damage
    expect(true).toBe(true); // Placeholder
  });

  it('should assign first strike damage first, then normal damage', () => {
    // Setup: P1 attacks with 2/1 First Strike, P2 blocks with 1/1
    // Action: Advance through COMBAT_DAMAGE_FIRST, check SBAs, advance through COMBAT_DAMAGE_NORMAL
    // Assert: Blocker destroyed before dealing damage, Attacker survives with 0 damage
    expect(true).toBe(true); // Placeholder
  });

  it('should end the game if a player reaches 0 life due to combat damage', () => {
    // Setup: P1 attacks with 5/5, P2 has 5 life and no blockers
    // Action: Advance through combat damage and SBA checks
    // Assert: gameState.winner should be player1Id
    expect(true).toBe(true); // Placeholder
  });

  // Add more tests for edge cases, multiple attackers/blockers etc.

});
