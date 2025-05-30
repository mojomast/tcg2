import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { PlayerState } from '../store/slices/gameSlice'; // Import PlayerState for typing

const OpponentInfoBar: React.FC = () => {
  const localPlayerId = useSelector((state: RootState) => state.game.localPlayerId);
  const players = useSelector((state: RootState) => state.game.players);

  const opponent: PlayerState | undefined = players.find(p => p.playerId !== localPlayerId);

  if (!opponent) {
    return <div className="opponent-info-bar">Loading opponent data...</div>;
  }

  return (
    <div className="opponent-info-bar">
      <h3>{opponent.name || 'Opponent'}</h3>
      <p>Life: {opponent.life}</p>
      <p>Hand: {opponent.handSize ?? opponent.hand.length}</p> {/* Use handSize if available, else derive */}
      <p>Deck: {opponent.deckSize ?? opponent.library.length}</p> {/* Use deckSize if available, else derive */}
      <p>Energy: {opponent.energy}</p>
      <p>Poison: {opponent.poisonCounters}</p>
    </div>
  );
};

export default OpponentInfoBar;
