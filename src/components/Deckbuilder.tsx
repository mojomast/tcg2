import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService'; // Import the new service
import CardSearchPanel from './CardSearchPanel';
import GenerateDeckModal from './GenerateDeckModal';
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
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);

  // Function to refresh the decks list
  const refreshDecks = async () => {
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

  useEffect(() => {
    refreshDecks();
  }, []); // Empty dependency array means this runs once on mount

  const handleGenerateDeck = (params: any) => {
    console.log('Deck generated with params:', params);
    setGenerationSuccess(`Deck "${params.deckName}" generated successfully!`);
    setShowGenerateModal(false);
    // Refresh the decks list to show the new deck
    refreshDecks();
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setGenerationSuccess(null);
    }, 5000);
  };

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
          <button 
            onClick={() => setShowGenerateModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Generate New Deck
          </button>
        </div>

        <div className="deck-editor-panel">
          <h2>Current Deck: [Deck Name]</h2>
          <p>Cards in the current deck will appear here.</p>
          <button>Save Deck</button>
        </div>

        <div className="card-search-panel">
          <CardSearchPanel 
            onCardSelect={(card) => {
              console.log('Card selected:', card.name);
              // TODO: Add card to current deck
            }}
          />
        </div>
      </div>
      
      {/* Generate Deck Modal */}
      <GenerateDeckModal 
        isVisible={showGenerateModal}
        onGenerate={handleGenerateDeck}
        onClose={() => setShowGenerateModal(false)}
        playerId="player1" // TODO: Get actual player ID from context/props
      />
      
      {/* Success Message */}
      {generationSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '12px 16px',
          borderRadius: '4px',
          border: '1px solid #c3e6cb',
          zIndex: 1001,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          ✅ {generationSuccess}
        </div>
      )}
    </div>
  );
};

export default Deckbuilder;
