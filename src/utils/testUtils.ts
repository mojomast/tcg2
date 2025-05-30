// src/utils/testUtils.ts
import { 
    GameState, 
    PlayerState, 
    PlayerId, 
    Zone, 
    GamePhase, 
    GameStep,
    ManaPool, 
    BattlefieldCard,
    CardType as GameStateCardType // Added for createBattlefieldCard
} from '../interfaces/gameState';
import { Card, CardType, ManaCost, Keyword } from '../interfaces/card'; // Assuming Card interface is needed
import { v4 as uuidv4 } from 'uuid'; // For generating instance IDs

// Basic Mana Pool
const createMockManaPool = (): ManaPool => ({
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
    C: 0, // Colorless
});

/**
 * Creates a mock PlayerState for testing purposes.
 * @param playerId The ID for the mock player.
 * @returns A basic PlayerState object.
 */
export function createMockPlayerState(playerId: PlayerId): PlayerState {
    return {
        playerId: playerId,
        life: 20,
        energy: 0,
        poisonCounters: 0,
        manaPool: createMockManaPool(),
        landPlayedThisTurn: false,
        hand: [],
        library: [], // Corresponds to 'deck' in some contexts
        graveyard: [],
        exile: [],
        battlefield: {
            creatures: [] as BattlefieldCard[],
            resources: [] as BattlefieldCard[],
            enchantments: [] as BattlefieldCard[],
            artifacts: [] as BattlefieldCard[],
            planeswalkers: [] as BattlefieldCard[],
            other: [] as BattlefieldCard[],
        },
        hasPlayedResourceThisTurn: false,
        maxHandSize: 7, // Added default for max hand size
        hasLost: false, // Added default for hasLost
        deck_count: 0 // Initialize with 0, or derive from library.length if populated
        // Add other necessary defaults
    };
}

/**
 * Creates a mock GameState for testing purposes.
 * @param players An array of PlayerState objects.
 * @param initialGameState Optional partial GameState to override defaults.
 * @returns A basic GameState object.
 */
export function createMockGameState(players: [PlayerState, PlayerState], initialGameState: Partial<GameState> = {}): GameState {
    const defaultState: GameState = {
        gameId: 'test-game-' + Date.now(),
        turnNumber: 1,
        players: players, // Use the provided players
        activePlayerId: players[0]?.playerId ?? 'player1', // Default to first player
        priorityPlayerId: players[0]?.playerId ?? 'player1',
        consecutivePriorityPasses: 0,
        currentPhase: 'BEGIN' as GamePhase, // Assign a valid value
        currentStep: 'UNTAP' as GameStep, // Assign a valid value
        stack: [],
        gameObjects: {}, // Initialize game objects
        attackers: {}, // Initialize attackers
        blockers: {}, // Initialize blockers
        startingPlayerId: players[0]?.playerId ?? 'player1', // Added missing property
        gameLog: [],
        ...initialGameState // Apply any overrides
    };
    return defaultState;
}

// Mock a minimal card object for testing (moved from actionManager.test.ts)
export const createMockCard = (id: string, name: string, type: CardType, cost: ManaCost = {}, keywords: Keyword[] = [], attack: number = 1, health: number = 1): Card => ({
    id,
    name,
    type,
    subtype: undefined,
    cost,
    text: '', 
    rulesText: '', 
    rarity: 'Common',
    setId: 'test-set',
    collectorNumber: '001',
    keywords, // Assign passed keywords
    attack: type === 'Creature' ? attack : undefined,
    health: type === 'Creature' ? health : undefined,
});

export const createInitialGameState = (player1Id: PlayerId, player2Id: PlayerId, initialGameState?: Partial<GameState>): GameState => {
    const player1 = createMockPlayerState(player1Id);
    const player2 = createMockPlayerState(player2Id);
    return createMockGameState([player1, player2], initialGameState);
};

export const createBattlefieldCard = (
    baseCard: Card,
    ownerId: PlayerId,
    instanceId: string, // Allow providing an instanceId
    controllerId?: PlayerId, 
    currentZone: Zone = 'battlefield' // Default to battlefield string literal
): BattlefieldCard => {
    const result: BattlefieldCard = {
        // Properties from Card interface
        id: baseCard.id,
        name: baseCard.name,
        cost: baseCard.cost,
        type: baseCard.type as GameStateCardType, // Cast to the more specific type
        subtype: baseCard.subtype,
        rarity: baseCard.rarity,
        rulesText: baseCard.rulesText,
        flavorText: baseCard.flavorText,
        setId: baseCard.setId,
        collectorNumber: baseCard.collectorNumber,
        imageUrl: baseCard.imageUrl,
        attack: baseCard.attack,
        health: baseCard.health,
        keywords: baseCard.keywords ? [...baseCard.keywords] : [], // Ensure deep copy for array
        spellSpeed: baseCard.spellSpeed,
        producesMana: baseCard.producesMana, // Potentially deep copy if it's an object
        text: baseCard.text,

        // Properties specific to BattlefieldCard interface
        instanceId: instanceId,
        cardId: baseCard.id, // Explicitly set BattlefieldCard's own cardId
        currentZone: currentZone,
        ownerId: ownerId,
        controllerId: controllerId || ownerId,
        tapped: false,
        summoningSickness: baseCard.type === 'Creature',
        damageMarked: 0,
        counters: {},
        attachments: [],
    };
    return result;
};

export const addCreatureToBattlefield = (
    gameState: GameState,
    playerState: PlayerState, // Pass the specific player's state
    cardDetails: Partial<Card>, // Allow overriding parts of a default mock card
    instanceId?: string // Optional: allow specifying an ID for deterministic tests
): BattlefieldCard => {
    const baseCard: Card = {
        ...createMockCard(
            cardDetails.id || `test-creature-${uuidv4()}`,
            cardDetails.name || 'Test Creature',
            'Creature', // Default to creature string literal
            cardDetails.cost || { C: 1 },
            cardDetails.keywords || [],
            cardDetails.attack || 1,
            cardDetails.health || 1
        ),
        ...cardDetails, // Apply overrides
        type: 'Creature', // Ensure it's a creature string literal
    };

    const newInstanceId = instanceId || `bf-${uuidv4()}`;
    const battlefieldCreature = createBattlefieldCard(baseCard, playerState.playerId, newInstanceId, playerState.playerId, 'battlefield'); // Use string literal

    gameState.gameObjects[newInstanceId] = battlefieldCreature;
    playerState.battlefield.creatures.push(battlefieldCreature);

    return battlefieldCreature;
};
