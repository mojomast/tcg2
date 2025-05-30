import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { PlayerState } from '../store/slices/gameSlice';
import { ManaPool } from '../interfaces/gameState';

import './ManaDisplay.css'; // We'll create this for styling

// Mana color configuration with emojis
const MANA_COLORS = {
  W: { emoji: '⚪', color: '#f8f6d8', name: 'White' },
  U: { emoji: '🔵', color: '#c1d7e9', name: 'Blue' },
  B: { emoji: '⚫', color: '#bab1ab', name: 'Black' },
  R: { emoji: '🔴', color: '#e9c0c0', name: 'Red' },
  G: { emoji: '🟢', color: '#c4d3c4', name: 'Green' },
  C: { emoji: '⚪', color: '#d3d3d3', name: 'Colorless' }
} as const;

interface ManaSymbolDisplayProps {
  color: keyof typeof MANA_COLORS;
  count: number;
}

const ManaSymbolDisplay: React.FC<ManaSymbolDisplayProps> = ({ color, count }) => {
  if (count === 0) return null;
  
  const config = MANA_COLORS[color];
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      margin: '2px 4px',
      padding: '4px 8px',
      backgroundColor: config.color,
      borderRadius: '15px',
      border: '1px solid #666',
      fontSize: '0.9em'
    }}>
      <span style={{ marginRight: '4px', fontSize: '1.1em' }}>
        {config.emoji}
      </span>
      <span style={{ fontWeight: 'bold', minWidth: '15px', textAlign: 'center' }}>
        {count}
      </span>
    </div>
  );
};

const ManaDisplay: React.FC = () => {
  const localPlayerId = useSelector((state: RootState) => state.game.localPlayerId);
  const players = useSelector((state: RootState) => state.game.players);
  const gameState = useSelector((state: RootState) => state.game);

  const localPlayer: PlayerState | undefined = players.find(p => p.playerId === localPlayerId);

  if (!localPlayer) {
    return (
      <div className="mana-display-container">
        <p style={{ color: '#999', fontSize: '0.9em' }}>Loading mana pool...</p>
      </div>
    );
  }

  const manaPool = localPlayer.manaPool;
  const totalMana = Object.values(manaPool).reduce((sum, amount) => sum + amount, 0);
  
  // Check if mana pools should be visible (they empty at end of most steps)
  const currentPhase = gameState.currentPhase;
  const showManaWarning = currentPhase === 'END' && totalMana > 0;
  
  return (
    <div className="mana-display-container" style={{ margin: '10px 0' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <h4 style={{ margin: 0, fontSize: '1em', color: '#333' }}>
          ⚡ Mana Pool
        </h4>
        <div style={{ 
          fontSize: '0.8em', 
          color: totalMana > 0 ? '#0066cc' : '#999',
          fontWeight: 'bold'
        }}>
          Total: {totalMana}
        </div>
      </div>
      
      {totalMana === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#999', 
          fontSize: '0.8em',
          fontStyle: 'italic',
          padding: '10px'
        }}>
          No mana available
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '4px',
          justifyContent: 'flex-start'
        }}>
          {/* Display each mana color that has a positive amount */}
          {(Object.keys(MANA_COLORS) as Array<keyof typeof MANA_COLORS>).map(color => {
            const amount = manaPool[color] || 0;
            return (
              <ManaSymbolDisplay 
                key={color}
                color={color}
                count={amount}
              />
            );
          })}
        </div>
      )}
      
      {/* Mana pool warning */}
      {showManaWarning && (
        <div style={{
          marginTop: '8px',
          fontSize: '0.7em',
          color: '#ff6600',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          ⚠️ Mana pools empty at end of turn
        </div>
      )}
      
      {/* Resource play status */}
      {localPlayer.hasPlayedResourceThisTurn && (
        <div style={{
          marginTop: '5px',
          fontSize: '0.7em',
          color: '#666',
          textAlign: 'center'
        }}>
          🏞️ Resource played this turn
        </div>
      )}
    </div>
  );
};

export default ManaDisplay;
