import React from 'react';

// Assuming GameState structure similar to what's in App.tsx
interface GameBoardInfoProps {
  turnNumber?: number;
  activePlayerId?: string | null;
  priorityHolderId?: string | null;
  currentPhase?: string | null;
  isLoading: boolean; // To show loading state if game data isn't ready
}

const GameBoardInfo: React.FC<GameBoardInfoProps> = ({
  turnNumber,
  activePlayerId,
  priorityHolderId,
  currentPhase,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="game-board-info" style={{ border: '1px dashed gray', padding: '10px', margin: '10px', textAlign: 'center' }}>
        <p>Loading game information...</p>
      </div>
    );
  }

  if (turnNumber === undefined || turnNumber === null) { // Check if game has started
     return (
      <div className="game-board-info" style={{ border: '1px dashed gray', padding: '10px', margin: '10px', textAlign: 'center' }}>
        <p>Game has not started yet.</p>
      </div>
    );
  }

  return (
    <div className="game-board-info" style={{ border: '1px solid seagreen', padding: '15px', margin: '10px', textAlign: 'center' }}>
      <h3>Game Information</h3>
      <p><strong>Turn:</strong> {turnNumber}</p>
      <p><strong>Active Player:</strong> {activePlayerId || 'N/A'}</p>
      <p><strong>Priority:</strong> {priorityHolderId || 'N/A'}</p>
      {currentPhase && (
        <p>
          <strong>Current Phase:</strong> <strong style={{ fontSize: '1.1em' }}>{currentPhase}</strong>
        </p>
      )}
    </div>
  );
};

export default GameBoardInfo;
