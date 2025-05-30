/**
 * Test runner for the deck system validation
 * Run with: node runDeckTest.js
 */

import { DeckSystemTest } from './compiled/test/deckSystemTest.js';

async function runDeckSystemTests() {
    const tester = new DeckSystemTest();
    
    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('🚨 Test runner failed:', error);
        process.exit(1);
    }
}

// Run the tests
runDeckSystemTests();

