import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import ActionControls from './components/ActionControls';
import PlayerHUD from './components/PlayerHUD';
import GameBoardInfo from './components/GameBoardInfo';
import HandDisplay from './components/HandDisplay';
import DeckEditorPanel from './components/DeckEditorPanel';
import { startGame, passPriorityService } from './services/gameService';
import { GameState } from './types/gameState';

function App() {
  const [count, setCount] = useState(0);
  const [gameData, setGameData] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeckEditorVisible, setIsDeckEditorVisible] = useState(false);

  const handleStartGame = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: GameState = await startGame();
      setGameData(data);
      console.log('Game started in App.tsx:', data);
    } catch (err: any) {
      console.error('Failed to start game in App.tsx:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePassPriority = async () => {
    if (!gameData) {
      console.error('Cannot pass priority, game data is not available.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedGameData = await passPriorityService(gameData);
      setGameData(updatedGameData);
    } catch (err) {
      console.error('Error passing priority:', err);
      setError(err instanceof Error ? err.message : 'Failed to pass priority');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDeckEditor = () => {
    setIsDeckEditorVisible(true);
  };

  const handleCloseDeckEditor = () => {
    setIsDeckEditorVisible(false);
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React TCG</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button 
          onClick={handleOpenDeckEditor}
          style={{
            marginLeft: '1rem',
            padding: '0.6rem 1.2rem',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Open Deck Editor
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

      <ActionControls 
        onStartGame={handleStartGame} 
        onPassPriority={handlePassPriority}
        isLoading={isLoading} 
        gameActive={!!gameData}
        currentPlayerId={gameData ? gameData.player1_state.id : null} 
        priorityHolderId={gameData ? gameData.priorityHolderId : null} 
      />

      {error && <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>}

      <GameBoardInfo 
        isLoading={isLoading && !gameData} 
        turnNumber={gameData?.turnNumber}
        activePlayerId={gameData?.activePlayerId}
        priorityHolderId={gameData?.priorityHolderId}
        currentPhase={gameData?.currentPhase}
      />

      {gameData && (
        <div style={{ marginTop: '20px', borderTop: '2px solid #666', paddingTop: '20px' }}>
          <h2 style={{textAlign: 'center'}}>Game Active (ID: {gameData.gameId})</h2>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
            <PlayerHUD 
              playerData={gameData.player1_state} 
              playerName="Player 1" 
              hasPriority={gameData.priorityHolderId === gameData.player1_state.id}
            />
            <div> {/* Wrapper for Opponent's HUD and Hand Count */}
              <PlayerHUD 
                playerData={gameData.player2_state} 
                playerName="Player 2 (Opponent)" 
                hasPriority={gameData.priorityHolderId === gameData.player2_state.id}
              />
              {gameData.player2_state.handCount !== undefined && (
                <p style={{ textAlign: 'center', margin: '0', fontSize: '0.9em' }}>
                  Opponent's Hand: {gameData.player2_state.handCount}
                </p>
              )}
            </div>
          </div>
          
          {/* Display Player 1's Hand */} 
          {gameData.player1_state && (
            <HandDisplay 
              cards={gameData.player1_state.hand} 
              playerName="Player 1" 
              currentEnergy={gameData.player1_state.energy} 
            />
          )}

          <div style={{ marginTop: '10px', padding: '10px', border: '1px solid lightgray', background: '#f9f9f9' }}>
            <h4>Raw GameState Data (Mock):</h4>
            <pre>{JSON.stringify(gameData, null, 2)}</pre>
          </div>
        </div>
      )}

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      
      <DeckEditorPanel 
        isVisible={isDeckEditorVisible}
        onClose={handleCloseDeckEditor}
      />
    </>
  );
}

export default App;
