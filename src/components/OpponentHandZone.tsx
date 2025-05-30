import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { PlayerState } from '../store/slices/gameSlice';

const OpponentHandZone: React.FC = () => {
  const localPlayerId = useSelector((state: RootState) => state.game.localPlayerId);
  const players = useSelector((state: RootState) => state.game.players);

  const opponentPlayer = players.find(p => p.playerId && p.playerId !== localPlayerId);

  return (
    <div className="opponent-hand-zone">
      <p>Opponent's Hand</p>
      {opponentPlayer ? (
        <p>Cards: {opponentPlayer.handSize}</p>
      ) : (
        <p>Waiting for opponent...</p>
      )}
    </div>
  );
};

export default OpponentHandZone;
