import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { PlayerState } from '../store/slices/gameSlice'; // Import PlayerState for typing

const PlayerInfoBar: React.FC = () => {
  const localPlayerId = useSelector((state: RootState) => state.game.localPlayerId);
  const players = useSelector((state: RootState) => state.game.players);
  
  // Debug logging to see if component is receiving state updates
  console.log('[PlayerInfoBar] Component rendering with:', {
    localPlayerId,
    playersCount: players.length,
    players: players.map(p => ({ id: p.playerId, life: p.life, handSize: p.handSize }))
  });

  const player: PlayerState | undefined = players.find(p => p.playerId === localPlayerId);
  
  if (player) {
    console.log('[PlayerInfoBar] Found player with data:', {
      id: player.playerId,
      name: player.name,
      life: player.life,
      handSize: player.handSize,
      deckSize: player.deckSize,
      poisonCounters: player.poisonCounters,
      energy: player.energy,
      hasAllRequiredFields: !!(player.name && player.life !== undefined && player.handSize !== undefined)
    });
    console.log('[PlayerInfoBar] Raw player object:', JSON.stringify(player, null, 2));
  } else {
    console.log('[PlayerInfoBar] NO PLAYER FOUND');
  }

  if (!player) {
    return <div className="player-info-bar">Loading player data...</div>;
  }

  return (
    <div className="player-info-bar">
      <h3>{player.name || 'Player'}</h3>
      <p>Life: {player.life}</p>
      <p>Hand: {player.handSize ?? player.hand.length}</p> {/* Use handSize if available, else derive */}
      <p>Deck: {player.deckSize ?? player.library.length}</p> {/* Use deckSize if available, else derive */}
      <p>Energy: {player.energy}</p>
      <p>Poison: {player.poisonCounters}</p>
    </div>
  );
};

export default PlayerInfoBar;
