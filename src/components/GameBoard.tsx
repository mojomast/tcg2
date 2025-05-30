import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './GameBoard.css'; 
import OpponentInfoBar from './OpponentInfoBar.js';
import PlayerInfoBar from './PlayerInfoBar.js';
import OpponentBattlefield from './OpponentBattlefield.js';
import PlayerBattlefield from './PlayerBattlefield.js';
import OpponentHandZone from './OpponentHandZone.js';
import PlayerHandZone from './PlayerHandZone.js';
import OpponentDeckZone from './OpponentDeckZone.js';
import PlayerDeckZone from './PlayerDeckZone.js';
import OpponentDiscardZone from './OpponentDiscardZone.js';
import PlayerDiscardZone from './PlayerDiscardZone.js';
import StackZone from './StackZone.js';
import PhaseDisplay from './PhaseDisplay.js';
import ActionControls from './ActionControls.js';
import ManaDisplay from './ManaDisplay'; // Import ManaDisplay
import GameOverModal from './GameOverModal'; // Import GameOverModal
import { RootState } from '../store/store.js';
import { setLocalPlayerId, setGameStateFromServer } from '../store/slices/gameSlice.js';
import { EventType, GameEvent, GameState as ServerGameState } from '../interfaces/gameState.js';
import socketService from '../services/socketService.js';
import { TEST_GAME_ID, TEST_PLAYER_1_ID, TEST_PLAYER_2_ID } from '../config/constants.js';
import DeckSelectionModal from './DeckSelectionModal.js';

const GameBoard: React.FC = () => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const localPlayerId = gameState.localPlayerId;
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(TEST_PLAYER_1_ID);
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // useEffect to log when localPlayerId changes, useful for debugging UI state
  useEffect(() => {
    console.log('[GameBoard] localPlayerId is now:', localPlayerId);
  }, [localPlayerId]);

  const handleJoinGame = () => {
    if (selectedPlayerId) {
      // Show deck selection modal before joining game
      setShowDeckSelection(true);
    }
  };

  const handleDeckSelected = (deckId: string) => {
    setSelectedDeckId(deckId);
    setShowDeckSelection(false);
    
    // Now join the game with the selected deck
    dispatch(setLocalPlayerId(selectedPlayerId));
    socketService.emitJoinGame(TEST_GAME_ID, selectedPlayerId);
    console.log(`Attempting to join game ${TEST_GAME_ID} as ${selectedPlayerId} with deck ${deckId}`);
  };

  const handleDeckSelectionCancel = () => {
    setShowDeckSelection(false);
  };

  if (!localPlayerId) {
    return (
      <div className="join-game-container" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Join Game</h2>
        <div>
          <label htmlFor="playerIdSelect" style={{ marginRight: '10px' }}>Select Player ID:</label>
          <select 
            id="playerIdSelect"
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            style={{ padding: '5px', marginRight: '10px' }}
          >
            <option value={TEST_PLAYER_1_ID}>Player 1 ({TEST_PLAYER_1_ID})</option>
            <option value={TEST_PLAYER_2_ID}>Player 2 ({TEST_PLAYER_2_ID})</option>
          </select>
          <button onClick={handleJoinGame} style={{ padding: '5px 10px' }}>
            Join Game
          </button>
        </div>
        <p style={{ marginTop: '20px' }}>Open another tab or incognito window, select the other Player ID, and click "Join Game" to test two players.</p>
        
        <DeckSelectionModal 
          isOpen={showDeckSelection}
          onSelectDeck={handleDeckSelected}
          onCancel={handleDeckSelectionCancel}
          playerId={selectedPlayerId}
          availableDecks={[]}
        />
      </div>
    );
  }

  return (
    <div className="game-board">
      <div className="opponent-info-bar-area">
        <OpponentInfoBar />
      </div>

      <div className="opponent-deck-zone-area">
        <OpponentDeckZone />
      </div>
      <div className="opponent-hand-zone-area">
        <OpponentHandZone />
      </div>
      <div className="opponent-battlefield-area">
        <OpponentBattlefield />
      </div>
      <div className="opponent-discard-zone-area">
        <OpponentDiscardZone />
      </div>

      <div className="stack-zone-area">
        <StackZone />
      </div>

      <div className="player-deck-zone-area">
        <PlayerDeckZone />
      </div>
      {/* PlayerHandZone moved below */}
      <div className="player-battlefield-area">
        <PlayerBattlefield />
      </div>
      <div className="player-discard-zone-area">
        <PlayerDiscardZone />
      </div>

      {/* New dedicated row for PlayerHandZone */}
      <div className="player-hand-zone-area">
        <PlayerHandZone />
      </div>

      <div className="player-info-bar-area">
        <PlayerInfoBar />
        {/* PhaseDisplay might be better here or within ActionControls based on final design preference */}
        <PhaseDisplay /> 
        <ManaDisplay /> {/* Add ManaDisplay here */}
      </div>

      <div className="action-controls-area">
        <ActionControls />
      </div>
      
      {/* Game Over Modal */}
      <GameOverModal 
        isVisible={gameState.gameEnded || false}
        onPlayAgain={() => {
          console.log('Play Again clicked - implement game restart logic');
          // TODO: Implement play again functionality
        }}
        onReturnToMenu={() => {
          console.log('Return to Menu clicked - implement menu navigation');
          // TODO: Implement return to menu functionality
        }}
      />
    </div>
  );
};

export default GameBoard;
