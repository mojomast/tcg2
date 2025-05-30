import React from 'react';

interface ActionControlsProps {
  onStartGame: () => Promise<void>;
  isLoading: boolean;
  onPassPriority?: () => Promise<void>; 
  gameActive?: boolean; 
  currentPlayerId?: string | null; // ID of the player using this UI instance
  priorityHolderId?: string | null; // ID of the player who currently has priority
}

const ActionControls: React.FC<ActionControlsProps> = ({ onStartGame, isLoading, onPassPriority, gameActive, currentPlayerId, priorityHolderId }) => {

  const handleStartGame = async () => {
    await onStartGame();
  };

  const handlePassPriority = async () => {
    if (onPassPriority) {
      await onPassPriority(); 
    } else {
      console.log('Pass Priority button clicked - no action configured');
    }
  };

  return (
    <div className="action-controls" style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
      <h3>Game Actions</h3>
      <button onClick={handleStartGame} disabled={isLoading || gameActive} style={{ marginRight: '10px' }}>
        {isLoading && !gameActive ? '↻ Starting...' : (gameActive ? 'Game Active' : 'Start Game')}
      </button>
      <button 
        onClick={handlePassPriority} 
        disabled={!gameActive || isLoading || !onPassPriority || priorityHolderId !== currentPlayerId} 
      >
        {isLoading && gameActive && priorityHolderId === currentPlayerId ? '↻ Passing...' : 'Pass Priority'}
      </button>
      {/* More buttons will be added here, e.g., Play Card */}
    </div>
  );
};

export default ActionControls;
