import { GameState, PlayerState, PlayerId, GameObjectId, BattlefieldCard, Zone, ManaColor } from '../interfaces/gameState.js';
import { Card, CardType, Keyword } from '../interfaces/card.js';

let nextGameObjectId = 1;
export function generateId(): GameObjectId {
    return `obj-${nextGameObjectId++}` as GameObjectId;
}

export function createTestCard(
    id: GameObjectId,
    name: string,
    type: CardType,
    cost: { [key in ManaColor | 'colorless']?: number } = {},
    attack?: number,
    health?: number,
    keywords?: Keyword[],
    ownerId?: PlayerId, // Keep owner separate usually, but useful for direct game object creation
    text?: string
): Card & { ownerId: PlayerId } {
    const card: Card = {
        id: id, // Note: This might be the definition ID, not instance ID in a real scenario
        name: name,
        type: type,
        cost: cost,
        attack: attack,
        health: health,
        keywords: keywords,
        rarity: 'Common', // Default rarity
        rulesText: text || `Test card - ${name}`, // Use provided text or generate default
        setId: 'TEST', // Default set ID
        collectorNumber: '001', // Default collector number
        text: text // Keep this if needed, otherwise rely on rulesText
    };
    // For GameState.gameObjects, we need the owner tied to the Card definition
    return { ...card, ownerId: ownerId ?? 'test-owner' as PlayerId };
}

export function createBattlefieldCard(
    baseCard: Card, // Accept the full base Card object
    instanceId: GameObjectId,
    ownerId: PlayerId,
    controllerId: PlayerId,
    currentZone: Zone = 'battlefield',
    isTapped: boolean = false,
    damageMarked: number = 0,
    summoningSickness: boolean = true,
    counters: { [type: string]: number } = {},
    attachments: GameObjectId[] = []
): BattlefieldCard {
    return {
        ...baseCard, // Spread all properties from the base card
        instanceId: instanceId,
        cardId: baseCard.id, // Link to the base card's definition ID
        currentZone: currentZone,
        ownerId: ownerId,
        controllerId: controllerId,
        tapped: isTapped,
        summoningSickness: summoningSickness,
        damageMarked: damageMarked,
        counters: counters,
        attachments: attachments,
        // Ensure all other BattlefieldCard specific fields (if any not covered by Card) are here
    };
}

export function createInitialPlayerState(playerId: PlayerId): PlayerState {
    return {
        playerId: playerId,
        life: 20,
        energy: 0,
        poisonCounters: 0,
        manaPool: {},
        hand: [],
        library: [], // Populate as needed
        deck_count: 0, // Initialize deck_count, can be overridden by tests if library is populated
        graveyard: [],
        exile: [],
        battlefield: {
            creatures: [],
            resources: [],
            enchantments: [],
            artifacts: [], // Added missing
            planeswalkers: [], // Added missing
            other: [], // Added missing
        },
        hasPlayedResourceThisTurn: false,
        landPlayedThisTurn: false, // Added missing property
        maxHandSize: 7,
        hasLost: false, // Default to false
    };
}

export function createInitialGameState(player1Id: PlayerId, player2Id: PlayerId): GameState {
    nextGameObjectId = 1; // Reset ID generator for fresh state
    return {
        gameId: 'test-game-1', // Default game ID for tests
        turnNumber: 1, // Default turn number
        currentPhase: 'BEGIN',
        currentStep: 'UNTAP',
        activePlayerId: player1Id,
        priorityPlayerId: player1Id,
        consecutivePriorityPasses: 0, // Added missing
        startingPlayerId: player1Id, // Added missing
        players: [createInitialPlayerState(player1Id), createInitialPlayerState(player2Id)],
        stack: [],
        gameObjects: {}, // Populate as needed for tests
        attackers: {},
        blockers: {},
        gameLog: [],
        winner: undefined,
    };
}

// Helper to add a creature card definition and instance to the game state for a player
export function addCreatureToBattlefield(
    gameState: GameState,
    playerId: PlayerId,
    name: string,
    attack: number,
    health: number,
    keywords?: Keyword[],
    cost: { [key in ManaColor | 'colorless']?: number } = {},
    isTapped: boolean = false
): { cardDef: Card & { ownerId: PlayerId }, battlefieldCard: BattlefieldCard } {
    const playerState = gameState.players.find((p: PlayerState) => p.playerId === playerId);
    if (!playerState) {
        throw new Error(`Player ${playerId} not found in game state.`);
    }

    const cardDefId = generateId(); // ID for the card definition in gameObjects
    const instanceId = generateId(); // ID for the battlefield instance

    const cardDef = createTestCard(cardDefId, name, 'Creature' as CardType, cost, attack, health, keywords, playerId);

    const battlefieldCard = createBattlefieldCard(cardDef, instanceId, playerId, playerId, 'battlefield', isTapped);
    playerState.battlefield.creatures.push(battlefieldCard);

    // Link instance back to definition in gameObjects (important!)
    gameState.gameObjects[instanceId] = battlefieldCard; // Correctly store the BattlefieldCard instance

    return { cardDef, battlefieldCard };
}

export function createMockPlayerState(playerId: PlayerId, overrides: Partial<PlayerState> = {}): PlayerState {
    return {
        playerId,
        life: 20,
        energy: 0,
        poisonCounters: 0,
        manaPool: {},
        hand: [],
        library: [],
        deck_count: overrides.library?.length || 0, // Initialize based on library or 0
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
        landPlayedThisTurn: false,
        maxHandSize: 7,
        hasLost: false,
        ...overrides,
    };
}

export function createMockGameState(player1Id: PlayerId = 'player1', player2Id: PlayerId = 'player2'): GameState {
    return {
        gameId: 'test-game-1', // Default game ID for tests
        turnNumber: 1, // Default turn number
        currentPhase: 'BEGIN',
        currentStep: 'UNTAP',
        activePlayerId: player1Id,
        priorityPlayerId: player1Id,
        consecutivePriorityPasses: 0, // Added missing
        startingPlayerId: player1Id, // Added missing
        players: [createMockPlayerState(player1Id), createMockPlayerState(player2Id)],
        stack: [],
        gameObjects: {}, // Populate as needed for tests
        attackers: {},
        blockers: {},
        gameLog: [],
        winner: undefined,
    };
}
