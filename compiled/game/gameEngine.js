import { EventType } from '../interfaces/gameState.js';
import { ResourceManager } from './resourceManager.js';
import { TurnManager } from './turnManager.js';
import { CombatManager } from './combatManager.js';
import { ActionManager } from './actionManager.js';
import { StateManager } from './stateManager.js';
import { v4 as uuidv4 } from 'uuid';
import DeckService from '../services/deckService.js';
import cardService from '../services/cardService.js'; // Import default instance of CardService
import { DeckNotFoundError, DeckSelectionMissingError, DeckValidationError } from '../errors/customErrors.js';
// Utility function for shuffling an array (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}
// Temporary mock card definitions - replace with actual card data loading
// const mockCardDefinitions: Card[] = [...]; // REMOVED
export class GameEngine {
    generateGameObjectId(prefix = 'go') {
        return `${prefix}_${uuidv4()}`;
    }
    emitGameEvent(eventType, eventData) {
        console.log(`Game Event: ${eventType}`, eventData);
        console.log(`[DEBUG] GameEngine.emitGameEvent: typeof this.externalEventCallback is ${typeof this.externalEventCallback}`);
        if (typeof this.externalEventCallback === 'function') {
            this.externalEventCallback(eventType, eventData);
        }
    }
    getBaseCardData(cardId) {
        return this.cardDatabase.get(cardId);
    }
    constructor(playerIds, playerDeckSelections, eventCallback // Added optional callback
    ) {
        // This constructor is now effectively synchronous again after pre-fetching decks in a static async method.
        // To make the GameEngine instantiation itself async, you'd typically use a static async factory method.
        // For now, we'll assume decks are pre-fetched and passed in, or handle async logic carefully.
        // The actual fetching will be done in an async method called by the constructor or a factory. 
        // For simplicity in this step, we'll call an async setup method from the constructor.
        // This is often not ideal for constructors. A static async factory method is preferred.
        this.cardDatabase = new Map();
        // Initialize basic properties first
        console.log('[DEBUG] GameEngine Constructor Start');
        console.log(`[DEBUG] GameEngine Constructor: Received eventCallback of type: ${typeof eventCallback}`);
        this.externalEventCallback = eventCallback; // Store the callback
        this.initializeCardDatabase(); // Populate cardDatabase
        // The GameState and other managers will be initialized after decks are loaded.
        // Placeholder for GameState until players are initialized
        this.gameState = {};
        this.stateManager = {}; // Will be properly initialized in async setup
        // _asyncInitialize will be called by the static create method.
        console.log('[DEBUG] GameEngine Constructor End: Synchronous part completed.');
    }
    // Private async method to handle asynchronous parts of initialization
    async _asyncInitialize(playerIds, playerDeckSelections) {
        console.log('[DEBUG] GameEngine Constructor Start');
        // Populate cardDatabase with actual card data from CardService
        this.initializeCardDatabase();
        // This constructor will become async due to deck fetching
        // For now, let's assume decks are fetched and processed to fit the old structure
        // This is a placeholder for the async fetching logic
        // TODO: Make this part async and use DeckService properly
        const decklists = {};
        try {
            console.log('[DEBUG] GameEngine: Starting to fetch decks for players.');
            console.log(`[DEBUG] GameEngine._asyncInitialize: playerIds array before loop: ${JSON.stringify(playerIds)}`);
            for (const playerId of playerIds) {
                console.log(`[DEBUG] GameEngine._asyncInitialize: Current playerId in loop: ${playerId}, type: ${typeof playerId}`);
                const deckId = playerDeckSelections[playerId];
                if (!deckId) {
                    console.error(`[GameEngine] No deck ID selected for player ${playerId}.`);
                    // Throw DeckSelectionMissingError, which should be caught by server.ts to initiate selection process
                    throw new DeckSelectionMissingError(`No deck selected for player ${playerId}.`, playerId);
                }
                console.log(`[DEBUG] GameEngine: Fetching deck ${deckId} for player ${playerId}.`);
                // First, validate the deck before processing
                const deckList = await DeckService.fetchDeck(deckId);
                const validationResult = DeckService.validateDeck(deckList, this.cardDatabase);
                if (!validationResult.valid) {
                    console.error(`[GameEngine] Deck validation failed for player ${playerId}, deck ${deckId}:`);
                    validationResult.errors.forEach((error, index) => {
                        console.error(`  ${index + 1}. ${error}`);
                    });
                    throw new DeckValidationError(`Deck '${deckList.name}' failed validation: ${validationResult.errors.join('; ')}`, deckId, validationResult.errors, playerId);
                }
                console.log(`[DEBUG] GameEngine: Deck validation passed for ${deckId}. Proceeding with card loading.`);
                // Use the getPlayerDeckCards method from the imported DeckService
                // This method already handles creating card instances from the cardDatabase
                let playerDeckCards;
                try {
                    playerDeckCards = await DeckService.getPlayerDeckCards(deckId, this.cardDatabase);
                }
                catch (error) {
                    if (error instanceof DeckNotFoundError) {
                        // Re-throw DeckNotFoundError with playerId for context
                        console.error(`[GameEngine] DeckNotFoundError for player ${playerId}, deckId ${deckId}: ${error.message}`);
                        throw new DeckNotFoundError(error.message, error.deckId, playerId);
                    }
                    // For other errors from DeckService.getPlayerDeckCards
                    console.error(`[GameEngine] Error fetching deck ${deckId} for player ${playerId}:`, error);
                    throw error; // Propagate other errors
                }
                decklists[playerId] = playerDeckCards.map(card => ({
                    ...card,
                    instanceId: this.generateGameObjectId(card.id)
                }));
                console.log(`[DEBUG] GameEngine: Deck for player ${playerId} (${deckId}) loaded with ${decklists[playerId].length} cards.`);
            }
        }
        catch (error) {
            console.error('[GameEngine] Critical error during deck fetching:', error);
            // Handle the error appropriately - perhaps by not starting the game or emitting an error event
            // For now, re-throw to indicate failure in initialization
            // Specific errors (DeckNotFoundError, DeckSelectionMissingError) should be thrown directly by the loop above.
            // This catch block will now handle other unexpected errors during the deck fetching loop or subsequent setup.
            this.emitGameEvent(EventType.ERROR, { message: 'Failed to initialize game.', details: error.message });
            throw new Error(`Failed to initialize game: ${error.message}`);
        }
        console.log('[DEBUG] GameEngine: Decks fetched, proceeding to initialize players.');
        this.gameState = {
            gameId: uuidv4(),
            turnNumber: 0,
            startingPlayerId: playerIds[0],
            activePlayerId: playerIds[0],
            priorityPlayerId: playerIds[0],
            currentPhase: 'BEGIN',
            currentStep: 'UNTAP',
            players: null,
            stack: [],
            gameLog: [],
            consecutivePriorityPasses: 0,
            gameObjects: {},
            attackers: {},
            blockers: {},
            gameEnded: false,
        };
        // --- Instantiate Managers --- 
        // Order matters based on dependencies!
        console.log('[DEBUG] Instantiating StateManager...');
        // StateManager Dependencies (no longer a separate const)
        // Instantiate StateManager FIRST
        this.stateManager = new StateManager(this, this.gameState, this.getCardFromInstanceId.bind(this));
        console.log('[DEBUG] Initializing Player States...');
        const initialPlayerStates = this.initializePlayers(playerIds, decklists);
        if (initialPlayerStates.length !== 2) {
            throw new Error("GameEngine requires exactly two players.");
        }
        this.gameState.players = initialPlayerStates;
        // Draw starting hands for each player using DeckService wrapper
        const STARTING_HAND_SIZE = 7; // Or get from game rules/config
        console.log(`[DEBUG] GameEngine: Drawing starting hands of size ${STARTING_HAND_SIZE} for each player.`);
        for (const player of this.gameState.players) {
            let handDrawn = 0;
            // Draw initial hand
            for (let i = 0; i < STARTING_HAND_SIZE; i++) {
                if (DeckService.drawCard(this.gameState, player.playerId)) {
                    handDrawn++;
                }
                else {
                    console.warn(`[GameEngine] Player ${player.playerId} has insufficient cards in library to draw full starting hand of ${STARTING_HAND_SIZE}. Drawn ${handDrawn} cards.`);
                    break; // Stop drawing for this player if library is empty
                }
            }
            // Basic mulligan support - if hand size is less than expected, redraw once
            if (handDrawn < STARTING_HAND_SIZE && player.library.length >= STARTING_HAND_SIZE) {
                console.log(`[DEBUG] GameEngine: Player ${player.playerId} eligible for mulligan (drew ${handDrawn}/${STARTING_HAND_SIZE}). Attempting redraw.`);
                // Return current hand to library
                while (player.hand.length > 0) {
                    const cardInstanceId = player.hand.pop();
                    if (cardInstanceId) {
                        player.library.push(cardInstanceId);
                        // Update card zone
                        const cardObject = this.gameState.gameObjects[cardInstanceId];
                        if (cardObject) {
                            cardObject.currentZone = 'library';
                        }
                    }
                }
                // Reshuffle library
                shuffleArray(player.library);
                console.log(`[DEBUG] GameEngine: Reshuffled library for player ${player.playerId} mulligan. First 3 cards: [${player.library.slice(0, 3).join(', ')}]`);
                // Draw new hand
                handDrawn = 0;
                for (let i = 0; i < STARTING_HAND_SIZE; i++) {
                    if (DeckService.drawCard(this.gameState, player.playerId)) {
                        handDrawn++;
                    }
                    else {
                        break;
                    }
                }
            }
            console.log(`[DEBUG] GameEngine: Player ${player.playerId} finished drawing starting hand. Hand size: ${player.hand.length}, Library size: ${player.library.length}, Deck count: ${player.deck_count}`);
        }
        console.log('[DEBUG] Instantiating CombatManager...');
        // Instantiate CombatManager AFTER StateManager, passing null for turnManager
        this.combatManager = new CombatManager(this.gameState, null, // TurnManager not yet created
        this.stateManager, // Pass the created StateManager
        this.validateCombatAction.bind(this), this.getCardFromInstanceId.bind(this), this.findBattlefieldCard.bind(this), this.hasKeyword.bind(this));
        console.log('[DEBUG] Instantiating ResourceManager...');
        // Create the dependency object for ResourceManager
        const resourceDeps = {
            getPlayerStateFn: this.getPlayerState.bind(this),
            findBattlefieldCardFn: this.findBattlefieldCard.bind(this),
            getBaseCardDataFn: this.getBaseCardData.bind(this),
            emitGameEventFn: this.emitGameEvent.bind(this),
            findCardInZoneFn: this.findCardInZone.bind(this),
            validatePlayerActionFn: this.validateResourceAction.bind(this),
            moveCardZoneFn: this.moveCardZone.bind(this)
        };
        this.resourceManager = new ResourceManager(this.gameState, resourceDeps);
        console.log('[DEBUG] Instantiating TurnManager...');
        this.turnManager = new TurnManager(this.gameState, this, this.resourceManager, this.stateManager);
        this.combatManager.setTurnManager(this.turnManager); // Now set TurnManager in CombatManager
        console.log('[DEBUG] Instantiating ActionManager...');
        this.actionManager = new ActionManager(this.gameState, this, this.turnManager);
        console.log('[DEBUG] GameEngine _asyncInitialize complete.');
        this.emitGameEvent(EventType.GAME_READY, { gameState: this.gameState }); // Notify that the engine is ready
    }
    // Public method to check if the engine is fully initialized
    // This can be used by the server to wait until _asyncInitialize is done
    isReady() {
        // A simple check; might need to be more robust based on your state management
        return this.gameState && this.gameState.players && this.gameState.players.length > 0 && !!this.turnManager;
    }
    // Static async factory method for creating GameEngine instances
    static async create(playerIds, playerDeckSelections, eventCallback) {
        console.log(`[DEBUG] GameEngine.create: Received playerIds: ${JSON.stringify(playerIds)}, type: ${typeof playerIds}`);
        console.log(`[DEBUG] GameEngine.create: Received playerDeckSelections: ${JSON.stringify(playerDeckSelections)}`);
        const engine = new GameEngine(playerIds, playerDeckSelections, eventCallback);
        await engine._asyncInitialize(playerIds, playerDeckSelections); // Ensure async setup is complete
        if (!engine.isReady()) {
            throw new Error("GameEngine failed to initialize completely.");
        }
        console.log('[DEBUG] GameEngine instance created and initialized via static factory.');
        return engine;
    }
    // ... (rest of the GameEngine class)
    initializeCardDatabase() {
        // Load cards from CardService
        const allCards = cardService.getAllCards();
        allCards.forEach((card) => {
            this.cardDatabase.set(card.id, card); // Use .set() for Map
        });
        if (this.cardDatabase.size === 0) { // Check size for Map
            console.warn('Card database is empty after initialization from CardService!');
            // Potentially throw an error or handle this case as critical
        }
    }
    initializePlayers(playerIds, decklists) {
        console.log('[DEBUG] Initializing players...');
        const states = [];
        for (const playerId of playerIds) {
            const playerDecklist = decklists[playerId] || [];
            const libraryInstanceIds = [];
            for (const baseCard of playerDecklist) {
                const instanceId = uuidv4();
                const battlefieldCard = {
                    // Properties from base Card definition
                    id: baseCard.id,
                    name: baseCard.name,
                    type: baseCard.type,
                    subtype: baseCard.subtype,
                    cost: baseCard.cost,
                    text: baseCard.text,
                    rulesText: baseCard.rulesText,
                    rarity: baseCard.rarity,
                    setId: baseCard.setId,
                    collectorNumber: baseCard.collectorNumber,
                    keywords: [...(baseCard.keywords || [])],
                    attack: baseCard.attack, // Use attack from Card interface
                    health: baseCard.health, // Use health from Card interface
                    // BattlefieldCard specific properties
                    instanceId,
                    cardId: baseCard.id,
                    ownerId: playerId,
                    controllerId: playerId,
                    currentZone: 'library',
                    tapped: false,
                    summoningSickness: false,
                    damageMarked: 0,
                    counters: {},
                    attachments: [],
                };
                this.gameState.gameObjects[instanceId] = battlefieldCard;
                libraryInstanceIds.push(instanceId);
            }
            // Shuffle the library before assigning it to the player state
            shuffleArray(libraryInstanceIds);
            console.log(`[DEBUG] Shuffled library for player ${playerId}. First 3 cards: [${libraryInstanceIds.slice(0, 3).join(', ')}]`);
            // Basic player state structure
            const playerState = {
                playerId: playerId,
                life: 20,
                energy: 0,
                poisonCounters: 0,
                manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
                landPlayedThisTurn: false,
                hand: [],
                library: libraryInstanceIds,
                deck_count: libraryInstanceIds.length,
                graveyard: [],
                exile: [],
                battlefield: {
                    creatures: [],
                    resources: [],
                    enchantments: [],
                    artifacts: [],
                    planeswalkers: [],
                    other: [],
                },
                hasPlayedResourceThisTurn: false,
                maxHandSize: 7,
                hasLost: false,
            };
            states.push(playerState);
        }
        console.log('[DEBUG] Players initialized. GameObjects count:', Object.keys(this.gameState.gameObjects).length);
        return states;
    }
    getPlayerState(playerId) {
        return this.gameState.players.find(p => p.playerId === playerId);
    }
    findBattlefieldCard(instanceId) {
        const card = this.gameState.gameObjects[instanceId];
        if (card && card.currentZone === 'battlefield') {
            return card;
        }
        return undefined;
    }
    getCardFromInstanceId(instanceId) {
        const gameObject = this.gameState.gameObjects[instanceId];
        if (gameObject) {
            return this.getBaseCardData(gameObject.cardId);
        }
        const stackItem = this.gameState.stack.find((item) => item.sourceInstanceId === instanceId);
        if (stackItem)
            return this.getBaseCardData(stackItem.sourceCardId);
        return undefined;
    }
    hasKeyword(instanceId, keyword) {
        const card = this.getCardFromInstanceId(instanceId);
        const instance = this.gameState.gameObjects[instanceId];
        return card?.keywords?.includes(keyword) ?? false;
    }
    findCardInZone(playerId, zone, cardObjectId) {
        console.log(`[DEBUG] findCardInZone called for Player ${playerId}, Zone ${zone}, ObjectId ${cardObjectId}`);
        const playerState = this.getPlayerState(playerId);
        if (!playerState) {
            console.error(`[GameEngine] findCardInZone Error: Player ${playerId} not found.`);
            return undefined;
        }
        // Handle battlefield separately as it uses BattlefieldCard objects directly
        if (zone === 'battlefield') {
            // Search creatures, resources, etc.
            const foundOnBattlefield = [
                ...playerState.battlefield.creatures,
                ...playerState.battlefield.resources,
                ...playerState.battlefield.enchantments,
                ...playerState.battlefield.artifacts,
                ...playerState.battlefield.planeswalkers,
                ...playerState.battlefield.other,
            ].find(card => card.instanceId === cardObjectId);
            if (foundOnBattlefield) {
                console.log(`[DEBUG] Found card on battlefield:`, foundOnBattlefield);
                return foundOnBattlefield; // Return the BattlefieldCard object
            }
            else {
                console.log(`[DEBUG] Card instance ${cardObjectId} not found on player ${playerId}'s battlefield.`);
                return undefined;
            }
        }
        // Handle zones that store GameObjectId strings
        let targetZoneArray;
        switch (zone) {
            case 'hand':
                targetZoneArray = playerState.hand;
                break;
            case 'graveyard':
                targetZoneArray = playerState.graveyard;
                break;
            case 'library':
                targetZoneArray = playerState.library;
                break;
            case 'exile':
                targetZoneArray = playerState.exile;
                break;
            // 'stack' might need special handling if it stores more complex objects
            // case 'stack': ...
            default:
                // Check if zone is a valid key but not a card zone array (like 'playerId', 'life', etc.)
                if (zone in playerState) {
                    console.warn(`[GameEngine] findCardInZone: Zone '${zone}' is not a searchable card zone array.`);
                }
                else {
                    console.error(`[GameEngine] findCardInZone Error: Unsupported or invalid zone key: ${zone}`);
                }
                return undefined;
        }
        if (!targetZoneArray)
            return undefined;
        const foundItemId = targetZoneArray.find(itemId => itemId === cardObjectId);
        if (foundItemId) {
            console.log(`[DEBUG] Found item ID ${foundItemId} in zone ${zone}. Returning GameObject.`);
            return this.gameState.gameObjects[foundItemId]; // Return the GameObject
        }
        console.log(`[DEBUG] Item ID ${cardObjectId} not found in zone ${zone}.`);
        return undefined;
    }
    validateCombatAction(playerId, requiredStep, requiredPhase) {
        const playerHasPriority = this.gameState.priorityPlayerId === playerId;
        const isCorrectPhase = requiredPhase === null || this.gameState.currentPhase === requiredPhase;
        const isCorrectStep = requiredStep === null || this.gameState.currentStep === requiredStep;
        if (!playerHasPriority) {
            console.warn(`[Validation] Player ${playerId} does not have priority.`);
            return false;
        }
        if (!isCorrectPhase) {
            console.warn(`[Validation] Action not allowed in phase ${this.gameState.currentPhase} (required: ${requiredPhase}).`);
            return false;
        }
        if (!isCorrectStep) {
            console.warn(`[Validation] Action not allowed in step ${this.gameState.currentStep} (required: ${requiredStep}).`);
            return false;
        }
        console.log(`[Validation] Combat action validated for Player ${playerId} in ${this.gameState.currentPhase}/${this.gameState.currentStep}.`);
        return true; // Placeholder
    }
    validateResourceAction(playerId, actionType, details) {
        const playerHasPriority = this.gameState.priorityPlayerId === playerId;
        if (!playerHasPriority) {
            console.warn(`[Validation] Player ${playerId} does not have priority for resource action ${actionType}.`);
            return false;
        }
        // Add specific validation based on actionType if needed
        console.log(`[Validation] Resource action '${actionType}' validated for Player ${playerId}. Details:`, details);
        return true; // Placeholder
    }
    moveCardZone(instanceId, fromZone, toZone, targetPlayerId) {
        console.log(`[GameEngine] moveCardZone called for ${instanceId} from ${fromZone} to ${toZone} for player ${targetPlayerId}`);
        // Call the correct StateManager method which handles the logic and returns boolean
        const success = this.stateManager.moveCardToZone(targetPlayerId, instanceId, fromZone, toZone);
        if (!success) {
            console.error(`[GameEngine] moveCardZone Error: StateManager failed to move card ${instanceId} for player ${targetPlayerId} from ${fromZone} to ${toZone}`);
        }
        else {
            console.log(`[GameEngine] moveCardZone successful for ${instanceId}.`);
        }
        return success;
    }
    passPriority(playerId) {
        console.warn('[GameEngine] passPriority called - Placeholder implementation');
    }
    playCard(playerId, cardId, targets) {
        console.log(`[GameEngine] playCard called for player ${playerId}, card ${cardId}`);
        // Check if game has ended
        if (this.gameState.gameEnded) {
            console.warn(`[GameEngine] playCard rejected: Game has already ended.`);
            return false;
        }
        try {
            // The ActionManager.playCard method will handle validation, cost payment, and putting the card on the stack.
            // It also handles emitting events for invalid actions or throws errors for critical failures.
            this.actionManager.playCard(playerId, cardId, targets);
            // If playCard did not throw, it means the action was successfully initiated (card on stack or resource played).
            // ActionManager.playCard should handle priority internally or via TurnManager after adding to stack.
            console.log(`[GameEngine] playCard: ActionManager successfully initiated play for card ${cardId} by player ${playerId}`);
            return true;
        }
        catch (error) {
            // Log the error but don't crash the game
            console.warn(`[GameEngine] playCard failed for player ${playerId}, card ${cardId}:`, error);
            // Check if it's a validation error (should return false) vs critical error (should propagate)
            if (error instanceof Error && (error.message.includes('validation') ||
                error.message.includes('insufficient') ||
                error.message.includes('priority') ||
                error.message.includes('phase') ||
                error.message.includes('not found'))) {
                // These are expected validation failures, return false
                return false;
            }
            else {
                // Unexpected critical error, propagate it
                throw error;
            }
        }
    }
    /**
     * Handles a player drawing a card.
     * Moves a card from the top of the player's library to their hand.
     * Emits relevant events.
     * @param playerId The ID of the player drawing a card.
     */
    playerDrawCard(playerId) {
        const playerState = this.getPlayerState(playerId);
        if (!playerState) {
            console.error(`GameEngine Error: Player ${playerId} not found during draw action.`);
            return;
        }
        if (playerState.library.length === 0) {
            console.warn(`GameEngine: Player ${playerId} attempts to draw from an empty library.`);
            // Set loss condition immediately - this is a game loss
            playerState.hasLost = true;
            console.log(`GameEngine: Player ${playerId} loses due to deck depletion (attempted draw from empty library).`);
            this.emitGameEvent(EventType.PLAYER_ATTEMPTED_DRAW_FROM_EMPTY_LIBRARY, { playerId });
            // Check if this ends the game
            this.checkGameEnd('deck_depletion', playerId);
            return;
        }
        const cardToDrawInstanceId = playerState.library.shift(); // Removes from the top (beginning of array)
        if (cardToDrawInstanceId) {
            playerState.hand.push(cardToDrawInstanceId);
            console.log(`GameEngine: Player ${playerId} drew card ${cardToDrawInstanceId}. Hand size: ${playerState.hand.length}`);
            // Update the card's zone - this assumes card instances store their zone, which might not be the case.
            // If not, this part might be conceptual or handled differently.
            const cardObject = this.gameState.gameObjects[cardToDrawInstanceId];
            if (cardObject) {
                cardObject.currentZone = 'hand';
            }
            this.emitGameEvent(EventType.CARD_DRAWN, {
                playerId,
                cardId: cardToDrawInstanceId, // This is the instance ID
                // baseCardId: cardObject?.baseId, // If you want to include base card ID
            });
        }
        else {
            // This case should ideally not be reached if library.length check passed, but as a safeguard:
            console.error(`GameEngine Error: Library was not empty but failed to shift a card for player ${playerId}.`);
        }
    }
    /**
     * Gets the ID of the opponent for a given player ID.
     * Assumes a two-player game.
     * @param playerId The ID of the player whose opponent is needed.
     * @returns The opponent's PlayerId, or throws an error if not found.
     */
    getOpponentId(playerId) {
        const opponent = this.gameState.players.find(p => p.playerId !== playerId);
        if (!opponent) {
            console.error(`Could not find opponent for player ${playerId}. Players:`, this.gameState.players);
            throw new Error(`Could not find opponent for player ${playerId}.`);
        }
        return opponent.playerId;
    }
    /**
     * Checks if the game should end and handles game end logic.
     * This can be called from various places like deck depletion, SBAs, etc.
     * @param reason The reason for the potential game end
     * @param triggeringPlayerId Optional player who triggered the check
     */
    checkGameEnd(reason, triggeringPlayerId) {
        if (this.gameState.gameEnded) {
            return; // Game already ended
        }
        const activePlayers = this.gameState.players.filter(p => !p.hasLost);
        if (activePlayers.length === 1) {
            // Single winner
            this.endGame(reason, activePlayers[0].playerId, triggeringPlayerId);
        }
        else if (activePlayers.length === 0) {
            // Draw - both players lost simultaneously
            this.endGame('simultaneous_loss', null, triggeringPlayerId);
        }
        // If activePlayers.length > 1, game continues
    }
    /**
     * Ends the game with proper state management and event emission.
     * @param reason The reason for game end (e.g., 'life_depletion', 'deck_depletion')
     * @param winnerId The winning player ID, or null for a draw
     * @param loserId The losing player ID, or null if not applicable
     */
    endGame(reason, winnerId, loserId) {
        console.log(`[GameEngine] Game ending - Reason: ${reason}, Winner: ${winnerId || 'DRAW'}, Loser: ${loserId || 'N/A'}`);
        // Set game end state
        this.gameState.gameEnded = true;
        this.gameState.endReason = reason;
        this.gameState.endTime = new Date();
        if (winnerId) {
            this.gameState.winner = winnerId;
        }
        if (loserId) {
            this.gameState.loser = loserId;
        }
        // Log game statistics
        const gameDuration = this.gameState.endTime.getTime() - (this.gameState.endTime.getTime() - (this.gameState.turnNumber * 30000)); // Rough estimate
        console.log(`[GameEngine] Game ended after ${this.gameState.turnNumber} turns. Duration: ~${Math.round(gameDuration / 1000 / 60)} minutes.`);
        // Emit game over event
        this.emitGameEvent(EventType.GAME_OVER, {
            gameId: this.gameState.gameId,
            winner: winnerId,
            loser: loserId,
            reason: reason,
            turnNumber: this.gameState.turnNumber,
            endTime: this.gameState.endTime,
            gameState: this.gameState // Include full final state
        });
        console.log(`[GameEngine] GAME_OVER event emitted. Game ${this.gameState.gameId} has ended.`);
    }
}
