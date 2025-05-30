// Placeholder for DeckService
// TODO: Implement actual deck loading and management logic

import { Card } from '../interfaces/card.js';
import { GameState, PlayerId } from '../interfaces/gameState.js';
import { db } from '../db/database.js'; // Import the database instance
import { DeckNotFoundError } from '../errors/customErrors.js';

export interface DeckList {
  deckId: string;
  name: string;
  cards: { cardId: string; quantity: number }[];
}

const DeckService = {
  async createDeck(deckId: string, playerId: string, name: string, cards: { cardId: string; quantity: number }[]): Promise<void> {
    console.log(`[DeckService] Creating deck: ${name} (ID: ${deckId}) for player ${playerId}`);
    const insertDeckStmt = db.prepare(`
      INSERT INTO decks (id, player_id, name, format, description, created_at, updated_at)
      VALUES (@id, @player_id, @name, @format, @description, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO NOTHING;
    `);

    const insertDeckCardStmt = db.prepare(`
      INSERT INTO deck_cards (deck_id, card_id, quantity, is_sideboard)
      VALUES (@deck_id, @card_id, @quantity, @is_sideboard)
      ON CONFLICT(deck_id, card_id, is_sideboard) DO NOTHING;
    `);

    // Use a transaction to ensure atomicity
    const transaction = db.transaction(() => {
      const deckInfo = insertDeckStmt.run({
        id: deckId,
        player_id: playerId,
        name: name,
        format: 'standard', // Default format, can be parameterized later
        description: `Default deck for ${playerId}`
      });

      if (deckInfo.changes === 0) {
        console.log(`[DeckService] Deck ${deckId} already exists. Skipping card insertions if deck was not newly created.`);
        // Optionally, you could decide to clear existing deck_cards and re-add, or update quantities.
        // For now, if deck exists, we assume its cards are also as intended or managed elsewhere.
        return; // Exit if deck wasn't newly inserted
      }

      for (const card of cards) {
        if (card.quantity <= 0) continue; // Skip if quantity is zero or less
        insertDeckCardStmt.run({
          deck_id: deckId,
          card_id: card.cardId,
          quantity: card.quantity,
          is_sideboard: 0 // Default to mainboard
        });
      }
      console.log(`[DeckService] Deck ${name} (ID: ${deckId}) and its cards created successfully.`);
    });

    try {
      transaction();
    } catch (error) {
      console.error(`[DeckService] Error creating deck ${deckId}:`, error);
      throw error; // Re-throw to allow caller to handle
    }
  },

  async fetchDeck(deckId: string): Promise<DeckList> {
    console.log(`[DeckService] Fetching deck from DB: ${deckId}`);
    try {
      // Fetch deck name
      const deckQuery = db.prepare('SELECT name FROM decks WHERE id = ?');
      const deckResult = deckQuery.get(deckId) as { name: string } | undefined;

      if (!deckResult) {
        console.warn(`[DeckService] Deck with ID ${deckId} not found in 'decks' table.`);
        // Throw custom error, playerId is not known at this point in fetchDeck
        throw new DeckNotFoundError(`Deck with ID ${deckId} not found.`, deckId);
      }

      // Fetch card IDs and quantities for the deck (mainboard only)
      const cardsQuery = db.prepare('SELECT card_id, quantity FROM deck_cards WHERE deck_id = ? AND is_sideboard = 0');
      const cardResults = cardsQuery.all(deckId) as { card_id: string; quantity: number }[];

      const cardsForDeckList = cardResults.map(row => ({
        cardId: row.card_id,
        quantity: row.quantity,
      }));

      const deck: DeckList = {
        deckId: deckId,
        name: deckResult.name,
        cards: cardsForDeckList,
      };

      console.log(`[DeckService] Found deck: ${deck.name} with ${deck.cards.length} unique card entries.`);
      return deck;
    } catch (error) {
      console.error(`[DeckService] Error fetching deck ${deckId}:`, error);
      // Re-throw original error if it's not a DeckNotFoundError, or wrap it
      if (error instanceof DeckNotFoundError) throw error;
      throw new Error(`An unexpected error occurred while fetching deck ${deckId}: ${(error as Error).message}`);
    }
  },

  async getPlayerDeckCards(deckId: string, cardDatabase: Map<string, Card>): Promise<Card[]> {
    console.log(`[DeckService] Getting player deck cards for: ${deckId}`);
    // fetchDeck now throws DeckNotFoundError if not found, or other errors.
    // We can catch DeckNotFoundError specifically if we need to add playerId to it here,
    // or let it propagate if playerId isn't critical for this specific error instance.
    // For now, let it propagate. If GameEngine needs playerId with this error, it can wrap it.
    const deckList = await this.fetchDeck(deckId);

    if (!deckList) {
      // This path should ideally be unreachable if fetchDeck always throws or returns a DeckList.
      // Adding for linter satisfaction or as a safeguard against unexpected behavior.
      console.error(`[DeckService] CRITICAL: fetchDeck returned null/undefined unexpectedly for deckId ${deckId} in getPlayerDeckCards.`);
      throw new Error(`DeckService critical error: Failed to retrieve deck ${deckId} after fetchDeck call.`);
    }

    const actualDeck: Card[] = [];
    for (const item of deckList.cards) {
      const baseCard = cardDatabase.get(item.cardId);
      if (baseCard) {
        for (let i = 0; i < item.quantity; i++) {
          // For now, we are returning base cards. Instance creation will happen in GameEngine.
          actualDeck.push({ ...baseCard }); 
        }
      } else {
        console.warn(`[DeckService] Card ID ${item.cardId} not found in cardDatabase while building deck ${deckId}.`);
      }
    }
    console.log(`[DeckService] Deck ${deckId} constructed with ${actualDeck.length} cards.`);
    return actualDeck;
  },

  /**
   * Validates a deck according to standard format rules.
   * @param deckList The deck to validate
   * @param cardDatabase Optional card database for additional validation
   * @returns Validation result with detailed error messages
   */
  validateDeck(deckList: DeckList, cardDatabase?: Map<string, Card>): { valid: boolean, errors: string[] } {
    console.log(`[DeckService] Validating deck: ${deckList.name} (${deckList.deckId})`);
    const errors: string[] = [];
    
    // Calculate total card count
    const totalCards = deckList.cards.reduce((sum, entry) => sum + entry.quantity, 0);
    
    // Check 1: Minimum deck size (60 cards for standard format)
    if (totalCards < 60) {
      errors.push(`Deck has ${totalCards} cards but requires minimum 60 cards for standard format.`);
    }
    
    // Check 2: Maximum 4 copies of any non-basic land card
    const cardCounts = new Map<string, number>();
    for (const entry of deckList.cards) {
      cardCounts.set(entry.cardId, entry.quantity);
      
      // Skip basic lands (they have unlimited copies)
      const isBasicLand = entry.cardId.startsWith('basic-') || 
                          entry.cardId.includes('-basic-') ||
                          (cardDatabase && cardDatabase.get(entry.cardId)?.name?.match(/^(Plains|Island|Swamp|Mountain|Forest)$/));
      
      if (!isBasicLand && entry.quantity > 4) {
        const cardName = cardDatabase?.get(entry.cardId)?.name || entry.cardId;
        errors.push(`Card '${cardName}' has ${entry.quantity} copies but maximum allowed is 4.`);
      }
    }
    
    // Check 3: All card IDs exist in card database (if provided)
    if (cardDatabase) {
      for (const entry of deckList.cards) {
        if (!cardDatabase.has(entry.cardId)) {
          errors.push(`Card ID '${entry.cardId}' not found in card database.`);
        }
      }
    }
    
    // Check 4: No negative quantities
    const negativeQuantities = deckList.cards.filter(entry => entry.quantity <= 0);
    if (negativeQuantities.length > 0) {
      negativeQuantities.forEach(entry => {
        errors.push(`Card '${entry.cardId}' has invalid quantity: ${entry.quantity}`);
      });
    }
    
    const isValid = errors.length === 0;
    
    if (isValid) {
      console.log(`[DeckService] Deck '${deckList.name}' validation passed. ${totalCards} cards total.`);
    } else {
      console.warn(`[DeckService] Deck '${deckList.name}' validation failed with ${errors.length} errors:`);
      errors.forEach((error, index) => {
        console.warn(`  ${index + 1}. ${error}`);
      });
    }
    
    return { valid: isValid, errors };
  },

  /**
   * Draws a card from the top of a player's library to their hand.
   * Updates deck_count and handles empty deck scenarios.
   * This is a wrapper around GameEngine.playerDrawCard() for external use.
   * @param gameState The current game state
   * @param playerId The player drawing the card
   * @returns true if card was drawn successfully, false if library is empty
   */
  drawCard(gameState: GameState, playerId: PlayerId): boolean {
    console.log(`[DeckService] Draw card requested for player ${playerId}`);
    
    const playerState = gameState.players.find(p => p.playerId === playerId);
    if (!playerState) {
      console.error(`[DeckService] Player ${playerId} not found in game state.`);
      return false;
    }

    // Check if library is empty before attempting draw
    if (playerState.library.length === 0) {
      console.warn(`[DeckService] Player ${playerId} attempted to draw from empty library.`);
      return false;
    }

    // Perform the card draw (move from library to hand)
    const cardToDrawInstanceId = playerState.library.shift();
    if (cardToDrawInstanceId) {
      playerState.hand.push(cardToDrawInstanceId);
      
      // Update deck_count to reflect the change
      playerState.deck_count = playerState.library.length;
      
      // Update the card's zone in game objects
      const cardObject = gameState.gameObjects[cardToDrawInstanceId];
      if (cardObject) {
        cardObject.currentZone = 'hand';
      }
      
      console.log(`[DeckService] Player ${playerId} drew card ${cardToDrawInstanceId}. Hand: ${playerState.hand.length}, Library: ${playerState.library.length}`);
      return true;
    }
    
    // This shouldn't happen if library.length check passed, but safeguard
    console.error(`[DeckService] Failed to draw card for player ${playerId} despite non-empty library.`);
    return false;
  }
};

export default DeckService;
