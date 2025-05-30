import { GameEngine } from '../gameEngine.js';
import { TEST_PLAYER_1_ID, TEST_PLAYER_2_ID } from '../../config/constants.js';
import deckService from '../../services/deckService.js';
import cardService from '../../services/cardService.js';
import { initializeDatabase } from '../../db/database.js';
import { Card } from '../../interfaces/card.js';
import { EventType } from '../../interfaces/gameState.js';

describe('Deck Management', () => {
  let mockCallback: jest.MockedFunction<(eventType: EventType, eventData: any) => void>;

  beforeAll(async () => {
    // Initialize database for testing
    await initializeDatabase();
    
    // Add test cards
    const testCard: Card = {
      id: 'test-card-001',
      name: 'Test Card',
      type: 'Creature',
      cost: { C: 1 },
      attack: 1,
      health: 1,
      rarity: 'Common',
      rulesText: 'Test creature',
      colorIdentity: [],
      setId: 'TEST',
      collectorNumber: '1',
      text: 'Test creature'
    };
    cardService.createCard(testCard);

    const basicLand: Card = {
      id: 'test-plains-001',
      name: 'Plains',
      type: 'Land',
      rarity: 'Common',
      rulesText: 'T: Add {W}.',
      producesMana: { W: 1 },
      colorIdentity: ['W'],
      cost: {},
      setId: 'TEST',
      collectorNumber: '2',
      text: 'T: Add {W}.'
    };
    cardService.createCard(basicLand);
  });

  beforeEach(() => {
    mockCallback = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Deck Loading and Validation', () => {
    test('should load deck from database using existing default decks', async () => {
      const deckList = await deckService.fetchDeck('defaultDeckP1');
      
      expect(deckList).toBeDefined();
      expect(deckList.deckId).toBe('defaultDeckP1');
      expect(deckList.name).toBe('Player 1 Default');
      expect(deckList.cards.length).toBeGreaterThan(0);
      
      console.log(`✓ Loaded deck: ${deckList.name} with ${deckList.cards.length} card types`);
    });

    test('should validate deck with minimum card requirement (should fail with default 40-card deck)', async () => {
      const deckList = await deckService.fetchDeck('defaultDeckP1');
      const cardArray = cardService.getAllCards();
      const cardDatabase = new Map(cardArray.map(card => [card.id, card]));
      
      const validation = deckService.validateDeck(deckList, cardDatabase);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(error => error.includes('40 cards but requires minimum 60'))).toBe(true);
      
      console.log(`✓ Deck validation correctly failed: ${validation.errors[0]}`);
    });

    test('should validate deck with too many copies of a card', async () => {
      // Create a test deck with 5 copies of a non-basic card
      const invalidDeck = {
        deckId: 'test-invalid-deck',
        name: 'Invalid Test Deck',
        cards: [
          { cardId: 'test-card-001', quantity: 5 }, // Too many copies
          { cardId: 'test-plains-001', quantity: 55 } // Basic lands are okay
        ]
      };
      
      const cardArray = cardService.getAllCards();
      const cardDatabase = new Map(cardArray.map(card => [card.id, card]));
      const validation = deckService.validateDeck(invalidDeck, cardDatabase);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(error => error.includes('has 5 copies but maximum allowed is 4'))).toBe(true);
      
      console.log(`✓ Too many copies validation failed correctly`);
    });

    test('should create valid 60-card deck', async () => {
      // Create a valid test deck
      await deckService.createDeck('test-valid-deck', 'test-player', 'Valid Test Deck', [
        { cardId: 'test-card-001', quantity: 4 },
        { cardId: 'test-plains-001', quantity: 56 }
      ]);
      
      const deckList = await deckService.fetchDeck('test-valid-deck');
      const cardArray = cardService.getAllCards();
      const cardDatabase = new Map(cardArray.map(card => [card.id, card]));
      const validation = deckService.validateDeck(deckList, cardDatabase);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
      
      const totalCards = deckList.cards.reduce((sum, card) => sum + card.quantity, 0);
      expect(totalCards).toBe(60);
      
      console.log(`✓ Valid 60-card deck created and validated successfully`);
    });
  });

  describe('Deck Drawing and Shuffling', () => {
    test('should verify shuffle randomness', async () => {
      const playerDeckSelections = {
        [TEST_PLAYER_1_ID]: 'defaultDeckP1',
        [TEST_PLAYER_2_ID]: 'defaultDeckP2'
      };
      
      const orders: string[][] = [];
      
      // Run multiple games to check shuffle randomness
      for (let i = 0; i < 5; i++) {
        const engine = await GameEngine.create(
          [TEST_PLAYER_1_ID, TEST_PLAYER_2_ID],
          playerDeckSelections,
          mockCallback
        );
        
        const player1 = engine.gameState.players.find(p => p.playerId === TEST_PLAYER_1_ID);
        expect(player1).toBeDefined();
        
        // Get first 3 cards from library
        const firstThreeCards = player1!.library.slice(0, 3);
        orders.push(firstThreeCards);
        
        console.log(`Shuffle ${i + 1}: First 3 cards = [${firstThreeCards.join(', ')}]`);
      }
      
      // Check that at least some orders are different
      const uniqueOrders = new Set(orders.map(order => order.join(',')));
      expect(uniqueOrders.size).toBeGreaterThan(1);
      
      console.log(`✓ Shuffle randomness verified: ${uniqueOrders.size} unique orders out of 5 runs`);
    });

    test('should draw 7 cards for opening hand and verify counts', async () => {
      const playerDeckSelections = {
        [TEST_PLAYER_1_ID]: 'defaultDeckP1',
        [TEST_PLAYER_2_ID]: 'defaultDeckP2'
      };
      
      const engine = await GameEngine.create(
        [TEST_PLAYER_1_ID, TEST_PLAYER_2_ID],
        playerDeckSelections,
        mockCallback
      );
      
      const player1 = engine.gameState.players.find(p => p.playerId === TEST_PLAYER_1_ID);
      const player2 = engine.gameState.players.find(p => p.playerId === TEST_PLAYER_2_ID);
      
      expect(player1).toBeDefined();
      expect(player2).toBeDefined();
      
      // Check opening hand size
      expect(player1!.hand.length).toBe(7);
      expect(player2!.hand.length).toBe(7);
      
      // Check deck count is updated
      expect(player1!.deck_count).toBe(player1!.library.length);
      expect(player2!.deck_count).toBe(player2!.library.length);
      
      // Total cards should be 40 (hand + library)
      expect(player1!.hand.length + player1!.library.length).toBe(40);
      expect(player2!.hand.length + player2!.library.length).toBe(40);
      
      console.log(`✓ Player 1: Hand=${player1!.hand.length}, Library=${player1!.library.length}, Total=40`);
      console.log(`✓ Player 2: Hand=${player2!.hand.length}, Library=${player2!.library.length}, Total=40`);
    });

    test('should handle empty deck scenario', async () => {
      const playerDeckSelections = {
        [TEST_PLAYER_1_ID]: 'defaultDeckP1',
        [TEST_PLAYER_2_ID]: 'defaultDeckP2'
      };
      
      const engine = await GameEngine.create(
        [TEST_PLAYER_1_ID, TEST_PLAYER_2_ID],
        playerDeckSelections,
        mockCallback
      );
      
      const player1 = engine.gameState.players.find(p => p.playerId === TEST_PLAYER_1_ID);
      expect(player1).toBeDefined();
      
      // Empty the library manually for testing
      const originalLibrarySize = player1!.library.length;
      player1!.library = [];
      player1!.deck_count = 0;
      
      // Attempt to draw from empty library
      const drawResult = deckService.drawCard(engine.gameState, TEST_PLAYER_1_ID);
      
      expect(drawResult).toBe(false);
      expect(player1!.library.length).toBe(0);
      expect(player1!.deck_count).toBe(0);
      
      console.log(`✓ Empty deck handling works correctly - draw returned false`);
    });
  });

  describe('Game Integration', () => {
    test('should successfully create game with valid decks', async () => {
      const playerDeckSelections = {
        [TEST_PLAYER_1_ID]: 'defaultDeckP1',
        [TEST_PLAYER_2_ID]: 'defaultDeckP2'
      };
      
      const engine = await GameEngine.create(
        [TEST_PLAYER_1_ID, TEST_PLAYER_2_ID],
        playerDeckSelections,
        mockCallback
      );
      
      expect(engine).toBeDefined();
      expect(engine.gameState).toBeDefined();
      expect(engine.gameState.players.length).toBe(2);
      expect(engine.gameState.gameEnded).toBe(false);
      
      console.log(`✓ Game created successfully with GameID: ${engine.gameState.gameId}`);
    });
  });
});

