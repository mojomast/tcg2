import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface GameOverModalProps {
  onPlayAgain?: () => void;
  onReturnToMenu?: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ onPlayAgain, onReturnToMenu }) => {
  const gameState = useSelector((state: RootState) => state.game);
  const localPlayerId = gameState.localPlayerId;
  const winner = gameState.winner;
  const turnNumber = gameState.turnNumber;
  
  // Don't show modal if game isn't over
  if (!winner) {
    return null;
  }
  
  const isPlayerWinner = winner === localPlayerId;
  const winnerName = isPlayerWinner ? 'You' : 'Opponent';
  const loserName = isPlayerWinner ? 'Opponent' : 'You';
  
  // Determine win reason (this would be more sophisticated in a real implementation)
  const getWinReason = () => {
    // This is a placeholder - in a real game, the server would send the win reason
    const players = gameState.players;
    const losingPlayer = players.find(p => p.playerId !== winner);
    
    if (losingPlayer && losingPlayer.life <= 0) {
      return `${loserName} reached 0 life`;
    }
    
    // Could add more conditions like deck depletion, etc.
    return 'Game ended';
  };
  
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };
  
  const contentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  };
  
  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    margin: '0 10px',
    fontSize: '16px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  };
  
  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: isPlayerWinner ? '#4CAF50' : '#2196F3',
    color: 'white',
  };
  
  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f0f0f0',
    color: '#333',
  };
  
  return (
    <div style={modalStyle}>
      <div style={contentStyle}>
        {/* Victory/Defeat Icon */}
        <div style={{ fontSize: '4em', marginBottom: '20px' }}>
          {isPlayerWinner ? '🎉' : '😞'}
        </div>
        
        {/* Game Result */}
        <h1 style={{ 
          margin: '0 0 20px 0', 
          color: isPlayerWinner ? '#4CAF50' : '#f44336',
          fontSize: '2.5em'
        }}>
          {isPlayerWinner ? 'VICTORY!' : 'DEFEAT'}
        </h1>
        
        {/* Winner announcement */}
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5em' }}>
          {winnerName} won the game!
        </h2>
        
        {/* Win reason */}
        <p style={{ 
          fontSize: '1.1em', 
          color: '#666',
          marginBottom: '20px',
          fontStyle: 'italic'
        }}>
          {getWinReason()}
        </p>
        
        {/* Game statistics */}
        <div style={{ 
          backgroundColor: '#f9f9f9',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2em' }}>Game Statistics</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.9em' }}>
            <div>
              <strong>Turns Played:</strong><br />
              {turnNumber}
            </div>
            <div>
              <strong>Winner:</strong><br />
              {winnerName}
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onPlayAgain && (
            <button 
              style={primaryButtonStyle}
              onClick={onPlayAgain}
            >
              ⚔️ Play Again
            </button>
          )}
          {onReturnToMenu && (
            <button 
              style={secondaryButtonStyle}
              onClick={onReturnToMenu}
            >
              🏠 Return to Menu
            </button>
          )}
        </div>
        
        {/* Additional game info */}
        <div style={{ marginTop: '20px', fontSize: '0.8em', color: '#999' }}>
          Game ID: {gameState.gameId}
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;

