/**
 * Simple deck system validation test
 * Run with: node testDeckSimple.js  
 */

import { shuffleArray } from './src/utils/arrayUtils.js';

console.log('🧪 SIMPLE DECK SYSTEM TEST');
console.log('==========================\n');

// Test 1: Fisher-Yates Shuffle Quality
console.log('=== TEST 1: Shuffle Quality ===');
const originalArray = Array.from({ length: 60 }, (_, i) => `card-${i.toString().padStart(2, '0')}`);
const testArray = [...originalArray];

console.log(`Original first 10: [${originalArray.slice(0, 10).join(', ')}]`);

// Shuffle the array
shuffleArray(testArray);
console.log(`Shuffled first 10: [${testArray.slice(0, 10).join(', ')}]`);

// Quality check
const samePositions = testArray.filter((card, index) => card === originalArray[index]).length;
const shuffleQuality = ((60 - samePositions) / 60) * 100;
const isGoodShuffle = shuffleQuality >= 80;

console.log(`Cards in different positions: ${60 - samePositions}/60 (${shuffleQuality.toFixed(1)}%)`);
console.log(`Shuffle quality: ${isGoodShuffle ? '✅ GOOD' : '⚠️ POOR'} (${shuffleQuality.toFixed(1)}% different)\n`);

// Test 2: Multiple shuffle consistency
console.log('=== TEST 2: Multiple Shuffle Tests ===');
let goodShuffles = 0;
const totalTests = 5;

for (let i = 0; i < totalTests; i++) {
    const testDeck = [...originalArray];
    shuffleArray(testDeck);
    
    const samePosCount = testDeck.filter((card, index) => card === originalArray[index]).length;
    const quality = ((60 - samePosCount) / 60) * 100;
    
    if (quality >= 80) goodShuffles++;
    console.log(`Shuffle ${i+1}: ${quality.toFixed(1)}% different ${quality >= 80 ? '✅' : '❌'}`);
}

console.log(`\nShuffle consistency: ${goodShuffles}/${totalTests} good shuffles`);

// Test 3: Deck simulation (opening hand)
console.log('\n=== TEST 3: Opening Hand Simulation ===');
const deckSimulation = [...originalArray];
shuffleArray(deckSimulation);

const hand = [];
const library = [...deckSimulation];

// Draw 7 cards for opening hand
for (let i = 0; i < 7 && library.length > 0; i++) {
    const drawnCard = library.shift();
    if (drawnCard) {
        hand.push(drawnCard);
    }
}

console.log(`Opening hand drawn: ${hand.length} cards`);
console.log(`Remaining library: ${library.length} cards`);
console.log(`Hand sample: [${hand.slice(0, 5).join(', ')}${hand.length > 5 ? ', ...' : ''}]`);

// Test 4: Multiple draw simulation
console.log('\n=== TEST 4: Draw Card Simulation ===');
const initialLibrarySize = library.length;
const initialHandSize = hand.length;

// Draw one more card
if (library.length > 0) {
    const drawnCard = library.shift();
    hand.push(drawnCard);
}

const finalLibrarySize = library.length;
const finalHandSize = hand.length;

console.log(`Before draw: Hand=${initialHandSize}, Library=${initialLibrarySize}`);
console.log(`After draw:  Hand=${finalHandSize}, Library=${finalLibrarySize}`);

const handIncreased = finalHandSize === initialHandSize + 1;
const libraryDecreased = finalLibrarySize === initialLibrarySize - 1;
const drawCorrect = handIncreased && libraryDecreased;

console.log(`Draw mechanics: ${drawCorrect ? '✅ CORRECT' : '❌ FAILED'}`);

// Summary
console.log('\n==========================');
console.log('📊 TEST SUMMARY');
console.log('==========================');
console.log(`✅ Shuffle Quality: ${isGoodShuffle ? 'PASSED' : 'FAILED'}`);
console.log(`✅ Shuffle Consistency: ${goodShuffles >= 4 ? 'PASSED' : 'FAILED'}`);
console.log(`✅ Opening Hand: ${hand.length === 7 ? 'PASSED' : 'FAILED'}`);
console.log(`✅ Draw Mechanics: ${drawCorrect ? 'PASSED' : 'FAILED'}`);

const allPassed = isGoodShuffle && goodShuffles >= 4 && hand.length === 7 && drawCorrect;
console.log(`\n${allPassed ? '🎉 ALL BASIC DECK TESTS PASSED!' : '⚠️ Some tests failed'}`);

