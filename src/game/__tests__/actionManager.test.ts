import { ActionManager } from '../actionManager';
import { GameEngine } from '../gameEngine';
import { ResourceManager } from '../resourceManager';
import { GameState, PlayerId, GameObjectId, StackItem, ManaColor, Zone, PlayerState, BattlefieldCard, CardType as GameStateCardType, GamePhase, GameStep } from '../../interfaces/gameState';
import { Card, CardType, ManaCost, Keyword } from '../../interfaces/card';
import { createMockCard } from '../../utils/testUtils';

describe('ActionManager', () => {
    let gameState: GameState;
    let engine: GameEngine;
    let actionManager: ActionManager;
    let resourceManager: ResourceManager;

    const player1Id: PlayerId = 'player1';
    const player2Id: PlayerId = 'player2';

    let cardC1: Card, cardC2: Card, cardC3: Card, cardC4: Card, cardC5: Card, cardC6: Card, cardFlyer: Card;
    let mockCreatureInstanceId: GameObjectId;
    let mockInstantCardId: GameObjectId;
    let instantCardDefinition: Card;

    beforeEach(() => {
        cardC1 = createMockCard('c1', 'Vigilant Creature', 'Creature', { B: 1 }, ['Vigilance']);
        cardC2 = createMockCard('c2', 'Hasty Creature', 'Creature', { R: 1 }, ['Haste']);
        instantCardDefinition = createMockCard('c3', 'Instant Spell', 'Instant', { U: 1 });
        cardC4 = createMockCard('c4', 'Sorcery Spell', 'Sorcery', { W: 1 });
        cardC5 = createMockCard('c5', 'Artifact A', 'Artifact');
        cardC6 = createMockCard('c6', 'Land X', 'Land');
        cardFlyer = createMockCard('cfly', 'Flying Creature', 'Creature', {W: 2}, ['Flying']);

        const P1_DECKLIST_CARDS: Card[] = [cardC1, cardC2, instantCardDefinition, cardC1, cardC2, cardFlyer];
        const P2_DECKLIST_CARDS: Card[] = [cardC4, cardC5, cardC6, cardC4, cardC5];

        const decklistsForEngine: Record<PlayerId, Card[]> = {
            [player1Id]: P1_DECKLIST_CARDS,
            [player2Id]: P2_DECKLIST_CARDS,
        };
        
        engine = new GameEngine([player1Id, player2Id], decklistsForEngine);
        gameState = engine.gameState;
        actionManager = engine.actionManager;
        resourceManager = engine.resourceManager;

        gameState.activePlayerId = player1Id;
        gameState.priorityPlayerId = player1Id;
        gameState.currentPhase = 'MAIN';
        gameState.currentStep = 'MAIN_PRE';
        gameState.stack = [];
        gameState.consecutivePriorityPasses = 0;

        const player1State = gameState.players.find(p => p.playerId === player1Id);
        if (!player1State) {
            throw new Error('Player 1 state not found during test setup');
        }

        // Setup for mockCreatureInstanceId (c1)
        const creatureCardInGame = Object.values(gameState.gameObjects).find((ci: BattlefieldCard) => ci.cardId === 'c1' && ci.ownerId === player1Id);
        if (!creatureCardInGame) {
            throw new Error('Test setup error: Card instance c1 for player1 not found.');
        }
        mockCreatureInstanceId = creatureCardInGame.instanceId;

        // Ensure creature is in hand
        player1State.library = player1State.library.filter(id => id !== mockCreatureInstanceId);
        player1State.graveyard = player1State.graveyard.filter(id => id !== mockCreatureInstanceId);
        player1State.exile = player1State.exile.filter(id => id !== mockCreatureInstanceId);
        Object.keys(player1State.battlefield).forEach(zoneKey => {
            const key = zoneKey as keyof PlayerState['battlefield'];
            player1State.battlefield[key] = player1State.battlefield[key].filter(bfCard => bfCard.instanceId !== mockCreatureInstanceId);
        });
        if (!player1State.hand.includes(mockCreatureInstanceId)) {
            player1State.hand.push(mockCreatureInstanceId);
        }
        gameState.gameObjects[mockCreatureInstanceId].currentZone = 'hand';

        // Setup for mockInstantCardId (c3)
        const instantCardInGame = Object.values(gameState.gameObjects).find((ci: BattlefieldCard) => ci.cardId === 'c3' && ci.ownerId === player1Id);
        if (!instantCardInGame) {
            throw new Error('Test setup error: Card instance c3 for player1 not found.');
        }
        mockInstantCardId = instantCardInGame.instanceId;
        // Ensure instant is in hand
        player1State.library = player1State.library.filter(id => id !== mockInstantCardId);
        player1State.graveyard = player1State.graveyard.filter(id => id !== mockInstantCardId);
        player1State.exile = player1State.exile.filter(id => id !== mockInstantCardId);
        Object.keys(player1State.battlefield).forEach(zoneKey => {
            const key = zoneKey as keyof PlayerState['battlefield'];
            player1State.battlefield[key] = player1State.battlefield[key].filter(bfCard => bfCard.instanceId !== mockInstantCardId);
        });
        if (!player1State.hand.includes(mockInstantCardId)) {
            player1State.hand.push(mockInstantCardId);
        }
        gameState.gameObjects[mockInstantCardId].currentZone = 'hand';
        
        player1State.manaPool = { B: 5, U: 5, R: 5, W: 5, G: 5, C: 5 };
    });

    describe('playCard', () => {
        it('should allow a player to play a card from hand if they have priority and can pay costs', () => {
            expect(gameState.stack.length).toBe(0);
            const player1State = gameState.players.find(p => p.playerId === player1Id) as PlayerState;
            expect(player1State.hand).toContain(mockCreatureInstanceId);

            const canAffordSpy = jest.spyOn(resourceManager, 'canAffordCost').mockReturnValue(true);
            const spendManaSpy = jest.spyOn(resourceManager, 'spendMana').mockReturnValue(true);

            const success = actionManager.playCard(player1Id, mockCreatureInstanceId);

            expect(success).toBe(true);
            expect(gameState.stack.length).toBe(1);
            const stackItem = gameState.stack[0];
            expect(stackItem.type).toBe('Spell');
            expect(stackItem.sourceCardId).toBe(cardC1.id);
            expect(stackItem.sourceInstanceId).toBe(mockCreatureInstanceId);
            expect(stackItem.controllerId).toBe(player1Id);
            
            expect(canAffordSpy).toHaveBeenCalledWith(player1Id, cardC1.cost);
            expect(spendManaSpy).toHaveBeenCalledWith(player1Id, cardC1.cost);

            canAffordSpy.mockRestore();
            spendManaSpy.mockRestore();
        });

        it('should not allow a player to play a card if they do not have priority', () => {
            gameState.priorityPlayerId = player2Id;
            const success = actionManager.playCard(player1Id, mockCreatureInstanceId);
            expect(success).toBe(false);
            expect(gameState.stack.length).toBe(0);
        });

        it('should not allow a player to play a card that is not in their hand', () => {
            const player1State = gameState.players.find(p => p.playerId === player1Id) as PlayerState;
            player1State.hand = player1State.hand.filter(id => id !== mockCreatureInstanceId); // Remove card
            const success = actionManager.playCard(player1Id, mockCreatureInstanceId);
            expect(success).toBe(false);
            expect(gameState.stack.length).toBe(0);
        });

        it('should not allow a player to play a card if they cannot afford the cost', () => {
            const canAffordSpy = jest.spyOn(resourceManager, 'canAffordCost').mockReturnValue(false);
            const spendManaSpy = jest.spyOn(resourceManager, 'spendMana');

            const success = actionManager.playCard(player1Id, mockCreatureInstanceId);

            expect(success).toBe(false);
            expect(gameState.stack.length).toBe(0);
            expect(canAffordSpy).toHaveBeenCalledWith(player1Id, cardC1.cost);
            expect(spendManaSpy).not.toHaveBeenCalled();

            canAffordSpy.mockRestore();
            spendManaSpy.mockRestore();
        });

        it('should move the card to the stack zone when played', () => {
            jest.spyOn(resourceManager, 'canAffordCost').mockReturnValue(true);
            jest.spyOn(resourceManager, 'spendMana').mockReturnValue(true);

            actionManager.playCard(player1Id, mockCreatureInstanceId);
            expect(gameState.gameObjects[mockCreatureInstanceId].currentZone).toBe('stack');
        });
    });

    describe('resolveNextStackItem', () => {
        beforeEach(() => {
            // Ensure player1 has priority and mana to play the instant card for stack setup
            gameState.priorityPlayerId = player1Id;
            const player1State = gameState.players.find(p => p.playerId === player1Id) as PlayerState;
            player1State.manaPool = { U: 1 }; // Ensure enough mana for the instant
            jest.spyOn(resourceManager, 'canAffordCost').mockReturnValue(true);
            jest.spyOn(resourceManager, 'spendMana').mockReturnValue(true);
        });

        it('should resolve the top item on the stack (creature) and move it to battlefield', () => {
            // Play the creature card first
            actionManager.playCard(player1Id, mockCreatureInstanceId);
            expect(gameState.stack.length).toBe(1);
            expect(gameState.gameObjects[mockCreatureInstanceId].currentZone).toBe('stack');

            const moveCardZoneSpy = jest.spyOn(engine, 'moveCardZone');
            const success = actionManager.resolveNextStackItem();

            expect(success).toBe(true);
            expect(gameState.stack.length).toBe(0);
            expect(gameState.gameObjects[mockCreatureInstanceId].currentZone).toBe('battlefield');
            const player1State = gameState.players.find(p => p.playerId === player1Id) as PlayerState;
            expect(player1State.battlefield.creatures.some(c => c.instanceId === mockCreatureInstanceId)).toBe(true);
            expect(moveCardZoneSpy).toHaveBeenCalledWith(mockCreatureInstanceId, 'stack', 'battlefield', player1Id);
            moveCardZoneSpy.mockRestore();
        });

        it('should resolve the top item on the stack (instant) and move it to graveyard', () => {
            // Play the instant card
            actionManager.playCard(player1Id, mockInstantCardId);
            expect(gameState.stack.length).toBe(1);
            expect(gameState.gameObjects[mockInstantCardId].currentZone).toBe('stack');

            const moveCardZoneSpy = jest.spyOn(engine, 'moveCardZone');
            const success = actionManager.resolveNextStackItem();

            expect(success).toBe(true);
            expect(gameState.stack.length).toBe(0);
            expect(gameState.gameObjects[mockInstantCardId].currentZone).toBe('graveyard');
            const player1State = gameState.players.find(p => p.playerId === player1Id) as PlayerState;
            expect(player1State.graveyard).toContain(mockInstantCardId);
            expect(moveCardZoneSpy).toHaveBeenCalledWith(mockInstantCardId, 'stack', 'graveyard', player1Id);
            moveCardZoneSpy.mockRestore();
        });

        it('should return false if there are no items on the stack to resolve', () => {
            expect(gameState.stack.length).toBe(0);
            const success = actionManager.resolveNextStackItem();
            expect(success).toBe(false);
        });
    });
});
