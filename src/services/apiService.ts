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

  // Future API functions can be added here, e.g.:
  // async getDeckById(deckId: string): Promise<DeckDetails> { ... }
  // async saveDeck(deckData: DeckData): Promise<DeckBasicInfo> { ... }
  // async getCards(page: number, pageSize: number): Promise<PaginatedCardsResponse> { ... }
};

export default apiService;
