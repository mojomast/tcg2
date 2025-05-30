// Debug process exit handler removed to prevent console spam
// process.on('exit', (code) => {
//   console.log(`[process]: Exiting with code: ${code}`);
//   console.log('TEST CHANGE');
// });

import express, { Express, Request, Response } from 'express';
import http from 'http'; 
import { Server, Socket } from 'socket.io'; 
import { GameEngine } from './game/gameEngine.js'; 
import { PlayerId, EventType, GameEvent } from './interfaces/gameState.js'; // Import PlayerId and EventType
import { Card, CardType } from './interfaces/card.js'; // Import Card for decklists
import { TEST_GAME_ID, TEST_PLAYER_1_ID, TEST_PLAYER_2_ID } from './config/constants.js'; // Import constants
import deckService from './services/deckService.js'; // Assuming DeckService is default export
import cardService from './services/cardService.js'; // Import CardService
import path from 'path'; // Import path module
import { fileURLToPath } from 'url'; // Added for __dirname
import { initializeDatabase, getAllDecks, DeckBasicInfo } from './db/database.js'; // Import database initializer, getAllDecks, DeckBasicInfo
import { DeckNotFoundError, DeckSelectionMissingError, DeckValidationError } from './errors/customErrors.js';

// --- Define __filename and __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- End Define __filename and __dirname ---

(async () => {
  try {
    console.log('[server]: Initializing database...');
    await initializeDatabase();
    console.log('[server]: Database initialized successfully.');

    // --- BEGIN: Add default cards and decks ---
    const plainsCardId = 'basic-plains-001';
    const plainsCard: Card = {
      id: plainsCardId,
      name: 'Plains',
      type: 'Land',
      rarity: 'Common',
      rulesText: 'T: Add {W}.',
      producesMana: { W: 1 },
      colorIdentity: ['W'],
      cost: {}, 
      setId: 'CORE',
      collectorNumber: '1',
      flavorText: undefined, 
      imageUrl: undefined,
      attack: undefined,
      health: undefined,
      keywords: undefined,
      spellSpeed: undefined,
      abilities: undefined,
      text: 'T: Add {W}.',
      subtype: undefined,
    };
    cardService.createCard(plainsCard);
    console.log(`[server]: Ensured '${plainsCard.name}' exists in the database.`);

    const islandCardId = 'basic-island-001';
    const islandCard: Card = {
      id: islandCardId,
      name: 'Island',
      type: 'Land',
      rarity: 'Common',
      rulesText: 'T: Add {U}.',
      producesMana: { U: 1 },
      colorIdentity: ['U'],
      cost: {},
      setId: 'CORE',
      collectorNumber: '3',
      text: 'T: Add {U}.',
      subtype: undefined,
    };
    cardService.createCard(islandCard);
    console.log(`[server]: Ensured '${islandCard.name}' exists in the database.`);

    const forestCardId = 'basic-forest-001';
    const forestCard: Card = {
      id: forestCardId,
      name: 'Forest',
      type: 'Land',
      rarity: 'Common',
      rulesText: 'T: Add {G}.',
      producesMana: { G: 1 },
      colorIdentity: ['G'],
      cost: {},
      setId: 'CORE',
      collectorNumber: '4',
      text: 'T: Add {G}.',
      subtype: undefined,
    };
    cardService.createCard(forestCard);
    console.log(`[server]: Ensured '${forestCard.name}' exists in the database.`);

    const genericCreatureId = 'generic-creature-001';
    const genericCreature: Card = {
      id: genericCreatureId,
      name: 'Generic Soldier',
      type: 'Creature',
      subtype: 'Soldier',
      cost: { C: 1, W: 1 },
      attack: 2,
      health: 2,
      rarity: 'Common',
      rulesText: 'A simple soldier.',
      colorIdentity: ['W'],
      setId: 'CORE',
      collectorNumber: '2',
      flavorText: undefined,
      imageUrl: undefined,
      keywords: undefined,
      spellSpeed: undefined,
      producesMana: undefined,
      abilities: undefined,
      text: 'A simple soldier.',
    };
    cardService.createCard(genericCreature);
    console.log(`[server]: Ensured '${genericCreature.name}' exists in the database.`);

    const grizzlyBearsId = 'grizzly-bears-001';
    const grizzlyBears: Card = {
      id: grizzlyBearsId,
      name: 'Grizzly Bears',
      type: 'Creature',
      subtype: 'Bear',
      cost: { C: 1, G: 1 },
      attack: 2,
      health: 2,
      rarity: 'Common',
      rulesText: '',
      colorIdentity: ['G'],
      setId: 'CORE',
      collectorNumber: '5',
      text: '',
    };
    cardService.createCard(grizzlyBears);
    console.log(`[server]: Ensured '${grizzlyBears.name}' exists in the database.`);

    const defaultDeckP1Cards = [
      { cardId: plainsCardId, quantity: 10 },
      { cardId: islandCardId, quantity: 8 },
      { cardId: genericCreatureId, quantity: 12 }, 
      { cardId: grizzlyBearsId, quantity: 10 }
    ]; // Total 40 cards
    await deckService.createDeck('defaultDeckP1', TEST_PLAYER_1_ID, 'Player 1 Default', defaultDeckP1Cards);
    console.log(`[server]: Ensured deck 'defaultDeckP1' exists for player ${TEST_PLAYER_1_ID}.`);

    const defaultDeckP2Cards = [
      { cardId: forestCardId, quantity: 10 },
      { cardId: plainsCardId, quantity: 8 },
      { cardId: grizzlyBearsId, quantity: 12 },
      { cardId: genericCreatureId, quantity: 10 }
    ]; // Total 40 cards
    await deckService.createDeck('defaultDeckP2', TEST_PLAYER_2_ID, 'Player 2 Default', defaultDeckP2Cards);
    console.log(`[server]: Ensured deck 'defaultDeckP2' exists for player ${TEST_PLAYER_2_ID}.`);
    // --- END: Add default cards and decks ---

// --- Placeholder --- 
// This would normally involve managing multiple game instances
// and associating sockets with players/games.
const activeGames: Map<string, GameEngine> = new Map();
const pendingDeckSelections: Map<string, { playerId: PlayerId, resolve: (deckId: string) => void, reject: (reason?: any) => void }> = new Map();

// Function to get player ID from socket
const getPlayerIdFromSocket = (socket: Socket): PlayerId | undefined => {
  return socket.data.playerId;
};
// Function to get GameEngine instance (needs implementation)
const getGameEngineForSocket = (socket: Socket): GameEngine | null => {
  const gameId = socket.data.gameId;
  return activeGames.get(gameId) || null;
};
// --- End Placeholder ---

// Function to prompt client for deck selection
async function promptForDeckSelection(
  socket: Socket | null, // Allow socket to be null for test scenarios
  playerId: PlayerId,
  problematicDeckId: string | null,
  availableDecks: DeckBasicInfo[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      console.warn(`[server] promptForDeckSelection called for player ${playerId} with a null socket. Cannot prompt. Rejecting.`);
      return reject(new Error('Cannot prompt for deck selection: no active socket.'));
    }
    const selectionKey = socket.id + ':' + playerId; // Unique key for this request
    pendingDeckSelections.set(selectionKey, { playerId, resolve, reject });

    console.log(`[server] Requesting deck selection for player ${playerId} (socket ${socket.id}). Problematic ID: ${problematicDeckId}`);
    socket.emit('request_deck_selection', {
      playerId,
      problematicDeckId,
      availableDecks,
      selectionKey // Send the key so client can include it in response
    });

    // Timeout for selection (e.g., 2 minutes)
    const timeoutId = setTimeout(() => {
      if (pendingDeckSelections.has(selectionKey)) {
        pendingDeckSelections.delete(selectionKey);
        console.log(`[server] Deck selection timed out for player ${playerId} (socket ${socket.id})`);
        reject(new Error('Deck selection timed out.'));
      }
    }, 120000); // 120 seconds

    // Clean up if socket disconnects
    socket.once('disconnect', () => {
      if (pendingDeckSelections.has(selectionKey)) {
        clearTimeout(timeoutId);
        pendingDeckSelections.delete(selectionKey);
        console.log(`[server] Client disconnected during deck selection for player ${playerId} (socket ${socket.id})`);
        reject(new Error('Client disconnected during deck selection.'));
      }
    });
  });
}

// Listener for when a client submits their deck selection
// This should be set up ONCE per socket connection, inside io.on('connection')
async function attemptToStartGame(
  gameId: string,
  playersInfo: Array<{ id: PlayerId, socket: Socket, initialDeckId?: string }>, 
  externalEventCallback: (eventType: EventType, eventData: any) => void
): Promise<GameEngine | null> {
  console.log(`[server] attemptToStartGame CALLED for gameId: ${gameId} with players: ${JSON.stringify(playersInfo.map(p=>p.id))}`);
  let playerDeckSelections: { [playerId: PlayerId]: string } = {};
  const playerIds = playersInfo.map(p => p.id) as [PlayerId, PlayerId]; // Assuming 2 players for now

  // Initialize deck selections
  for (const player of playersInfo) {
    if (player.initialDeckId) {
      playerDeckSelections[player.id] = player.initialDeckId;
    }
  }

  const MAX_RETRIES_PER_PLAYER = 3;
  let gameSuccessfullyCreated = false;
  let engine: GameEngine | null = null;

  for (let i = 0; i < MAX_RETRIES_PER_PLAYER * playerIds.length; i++) { // Overall retry limit
    try {
      console.log(`[server] Attempting to create GameEngine for game ${gameId} with decks: ${JSON.stringify(playerDeckSelections)}`);

      // Detailed logging before calling GameEngine.create
      const playerIdsForCreate: [PlayerId, PlayerId] = playersInfo.map(p => p.id) as [PlayerId, PlayerId]; // Re-ensure this is the value used
      console.log(`[DEBUG] server.ts: PRE-CALL GameEngine.create with playerIds: ${JSON.stringify(playerIdsForCreate)}, type: ${typeof playerIdsForCreate}`);
      console.log(`[DEBUG] server.ts: PRE-CALL GameEngine.create with playerDeckSelections: ${JSON.stringify(playerDeckSelections)}`);
      console.log(`[DEBUG] server.ts: PRE-CALL GameEngine.create with externalEventCallback type: ${typeof externalEventCallback}`);

      engine = await GameEngine.create(playerIdsForCreate, playerDeckSelections, externalEventCallback);
      activeGames.set(gameId, engine);
      console.log(`[server] GameEngine for ${gameId} created and stored successfully.`);
      gameSuccessfullyCreated = true;
      break; // Success
    } catch (error) {
      if ((error instanceof DeckNotFoundError || error instanceof DeckSelectionMissingError || error instanceof DeckValidationError) && error.playerId) {
        const erroredPlayerId = error.playerId;
        const erroredPlayerInfo = playersInfo.find(p => p.id === erroredPlayerId);
        if (!erroredPlayerInfo) {
          console.error(`[server] Critical: Error for player ${erroredPlayerId}, but player info not found.`);
          throw error; // Or handle differently
        }

        console.log(`[server] attemptToStartGame: Calling promptForDeckSelection for player ${erroredPlayerId}, game ${gameId}.`);
        console.log(`[server] Game creation failed for player ${erroredPlayerId} in game ${gameId}: ${(error as Error).message}.`);
        try {
          const availableDecks = getAllDecks(); // Fetch current list of all decks
          let problematicDeckId: string | null = null;
          
          if (error instanceof DeckNotFoundError) {
            problematicDeckId = error.deckId;
          } else if (error instanceof DeckValidationError) {
            // For validation errors, also identify the problematic deck
            problematicDeckId = error.deckId;
            console.error(`[server] Deck validation errors for ${error.deckId}:`);
            error.validationErrors.forEach((validationError, index) => {
              console.error(`  ${index + 1}. ${validationError}`);
            });
          }
          
          const newDeckId = await promptForDeckSelection(erroredPlayerInfo.socket, erroredPlayerId, problematicDeckId, availableDecks);
          playerDeckSelections[erroredPlayerId] = newDeckId;
          console.log(`[server] Player ${erroredPlayerId} selected new deck: ${newDeckId}. Retrying game creation.`);
          // Continue to next iteration of the loop to retry GameEngine.create
        } catch (promptError) {
          console.error(`[server] Error during deck selection prompt for player ${erroredPlayerId}:`, promptError);
          // Player failed to select a deck (e.g., disconnected, timed out)
          // Emit an event to the client(s) that game creation failed
          playersInfo.forEach(pInfo => {
            if (pInfo.socket) { // Check if socket exists
              pInfo.socket.emit('game_creation_failed', {
              gameId,
              playerId: erroredPlayerId,
              reason: (promptError as Error).message || 'Deck selection failed.'
            });
            } // End if (pInfo.socket)
          });
          console.error(`[server] Deck selection prompt failed for player ${erroredPlayerId}. Game creation cannot proceed for ${gameId}.`);
          console.error(`[server] Deck selection prompt failed for player ${erroredPlayerId}. Game creation cannot proceed for ${gameId}.`);
          console.log(`[server] attemptToStartGame RETURNING NULL for ${gameId} due to promptError.`);
          return null; // Stop game creation if prompting fails
        }
      } else {
        // Other unexpected error during GameEngine.create
        console.error(`[server] Unexpected error creating GameEngine for ${gameId}:`, error);
        // Emit an event to the client(s) that game creation failed
        playersInfo.forEach(pInfo => {
            if (pInfo.socket) { // Check if socket exists
              pInfo.socket.emit('game_creation_failed', {
              gameId,
              reason: (error as Error).message || 'Internal server error during game setup.'
            });
            } // End if (pInfo.socket)
          });
        console.error(`[server] GameEngine.create for ${gameId} failed with an unexpected error:`, error);
        console.log(`[server] attemptToStartGame RETURNING NULL for ${gameId} due to unexpected GameEngine.create error.`);
        return null; // Stop game creation
      }
    }
  }

  console.log(`[server] attemptToStartGame: Exited loop for ${gameId}. gameSuccessfullyCreated: ${gameSuccessfullyCreated}`);
  if (!gameSuccessfullyCreated) {
    console.error(`[server] Failed to create game ${gameId} after all retries. No engine was successfully created and stored.`);
    // Notify players if game creation ultimately fails after retries
     playersInfo.forEach(pInfo => {
        if (pInfo.socket) { // Check if socket exists
          pInfo.socket.emit('game_creation_failed', {
          gameId,
          reason: 'Failed to set up decks for the game after multiple attempts.'
        });
        } // End if (pInfo.socket)
      });
    console.log(`[server] attemptToStartGame RETURNING NULL for ${gameId} because gameSuccessfullyCreated is false.`);
    return null;
  }
  console.log(`[server] attemptToStartGame RETURNING VALID ENGINE for ${gameId}`);
  return engine;
}

// Listener for when a client submits their deck selection
// This should be set up ONCE per socket connection, inside io.on('connection')
function setupDeckSelectionListener(socket: Socket) {
  socket.on('submit_deck_selection', (data: { selectionKey: string, selectedDeckId: string }) => {
    const { selectionKey, selectedDeckId } = data;
    const pending = pendingDeckSelections.get(selectionKey);

    if (pending) {
      console.log(`[server] Received deck selection for player ${pending.playerId} (socket ${socket.id}): ${selectedDeckId}`);
      pending.resolve(selectedDeckId);
      pendingDeckSelections.delete(selectionKey);
    } else {
      console.warn(`[server] Received deck selection for unknown or timed-out key: ${selectionKey}`);
      // Optionally, inform client of the error
      socket.emit('deck_selection_error', { message: 'Invalid or expired selection attempt.' });
    }
  });
}

const app: Express = express();
const PORT = process.env.PORT || 3000; // Single port for HTTP and Socket.IO

app.use(express.json()); // Middleware to parse JSON bodies, added for potential POST/PUT later

// Serve static files from the 'dist_frontend' directory (Vite build output)
// __dirname will be 'dist' after compilation, so '..' goes to project root
app.use(express.static(path.join(__dirname, '..', 'dist_frontend')));

const httpServer = http.createServer(app);

// Call this inside io.on('connection', (socket) => { ... })
// setupDeckSelectionListener(socket);

const io = new Server(httpServer, {
  path: "/socket.io/", // Explicitly set the path
  // allowEIO3: true, // Removed as client is EIO=4 (Socket.IO v3/v4)
  cors: {
    origin: true, // Temporarily allow all origins for debugging
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  allowEIO3: true // Enable backwards compatibility
});

// Helper function to broadcast game state updates
const broadcastGameStateUpdate = (engine: GameEngine) => {
  if (engine && engine.gameState && engine.gameState.gameId) {
    const gameEvent: GameEvent = {
      type: EventType.GAME_STATE_UPDATE,
      payload: { gameState: engine.gameState }
    };
    io.to(engine.gameState.gameId).emit('game_event', gameEvent);
    console.log(`[socket]: Emitted game_event (GAME_STATE_UPDATE) to room ${engine.gameState.gameId}`);
  } else {
    console.error('[socket]: Cannot broadcast, GameEngine or gameId is invalid.');
  }
};

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'dist_frontend', 'index.html'));
});

// API endpoint to get cards from the database
app.get('/api/cards', (req: Request, res: Response): void => { 
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    if (page <= 0) {
      res.status(400).json({ message: 'Page number must be positive.' });
      return;
    }
    if (pageSize <= 0 || pageSize > 100) { 
      res.status(400).json({ message: 'Page size must be between 1 and 100.' });
      return;
    }

    const paginatedResult = cardService.getCards(page, pageSize);
    res.json({
      cards: paginatedResult.cards,
      pagination: {
        totalCards: paginatedResult.totalCards,
        page: paginatedResult.page,
        pageSize: paginatedResult.pageSize,
        totalPages: paginatedResult.totalPages,
      }
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ message: 'Failed to fetch cards from the database.' });
  }
});

    // API endpoint to get all decks from the database
    app.get('/api/decks', (req: Request, res: Response): void => {
      try {
        const decks: DeckBasicInfo[] = getAllDecks();
        res.json(decks); // Send the array of decks
      } catch (error) {
        console.error('Error fetching all decks:', error);
        res.status(500).json({ message: 'Failed to fetch decks from the database.' });
      }
    });

    // API endpoint to validate a deck
    app.post('/api/validate-deck', (req: Request, res: Response): void => {
      try {
        const { deckId } = req.body;
        
        if (!deckId || typeof deckId !== 'string') {
          res.status(400).json({ message: 'Deck ID is required and must be a string.' });
          return;
        }
        
        console.log(`[server]: Validating deck ${deckId}`);
        
        // Fetch the deck from the database
        deckService.fetchDeck(deckId)
          .then(deckList => {
            // Get card database for validation
            const cardArray = cardService.getAllCards();
            const cardDatabase = new Map(cardArray.map(card => [card.id, card]));
            
            // Validate the deck
            const validationResult = deckService.validateDeck(deckList, cardDatabase);
            
            console.log(`[server]: Deck ${deckId} validation result: ${validationResult.valid ? 'VALID' : 'INVALID'}`);
            
            res.json({
              deckId: deckId,
              deckName: deckList.name,
              valid: validationResult.valid,
              errors: validationResult.errors
            });
          })
          .catch(error => {
            console.error(`[server]: Error during deck validation for ${deckId}:`, error);
            
            if (error instanceof DeckNotFoundError) {
              res.status(404).json({ 
                message: `Deck with ID '${deckId}' not found.`,
                deckId: deckId,
                valid: false,
                errors: [`Deck '${deckId}' does not exist.`]
              });
            } else {
              res.status(500).json({ 
                message: 'Failed to validate deck due to internal error.',
                deckId: deckId,
                valid: false,
                errors: ['Internal server error during validation.']
              });
            }
          });
      } catch (error) {
        console.error('[server]: Error in validate-deck endpoint:', error);
        res.status(500).json({ message: 'Failed to validate deck.' });
      }
    });

    // --- REAL GAME ENGINE INITIALIZATION ---
    console.log('[server]: Initializing real GameEngine for gameplay.');
    
    // Placeholder for initializing the first test game
    // NOTE: This setup does not have real sockets for TEST_PLAYER_1_ID and TEST_PLAYER_2_ID.
    // True deck selection prompting requires real client sockets.
    // If 'defaultDeckP1' or 'defaultDeckP2' are invalid, game creation will likely fail here
    // as promptForDeckSelection would not have a socket to communicate with.
    (async () => {
      const testGameId = TEST_GAME_ID;
      const testPlayersInfo = [
        { id: TEST_PLAYER_1_ID, socket: null, initialDeckId: 'defaultDeckP1' }, // No real socket for test player
        { id: TEST_PLAYER_2_ID, socket: null, initialDeckId: 'defaultDeckP2' }  // No real socket for test player
      ];

      const gameExternalEventCallback = (eventType: EventType, eventData: any) => {
        const gameIdToBroadcast = testGameId; // Use the testGameId for this test game

        if (!gameIdToBroadcast) {
          // This should ideally not be reached if GameEngine always provides a valid gameId.
          console.error(`[socket]: Game event received from engine without gameId (this shouldn't happen). Cannot broadcast. EventType: ${eventType}, EventData:`, eventData);
          return;
        }

        // eventData is the payload of the game event.
        // The GameEngine calls this callback as: externalEventCallback(type, payload, gameId)
        // We then emit to the client: { type: eventType, payload: eventData }
        // The client-side game_event handler will receive this structure.
        console.log(`[server] Game Event Emitted by Engine (Game ID: ${gameIdToBroadcast}) via Callback:`, { type: eventType, payload: eventData });

        io.to(gameIdToBroadcast).emit('game_event', { type: eventType, payload: eventData });

        console.log(`[socket]: Emitted game_event (${eventType}) to room ${gameIdToBroadcast} (Game ID: ${gameIdToBroadcast})`);
      };

      console.log(`[server] Attempting to initialize placeholder test game: ${testGameId}`);
      // Cast to 'any' for socket to bypass type checking for this placeholder
      const engine = await attemptToStartGame(testGameId, testPlayersInfo as any, gameExternalEventCallback);
      if (engine) {
        console.log(`[server] Placeholder test game ${testGameId} initialized successfully.`);
        // The engine is already added to activeGames by attemptToStartGame
      } else {
        console.error(`[server] Failed to initialize placeholder test game ${testGameId}.`);
      }
    })();
    
    // --- END REAL GAME ENGINE INITIALIZATION ---

    // Custom httpServer.on('upgrade', ...) listener REMOVED to ensure Socket.IO has exclusive control.

    io.on('connection', (socket) => {
      setupDeckSelectionListener(socket); // Setup listener for deck selection submissions
      console.log(`[server.ts]: Client connected - ID: ${socket.id}`);
      socket.emit('test_event', { message: `Hello from server, client ${socket.id}` });
      console.log(`[server.ts]: Sent 'test_event' to ${socket.id}`);

      // Handle join_game events from the GameBoard
      socket.on('join_game', (data: { gameId: string, playerId: string }) => {
        console.log(`[server.ts]: Player ${data.playerId} joining game ${data.gameId}`);
        
        // Join the socket to the game room
        socket.join(data.gameId);
        socket.data.gameId = data.gameId;
        socket.data.playerId = data.playerId;
        
        // Send a simple game ready event for now
        // Get the real game state from the game engine instead of using mock data
        const gameEngine = activeGames.get(data.gameId);
        
        if (!gameEngine) {
          console.error(`[server.ts]: No game engine found for game ${data.gameId}`);
          return;
        }
        
        // Use the actual game state from the engine
        const realGameState = gameEngine.gameState;
        
        // Emit game ready event to ALL players in the game room
        io.to(data.gameId).emit('game_event', {
          type: EventType.GAME_READY,
          payload: { gameState: realGameState }
        });
        
        console.log(`[server.ts]: Broadcasted GAME_READY event to all players in room ${data.gameId}`);
        
        // Also emit a player joined event to notify other players
        socket.to(data.gameId).emit('game_event', {
          type: 'PLAYER_JOINED',
          payload: { 
            playerId: data.playerId,
            message: `${data.playerId} joined the game` 
          }
        });
        
        console.log(`[server.ts]: Notified other players that ${data.playerId} joined`);
      });

      socket.on('discard_card', (data: { playerId: string, cardInstanceId: string }) => {
        console.log(`[server.ts]: Received discard_card from ${data.playerId} for card ${data.cardInstanceId}`);
        const gameEngine = getGameEngineForSocket(socket);
        if (gameEngine && gameEngine.actionManager) {
            const success = gameEngine.actionManager.discardCard(data.playerId, data.cardInstanceId);
            if (success) {
                broadcastGameStateUpdate(gameEngine);
                console.log(`[server.ts]: Card discard successful, game state broadcasted.`);
            } else {
                console.error(`[server.ts]: Card discard failed for player ${data.playerId}.`);
                socket.emit('action_error', { message: 'Discard card action failed.' });
            }
        } else {
            console.error(`[server.ts]: Game engine or action manager not found for socket ${socket.id} during discard_card.`);
            socket.emit('action_error', { message: 'Game not found or not initialized.' });
        }
      });

      socket.on('play_card', (data: { playerId: string, cardInstanceId: string, targets?: string[] }) => {
        console.log(`[server.ts]: Received play_card from ${data.playerId} for card ${data.cardInstanceId}`);
        
        // Validate player ID matches socket
        if (data.playerId !== socket.data.playerId) {
          console.warn(`[server.ts]: Player ID mismatch for play_card. Socket: ${socket.data.playerId}, Data: ${data.playerId}`);
          socket.emit('action_error', { message: 'Player ID mismatch.' });
          return;
        }
        
        const gameEngine = getGameEngineForSocket(socket);
        if (gameEngine) {
          try {
            gameEngine.playCard(data.playerId, data.cardInstanceId, data.targets);
            // If no exception was thrown, the action was successful
            broadcastGameStateUpdate(gameEngine);
            console.log(`[server.ts]: Card play successful for ${data.cardInstanceId}, game state broadcasted.`);
          } catch (error) {
            console.error(`[server.ts]: Error during play_card for player ${data.playerId}:`, error);
            socket.emit('action_error', { message: 'Card play action failed due to internal error.' });
          }
        } else {
          console.error(`[server.ts]: Game engine not found for socket ${socket.id} during play_card.`);
          socket.emit('action_error', { message: 'Game not found or not initialized.' });
        }
      });

      socket.on('pass_turn', (data: { playerId: string }) => {
        console.log(`[server.ts]: Received pass_turn from ${data.playerId}`);
        const gameEngine = getGameEngineForSocket(socket);
        if (gameEngine && gameEngine.turnManager) {
            const success = gameEngine.turnManager.passTurn(data.playerId);
            if (success) {
                broadcastGameStateUpdate(gameEngine);
                console.log(`[server.ts]: Turn pass successful, game state broadcasted.`);
            } else {
                console.error(`[server.ts]: Pass turn failed for player ${data.playerId}.`);
                socket.emit('action_error', { message: 'Pass turn action failed.' });
            }
        } else {
            console.error(`[server.ts]: Game engine or turn manager not found for socket ${socket.id} during pass_turn.`);
            socket.emit('action_error', { message: 'Game not found or not initialized.' });
        }
      });

      // Combat Actions
      socket.on('declare_attackers', (data: { playerId: string, attackerInstanceIds: string[] }) => {
        console.log(`[server.ts]: Received declare_attackers from ${data.playerId} with attackers: ${data.attackerInstanceIds.join(', ')}`);
        
        // Validate player ID matches socket
        if (data.playerId !== socket.data.playerId) {
          console.warn(`[server.ts]: Player ID mismatch for declare_attackers. Socket: ${socket.data.playerId}, Data: ${data.playerId}`);
          socket.emit('action_error', { message: 'Player ID mismatch.' });
          return;
        }
        
        const gameEngine = getGameEngineForSocket(socket);
        if (gameEngine && gameEngine.combatManager) {
          try {
            // Convert array to attackers map (attacker -> target player)
            const attackers: { [attackerId: string]: string } = {};
            const opponentId = gameEngine.getOpponentId(data.playerId);
            
            data.attackerInstanceIds.forEach(attackerId => {
              attackers[attackerId] = opponentId;
            });
            
            gameEngine.combatManager.declareAttackers(data.playerId, attackers);
            // If no exception was thrown, the action was successful
            broadcastGameStateUpdate(gameEngine);
            console.log(`[server.ts]: Declare attackers successful, game state broadcasted.`);
          } catch (error) {
            console.error(`[server.ts]: Error during declare_attackers for player ${data.playerId}:`, error);
            socket.emit('action_error', { message: 'Declare attackers action failed due to internal error.' });
          }
        } else {
          console.error(`[server.ts]: Game engine or combat manager not found for socket ${socket.id} during declare_attackers.`);
          socket.emit('action_error', { message: 'Game not found or combat system not initialized.' });
        }
      });

      socket.on('declare_blockers', (data: { playerId: string, blockerAssignments: { [blockerId: string]: string } }) => {
        console.log(`[server.ts]: Received declare_blockers from ${data.playerId} with blockers:`, data.blockerAssignments);
        
        // Validate player ID matches socket
        if (data.playerId !== socket.data.playerId) {
          console.warn(`[server.ts]: Player ID mismatch for declare_blockers. Socket: ${socket.data.playerId}, Data: ${data.playerId}`);
          socket.emit('action_error', { message: 'Player ID mismatch.' });
          return;
        }
        
        const gameEngine = getGameEngineForSocket(socket);
        if (gameEngine && gameEngine.combatManager) {
          try {
            gameEngine.combatManager.declareBlockers(data.playerId, data.blockerAssignments);
            // If no exception was thrown, the action was successful
            broadcastGameStateUpdate(gameEngine);
            console.log(`[server.ts]: Declare blockers successful, game state broadcasted.`);
          } catch (error) {
            console.error(`[server.ts]: Error during declare_blockers for player ${data.playerId}:`, error);
            socket.emit('action_error', { message: 'Declare blockers action failed due to internal error.' });
          }
        } else {
          console.error(`[server.ts]: Game engine or combat manager not found for socket ${socket.id} during declare_blockers.`);
          socket.emit('action_error', { message: 'Game not found or combat system not initialized.' });
        }
      });

      socket.on('play_resource', (data: { playerId: string, cardInstanceId: string }) => {
        console.log(`[server.ts]: Received play_resource from ${data.playerId} for card ${data.cardInstanceId}`);
        
        // Validate player ID matches socket
        if (data.playerId !== socket.data.playerId) {
          console.warn(`[server.ts]: Player ID mismatch for play_resource. Socket: ${socket.data.playerId}, Data: ${data.playerId}`);
          socket.emit('action_error', { message: 'Player ID mismatch.' });
          return;
        }
        
        const gameEngine = getGameEngineForSocket(socket);
        if (gameEngine) {
          try {
            // Resource cards are handled by the same playCard method in ActionManager
            // The ActionManager will detect if it's a resource and handle it accordingly
            gameEngine.playCard(data.playerId, data.cardInstanceId);
            // If no exception was thrown, the action was successful
            broadcastGameStateUpdate(gameEngine);
            console.log(`[server.ts]: Play resource successful for ${data.cardInstanceId}, game state broadcasted.`);
          } catch (error) {
            console.error(`[server.ts]: Error during play_resource for player ${data.playerId}:`, error);
            socket.emit('action_error', { message: 'Play resource action failed due to internal error.' });
          }
        } else {
          console.error(`[server.ts]: Game engine not found for socket ${socket.id} during play_resource.`);
          socket.emit('action_error', { message: 'Game not found or not initialized.' });
        }
      });

      socket.on('disconnect', (reason) => {
        console.log(`[server.ts]: Client disconnected: ${socket.id}, reason: ${reason}`);
      });

      // Optional: Listen for a test event from the client to confirm two-way communication
      socket.on('client_test_event', (data) => {
        console.log(`[server.ts]: Received 'client_test_event' from ${socket.id}:`, data);
      });
    }); // Closes io.on('connection', (socket) => { ... });

    console.log('[server]: About to call httpServer.listen().');
    httpServer.listen(PORT, () => {
      console.log(`[server]: HTTP and Socket.IO server running at http://localhost:${PORT}`);
      console.log('[server]: httpServer.listen() callback executed.');
    });

    console.log('[server]: Script execution reached end of IIFE main try block (after httpServer.listen call).');

  } catch (error: any) { // Main IIFE catch
    console.error('[server]: Critical error during server startup:', error);
    process.exit(1); // Exit if critical initialization fails
  }
})();

console.log('[server]: Script execution reached very end of file (after IIFE).');

// Keep the process alive by preventing immediate exit
// This ensures the server continues running after the IIFE completes
process.stdin.resume(); // Keeps the process alive
