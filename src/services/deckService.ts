// DeckService - Comprehensive deck management with database operations
// Handles CRUD operations for decks and deck_cards tables with transaction support

import { Card } from '../interfaces/card.js';
import { GameState, PlayerId } from '../interfaces/gameState.js';
import { db } from '../db/database.js'; // Import the database instance
import { DeckNotFoundError } from '../errors/customErrors.js';
import cardService from './cardService.js';
import { type DeckDetails, type DeckCardEntry, type DeckBasicInfo } from './apiService.js';

export interface DeckList {
  deckId: string;
  name: string;
  cards: { cardId: string; quantity: number }[];
}

export interface DeckInfo {
  id: string;
  player_id: string;
  name: string;
  format?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DeckCard {
  deck_id: string;
  card_id: string;
  quantity: number;
  is_sideboard: number; // 0 for mainboard, 1 for sideboard
}

const DeckService = {
  /**
   * Gets a deck by its ID with full deck information
   * @param deckId The deck ID to retrieve
   * @returns Complete deck information including metadata
   */
  async getDeckById(deckId: string): Promise<DeckDetails> {
    console.log(`[DeckService] Getting deck by ID: ${deckId}`);
    try {
      const deckQuery = db.prepare(`
        SELECT id, player_id, name, format, description, created_at, updated_at 
        FROM decks 
        WHERE id = ?
      `);
      const deck = deckQuery.get(deckId) as DeckInfo | undefined;

      if (!deck) {
        throw new DeckNotFoundError(`Deck with ID ${deckId} not found.`, deckId);
      }

      console.log(`[DeckService] Found deck basic info: ${deck.name} owned by ${deck.player_id}`);

      // Fetch all card entries for the deck
      const deckCardEntriesQuery = db.prepare('SELECT card_id, quantity, is_sideboard FROM deck_cards WHERE deck_id = ? ORDER BY is_sideboard, card_id');
      const rawDeckCards = deckCardEntriesQuery.all(deckId) as { card_id: string; quantity: number; is_sideboard: number }[];

      const populatedMainBoard: DeckCardEntry[] = [];
      const populatedSideBoard: DeckCardEntry[] = [];
      let totalDeckCards = 0;

      for (const rawEntry of rawDeckCards) {
        // Fetch full card details for each entry
        // Note: cardService.getCardById might throw CardNotFoundError if a card ID is invalid
        // This should be handled or ensured by data integrity.
        const cardDetail = cardService.getCardById(rawEntry.card_id);
        if (cardDetail) {
          const deckCardEntry: DeckCardEntry = {
            cardId: cardDetail.id,
            card: cardDetail,
            quantity: rawEntry.quantity
          };
          if (rawEntry.is_sideboard === 0) {
            populatedMainBoard.push(deckCardEntry);
            totalDeckCards += rawEntry.quantity;
          } else {
            populatedSideBoard.push(deckCardEntry);
          }
        } else {
          // This case means a card_id in deck_cards does not exist in the cards table.
          // This indicates a data integrity issue.
          // Depending on desired behavior, could throw an error, log a warning, or skip.
          console.warn(`[DeckService] Card with ID ${rawEntry.card_id} not found for deck ${deckId}. Skipping entry.`);
        }
      }

      return {
        id: deck.id,
        name: deck.name,
        description: deck.description || '',
        mainBoard: populatedMainBoard,
        sideBoard: populatedSideBoard,
        totalCards: totalDeckCards,
        player_id: deck.player_id, 
        format: deck.format,       
        created_at: deck.created_at,
        updated_at: deck.updated_at 
      };
    } catch (error) {
      console.error(`[DeckService] Error getting deck ${deckId}:`, error);
      if (error instanceof DeckNotFoundError) throw error;
      throw new Error(`Failed to retrieve deck ${deckId}: ${(error as Error).message}`);
    }
  },

  /**
   * Creates a new deck with the provided information and cards
   * @param deckId Unique identifier for the deck
   * @param playerId The player who owns the deck
   * @param name Name of the deck
   * @param cards Array of cards with quantities to add to the deck
   * @param format Optional format (defaults to 'standard')
   * @param description Optional description
   */
  async createDeck(deckId: string, playerId: string, name: string, cards: { cardId: string; quantity: number }[], format?: string, description?: string): Promise<void> {
    console.log(`[DeckService] Creating deck: ${name} (ID: ${deckId}) for player ${playerId}`);
    
    const insertDeckStmt = db.prepare(`
      INSERT INTO decks (id, player_id, name, format, description, created_at, updated_at)
      VALUES (@id, @player_id, @name, @format, @description, datetime('now'), datetime('now'))
    `);

    const insertDeckCardStmt = db.prepare(`
      INSERT INTO deck_cards (deck_id, card_id, quantity, is_sideboard)
      VALUES (@deck_id, @card_id, @quantity, @is_sideboard)
    `);

    // Use a transaction to ensure atomicity
    const transaction = db.transaction(() => {
      // Insert the deck
      const deckInfo = insertDeckStmt.run({
        id: deckId,
        player_id: playerId,
        name: name,
        format: format || 'standard',
        description: description || `Deck for ${playerId}`
      });

      if (deckInfo.changes === 0) {
        throw new Error(`Failed to create deck ${deckId}`);
      }

      // Insert deck cards
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
      throw error;
    }
  },

  /**
   * Updates an existing deck's information and optionally its cards
   * @param deckId The deck ID to update
   * @param updates Object containing fields to update
   * @param newCards Optional new card list to replace existing cards
   */
  async updateDeck(deckId: string, name: string | undefined, description: string | undefined, mainBoard: DeckCardEntry[], sideBoard: DeckCardEntry[]): Promise<DeckDetails> {
    console.log(`[DeckService] Updating deck: ${deckId}`);
    
    // First verify the deck exists
    await this.getDeckById(deckId);
    
    const updateDeckStmt = db.prepare(`
      UPDATE decks 
      SET name = COALESCE(@name, name),
          format = COALESCE(@format, format),
          description = COALESCE(@description, description),
          updated_at = datetime('now')
      WHERE id = @id
    `);

    const deleteDeckCardsStmt = db.prepare(`
      DELETE FROM deck_cards WHERE deck_id = ?
    `);

    const insertDeckCardStmt = db.prepare(`
      INSERT INTO deck_cards (deck_id, card_id, quantity, is_sideboard)
      VALUES (@deck_id, @card_id, @quantity, @is_sideboard)
    `);

    // Use a transaction to maintain consistency
    const transaction = db.transaction(() => {
      // Update deck information
      const result = updateDeckStmt.run({
        id: deckId,
        name: name || null,
        description: description || null
      });

      if (result.changes === 0) {
        throw new Error(`Failed to update deck ${deckId}`);
      }

      // Always replace existing cards
      deleteDeckCardsStmt.run(deckId);
      
      // Insert new mainBoard cards
      for (const entry of mainBoard) {
        if (entry.quantity <= 0) continue;
        insertDeckCardStmt.run({
          deck_id: deckId,
          card_id: entry.cardId, // Assuming DeckCardEntry has cardId directly
          quantity: entry.quantity,
          is_sideboard: 0
        });
      }

      // Insert new sideBoard cards
      for (const entry of sideBoard) {
        if (entry.quantity <= 0) continue;
        insertDeckCardStmt.run({
          deck_id: deckId,
          card_id: entry.cardId, // Assuming DeckCardEntry has cardId directly
          quantity: entry.quantity,
          is_sideboard: 1
        });
      }
      const totalCardsProcessed = mainBoard.length + sideBoard.length;
      console.log(`[DeckService] Updated deck ${deckId} with ${totalCardsProcessed} card entries across main and side boards.`);
    });

    try {
      transaction();

      // Fetch the updated deck details to return
      const deckInfoQuery = db.prepare('SELECT id, name, description, player_id, format, created_at, updated_at FROM decks WHERE id = ?');
      const updatedDeckInfo = deckInfoQuery.get(deckId) as DeckInfo | undefined;

      if (!updatedDeckInfo) {
        // This should ideally not happen if the transaction succeeded and deck was verified
        throw new DeckNotFoundError(`Deck with ID ${deckId} not found after update.`, deckId);
      }

      const deckCardEntriesQuery = db.prepare('SELECT card_id, quantity, is_sideboard FROM deck_cards WHERE deck_id = ?');
      const rawDeckCards = deckCardEntriesQuery.all(deckId) as { card_id: string; quantity: number; is_sideboard: number }[];

      const populatedMainBoard: DeckCardEntry[] = [];
      const populatedSideBoard: DeckCardEntry[] = [];
      let totalDeckCards = 0;

      for (const rawEntry of rawDeckCards) {
        const cardDetail = cardService.getCardById(rawEntry.card_id);
        if (cardDetail) {
          const deckCardEntry: DeckCardEntry = {
            cardId: cardDetail.id,
            card: cardDetail,
            quantity: rawEntry.quantity
          };
          if (rawEntry.is_sideboard === 0) {
            populatedMainBoard.push(deckCardEntry);
            totalDeckCards += rawEntry.quantity;
          } else {
            populatedSideBoard.push(deckCardEntry);
          }
        }
      }

      return {
        id: updatedDeckInfo.id,
        name: updatedDeckInfo.name,
        description: updatedDeckInfo.description || '',
        mainBoard: populatedMainBoard,
        sideBoard: populatedSideBoard,
        totalCards: totalDeckCards,
        player_id: updatedDeckInfo.player_id, 
        format: updatedDeckInfo.format,       
        created_at: updatedDeckInfo.created_at,
        updated_at: updatedDeckInfo.updated_at 
      };
    } catch (error) {
      console.error(`[DeckService] Error updating deck ${deckId}:`, error);
      throw error;
    }
  },

  /**
   * Deletes a deck and all its associated cards
   * @param deckId The deck ID to delete
   */
  async deleteDeck(deckId: string): Promise<void> {
    console.log(`[DeckService] Deleting deck: ${deckId}`);
    
    // First verify the deck exists
    await this.getDeckById(deckId);
    
    const deleteDeckStmt = db.prepare(`DELETE FROM decks WHERE id = ?`);
    const deleteDeckCardsStmt = db.prepare(`DELETE FROM deck_cards WHERE deck_id = ?`);

    // Use a transaction to ensure both deletions succeed
    const transaction = db.transaction(() => {
      // Delete deck cards first due to foreign key constraint
      const cardsDeletionResult = deleteDeckCardsStmt.run(deckId);
      console.log(`[DeckService] Deleted ${cardsDeletionResult.changes} deck card entries`);
      
      // Delete the deck
      const deckDeletionResult = deleteDeckStmt.run(deckId);
      if (deckDeletionResult.changes === 0) {
        throw new Error(`Failed to delete deck ${deckId}`);
      }
      console.log(`[DeckService] Deleted deck ${deckId} successfully`);
    });

    try {
      transaction();
    } catch (error) {
      console.error(`[DeckService] Error deleting deck ${deckId}:`, error);
      throw error;
    }
  },

  /**
   * Gets all cards in a deck with their quantities
   * @param deckId The deck ID to get cards for
   * @param includeSideboard Whether to include sideboard cards (default: false)
   * @returns Array of deck cards with quantities
   */
  async getDeckCards(deckId: string, includeSideboard: boolean = false): Promise<DeckCard[]> {
    console.log(`[DeckService] Getting cards for deck: ${deckId}, includeSideboard: ${includeSideboard}`);
  
  // First verify the deck exists by a lightweight query to avoid recursion
  const deckExistsQuery = db.prepare('SELECT id FROM decks WHERE id = ?');
  const deckExistsResult = deckExistsQuery.get(deckId) as { id: string } | undefined;
  if (!deckExistsResult) {
    throw new DeckNotFoundError(`Deck with ID ${deckId} not found when attempting to get its cards.`, deckId);
  }
  
  try {
      const query = includeSideboard
        ? 'SELECT deck_id, card_id, quantity, is_sideboard FROM deck_cards WHERE deck_id = ? ORDER BY is_sideboard, card_id'
        : 'SELECT deck_id, card_id, quantity, is_sideboard FROM deck_cards WHERE deck_id = ? AND is_sideboard = 0 ORDER BY card_id';
      
      const cardsQuery = db.prepare(query);
      const cards = cardsQuery.all(deckId) as DeckCard[];
      
      console.log(`[DeckService] Found ${cards.length} cards in deck ${deckId}`);
      return cards;
    } catch (error) {
      console.error(`[DeckService] Error getting cards for deck ${deckId}:`, error);
      throw new Error(`Failed to retrieve cards for deck ${deckId}: ${(error as Error).message}`);
    }
  },

  // Keep the existing createDeck method for backward compatibility, but mark as deprecated
  /** @deprecated Use the new createDeck method with additional parameters */
  async createDeckLegacy(deckId: string, playerId: string, name: string, cards: { cardId: string; quantity: number }[]): Promise<void> {
    console.log(`[DeckService] Creating deck (legacy): ${name} (ID: ${deckId}) for player ${playerId}`);
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
