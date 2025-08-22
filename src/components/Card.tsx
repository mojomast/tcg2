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

  const parts: string[] = [];
  // Show generic number first if present
  if (typeof cost.C === 'number' && cost.C > 0) parts.push(String(cost.C));

  const colorOrder: (keyof ManaCost)[] = ['W', 'U', 'B', 'R', 'G'];
  for (const color of colorOrder) {
    const n = cost[color];
    if (typeof n === 'number' && n > 0) {
      const emoji = manaSymbolToEmoji[color as string] ?? color;
      parts.push(emoji.repeat(n));
    }
  }
  return parts.length ? parts.join('') : '0';
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

  // Determine if card can be tapped (lands, creatures, artifacts, etc.)
  const canBeTapped = cardLocation === 'battlefield' && isOwner &&
                     (card.type === 'Land' || card.type === 'Creature' || card.type === 'Artifact' || card.type === 'Planeswalker');

  const handleTapClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (!canBeTapped) return;

    // Use existing tap functionality from context menu
    dispatch(tapCardViaSocket({ cardId: card.instanceId }));
  };

  return (
    <>
    <div
      className={cardClassName}
      draggable={cardLocation === 'hand' && isOwner} // Only draggable if in hand and owned
      onDragStart={handleDragStart}
      onContextMenu={handleContextMenu}
    >
      {/* Tap Button - Only show for tappable cards on battlefield */}
      {canBeTapped && (
        <button
          className="card-tap-button"
          onClick={handleTapClick}
          title={card.tapped ? 'Untap Card' : 'Tap Card'}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: card.tapped ? '2px solid #4CAF50' : '2px solid #ff9800',
            backgroundColor: card.tapped ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
            color: card.tapped ? '#4CAF50' : '#ff9800',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.backgroundColor = card.tapped ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 152, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = card.tapped ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)';
          }}
        >
          {card.tapped ? '↻' : '⭕'}
        </button>
      )}
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
