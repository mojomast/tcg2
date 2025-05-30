import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import CardComponent from './Card'; 
// CardData from '../interfaces/card' might still be useful if CardComponent expects that type
// However, gameObjects will store ServerBattlefieldCard from '../interfaces/gameState'
import { PlayerState } from '../store/slices/gameSlice';
import { BattlefieldCard as ServerBattlefieldCard, GameObjectId } from '../interfaces/gameState';
import socketService from '../services/socketService';
import { ManaCost } from '../interfaces/card';
import { ManaColor as GameStateManaColor } from '../interfaces/gameState'; // Renamed to avoid conflict if ManaColor is defined locally

interface GroupedCards {
  [type: string]: ServerBattlefieldCard[];
}

const groupCardsByType = (cards: ServerBattlefieldCard[]): GroupedCards => {
  return cards.reduce((acc, card) => {
    const type = card.type || 'Unknown'; // Default to 'Unknown' if type is missing
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(card);
    return acc;
  }, {} as GroupedCards);
};

// Type for mana pool, ensuring C is also handled if it's separate from GameStateManaColor
type PlayerManaPool = { [key in GameStateManaColor]?: number } & { C?: number };

const canAffordCard = (
  cardCost: ManaCost | undefined,
  availableMana: PlayerManaPool
): boolean => {
  if (!cardCost || Object.keys(cardCost).length === 0) return true; // No cost or empty cost object means it's free

  let remainingGenericCost = 0;
  const tempAvailableMana = { ...availableMana };

  // Check and "pay" specific colored costs
  // Ensure 'C' (colorless) from cardCost is not treated as a specific color here
  const specificColors: GameStateManaColor[] = ['W', 'U', 'B', 'R', 'G'];
  for (const color of specificColors) {
    const costOfColor = cardCost[color] || 0;
    if (costOfColor > 0) {
      if ((tempAvailableMana[color] || 0) >= costOfColor) {
        tempAvailableMana[color] = (tempAvailableMana[color] || 0) - costOfColor;
      } else {
        return false; // Not enough of a specific colored mana
      }
    }
  }

  // Calculate remaining generic cost from the card (cost.C)
  remainingGenericCost = cardCost.C || 0;
  
  // Note: 'X' costs are not currently handled by this function as ManaCost interface doesn't define 'X'.
  // If 'X' costs are introduced, ManaCost and this logic will need an update.

  // Check if remaining mana (any color + colorless) can cover generic cost
  let totalRemainingMana = 0;
  // Sum up all types of mana the player has left
  const allManaTypes: (GameStateManaColor | 'C')[] = [...specificColors, 'C'];
  for (const color of allManaTypes) {
    totalRemainingMana += tempAvailableMana[color] || 0;
  }
  
  return totalRemainingMana >= remainingGenericCost;
};

const PlayerHandZone: React.FC = () => {
  const [animatingOutCardId, setAnimatingOutCardId] = useState<string | null>(null);
  const localPlayerId = useSelector((state: RootState) => state.game.localPlayerId);
  const players = useSelector((state: RootState) => state.game.players);
  const gameObjects = useSelector((state: RootState) => state.game.gameObjects);
  const priorityPlayerId = useSelector((state: RootState) => state.game.priorityPlayerId);
  const gameState = useSelector((state: RootState) => state.game);
  
  // Game state for resource play validation
  const currentPhase = gameState.currentPhase;
  const activePlayerId = gameState.activePlayerId;
  const isMyTurn = activePlayerId === localPlayerId;
  const isMainPhase = currentPhase === 'MAIN';
  const canPlayCards = isMyTurn && priorityPlayerId === localPlayerId && isMainPhase;

  const localPlayer: PlayerState | undefined = players.find(p => p.playerId === localPlayerId);

  const handlePlayCardClick = (cardInstanceId: string) => {
    console.log(`Play Card clicked: ${cardInstanceId}, Player with priority: ${priorityPlayerId}`);
    if (localPlayerId && localPlayerId === priorityPlayerId) {
      console.log(`Attempting to play card: ${cardInstanceId} by player ${localPlayerId}`);
      setAnimatingOutCardId(cardInstanceId);
      socketService.emit('play_card', { 
        playerId: localPlayerId, 
        cardInstanceId: cardInstanceId,
        // targetId: null, // Add target selection later if needed
      });
      setTimeout(() => setAnimatingOutCardId(null), 500); // Animation duration: 500ms
    } else {
      console.warn(`Cannot play card: Priority is with ${priorityPlayerId}, local player is ${localPlayerId}`);
    }
  };

  const handleDiscardCard = (cardInstanceId: string) => {
    if (localPlayerId) {
      console.log(`[PlayerHandZone] Attempting to discard card: ${cardInstanceId} by player ${localPlayerId}`);
      
      // Log the socketService object and its emit method
      console.log('[PlayerHandZone] Inspecting socketService instance:', socketService);
      console.log('[PlayerHandZone] Type of socketService.emit:', typeof socketService.emit);
      console.log('[PlayerHandZone] Definition of socketService.emit:', String(socketService.emit)); 

      try {
        socketService.emit('discard_card', { 
          playerId: localPlayerId, 
          cardInstanceId: cardInstanceId 
        });
        console.log(`[PlayerHandZone] Successfully CALLED socketService.emit('discard_card') for ${cardInstanceId}`);
      } catch (error) {
        console.error('[PlayerHandZone] Error calling socketService.emit for discard_card:', error);
      }
    } else {
      console.error('[PlayerHandZone] Cannot discard card: localPlayerId is not defined.');
    }
  };
  
  const handlePlayResource = (cardInstanceId: string) => {
    if (!localPlayerId) {
      console.warn('Cannot play resource: No player ID');
      return;
    }
    
    console.log(`Playing resource card: ${cardInstanceId}`);
    socketService.emit('play_card', {
      playerId: localPlayerId,
      cardInstanceId: cardInstanceId
    });
  };
  
  // Helper functions for card playability
  const isResourceCard = (card: ServerBattlefieldCard): boolean => {
    return card.type === 'Resource' || card.type === 'Land';
  };
  
  const canPlayResource = (card: ServerBattlefieldCard): boolean => {
    return isResourceCard(card) && canPlayCards && !localPlayer?.hasPlayedResourceThisTurn;
  };
  
  const canPlayNonResource = (card: ServerBattlefieldCard): boolean => {
    if (isResourceCard(card) || !canPlayCards || !localPlayer) return false;
    // Check mana affordability using the player's current mana pool
    return canAffordCard(card.cost, localPlayer.manaPool);
  };
  
  const getCardPlayabilityStyle = (card: ServerBattlefieldCard): React.CSSProperties => {
    const baseNotPlayableStyle: React.CSSProperties = { opacity: 0.6, cursor: 'not-allowed' };
    const playableStyle: React.CSSProperties = { border: '2px solid limegreen' }; // Green for playable
    const cannotAffordStyle: React.CSSProperties = { ...baseNotPlayableStyle, border: '2px solid red' }; // Red for unaffordable
    const cannotPlayOtherReasonStyle: React.CSSProperties = { ...baseNotPlayableStyle, border: '2px solid grey' }; // Grey for other restrictions

    if (isResourceCard(card)) {
      // For resource cards, check if it can be played (e.g., resource limit not reached)
      return canPlayResource(card) ? playableStyle : cannotPlayOtherReasonStyle;
    } else {
      // For non-resource cards
      if (!localPlayer) {
        // Should not happen if component renders correctly, but as a fallback
        return cannotPlayOtherReasonStyle;
      }

      const isAffordable = canAffordCard(card.cost, localPlayer.manaPool);
      
      // canPlayCards typically checks if it's the player's turn, correct phase, priority, etc.
      // for playing non-resource spells/creatures.
      if (canPlayCards) { 
        if (isAffordable) {
          // Player can generally play cards, and this specific card is affordable
          return playableStyle;
        } else {
          // Player can generally play cards, but this specific card is NOT affordable
          return cannotAffordStyle;
        }
      } else {
        // Player cannot generally play cards right now (e.g., wrong phase, no priority)
        // In this case, affordability doesn't matter as much as the general game state restriction.
        return cannotPlayOtherReasonStyle;
      }
    }
  };

  if (!localPlayer) {
    return <div className="player-hand-zone"><p>Loading hand...</p></div>;
  }

  const handCardIds: GameObjectId[] = localPlayer.hand;
  const handCards: ServerBattlefieldCard[] = handCardIds
    .map(id => gameObjects[id])
    .filter(Boolean); // Filter out any undefined if an ID isn't in gameObjects
    
  const handCardInstances: ServerBattlefieldCard[] = localPlayer 
    ? localPlayer.hand
        .map(id => gameObjects[id])
        .filter(card => card !== undefined) as ServerBattlefieldCard[]
    : [];
  
  const resourceCards = handCardInstances.filter(card => isResourceCard(card));
  const otherCards = handCardInstances.filter(card => !isResourceCard(card));
  const groupedOtherCards = groupCardsByType(otherCards);
  const playableResourceCards = resourceCards.filter(canPlayResource);
  const resourcesPlayedThisTurn = localPlayer.hasPlayedResourceThisTurn;

  return (
    <div className="player-hand-zone" style={{ padding: '10px' }}>
      {/* Resource play status */}
      {isMyTurn && (
        <div style={{ 
          marginBottom: '10px', 
          padding: '8px',
          backgroundColor: resourcesPlayedThisTurn ? '#ffeeee' : '#eeffee',
          border: `1px solid ${resourcesPlayedThisTurn ? '#ffaaaa' : '#aaffaa'}`,
          borderRadius: '5px',
          fontSize: '0.9em'
        }}>
          🏞️ Resource Status: {resourcesPlayedThisTurn ? 
            'Already played resource this turn' : 
            `Can play resource (${playableResourceCards.length} available)`
          }
        </div>
      )}
      
      {handCardInstances.length > 0 ? (
        <>
          {/* Resource Cards Section */}
          {resourceCards.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1em', color: '#4CAF50' }}>
                🏞️ Resource Cards ({resourceCards.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {resourceCards.map((card: ServerBattlefieldCard) => (
                  <div key={card.instanceId} style={{ position: 'relative' }}>
                    <div 
                      style={{
                        ...getCardPlayabilityStyle(card),
                        cursor: canPlayResource(card) ? 'pointer' : 'default',
                        borderRadius: '8px',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => canPlayResource(card) && handlePlayResource(card.instanceId)}
                    >
                      <CardComponent card={card} isAnimatingOut={card.instanceId === animatingOutCardId} cardLocation="hand" isOwner={true} />
                    </div>
                    
                    {/* Resource play button */}
                    {canPlayResource(card) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayResource(card.instanceId);
                        }}
                        style={{
                          position: 'absolute',
                          bottom: '5px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '15px',
                          padding: '4px 8px',
                          fontSize: '0.7em',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                      >
                        🏞️ PLAY
                      </button>
                    )}
                    
                    {/* Playability indicator */}
                    {!canPlayCards && (
                      <div style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '0.6em',
                        color: '#666'
                      }}>
                        ⏸️
                      </div>
                    )}
                    
                    {resourcesPlayedThisTurn && isResourceCard(card) && (
                      <div style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'rgba(255, 152, 0, 0.9)',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '0.6em',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        LIMIT
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Sections for other card types */}
          {Object.entries(groupedOtherCards).map(([type, cardsInGroup]) => {
            if (cardsInGroup.length === 0) {
              return null; // Explicitly return null if no cards in this group
            }
            return (
              <div key={type}>
                <h4 style={{ margin: '10px 0 10px 0', fontSize: '1em', color: '#4CAF50' /* Different color for variety */ }}>
                  {/* Basic pluralization, can be improved */}
                  {type}{cardsInGroup.length > 1 && !type.endsWith('s') ? 's' : ''} ({cardsInGroup.length})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {cardsInGroup.map((card: ServerBattlefieldCard) => (
                    <div key={card.instanceId} style={{ position: 'relative' }}>
                      <div 
                        style={{
                          ...getCardPlayabilityStyle(card),
                          cursor: canPlayNonResource(card) ? 'pointer' : 'default',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => canPlayNonResource(card) && handlePlayCardClick(card.instanceId)}
                      >
                        <CardComponent card={card} isAnimatingOut={card.instanceId === animatingOutCardId} cardLocation="hand" isOwner={true} />
                      </div>
                      
                      {/* Play button for non-resource cards */}
                      {canPlayNonResource(card) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayCardClick(card.instanceId);
                          }}
                          style={{
                            position: 'absolute',
                            bottom: '5px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '15px',
                            padding: '4px 8px',
                            fontSize: '0.7em',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                          }}
                        >
                          ⚡ PLAY
                        </button>
                      )}
                      
                      {/* Discard button for all cards */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDiscardCard(card.instanceId);
                        }}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          backgroundColor: 'rgba(244, 67, 54, 0.8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          fontSize: '0.6em',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#999', fontSize: '1.1em', padding: '20px' }}>
          <p>💼 No cards in hand</p>
          <p style={{ fontSize: '0.8em' }}>Draw cards during your draw step</p>
        </div>
      )}
    </div>
  );
};

export default PlayerHandZone;
