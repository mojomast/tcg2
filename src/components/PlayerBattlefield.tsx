import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import CardComponent from './Card';
import { PlayerState, playCardViaSocket, playResourceViaSocket } from '../store/slices/gameSlice';
import { BattlefieldCard as BattlefieldCardType } from '../interfaces/gameState.js'; // For typing card objects
import { ManaCost } from '../interfaces/card';
import { GameObjectId } from '../interfaces/gameState.js'; // BattlefieldCard is already imported as BattlefieldCardType

// Combat selection context types
interface CombatSelection {
  selectedAttackers: string[];
  selectedBlockers: {[blockerId: string]: string};
  setSelectedAttackers: (attackers: string[]) => void;
  setSelectedBlockers: (blockers: {[blockerId: string]: string}) => void;
}

// Enhanced Card component for combat interactions
interface CombatCardProps {
  card: BattlefieldCardType;
  isSelected?: boolean;
  canSelect?: boolean;
  onSelect?: (cardId: string) => void;
  selectionType?: 'attacker' | 'blocker' | 'none';
  isOwner: boolean; // New prop
  // cardLocation will always be 'battlefield' for CombatCard, so not explicitly passed to CombatCard itself
  // but will be passed down to CardComponent as a fixed value.
}

const CombatCard: React.FC<CombatCardProps> = ({ 
  card, 
  isSelected = false, 
  canSelect = false, 
  onSelect, 
  selectionType = 'none',
  isOwner // Destructure new prop
}) => {
  const handleClick = useCallback(() => {
    if (canSelect && onSelect) {
      onSelect(card.instanceId);
    }
  }, [canSelect, onSelect, card.instanceId]);

  // Get visual styling for combat states
  const getCombatStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      cursor: canSelect ? 'pointer' : 'default',
      position: 'relative',
      transition: 'all 0.2s ease',
    };

    if (isSelected) {
      if (selectionType === 'attacker') {
        return {
          ...baseStyle,
          border: '3px solid #ff4444',
          boxShadow: '0 0 10px #ff444488',
          transform: 'scale(1.05)',
        };
      } else if (selectionType === 'blocker') {
        return {
          ...baseStyle,
          border: '3px solid #4444ff',
          boxShadow: '0 0 10px #4444ff88',
          transform: 'scale(1.05)',
        };
      }
    }

    if (canSelect) {
      return {
        ...baseStyle,
        border: '2px dashed #888',
        opacity: 0.8,
      };
    }

    return baseStyle;
  };

  const getCombatIcon = () => {
    if (isSelected && selectionType === 'attacker') return '⚔️';
    if (isSelected && selectionType === 'blocker') return '🛡️';
    if (canSelect && selectionType === 'attacker') return '👆';
    if (canSelect && selectionType === 'blocker') return '👆';
    return null;
  };

  return (
    <div style={getCombatStyle()} onClick={handleClick}>
      <CardComponent card={card} cardLocation="battlefield" isOwner={isOwner} />
      {getCombatIcon() && (
        <div style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          fontSize: '20px',
          background: 'white',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #333',
        }}>
          {getCombatIcon()}
        </div>
      )}
    </div>
  );
};

const PlayerBattlefield: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedAttackers, setSelectedAttackers] = useState<string[]>([]);
  const [selectedBlockers, setSelectedBlockers] = useState<{[blockerId: string]: string}>({});
  
  const localPlayerId = useSelector((state: RootState) => state.game.localPlayerId);
  const players = useSelector((state: RootState) => state.game.players);
  const gameObjects = useSelector((state: RootState) => state.game.gameObjects);
  const gameState = useSelector((state: RootState) => state.game);

  const localPlayer: PlayerState | undefined = players.find(p => p.playerId === localPlayerId);

  // Combat state detection
  const currentPhase = gameState.currentPhase;
  const currentStep = gameState.currentStep;
  const activePlayerId = gameState.activePlayerId;
  const priorityPlayerId = gameState.priorityPlayerId;

  const isMyTurn = activePlayerId === localPlayerId;
  const isAttackStep = currentPhase === 'COMBAT' && currentStep === 'DECLARE_ATTACKERS';

  // Helper: Check if a card is a resource card
  const isResourceCard = (card: BattlefieldCardType): boolean => {
    return card.type === 'Resource'; // Assuming 'Resource' is the type string for resource cards
  };

  // Helper: Check if player has enough mana
  const hasEnoughMana = (cost: ManaCost | undefined, manaPoolParam: PlayerState['manaPool']): boolean => {
    // Ensure manaPool is treated as an object, defaulting to empty if it were null/undefined (though types should prevent this)
    const manaPool = manaPoolParam || {};

    if (!cost || Object.keys(cost).length === 0) return true; // No cost or empty cost object means it's free

    // Create a mutable copy of the mana pool to simulate spending mana
    const tempManaPool: { [key: string]: number } = {}; // Use a simple string key type for temp pool
    const validManaColors: (keyof PlayerState['manaPool'])[] = ['W', 'U', 'B', 'R', 'G', 'C'];
    for (const color of validManaColors) {
      tempManaPool[color] = manaPool[color] || 0;
    }

    let genericCostToPay = cost.C || 0;

    // Pay specific colored costs first
    const specificColorKeys = Object.keys(cost).filter(c => c !== 'C' && c !== 'X') as (keyof ManaCost)[];

    for (const color of specificColorKeys) {
      const requiredAmount = cost[color] || 0;
      if (requiredAmount > 0) {
        if (tempManaPool[color] >= requiredAmount) {
          tempManaPool[color] -= requiredAmount;
        } else {
          return false; // Not enough of a specific colored mana
        }
      }
    }

    // Pay generic costs with remaining mana
    if (genericCostToPay > 0) {
      let totalRemainingMana = 0;
      for (const color of validManaColors) {
        totalRemainingMana += tempManaPool[color];
      }
      if (totalRemainingMana < genericCostToPay) {
        return false; // Not enough remaining mana for generic costs
      }
    }

    // Note: 'X' costs are not explicitly handled by this logic for payment.
    // If cost includes 'X', this function currently doesn't validate if 'X' can be paid.

    return true;
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Allow drop
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const cardInstanceId = event.dataTransfer.getData('text/plain');

    if (!localPlayer || !localPlayer.hand || !gameObjects) return;

    // Retrieve the full card object from gameObjects
    const cardToPlay = gameObjects[cardInstanceId];
    if (!cardToPlay) {
      console.error('Dropped card not found in gameObjects:', cardInstanceId);
      return;
    }
    // Ensure the card is actually in the player's hand by checking the ID
    if (!localPlayer.hand.includes(cardInstanceId)) {
        console.error('Dropped card ID not found in player hand:', cardInstanceId);
        return;
    }

    const isPlayerTurn = activePlayerId === localPlayerId;
    const hasPriority = priorityPlayerId === localPlayerId;
    const isMainPhase = currentStep === 'MAIN_PRE' || currentStep === 'MAIN_POST';

    if (isPlayerTurn && hasPriority && isMainPhase) {
      if (isResourceCard(cardToPlay)) {
        if (!localPlayer.hasPlayedResourceThisTurn) {
          dispatch(playResourceViaSocket({ cardId: cardInstanceId }));
        }
      } else {
        if (hasEnoughMana(cardToPlay.cost, localPlayer.manaPool)) {
          dispatch(playCardViaSocket({ cardId: cardInstanceId }));
        }
      }
    }
  };
  const isBlockStep = currentPhase === 'COMBAT' && currentStep === 'DECLARE_BLOCKERS';
  const canDeclareAttackers = isMyTurn && isAttackStep && priorityPlayerId === localPlayerId;
  const canDeclareBlockers = !isMyTurn && isBlockStep && priorityPlayerId === localPlayerId;

  if (!localPlayer) {
    return <div className="player-battlefield"><p>Loading battlefield...</p></div>;
  }

  const battlefieldCards: BattlefieldCardType[] = localPlayer.battlefield
    .map(id => gameObjects[id])
    .filter((card): card is BattlefieldCardType => !!card); // Ensure only valid cards are included and type guard

  // Separate cards by type for better organization
  const creatureCards = battlefieldCards.filter(card => card.type === 'Creature');
  const resourceCards = battlefieldCards.filter(card => card.type === 'Resource');
  const otherCards = battlefieldCards.filter(card => card.type !== 'Creature' && card.type !== 'Resource');

  // Handle attacker selection
  const handleAttackerSelect = useCallback((creatureId: string) => {
    if (selectedAttackers.includes(creatureId)) {
      setSelectedAttackers(prev => prev.filter(id => id !== creatureId));
    } else {
      setSelectedAttackers(prev => [...prev, creatureId]);
    }
  }, [selectedAttackers]);

  // Handle blocker selection (more complex - need to assign to specific attackers)
  const handleBlockerSelect = useCallback((blockerId: string) => {
    // For now, just toggle selection. In a full implementation,
    // you'd need a UI to assign which attacker this creature blocks
    if (selectedBlockers[blockerId]) {
      setSelectedBlockers(prev => {
        const newBlockers = { ...prev };
        delete newBlockers[blockerId];
        return newBlockers;
      });
    } else {
      // For demo, just assign to first available attacker
      // In real game, this would be a targeting interface
      const attackers = Object.keys(gameState.attackers || {});
      if (attackers.length > 0) {
        setSelectedBlockers(prev => ({ ...prev, [blockerId]: attackers[0] }));
      }
    }
  }, [selectedBlockers, gameState.attackers]);

  // Check if a creature can attack
  const canCreatureAttack = (creature: BattlefieldCardType): boolean => {
    return !creature.tapped && !creature.summoningSickness;
  };

  // Check if a creature can block
  const canCreatureBlock = (creature: BattlefieldCardType): boolean => {
    return !creature.tapped;
  };

  const renderCardSection = (cards: BattlefieldCardType[], title: string, isOwnerSection: boolean, selectionType: 'attacker' | 'blocker' | 'none' = 'none') => {
    if (cards.length === 0) return null;

    return (
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: '#666' }}>{title} ({cards.length})</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {cards.map((card: BattlefieldCardType) => {
            const isCreature = card.type === 'Creature';
            let canSelect = false;
            let isSelected = false;
            let onSelect: ((cardId: string) => void) | undefined;

            if (isCreature && selectionType === 'attacker' && canDeclareAttackers) {
              canSelect = canCreatureAttack(card);
              isSelected = selectedAttackers.includes(card.instanceId);
              onSelect = handleAttackerSelect;
            } else if (isCreature && selectionType === 'blocker' && canDeclareBlockers) {
              canSelect = canCreatureBlock(card);
              isSelected = !!selectedBlockers[card.instanceId];
              onSelect = handleBlockerSelect;
            }

            return (
              <CombatCard
                key={card.instanceId}
                card={card}
                isSelected={isSelected}
                canSelect={canSelect}
                onSelect={onSelect}
                selectionType={canSelect ? selectionType : 'none'}
                isOwner={isOwnerSection} // Pass isOwner based on the section
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="player-battlefield"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {battlefieldCards.length > 0 ? (
        <>
          {/* Show combat selection hints */}
          {(canDeclareAttackers || canDeclareBlockers) && (
            <div style={{ 
              marginBottom: '10px', 
              padding: '5px', 
              backgroundColor: canDeclareAttackers ? '#ffeeee' : '#eeeeff',
              border: '1px solid ' + (canDeclareAttackers ? '#ff4444' : '#4444ff'),
              borderRadius: '3px',
              fontSize: '0.9em'
            }}>
              {canDeclareAttackers && '⚔️ Click creatures to select attackers'}
              {canDeclareBlockers && '🛡️ Click creatures to select blockers'}
            </div>
          )}
          
          {/* Render battlefield sections */}
          {/* Assuming these sections are for the local player for now */}
          {renderCardSection(resourceCards, 'Your Resources', true)}
          {renderCardSection(creatureCards, 'Your Creatures', true, canDeclareAttackers ? 'attacker' : canDeclareBlockers ? 'blocker' : 'none')}
          {renderCardSection(otherCards, 'Your Other Permanents', true)}
          {/* Add sections for opponent's battlefield, passing isOwner={false} */}
          {/* Example: renderCardSection(opponentCreatureCards, "Opponent's Creatures", false) */}
        </>
      ) : (
        <p>No cards on battlefield.</p>
      )}
    </div>
  );
};

export default PlayerBattlefield;
