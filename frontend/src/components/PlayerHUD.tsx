import React from 'react';
import { PlayerState } from '../types/gameState';

interface PlayerHUDProps {
  playerData?: PlayerState | null; // Allow undefined or null if data isn't loaded yet
  playerName: string; // e.g., "Player 1" or "Opponent"
  hasPriority?: boolean; // New prop
}

const PlayerHUD: React.FC<PlayerHUDProps> = ({ playerData, playerName, hasPriority }) => {
  if (!playerData) {
    return (
      <div className="player-hud" style={{ border: '1px dashed gray', padding: '10px', margin: '10px' }}>
        <h4>{playerName} HUD</h4>
        <p>Loading player data...</p>
      </div>
    );
  }

  const hudStyle: React.CSSProperties = {
    border: `2px solid ${hasPriority ? 'gold' : 'dodgerblue'}`, // Highlight if hasPriority
    padding: '10px',
    margin: '10px',
    minWidth: '150px',
    boxShadow: hasPriority ? '0 0 10px gold' : 'none', // Glow effect
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease', // Smooth transition
  };

  return (
    <div className="player-hud" style={hudStyle}>
      <h4>{playerName} (ID: {playerData.id})</h4>
      <p>Life: {playerData.life}</p>
      <p>Energy: {playerData.energy}</p>
      {hasPriority && <p style={{ color: 'gold', fontWeight: 'bold' }}>PRIORITY</p>} {/* Text indicator */}
    </div>
  );
};

export default PlayerHUD;
