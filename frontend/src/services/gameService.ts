// TODO: Define a type for the expected GameState response
// import { GameState } from '../interfaces/gameState'; // Assuming gameState interface will be defined

// const API_BASE_URL = '/api'; // Adjust if your API is hosted elsewhere

/**
 * Calls the backend API to start a new game.
 * @returns A Promise that resolves to the initial game state.
 */
export const startGame = async (): Promise<any> => { // Replace 'any' with GameState once defined
  try {
    // const response = await fetch(`${API_BASE_URL}/game/start`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   // body: JSON.stringify({ /* any initial parameters, e.g., playerConfig */ }),
    // });

    // if (!response.ok) {
    //   const errorData = await response.json().catch(() => ({ message: 'Failed to start game and parse error response' }));
    //   throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    // }
    // return await response.json();

    // Placeholder until backend API is ready:
    console.log('gameService.startGame called - PENDING BACKEND INTEGRATION');
    // Simulate a successful API call with mock data
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return {
      gameId: 'mockGame123',
      turnNumber: 1,
      activePlayerId: 'player1',
      priorityHolderId: 'player1',
      currentPhase: 'MAIN',
      player1_state: {
        id: 'player1',
        life: 20,
        energy: 1,
        hand: [
          { id: 'card001', name: 'Fireball', type: 'Spell', cost: 2 },
          { id: 'card002', name: 'Grizzly Bears', type: 'Creature', cost: 2 },
          { id: 'card003', name: 'Island', type: 'Land', cost: 0 },
        ],
        battlefield: [],
        deckCount: 50
      },
      player2_state: {
        id: 'player2',
        life: 20,
        energy: 0,
        hand: [{id: 'card3', name: 'Mock Card C'}],
        handCount: 5,
        battlefield: [],
        deckCount: 50
      },
      message: 'Mock game started successfully!'
    };

  } catch (error) {
    console.error('Error starting game:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// Mock service function to pass priority
export const passPriorityService = async (currentGameData: any): Promise<any> => {
  console.log('passPriorityService called with gameData:', currentGameData);
  return new Promise(resolve => {
    setTimeout(() => {
      // Simulate priority passing: if player1 has priority, pass to player2 (or engine)
      // This is a very simplified mock logic
      const nextPriorityHolder = currentGameData.priorityHolderId === 'player1' ? 'player2' : 'player1';
      const updatedGameData = {
        ...currentGameData,
        priorityHolderId: nextPriorityHolder,
        // Potentially update phase or turn if priority pass implies that
        // For now, just toggle priority for simplicity
      };
      console.log('Resolving passPriorityService promise with updated mock data:', updatedGameData);
      resolve(updatedGameData);
    }, 300); // Shorter delay for quicker actions
  });
};

// Future service functions (e.g., playCard) will go here
