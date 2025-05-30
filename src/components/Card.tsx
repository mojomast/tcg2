import React from 'react';
import { Card as CardData, ManaCost } from '../interfaces/card';
import './Card.css';

interface CardProps {
  card: CardData;
  isTapped?: boolean;
}

// Helper function to format mana cost
const formatManaCost = (cost: ManaCost): string => {
  let costString = '';
  if (cost.C) costString += `${cost.C}`;
  if (cost.W) costString += 'W'.repeat(cost.W);
  if (cost.U) costString += 'U'.repeat(cost.U);
  if (cost.B) costString += 'B'.repeat(cost.B);
  if (cost.R) costString += 'R'.repeat(cost.R);
  if (cost.G) costString += 'G'.repeat(cost.G);
  return costString || '0'; // Show '0' if cost is empty (e.g., for lands)
};

const Card: React.FC<CardProps> = ({ card, isTapped = false }) => {
  const cardClassName = `card-component ${isTapped ? 'tapped' : ''}`;

  return (
    <div className={cardClassName}>
      <div className="card-header">
        <span className="card-name">{card.name}</span>
        <span className="card-cost">{formatManaCost(card.cost)}</span>
      </div>
      {card.imageUrl && (
        <div className="card-image-container">
          <img src={card.imageUrl} alt={card.name} className="card-image" />
        </div>
      )}
      <div className="card-type">
        {card.type}
        {card.subtype && ` - ${card.subtype}`}
      </div>
      {card.rulesText && <div className="card-rules-text">{card.rulesText}</div>}
      {(card.attack !== undefined || card.health !== undefined) && (
        <div className="card-power-toughness">
          {card.attack}/{card.health}
        </div>
      )}
    </div>
  );
};

export default Card;
