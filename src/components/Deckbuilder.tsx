import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService'; // Import the new service
import './Deckbuilder.css';

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

interface DeckbuilderProps {
  onBack: () => void;
}

const Deckbuilder: React.FC<DeckbuilderProps> = ({ onBack }) => {
  const [decks, setDecks] = useState<DeckBasicInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedDecks = await apiService.getAllDecks();
        setDecks(fetchedDecks);
      } catch (err: any) {
        setError(err.message || 'Failed to load decks.');
        console.error('Deckbuilder fetchDecks error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDecks();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="deckbuilder-container">
      <div className="deckbuilder-header">
        <h1>Deckbuilder</h1>
        <button onClick={onBack} className="back-button">
          Back to Main Menu
        </button>
      </div>
      
      <div className="deckbuilder-layout">
        <div className="deck-list-panel">
          <h2>My Decks</h2>
          {isLoading && <p>Loading decks...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          {!isLoading && !error && (
            decks.length > 0 ? (
              <ul>
                {decks.map((deck) => (
                  <li key={deck.id} onClick={() => console.log('Load deck:', deck.name)} style={{cursor: 'pointer'}}>
                    {deck.name} (ID: {deck.id.substring(0,8)}) - Last Updated: {new Date(deck.updated_at).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No decks found. Create one!</p>
            )
          )}
          <button>New Deck</button>
        </div>

        <div className="deck-editor-panel">
          <h2>Current Deck: [Deck Name]</h2>
          <p>Cards in the current deck will appear here.</p>
          <button>Save Deck</button>
        </div>

        <div className="card-search-panel">
          <h2>Card Search & Filter</h2>
          <p>Card search and filtering options will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default Deckbuilder;
