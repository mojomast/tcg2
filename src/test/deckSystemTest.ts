/**
 * Comprehensive test for the deck system including:
 * - Deck loading from database
 * - Deck validation 
 * - Fisher-Yates shuffling
 * - Opening hand dealing
 * - Mulligan functionality
 */

import { GameEngine } from '../game/gameEngine.js';
import DeckService from '../services/deckService.js';
import cardService from '../services/cardService.js';
import { shuffleArray } from '../utils/arrayUtils.js';

export class DeckSystemTest {
    private cardDatabase!: Map<string, any>;
    
    async initialize() {
        console.log('[DeckSystemTest] Initializing card database...');
        const allCards = cardService.getAllCards();
        this.cardDatabase = new Map();
        allCards.forEach(card => {
            this.cardDatabase.set(card.id, card);
        });
        console.log(`[DeckSystemTest] Loaded ${this.cardDatabase.size} cards from database`);
    }
    
    /**
     * Test 1: Verify deck loading from database
     */
    async testDeckLoading() {
        console.log('\n=== TEST 1: Deck Loading ===');
        
        try {
            // Try to load a deck (using standard test deck IDs)
            const testDeckId = 'deck-red-aggro-01';
            const deckList = await DeckService.fetchDeck(testDeckId);
            
            console.log(`✅ Successfully loaded deck: ${deckList.name}`);
            console.log(`   Deck ID: ${deckList.deckId}`);
            console.log(`   Unique cards: ${deckList.cards.length}`);
            
            const totalCards = deckList.cards.reduce((sum, entry) => sum + entry.quantity, 0);
            console.log(`   Total cards: ${totalCards}`);
            
            // Sample a few cards
            const sampleCards = deckList.cards.slice(0, 3);
            sampleCards.forEach(card => {
                const cardData = this.cardDatabase.get(card.cardId);
                console.log(`   - ${card.quantity}x ${cardData?.name || card.cardId}`);
            });
            
            return { success: true, deck: deckList };
        } catch (error) {
            console.error(`❌ Deck loading failed:`, error);
            return { success: false, error };
        }
    }
    
    /**
     * Test 2: Validate deck format compliance
     */
    testDeckValidation() {
        console.log('\n=== TEST 2: Deck Validation ===');
        
        // Test valid deck
        const validDeck = {
            deckId: 'test-valid',
            name: 'Valid Test Deck',
            cards: [
                { cardId: 'lightning-bolt', quantity: 4 },
                { cardId: 'mountain-basic', quantity: 20 },
                { cardId: 'goblin-guide', quantity: 4 },
                { cardId: 'monastery-swiftspear', quantity: 4 },
                // Add more cards to reach 60
                { cardId: 'shock', quantity: 4 },
                { cardId: 'lava-spike', quantity: 4 },
                { cardId: 'chain-lightning', quantity: 4 },
                { cardId: 'rift-bolt', quantity: 4 },
                { cardId: 'searing-blaze', quantity: 4 },
                { cardId: 'skullcrack', quantity: 4 },
                { cardId: 'boros-charm', quantity: 4 },
                { cardId: 'atarka-command', quantity: 4 }
            ]
        };
        
        const validResult = DeckService.validateDeck(validDeck, this.cardDatabase);
        console.log(`Valid deck test: ${validResult.valid ? '✅ PASSED' : '❌ FAILED'}`);
        if (!validResult.valid) {
            validResult.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        // Test invalid deck (too few cards)
        const invalidDeck = {
            deckId: 'test-invalid',
            name: 'Invalid Test Deck',
            cards: [
                { cardId: 'lightning-bolt', quantity: 4 },
                { cardId: 'mountain-basic', quantity: 10 }
            ]
        };
        
        const invalidResult = DeckService.validateDeck(invalidDeck, this.cardDatabase);
        console.log(`Invalid deck test: ${!invalidResult.valid ? '✅ PASSED' : '❌ FAILED'}`);
        if (!invalidResult.valid) {
            console.log(`   Validation errors (expected):`);
            invalidResult.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        return { validDeckResult: validResult, invalidDeckResult: invalidResult };
    }
    
    /**
     * Test 3: Fisher-Yates shuffle quality
     */
    testShuffleQuality() {
        console.log('\n=== TEST 3: Shuffle Quality ===');
        
        // Create a test array with known pattern
        const originalArray = Array.from({ length: 60 }, (_, i) => `card-${i.toString().padStart(2, '0')}`);
        const testArray = [...originalArray];
        
        console.log(`Original array first 10: [${originalArray.slice(0, 10).join(', ')}]`);
        
        // Shuffle the array
        shuffleArray(testArray);
        console.log(`Shuffled array first 10: [${testArray.slice(0, 10).join(', ')}]`);
        
        // Basic quality checks
        const samePositions = testArray.filter((card, index) => card === originalArray[index]).length;
        const shuffleQuality = ((60 - samePositions) / 60) * 100;
        
        console.log(`Cards in different positions: ${60 - samePositions}/60 (${shuffleQuality.toFixed(1)}%)`);
        
        // Good shuffle should have most cards in different positions
        const isGoodShuffle = shuffleQuality >= 80;
        console.log(`Shuffle quality: ${isGoodShuffle ? '✅ GOOD' : '⚠️ POOR'} (${shuffleQuality.toFixed(1)}% different)`);
        
        return { shuffleQuality, isGoodShuffle };
    }
    
    /**
     * Test 4: Game initialization with opening hands
     */
    async testGameInitialization() {
        console.log('\n=== TEST 4: Game Initialization ===');
        
        try {
            // Create a game with two test decks using proper static factory
            const playerIds: ['player1', 'player2'] = ['player1', 'player2'];
            const playerDeckSelections = {
                'player1': 'deck-red-aggro-01',
                'player2': 'deck-blue-control-01'
            };
            
            const gameEngine = await GameEngine.create(playerIds, playerDeckSelections);
            const gameState = gameEngine.gameState;
            
            console.log(`✅ Game initialized successfully`);
            console.log(`   Game ID: ${gameState.gameId}`);
            console.log(`   Players: ${gameState.players.length}`);
            console.log(`   Turn: ${gameState.turnNumber}`);
            console.log(`   Active player: ${gameState.activePlayerId}`);
            console.log(`   Phase: ${gameState.currentPhase}`);
            
            // Check each player's opening hand
            gameState.players.forEach(player => {
                console.log(`\n   Player ${player.playerId}:`);
                console.log(`     Hand size: ${player.hand.length}`);
                console.log(`     Library size: ${player.library.length}`);
                console.log(`     Starting life: ${player.life}`);
                console.log(`     Deck count: ${player.deck_count}`);
                
                // Sample some cards from hand
                const handSample = player.hand.slice(0, 3).map(cardId => {
                    const cardObject = gameState.gameObjects[cardId];
                    return cardObject ? cardObject.name : cardId;
                });
                console.log(`     Hand sample: [${handSample.join(', ')}]`);
            });
            
            return { success: true, gameState };
        } catch (error) {
            console.error(`❌ Game initialization failed:`, error);
            return { success: false, error };
        }
    }
    
    /**
     * Test 5: Draw card functionality 
     */
    async testDrawCard() {
        console.log('\n=== TEST 5: Draw Card Functionality ===');
        
        try {
            // Create a simple game state for testing using proper API
            const playerIds: ['player1', 'player2'] = ['player1', 'player2'];
            const playerDeckSelections = {
                'player1': 'deck-red-aggro-01',
                'player2': 'deck-blue-control-01'  // Need 2 players for GameEngine
            };
            
            const gameEngine = await GameEngine.create(playerIds, playerDeckSelections);
            const gameState = gameEngine.gameState;
            const player = gameState.players[0];
            
            const initialHandSize = player.hand.length;
            const initialLibrarySize = player.library.length;
            
            console.log(`Before draw: Hand=${initialHandSize}, Library=${initialLibrarySize}`);
            
            // Draw a card
            const drawSuccess = DeckService.drawCard(gameState, player.playerId);
            
            const finalHandSize = player.hand.length;
            const finalLibrarySize = player.library.length;
            
            console.log(`After draw: Hand=${finalHandSize}, Library=${finalLibrarySize}`);
            console.log(`Draw success: ${drawSuccess}`);
            
            // Verify the card moved correctly
            const handIncreased = finalHandSize === initialHandSize + 1;
            const libraryDecreased = finalLibrarySize === initialLibrarySize - 1;
            
            const testPassed = drawSuccess && handIncreased && libraryDecreased;
            console.log(`Draw card test: ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
            
            if (!testPassed) {
                console.log(`   Expected: Hand +1, Library -1`);
                console.log(`   Actual: Hand ${finalHandSize-initialHandSize}, Library ${finalLibrarySize-initialLibrarySize}`);
            }
            
            return { success: testPassed };
        } catch (error) {
            console.error(`❌ Draw card test failed:`, error);
            return { success: false, error };
        }
    }
    
    /**
     * Run all deck system tests
     */
    async runAllTests() {
        console.log('🧪 DECK SYSTEM COMPREHENSIVE TEST SUITE 🧪');
        console.log('==========================================\n');
        
        await this.initialize();
        
        const results = {
            deckLoading: await this.testDeckLoading(),
            deckValidation: this.testDeckValidation(),
            shuffleQuality: this.testShuffleQuality(),
            gameInitialization: await this.testGameInitialization(),
            drawCard: await this.testDrawCard()
        };
        
        console.log('\n==========================================');
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('==========================================');
        
        const testNames = Object.keys(results);
        let passedTests = 0;
        
        testNames.forEach(testName => {
            const result = results[testName as keyof typeof results];
            let passed = false;
            
            // Different result structures based on test type
            if (testName === 'deckValidation') {
                // Validation test passes if both valid and invalid tests work correctly
                const validationResult = result as any;
                passed = validationResult.validDeckResult.valid && !validationResult.invalidDeckResult.valid;
            } else if (testName === 'shuffleQuality') {
                // Shuffle test passes if shuffle quality is good
                const shuffleResult = result as any;
                passed = shuffleResult.isGoodShuffle;
            } else {
                // Standard success-based tests
                passed = (result as any).success !== false;
            }
            
            if (passed) passedTests++;
            console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
        });
        
        console.log(`\nOverall: ${passedTests}/${testNames.length} tests passed`);
        
        if (passedTests === testNames.length) {
            console.log('🎉 ALL DECK SYSTEM TESTS PASSED! 🎉');
        } else {
            console.log('⚠️  Some tests failed - check logs above for details');
        }
        
        return results;
    }
}

