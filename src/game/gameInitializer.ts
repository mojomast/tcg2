import { GameState, PlayerId } from '../interfaces/gameState';

export class GameInitializer {

    private determineFirstPlayer(gameState: GameState): PlayerId {
        // Simple random determination for now
        const randomIndex = Math.floor(Math.random() * gameState.players.length);
        return gameState.players[randomIndex].playerId;
    }

    private shuffleDeck(gameState: GameState, playerId: PlayerId): void {
        console.log(`Placeholder: Shuffling deck for player ${playerId}`);
        const playerState = gameState.players.find(p => p.playerId === playerId);
        if (playerState) {
            // Simple array shuffle placeholder
            playerState.library.sort(() => Math.random() - 0.5);
        }
    }

    private drawOpeningHand(gameState: GameState, playerId: PlayerId, handSize: number = 7): void {
        console.log(`Placeholder: Drawing opening hand for player ${playerId}`);
        const playerState = gameState.players.find(p => p.playerId === playerId);
        if (playerState) {
            for (let i = 0; i < handSize && playerState.library.length > 0; i++) {
                const drawnCardId = playerState.library.shift(); // Removes from library
                if (drawnCardId) {
                    playerState.hand.push(drawnCardId);
                }
            }
        }
    }

    public initializeGame(gameState: GameState): void {
        console.log("Initializing game...");

        // 1. Initial Setup
        gameState.players.forEach(player => {
            this.shuffleDeck(gameState, player.playerId);
            this.drawOpeningHand(gameState, player.playerId); // Draw opening hands
        });

        // 2. Determine First Player
        const firstPlayerId = this.determineFirstPlayer(gameState);
        console.log(`Player ${firstPlayerId} goes first.`);

        // 3. Set Initial Turn State
        gameState.turnNumber = 1;
        gameState.activePlayerId = firstPlayerId;
        gameState.currentPhase = 'BEGIN'; // Start in Beginning Phase
        gameState.currentStep = 'UPKEEP'; // Skip Untap and Draw on T1
        // Directly set priority - TurnManager will handle grantPriority later
        gameState.priorityPlayerId = firstPlayerId;

        console.log(`Game ${gameState.gameId} initialized. Turn ${gameState.turnNumber}. Active player: ${gameState.activePlayerId}. Phase: ${gameState.currentPhase}, Step: ${gameState.currentStep}. Priority: ${gameState.priorityPlayerId}`);
    }
}
