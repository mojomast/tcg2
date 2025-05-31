// src/services/apiService.ts

// Define DeckBasicInfo interface locally for frontend use
interface DeckBasicInfo {
  id: string;
  name: string;
  player_id: string; 
  format?: string;
  description?: string;
  created_at: string; 
  updated_at: string; 
}

// Interface for card search response
interface CardSearchResponse {
  cards: Card[];
  pagination: {
    totalCards: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Basic Card interface for the frontend (subset of the full card interface)
interface Card {
  id: string;
  name: string;
  type: string;
  rarity: string;
  cost?: any;
  rulesText?: string;
  attack?: number;
  health?: number;
  colorIdentity?: string[];
  imageUrl?: string;
}

// Interface for generated deck response
interface GeneratedDeckResponse {
  success: boolean;
  deck: {
    name: string;
    colors: string[];
    totalCards: number;
    mainBoard: DeckEntry[];
    sideBoard: DeckEntry[];
  };
  message: string;
}

// Interface for deck entries
interface DeckEntry {
  cardId: string;
  quantity: number;
}

const API_BASE_URL = '/api'; // Assuming your API routes are prefixed with /api

export const apiService = {
  /**
   * Fetches all decks from the backend.
   */
  async getAllDecks(): Promise<DeckBasicInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch decks and parse error response' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const decks: DeckBasicInfo[] = await response.json();
      return decks;
    } catch (error) {
      console.error('Error fetching all decks:', error);
      // Re-throw or handle as appropriate for your frontend error strategy
      // For now, re-throwing to let the component handle it.
      throw error;
    }
  },

  /**
   * Searches for cards with optional filters
   */
  async searchCards(searchParams: {
    page?: number;
    pageSize?: number;
    search?: string;
    manaType?: string[];
    cardType?: string;
    cmc?: number;
    rarity?: string;
  }): Promise<CardSearchResponse> {
    try {
      const params = new URLSearchParams();
      
      if (searchParams.page) params.append('page', searchParams.page.toString());
      if (searchParams.pageSize) params.append('pageSize', searchParams.pageSize.toString());
      if (searchParams.search) params.append('search', searchParams.search);
      if (searchParams.cardType) params.append('cardType', searchParams.cardType);
      if (searchParams.cmc !== undefined) params.append('cmc', searchParams.cmc.toString());
      if (searchParams.rarity) params.append('rarity', searchParams.rarity);
      
      // Handle multiple mana types
      if (searchParams.manaType && searchParams.manaType.length > 0) {
        searchParams.manaType.forEach(color => {
          params.append('manaType', color);
        });
      }
      
      const response = await fetch(`${API_BASE_URL}/cards?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to search cards and parse error response' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error searching cards:', error);
      throw error;
    }
  },

  /**
   * Generates a new deck based on provided parameters
   */
  async generateDeck(generateParams: {
    colors: string[];
    totalCards?: number;
    landRatio?: number;
    creatureRatio?: number;
    spellRatio?: number;
    deckName?: string;
    playerId: string;
  }): Promise<GeneratedDeckResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-deck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          colors: generateParams.colors,
          totalCards: generateParams.totalCards || 60,
          landRatio: generateParams.landRatio || 0.4,
          creatureRatio: generateParams.creatureRatio || 0.35,
          spellRatio: generateParams.spellRatio || 0.25,
          deckName: generateParams.deckName,
          playerId: generateParams.playerId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate deck and parse error response' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating deck:', error);
      throw error;
    }
  },

  // Future API functions can be added here, e.g.:
  // async getDeckById(deckId: string): Promise<DeckDetails> { ... }
  // async saveDeck(deckData: DeckData): Promise<DeckBasicInfo> { ... }
  // async getCards(page: number, pageSize: number): Promise<PaginatedCardsResponse> { ... }
};

export default apiService;
