import { GameState, PlayerState, PlayerId, GameObjectId, BattlefieldCard } from '../interfaces/gameState';
import { Card, ManaColor, Keyword } from '../interfaces/card';

let nextGameObjectId = 1;
export function generateId(): GameObjectId {
    return `obj-${nextGameObjectId++}` as GameObjectId;
}

export function createTestCard(
    id: GameObjectId,
    name: string,
    type: 'Creature' | 'Resource' | 'Spell',
    cost: { [key in ManaColor | 'colorless']?: number } = {},
    power?: number,
    toughness?: number,
    keywords?: Keyword[],
    ownerId?: PlayerId, // Keep owner separate usually, but useful for direct game object creation
    text?: string
): Card & { ownerId: PlayerId } {
    const card: Card = {
        id: id, // Note: This might be the definition ID, not instance ID in a real scenario
        name: name,
        type: type,
        cost: cost,
        power: power,
        toughness: toughness,
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
    objectId: GameObjectId,
    cardId: string, // Link back to the base card if needed
    ownerId: PlayerId,
    controllerId: PlayerId,
    isTapped: boolean = false,
    damageMarked: number = 0
): BattlefieldCard {
    return {
        objectId: objectId,
        cardId: cardId, // Or just store the full Card data if preferred
        ownerId: ownerId,
        controllerId: controllerId,
        isTapped: isTapped,
        damageMarked: damageMarked,
        summoningSickness: true, // Default to true
        counters: [],
        attachments: [],
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
        graveyard: [],
        exile: [],
        battlefield: {
            creatures: [],
            resources: [],
            enchantments: [],
        },
        hasPlayedResourceThisTurn: false,
        maxHandSize: 7,
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
    power: number,
    toughness: number,
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

    const cardDef = createTestCard(cardDefId, name, 'Creature', cost, power, toughness, keywords, playerId);
    gameState.gameObjects[cardDefId] = cardDef; // Add definition

    const battlefieldCard = createBattlefieldCard(instanceId, cardDef.id, playerId, playerId, isTapped);
    playerState.battlefield.creatures.push(battlefieldCard);

    // Link instance back to definition in gameObjects (important!)
    gameState.gameObjects[instanceId] = cardDef;

    return { cardDef, battlefieldCard };
}
