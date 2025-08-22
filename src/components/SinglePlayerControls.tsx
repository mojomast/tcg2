import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import socketService from '../services/socketService';
import {
  setLocalPlayerId,
  setGameStateFromServer,
  passTurnViaSocket,
  passPriorityViaSocket
} from '../store/slices/gameSlice';
import { TEST_PLAYER_1_ID, TEST_PLAYER_2_ID } from '../config/constants';

interface SinglePlayerControlsProps {
  onExitSinglePlayer: () => void;
}

const SinglePlayerControls: React.FC<SinglePlayerControlsProps> = ({ onExitSinglePlayer }) => {
  const dispatch = useDispatch<AppDispatch>();
  const gameState = useSelector((state: RootState) => state.game);
  const [activePlayer, setActivePlayer] = useState<string>(TEST_PLAYER_1_ID);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const currentPlayer = gameState.players.find(p => p.playerId === gameState.localPlayerId);
  const opponentPlayer = gameState.players.find(p => p.playerId !== gameState.localPlayerId);

  const switchPlayer = () => {
    const newPlayer = activePlayer === TEST_PLAYER_1_ID ? TEST_PLAYER_2_ID : TEST_PLAYER_1_ID;
    setActivePlayer(newPlayer);
    dispatch(setLocalPlayerId(newPlayer));

    // In single-player mode, we need to notify the server of the player switch
    // This ensures the server knows which player's cards we're trying to access
    console.log(`[SinglePlayer] Switching control to ${newPlayer}`);

    // The socket connection remains the same, but we need to inform the server
    // about the player switch so it knows which player's hand to check
    socketService.emit('switch_player', {
      gameId: 'test-game-001',
      newPlayerId: newPlayer
    });
  };

  const handlePassTurn = () => {
    if (gameState.localPlayerId) {
      dispatch(passTurnViaSocket({ playerId: gameState.localPlayerId }));
    }
  };

  const handlePassPriority = () => {
    if (gameState.localPlayerId) {
      dispatch(passPriorityViaSocket({ playerId: gameState.localPlayerId }));
    }
  };

  const forceDrawCard = () => {
    // This would need to be implemented in the game engine
    console.log('Force draw card for current player');
  };

  const toggleDebugPanel = () => {
    setShowDebugPanel(!showDebugPanel);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '10px',
      padding: '15px',
      color: 'white',
      fontSize: '14px',
      minWidth: '250px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#FFD700' }}>🎯 Single Player Mode</h3>
        <button
          onClick={onExitSinglePlayer}
          style={{
            background: 'transparent',
            border: '1px solid #ff4444',
            color: '#ff4444',
            borderRadius: '50%',
            width: '25px',
            height: '25px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Exit Single Player Mode"
        >
          ✕
        </button>
      </div>

      {/* Player Switcher */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          Control: {activePlayer === TEST_PLAYER_1_ID ? 'Player 1' : 'Player 2'}
        </div>
        <button
          onClick={switchPlayer}
          style={{
            width: '100%',
            padding: '8px',
            background: 'linear-gradient(45deg, #00FF00, #32CD32)',
            border: 'none',
            borderRadius: '5px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔄 Switch Player
        </button>
      </div>

      {/* Game Actions */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Game Actions:</div>
        <div style={{ display: 'grid', gap: '5px' }}>
          <button
            onClick={handlePassPriority}
            disabled={gameState.priorityPlayerId !== gameState.localPlayerId}
            style={{
              padding: '6px 10px',
              background: gameState.priorityPlayerId === gameState.localPlayerId
                ? 'linear-gradient(45deg, #4CAF50, #66BB6A)'
                : '#666',
              border: 'none',
              borderRadius: '3px',
              color: 'white',
              cursor: gameState.priorityPlayerId === gameState.localPlayerId ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            Pass Priority
          </button>
          <button
            onClick={handlePassTurn}
            disabled={gameState.activePlayerId !== gameState.localPlayerId}
            style={{
              padding: '6px 10px',
              background: gameState.activePlayerId === gameState.localPlayerId
                ? 'linear-gradient(45deg, #FF9800, #FFB74D)'
                : '#666',
              border: 'none',
              borderRadius: '3px',
              color: 'white',
              cursor: gameState.activePlayerId === gameState.localPlayerId ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
          >
            Pass Turn
          </button>
        </div>
      </div>

      {/* Game State Info */}
      <div style={{ marginBottom: '15px', fontSize: '12px' }}>
        <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Game State:</div>
        <div>Phase: {gameState.currentPhase}</div>
        <div>Step: {gameState.currentStep}</div>
        <div>Turn: {gameState.turnNumber}</div>
        <div>Active: {gameState.activePlayerId === TEST_PLAYER_1_ID ? 'P1' : 'P2'}</div>
        <div>Priority: {gameState.priorityPlayerId === TEST_PLAYER_1_ID ? 'P1' : 'P2'}</div>
      </div>

      {/* Player Info */}
      <div style={{ marginBottom: '15px', fontSize: '12px' }}>
        <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
          {gameState.localPlayerId === TEST_PLAYER_1_ID ? 'Player 1' : 'Player 2'}:
        </div>
        <div>Life: {currentPlayer?.life || 0}</div>
        <div>Mana: {currentPlayer?.manaPool ?
          Object.entries(currentPlayer.manaPool)
            .filter(([_, amount]) => amount > 0)
            .map(([color, amount]) => `${color}${amount}`)
            .join(' ') || 'None'
          : 'None'}</div>
        <div>Hand: {currentPlayer?.hand.length || 0} cards</div>
        <div>Library: {currentPlayer?.deck_count || 0} cards</div>
      </div>

      {/* Debug Panel Toggle */}
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={toggleDebugPanel}
          style={{
            width: '100%',
            padding: '6px',
            background: showDebugPanel ? '#444' : '#666',
            border: '1px solid #777',
            borderRadius: '3px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          {showDebugPanel ? '▼' : '▶'} Debug Panel
        </button>
      </div>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.3)',
          paddingTop: '10px',
          marginTop: '10px'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#FFD700' }}>
            Debug Controls:
          </div>
          <div style={{ display: 'grid', gap: '3px' }}>
            <button
              onClick={forceDrawCard}
              style={{
                padding: '4px 8px',
                background: '#2196F3',
                border: 'none',
                borderRadius: '3px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Force Draw Card
            </button>
            <button
              style={{
                padding: '4px 8px',
                background: '#9C27B0',
                border: 'none',
                borderRadius: '3px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Skip Phase
            </button>
            <button
              style={{
                padding: '4px 8px',
                background: '#F44336',
                border: 'none',
                borderRadius: '3px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Reset Game
            </button>
          </div>

          {/* Card ID Display */}
          <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>
            <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Recent Card IDs:</div>
            {gameState.players.flatMap(p => p.hand.slice(0, 2)).map((cardId, index) => (
              <div key={index} style={{ fontFamily: 'monospace' }}>
                {cardId}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div style={{
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        width: '15px',
        height: '15px',
        background: '#00FF00',
        borderRadius: '50%',
        border: '2px solid #333',
        animation: 'pulse 2s infinite'
      }} />

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default SinglePlayerControls;