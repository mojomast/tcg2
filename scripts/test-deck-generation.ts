import { generateDeck, DeckConfig } from '../src/services/deckGenerationService.js';
import { initializeTestEnvironment } from '../src/db/database.js';

async function testDeckGeneration() {
  console.log('Initializing database for deck generation test...');
  await initializeTestEnvironment(); // Ensure DB schema is set up and test data is cleared
  console.log('Database initialized.');

  const sampleConfig: DeckConfig = {
    colors: ['R', 'G'],       // Red-Green
    totalCards: 60,
    landRatio: 0.4,         // 24 lands
    creatureRatio: 0.35,    // 21 creatures
    spellRatio: 0.25,       // 15 spells
    playerId: 'testPlayer123'
  };

  console.log('\n--- Starting Deck Generation Test ---');
  console.log('Using config:', sampleConfig);

  try {
    const generatedDeck = await generateDeck(sampleConfig);
    console.log('\n--- Deck Generation Complete ---');
    console.log('Generated Deck Name:', generatedDeck.deckName);
    console.log('Mainboard Card Count:', generatedDeck.mainBoard.reduce((acc, entry) => acc + entry.quantity, 0));
    console.log('Mainboard Entries:', generatedDeck.mainBoard.length);
    // console.log('Full Generated Deck:', JSON.stringify(generatedDeck, null, 2));

    if (generatedDeck.mainBoard.length > 0) {
      console.log('\nSample of generated cards:');
      generatedDeck.mainBoard.slice(0, 5).forEach(entry => {
        console.log(`- ${entry.quantity}x ${entry.cardId}`);
      });
    }
    console.log('\nTest finished. Check console for logs and database for saved deck.');

  } catch (error) {
    console.error('\n--- Deck Generation Failed ---');
    console.error(error);
  }
}

testDeckGeneration();
