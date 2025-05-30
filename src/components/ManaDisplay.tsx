import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { ManaPool, ManaColor } from '../interfaces/gameState';

import './ManaDisplay.css'; // We'll create this for styling

const EMPTY_MANA_POOL: ManaPool = {}; // Define a constant for the empty mana pool

const ManaDisplay: React.FC = () => {
  const localPlayerId = useSelector((state: RootState) => state.player.id);
  const manaPool = useSelector((state: RootState) => {
    if (state.player.id && state.player.manaPool && Object.keys(state.player.manaPool).length > 0) {
      return state.player.manaPool;
    }
    // Fallback to the constant empty ManaPool object
    return EMPTY_MANA_POOL;
  });

  const manaColors: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

  const renderManaSymbol = (color: ManaColor, amount: number) => {
    const symbols = [];
    for (let i = 0; i < amount; i++) {
      symbols.push(
        <span key={`${color}-${i}`} className={`mana-symbol mana-${color.toLowerCase()}`}>
          {color}
        </span>
      );
    }
    return symbols;
  };

  const hasMana = Object.values(manaPool).some(amount => amount && amount > 0);

  return (
    <div className="mana-display-container">
      <h3>Your Mana</h3>
      {localPlayerId ? (
        <div className="mana-pool">
          {!hasMana && <p>No mana available.</p>}
          {manaColors.map(color => {
            const amount = manaPool[color] || 0;
            if (amount > 0) {
              return (
                <div key={color} className="mana-color-group">
                  {renderManaSymbol(color, amount)}
                </div>
              );
            }
            return null;
          })}
        </div>
      ) : (
        <p>Player ID not set.</p>
      )}
    </div>
  );
};

export default ManaDisplay;
