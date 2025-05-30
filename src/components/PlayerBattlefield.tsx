import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import CardComponent from './Card';
import { PlayerState } from '../store/slices/gameSlice';
import { BattlefieldCard as ServerBattlefieldCard, GameObjectId } from '../interfaces/gameState';

const PlayerBattlefield: React.FC = () => {
  const localPlayerId = useSelector((state: RootState) => state.game.localPlayerId);
  const players = useSelector((state: RootState) => state.game.players);
  const gameObjects = useSelector((state: RootState) => state.game.gameObjects);

  const localPlayer: PlayerState | undefined = players.find(p => p.playerId === localPlayerId);

  if (!localPlayer) {
    return <div className="player-battlefield"><p>Loading battlefield...</p></div>;
  }

  const battlefieldCardIds: GameObjectId[] = localPlayer.battlefield;
  const battlefieldCards: ServerBattlefieldCard[] = battlefieldCardIds
    .map(id => gameObjects[id])
    .filter(Boolean); // Filter out any undefined

  // TODO: Group cards by type (Resources, Creatures, etc.) as per DEVPLAN_10 and MEMORY[5268fd06-0d1c-480c-9aa9-a005ef63e481]

  return (
    <div className="player-battlefield">
      {battlefieldCards.length > 0 ? (
        battlefieldCards.map((card: ServerBattlefieldCard) => (
          // CardComponent's `key` should be unique, instanceId is good.
          // `isTapped` prop will use `card.tapped` from ServerBattlefieldCard
          <CardComponent card={card} key={card.instanceId} isTapped={card.tapped} />
        ))
      ) : (
        <p>No cards on battlefield.</p>
      )}
    </div>
  );
};

export default PlayerBattlefield;
