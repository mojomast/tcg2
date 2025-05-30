// src/game/deckService.ts

/**
 * Represents the structure of a card in a deck list.
 */
export interface DeckListItem {
  cardId: string;
  quantity: number;
}

/**
 * Represents a player's deck list.
 */
export interface DeckList {
  deckId: string;
  name: string;
  cards: DeckListItem[];
}

/**
 * Simulates fetching a deck list from a database.
 * In a real application, this would involve an actual database query.
 * @param deckId The ID of the deck to fetch.
 * @returns A Promise that resolves to the DeckList or null if not found.
 */
async function fetchDeckFromDB(deckId: string): Promise<DeckList | null> {
  console.log(`[DeckService] Fetching deck with ID: ${deckId}`);
  // Simulate database access with a delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Placeholder deck data
  const mockDecks: Record<string, DeckList> = {
    "defaultDeckP1": {
      deckId: "defaultDeckP1",
      name: "Player 1's Starter Deck",
      cards: [
        { cardId: "resource_001", quantity: 20 },
        { cardId: "creature_001", quantity: 4 },
        { cardId: "creature_002", quantity: 4 },
        { cardId: "spell_001", quantity: 2 },
        { cardId: "spell_002", quantity: 2 },
        // Add more cards to reach a reasonable deck size if needed for testing
      ],
    },
    "defaultDeckP2": {
      deckId: "defaultDeckP2",
      name: "Player 2's Starter Deck",
      cards: [
        { cardId: "resource_001", quantity: 20 },
        { cardId: "creature_003", quantity: 4 },
        { cardId: "creature_004", quantity: 4 },
        { cardId: "spell_003", quantity: 2 },
        { cardId: "spell_004", quantity: 2 },
      ],
    },
  };

  const deck = mockDecks[deckId];
  if (deck) {
    console.log(`[DeckService] Found deck: ${deck.name}`);
    return deck;
  }
  console.warn(`[DeckService] Deck with ID ${deckId} not found.`);
  return null;
}

export const DeckService = {
  fetchDeck: fetchDeckFromDB,
};
