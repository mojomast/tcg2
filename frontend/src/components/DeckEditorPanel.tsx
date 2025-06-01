import React, { useState } from 'react';
import './DeckEditorPanel.css';

// Define the structure for a deck card with quantity
interface DeckCard {
  id: string;
  name: string;
  type: string;
  cost: number;
  quantity: number;
}

// Define the structure for grouped cards by type
interface GroupedCards {
  [cardType: string]: DeckCard[];
}

// Props interface for the DeckEditorPanel
interface DeckEditorPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

// Mock deck data - in a real app, this would come from a service
const mockDeckCards: DeckCard[] = [
  { id: 'card001', name: 'Lightning Bolt', type: 'Spell', cost: 1, quantity: 4 },
  { id: 'card002', name: 'Fireball', type: 'Spell', cost: 3, quantity: 2 },
  { id: 'card003', name: 'Counterspell', type: 'Spell', cost: 2, quantity: 3 },
  { id: 'card004', name: 'Grizzly Bears', type: 'Creature', cost: 2, quantity: 4 },
  { id: 'card005', name: 'Serra Angel', type: 'Creature', cost: 5, quantity: 2 },
  { id: 'card006', name: 'Elite Vanguard', type: 'Creature', cost: 1, quantity: 3 },
  { id: 'card007', name: 'Plains', type: 'Land', cost: 0, quantity: 8 },
  { id: 'card008', name: 'Island', type: 'Land', cost: 0, quantity: 6 },
  { id: 'card009', name: 'Mountain', type: 'Land', cost: 0, quantity: 4 },
  { id: 'card010', name: 'Healing Potion', type: 'Artifact', cost: 1, quantity: 2 },
  { id: 'card011', name: 'Sword of Power', type: 'Artifact', cost: 4, quantity: 1 },
];

const DeckEditorPanel: React.FC<DeckEditorPanelProps> = ({ isVisible, onClose }) => {
  const [deckCards, setDeckCards] = useState<DeckCard[]>(mockDeckCards);
  const [hasChanges, setHasChanges] = useState(false);

  // Group cards by type
  const groupedCards: GroupedCards = deckCards.reduce((acc, card) => {
    if (!acc[card.type]) {
      acc[card.type] = [];
    }
    acc[card.type].push(card);
    return acc;
  }, {} as GroupedCards);

  // Sort card types for consistent display order
  const sortedCardTypes = Object.keys(groupedCards).sort((a, b) => {
    const typeOrder = ['Land', 'Creature', 'Spell', 'Artifact', 'Enchantment'];
    const aIndex = typeOrder.indexOf(a);
    const bIndex = typeOrder.indexOf(b);
    
    // If both types are in the order array, sort by their position
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    // If only one is in the order array, put it first
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    // If neither is in the order array, sort alphabetically
    return a.localeCompare(b);
  });

  // Handle removing/decrementing a card
  const handleRemoveCard = (cardId: string) => {
    setDeckCards(prevCards => {
      const updatedCards = prevCards.map(card => {
        if (card.id === cardId) {
          const newQuantity = card.quantity - 1;
          return newQuantity > 0 ? { ...card, quantity: newQuantity } : null;
        }
        return card;
      }).filter(card => card !== null) as DeckCard[];
      
      setHasChanges(true);
      return updatedCards;
    });
  };

  // Calculate total deck size
  const totalDeckSize = deckCards.reduce((total, card) => total + card.quantity, 0);

  // Handle save deck
  const handleSaveDeck = () => {
    // TODO: Implement actual save functionality
    console.log('Saving deck:', deckCards);
    setHasChanges(false);
    // Here you would typically call a service to save the deck
    alert('Deck saved successfully!');
  };

  if (!isVisible) return null;

  return (
    <div className="deck-editor-overlay">
      <div className="deck-editor-panel">
        <div className="deck-editor-header">
          <h2>Deck Editor</h2>
          <div className="deck-stats">
            <span className="deck-size">Total Cards: {totalDeckSize}</span>
            <button className="close-button" onClick={onClose} aria-label="Close deck editor">
              ×
            </button>
          </div>
        </div>
        
        <div className="deck-editor-content">
          {sortedCardTypes.map(cardType => (
            <div key={cardType} className="card-type-section">
              <h3 className="card-type-header">
                {cardType}s ({groupedCards[cardType].reduce((sum, card) => sum + card.quantity, 0)})
              </h3>
              
              <div className="card-type-table">
                <div className="table-header">
                  <span className="col-name">Name</span>
                  <span className="col-cost">Cost</span>
                  <span className="col-quantity">Qty</span>
                  <span className="col-actions">Actions</span>
                </div>
                
                {groupedCards[cardType]
                  .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name))
                  .map(card => (
                    <div key={card.id} className="table-row">
                      <span className="col-name" title={card.name}>{card.name}</span>
                      <span className="col-cost">{card.cost}</span>
                      <span className="col-quantity">{card.quantity}</span>
                      <span className="col-actions">
                        <button 
                          className="remove-card-button"
                          onClick={() => handleRemoveCard(card.id)}
                          title={`Remove one ${card.name}`}
                        >
                          −
                        </button>
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          ))}
        </div>
        
        <div className="deck-editor-footer">
          <button 
            className={`save-deck-button ${hasChanges ? 'has-changes' : ''}`}
            onClick={handleSaveDeck}
            disabled={!hasChanges}
          >
            {hasChanges ? 'Save Deck *' : 'Deck Saved'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeckEditorPanel;

