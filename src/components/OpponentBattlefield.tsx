import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import CardComponent from './Card';
import { PlayerState } from '../store/slices/gameSlice';
import { GameObjectId, BattlefieldCard as ServerBattlefieldCard } from '../interfaces/gameState';

const OpponentBattlefield: React.FC = () => {
  const localPlayerId = useSelector((state: RootState) => state.game.localPlayerId);
  const players = useSelector((state: RootState) => state.game.players);
  const gameObjects = useSelector((state: RootState) => state.game.gameObjects);

  const opponentPlayer: PlayerState | undefined = players.find(p => p.playerId !== localPlayerId);

  if (!opponentPlayer) {
    return <div className="opponent-battlefield"><p>Loading opponent's battlefield...</p></div>;
  }

  const battlefieldCardIds: GameObjectId[] = opponentPlayer.battlefield;
  const battlefieldCards: ServerBattlefieldCard[] = battlefieldCardIds
    .map(id => gameObjects[id])
    .filter(Boolean); // Filter out any undefined

  // TODO: Group cards by type (Resources, Creatures, etc.) as per DEVPLAN_10 and MEMORY[5268fd06-0d1c-480c-9aa9-a005ef63e481]

  return (
    <div className="opponent-battlefield">
      {battlefieldCards.length > 0 ? (
        battlefieldCards.map((card: ServerBattlefieldCard) => (
          // CardComponent's `key` should be unique, instanceId is good.
          // `isTapped` prop will use `card.tapped` from ServerBattlefieldCard
          <CardComponent card={card} key={card.instanceId} cardLocation="battlefield" isOwner={false} />
        ))
      ) : (
        <p>No cards on battlefield.</p>
      )}
    </div>
  );
};

export default OpponentBattlefield;
