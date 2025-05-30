import React, { useState, useEffect } from 'react';

export interface DeckInfo {
  id: string;
  name: string;
  cardCount?: number;
  isValid?: boolean;
  validationErrors?: string[];
}

export interface DeckSelectionModalProps {
  isVisible?: boolean;
  isOpen?: boolean;
  availableDecks: DeckInfo[];
  problematicDeckId?: string | null;
  onSelectDeck: (deckId: string) => void;
  onCancel: () => void;
  playerId: string;
}

const DeckSelectionModal: React.FC<DeckSelectionModalProps> = ({
  isVisible,
  isOpen,
  availableDecks,
  problematicDeckId,
  onSelectDeck,
  onCancel,
  playerId
}) => {
  // Support both isVisible and isOpen props
  const isModalVisible = isVisible || isOpen || false;
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [validationResults, setValidationResults] = useState<{ [deckId: string]: { valid: boolean; errors: string[] } }>({});

  useEffect(() => {
    if (isModalVisible && availableDecks.length > 0) {
      // Auto-select the first valid deck if none selected
      const firstValidDeck = availableDecks.find(deck => deck.isValid !== false);
      if (firstValidDeck && !selectedDeckId) {
        setSelectedDeckId(firstValidDeck.id);
      }
    }
  }, [isModalVisible, availableDecks, selectedDeckId]);

  const handleSelectDeck = () => {
    if (selectedDeckId) {
      onSelectDeck(selectedDeckId);
    }
  };

  const handleValidateDeck = async (deckId: string) => {
    try {
      const response = await fetch('/api/validate-deck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deckId })
      });
      
      const result = await response.json();
      setValidationResults(prev => ({
        ...prev,
        [deckId]: {
          valid: result.valid,
          errors: result.errors || []
        }
      }));
    } catch (error) {
      console.error('Error validating deck:', error);
      setValidationResults(prev => ({
        ...prev,
        [deckId]: {
          valid: false,
          errors: ['Failed to validate deck - server error']
        }
      }));
    }
  };

  if (!isModalVisible) {
    return null;
  }

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2 style={{ marginTop: 0, color: '#333' }}>
          Select Deck for {playerId}
        </h2>
        
        {problematicDeckId && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            marginBottom: '16px',
            color: '#c33'
          }}>
            <strong>Deck Error:</strong> The previously selected deck '{problematicDeckId}' has issues. 
            Please select a different deck.
          </div>
        )}
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '8px', color: '#555' }}>Available Decks:</h3>
          {availableDecks.length === 0 ? (
            <p style={{ color: '#888' }}>No decks available. Please create a deck first.</p>
          ) : (
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {availableDecks.map(deck => {
                const validation = validationResults[deck.id];
                const isProblematic = deck.id === problematicDeckId;
                const isSelected = selectedDeckId === deck.id;
                
                return (
                  <div
                    key={deck.id}
                    onClick={() => setSelectedDeckId(deck.id)}
                    style={{
                      padding: '12px',
                      border: `2px solid ${isSelected ? '#007bff' : isProblematic ? '#dc3545' : '#ddd'}`,
                      borderRadius: '6px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f8f9fa' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: isProblematic ? '#dc3545' : '#333' }}>
                          {deck.name}
                        </strong>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          ID: {deck.id}
                          {deck.cardCount && ` • ${deck.cardCount} cards`}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleValidateDeck(deck.id);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Validate
                      </button>
                    </div>
                    
                    {validation && (
                      <div style={{ marginTop: '8px', fontSize: '14px' }}>
                        {validation.valid ? (
                          <div style={{ color: '#28a745' }}>✓ Deck is valid</div>
                        ) : (
                          <div style={{ color: '#dc3545' }}>
                            <div>✗ Deck has errors:</div>
                            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                              {validation.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {deck.validationErrors && deck.validationErrors.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#dc3545' }}>
                        <div>Known issues:</div>
                        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                          {deck.validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSelectDeck}
            disabled={!selectedDeckId}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedDeckId ? '#28a745' : '#cccccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedDeckId ? 'pointer' : 'not-allowed',
              fontSize: '16px'
            }}
          >
            Select Deck
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeckSelectionModal;

