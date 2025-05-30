import React, { useState } from 'react';
import { Card } from '../types/gameState';

interface HandDisplayProps {
  cards: Card[];
  playerName: string; // To label whose hand this is
  currentEnergy: number; // Add currentEnergy prop
}

const HandDisplay: React.FC<HandDisplayProps> = ({ cards, playerName, currentEnergy }) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [canAffordSelected, setCanAffordSelected] = useState<boolean>(true);

  const handleCardClick = (card: Card) => {
    setSelectedCardId(card.id);
    const affordable = card.cost <= currentEnergy;
    setCanAffordSelected(affordable);
    console.log(`Card clicked: ${card.name} (ID: ${card.id}), Cost: ${card.cost}, Current Energy: ${currentEnergy}, Affordable: ${affordable}`, card);
    // Future: This could also call a prop function like onCardSelect(card)
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="hand-display" style={{ border: '1px solid lightblue', padding: '10px', margin: '10px 0' }}>
        <h4>{playerName}'s Hand</h4>
        <p>No cards in hand.</p>
      </div>
    );
  }

  return (
    <div className="hand-display" style={{ border: '1px solid lightblue', padding: '10px', margin: '10px 0' }}>
      <h4>{playerName}'s Hand</h4>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {cards.map(card => (
          <li 
            key={card.id} 
            onClick={() => handleCardClick(card)} 
            style={{
              border: '1px solid #eee', 
              padding: '8px', 
              marginBottom: '5px', 
              backgroundColor: selectedCardId === card.id 
                ? (canAffordSelected ? 'lightblue' : 'lightcoral') 
                : '#f9f9f9', // Highlight selected card: blue if affordable, red if not
              cursor: 'pointer', 
            }}
          >
            <strong>{card.name}</strong> ({card.type}) - Cost: {card.cost}
            {/* Future: Add onClick for card selection/playing */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HandDisplay;
