import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import CardComponent from './Card'; 
// CardData from '../interfaces/card' might still be useful if CardComponent expects that type
// However, gameObjects will store ServerBattlefieldCard from '../interfaces/gameState'
import { PlayerState } from '../store/slices/gameSlice';
import { BattlefieldCard as ServerBattlefieldCard, GameObjectId } from '../interfaces/gameState';
import socketService from '../services/socketService';

const PlayerHandZone: React.FC = () => {
  const localPlayerId = useSelector((state: RootState) => state.game.localPlayerId);
  const players = useSelector((state: RootState) => state.game.players);
  const gameObjects = useSelector((state: RootState) => state.game.gameObjects);
  const priorityPlayerId = useSelector((state: RootState) => state.game.priorityPlayerId);

  const localPlayer: PlayerState | undefined = players.find(p => p.playerId === localPlayerId);

  const handlePlayCardClick = (cardInstanceId: string) => {
    console.log(`Play Card clicked: ${cardInstanceId}, Player with priority: ${priorityPlayerId}`);
    if (localPlayerId && localPlayerId === priorityPlayerId) {
      console.log(`Attempting to play card: ${cardInstanceId} by player ${localPlayerId}`);
      socketService.emit('play_card', { 
        playerId: localPlayerId, 
        cardInstanceId: cardInstanceId 
        // selectedTargets will be added later if needed
      });
    } else {
      console.log(`Cannot play card: Player ${localPlayerId || 'Unknown'} does not have priority or is not defined. Priority belongs to ${priorityPlayerId}.`);
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

  if (!localPlayer) {
    return <div className="player-hand-zone"><p>Loading hand...</p></div>;
  }

  const handCardIds: GameObjectId[] = localPlayer.hand;
  const handCards: ServerBattlefieldCard[] = handCardIds
    .map(id => gameObjects[id])
    .filter(Boolean); // Filter out any undefined if an ID isn't in gameObjects

  return (
    <div className="player-hand-zone">
      {handCards.length > 0 ? (
        handCards.map((card: ServerBattlefieldCard) => (
          <div key={card.instanceId} className="card-in-hand-item" style={{ marginBottom: '10px' }}>
            <div 
              onClick={() => handlePlayCardClick(card.instanceId)}
              className="card-in-hand-container"
              style={{ cursor: 'pointer', display: 'inline-block' }}
            >
              <CardComponent card={card} />
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click when discard button is clicked
                handleDiscardCard(card.instanceId);
              }}
              style={{ marginLeft: '5px', padding: '2px 5px', fontSize: '0.8em' }}
            >
              Discard
            </button>
          </div>
        ))
      ) : (
        <p>No cards in hand.</p> 
      )}
    </div>
  );
};

export default PlayerHandZone;
