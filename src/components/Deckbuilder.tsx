import React, { useState, useEffect } from 'react';
import apiService, { DeckBasicInfo, DeckDetails, DeckCardEntry } from '../services/apiService'; // Import the service and types
import CardSearchPanel from './CardSearchPanel';
import GenerateDeckModal from './GenerateDeckModal';
import './Deckbuilder.css';

interface DeckbuilderProps {
  onBack: () => void;
}

const Deckbuilder: React.FC<DeckbuilderProps> = ({ onBack }) => {
  const [decks, setDecks] = useState<DeckBasicInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);
  
  // State for selected deck
  const [selectedDeck, setSelectedDeck] = useState<DeckDetails | null>(null);
  const [loadingDeck, setLoadingDeck] = useState<boolean>(false);
  const [deckLoadError, setDeckLoadError] = useState<string | null>(null);

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

  // Function to handle deck selection and loading
  const handleDeckSelect = async (deck: DeckBasicInfo) => {
    try {
      setLoadingDeck(true);
      setDeckLoadError(null);
      
      const deckDetails = await apiService.getDeckById(deck.id);
      setSelectedDeck(deckDetails);
    } catch (err: any) {
      setDeckLoadError(err.message || 'Failed to load deck details.');
      console.error('Error loading deck:', err);
    } finally {
      setLoadingDeck(false);
    }
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
                  <li 
                    key={deck.id} 
                    onClick={() => handleDeckSelect(deck)} 
                    style={{
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      backgroundColor: selectedDeck?.id === deck.id ? '#e7f3ff' : 'transparent',
                      border: selectedDeck?.id === deck.id ? '1px solid #007bff' : '1px solid transparent'
                    }}
                  >
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
          {loadingDeck && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>Loading deck details...</p>
            </div>
          )}
          
          {deckLoadError && (
            <div style={{ padding: '20px', color: 'red' }}>
              <p>Error loading deck: {deckLoadError}</p>
            </div>
          )}
          
          {selectedDeck ? (
            <div>
              <h2>Current Deck: {selectedDeck.name}</h2>
              <div style={{ marginBottom: '16px' }}>
                <p><strong>Total Cards:</strong> {selectedDeck.totalCards}</p>
                <p><strong>Format:</strong> {selectedDeck.format || 'Standard'}</p>
                {selectedDeck.description && (
                  <p><strong>Description:</strong> {selectedDeck.description}</p>
                )}
              </div>
              
              {/* Main Board */}
              <div style={{ marginBottom: '20px' }}>
                <h3>Main Board ({selectedDeck.mainBoard.reduce((total, entry) => total + entry.quantity, 0)} cards)</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px' }}>
                  {selectedDeck.mainBoard.length > 0 ? (
                    selectedDeck.mainBoard.map((entry, index) => (
                      <div key={`${entry.cardId}-${index}`} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '4px 8px',
                        borderBottom: '1px solid #eee'
                      }}>
                        <span>{entry.card.name}</span>
                        <span>x{entry.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#666' }}>No cards in main board</p>
                  )}
                </div>
              </div>
              
              {/* Side Board */}
              {selectedDeck.sideBoard.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3>Side Board ({selectedDeck.sideBoard.reduce((total, entry) => total + entry.quantity, 0)} cards)</h3>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px' }}>
                    {selectedDeck.sideBoard.map((entry, index) => (
                      <div key={`${entry.cardId}-${index}`} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '4px 8px',
                        borderBottom: '1px solid #eee'
                      }}>
                        <span>{entry.card.name}</span>
                        <span>x{entry.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>Save Deck</button>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              <h2>Current Deck</h2>
              <p>Select a deck from the list to view and edit its contents.</p>
            </div>
          )}
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
