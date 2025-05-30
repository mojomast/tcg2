import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { playCardViaSocket, playResourceViaSocket, tapCardViaSocket } from '../store/slices/gameSlice';
import ContextMenu from './ContextMenu'; // Import the new component

interface ContextMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
import { ManaCost, Card as CardInterface } from '../interfaces/card'; // ManaCost is part of static card data
import { ManaColor } from '../interfaces/gameState'; // ManaColor is defined here
import { BattlefieldCard } from '../interfaces/gameState'; // For dynamic battlefield state
import './Card.css';

interface CardProps {
  card: BattlefieldCard;
  isAnimatingOut?: boolean;
  cardLocation: 'hand' | 'battlefield'; // New prop
  isOwner: boolean; // New prop to know if the local player owns this card
}

// Mana symbol to emoji mapping
const manaSymbolToEmoji: { [key: string]: string } = {
  W: '⚪️',
  U: '💧',
  B: '💀',
  R: '🔥',
  G: '🌳',
};

// Helper function to format mana cost
const formatManaCost = (cost: ManaCost): string => {
  if (!cost || Object.keys(cost).length === 0) return '0';

  let costString = '';
  if (cost.C && cost.C > 0) { // Ensure C is a positive number
    costString += `${cost.C}`;
  }

  const colorOrder: (keyof ManaCost)[] = ['W', 'U', 'B', 'R', 'G'];
  
  for (const color of colorOrder) {
    const colorValue = cost[color];
    if (colorValue && colorValue > 0) { // Ensure colorValue is a positive number
      const emoji = manaSymbolToEmoji[color as string];
      if (emoji) {
        costString += emoji.repeat(colorValue as number);
      } else {
        costString += (color as string).repeat(colorValue as number);
      }
    }
  }
  return costString || '0';
};

// Helper function to determine background color class based on color identity
const getCardBackgroundColorClass = (colorIdentity: string[] | undefined): string => {
    if (!colorIdentity || colorIdentity.length === 0) {
    return 'card-bg-colorless';
  }
  if (colorIdentity.length === 1) {
    // We assume the strings in colorIdentity match ManaColor values ('W', 'U', etc.)
    switch (colorIdentity[0]) {
      case 'W': return 'card-bg-white';
      case 'U': return 'card-bg-blue';
      case 'B': return 'card-bg-black';
      case 'R': return 'card-bg-red';
      case 'G': return 'card-bg-green';
      default: return 'card-bg-colorless';
    }
  }
  // For 2+ colors, use a generic multicolor/gold style
  return 'card-bg-multicolor';
};


const CardComponent: React.FC<CardProps> = ({ card, isAnimatingOut, cardLocation, isOwner }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { localPlayerId, players, gameObjects, currentPhase, currentStep, activePlayerId, priorityPlayerId } = useSelector((state: RootState) => state.game);
  const localPlayer = players.find(p => p.playerId === localPlayerId);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  let cardClassName = `card-component ${card.tapped ? 'tapped' : ''}`;
  if (card.summoningSickness) {
    cardClassName += ' summoning-sickness';
  }
  cardClassName += ` ${getCardBackgroundColorClass(card.colorIdentity)}`;
  if (isAnimatingOut) {
    cardClassName += ' card--animating-out';
  }

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const items: ContextMenuItem[] = [];

    // Common item
    items.push({ label: 'View Details', onClick: () => console.log('View Details:', card.name), disabled: true }); // Placeholder

    if (cardLocation === 'hand' && isOwner && localPlayer) {
      const isPlayerTurn = activePlayerId === localPlayerId;
      const hasPriority = priorityPlayerId === localPlayerId;
      const isMainPhase = currentStep === 'MAIN_PRE' || currentStep === 'MAIN_POST';
      const isResource = card.type === 'Resource';
      
      let canPlay = isPlayerTurn && hasPriority && isMainPhase;
      if (isResource) {
        canPlay = canPlay && !localPlayer.hasPlayedResourceThisTurn;
      } else {
        // Simplified mana check for now, real check is in PlayerBattlefield
        canPlay = canPlay && (card.cost ? Object.keys(card.cost).length === 0 : true); // Basic check if cost exists
      }

      items.push({
        label: 'Play Card',
        onClick: () => {
          if (isResource) {
            dispatch(playResourceViaSocket({ cardId: card.instanceId }));
          } else {
            dispatch(playCardViaSocket({ cardId: card.instanceId }));
          }
        },
        disabled: !canPlay,
      });
    } else if (cardLocation === 'battlefield' && isOwner) {
      items.push({
        label: card.tapped ? 'Untap Card' : 'Tap Card',
        onClick: () => {
          dispatch(tapCardViaSocket({ cardId: card.instanceId }));
        },
        disabled: false, // Players can tap/untap their own permanents at any time
      });
      if (card.abilities && card.abilities.some(ab => ab.type === 'Activated')) { // Assuming abilities structure
        items.push({ label: 'Activate Ability (Debug)', onClick: () => console.log('Activate (Debug)'), disabled: true });
      }
    } else if (cardLocation === 'battlefield' && !isOwner) {
      // Options for opponent's cards on battlefield
      items.push({ label: 'Target (Debug)', onClick: () => console.log('Target Opponent Card (Debug)'), disabled: true });
    }

    setContextMenu({ x: event.clientX, y: event.clientY, items });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('text/plain', card.instanceId);
    // Optional: set a drag image, though default might be fine
    // event.dataTransfer.effectAllowed = 'move'; // Inform the browser about the type of operation
  };

  return (
    <>
    <div 
      className={cardClassName}
      draggable={cardLocation === 'hand' && isOwner} // Only draggable if in hand and owned
      onDragStart={handleDragStart}
      onContextMenu={handleContextMenu}
    >
      <div className="card-header">
        <span className="card-name">{card.name}</span>
        {/* Attachment Indicator */}
        {card.attachments && card.attachments.length > 0 && (
          <div className="card-attachments-indicator" title={`${card.attachments.length} attachment(s)`}>
            📎 {card.attachments.length}
          </div>
        )}
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
      {/* Display Counters */}
      {card.counters && Object.keys(card.counters).length > 0 && (
        <div className="card-counters">
          {Object.entries(card.counters).map(([type, value]) => {
            if (value === 0) return null; // Don't display counters with a value of 0
            return (
              <span key={type} className="counter-badge" title={`${type} counters`}>
                {`${type}: ${value}`}
              </span>
            );
          })}
        </div>
      )}
      {(() => {
        // Calculate and render effective P/T
        if (card.attack === undefined && card.health === undefined) return null;

        let effectiveAttack = card.attack;
        let effectiveHealth = card.health;
        let ptModified = false;

        if (card.counters) {
          const plusOnePlusOneCounters = card.counters['+1/+1'];
          if (plusOnePlusOneCounters && typeof plusOnePlusOneCounters === 'number') {
            if (typeof effectiveAttack === 'number') {
              effectiveAttack += plusOnePlusOneCounters;
              ptModified = true;
            }
            if (typeof effectiveHealth === 'number') {
              effectiveHealth += plusOnePlusOneCounters;
              ptModified = true;
            }
          }
          // TODO: Add logic for other types of P/T counters e.g. "-1/-1", "+X/0"
        }

        return (
          <div className={`card-power-toughness ${ptModified ? 'modified-pt' : ''}`}>
            {typeof effectiveAttack === 'number' ? effectiveAttack : '-'}/{typeof effectiveHealth === 'number' ? effectiveHealth : '-'}
          </div>
        );
      })()}
    </div>
    {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={handleCloseContextMenu} />}
    </>
  );
};

export default CardComponent;
