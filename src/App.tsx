// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Provider } from 'react-redux'; // Provider will be here
import store from './store/store';
import GameBoard from './components/GameBoard';
import MainMenu from './components/MainMenu';
import Deckbuilder from './components/Deckbuilder'; // Import the new Deckbuilder
import socketService from './services/socketService';
import { setGameStateFromServer } from './store/slices/gameSlice';
import { GameState as ServerGameState, GameEvent, EventType } from './interfaces/gameState';
import { updateManaPool } from './store/slices/playerSlice';
import './index.css'; // Global styles

interface PlaceholderProps {
  onBack: () => void;
}

// SettingsPlaceholder remains, DeckbuilderPlaceholder is removed
const SettingsPlaceholder: React.FC<PlaceholderProps> = ({ onBack }) => (
  <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
    <h1>Settings</h1>
    <p>Application settings will be available here in a future update.</p>
    <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
      Back to Main Menu
    </button>
  </div>
);

type ViewName = 'main_menu' | 'play' | 'deckbuilder' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewName>('main_menu');

  // Define handleGameEvent outside useEffect so it's accessible in cleanup
  const handleGameEvent = useCallback((eventData: GameEvent) => {
    console.log(`[App.tsx] RAW game_event RECEIVED FROM SERVER: type=${eventData.type}, payload keys=${eventData.payload ? Object.keys(eventData.payload).join(',') : 'no payload'}`);
    console.log('[App.tsx] Received game_event:', eventData);
    switch (eventData.type) {
      case EventType.GAME_READY:
      case EventType.GAME_STATE_UPDATE:
        if (eventData.payload && eventData.payload.gameState) {
          store.dispatch(setGameStateFromServer(eventData.payload.gameState as ServerGameState));
        } else {
          console.warn(`[App.tsx] ${eventData.type} event received without gameState:`, eventData);
        }
        break;
      case EventType.MANA_POOL_UPDATED:
        if (eventData.payload && typeof eventData.payload.playerId === 'string' && eventData.payload.manaPool) {
          store.dispatch(updateManaPool(eventData.payload as { playerId: string; manaPool: any }));
        } else {
          console.warn('[App.tsx] MANA_POOL_UPDATED event with invalid payload:', eventData);
        }
        break;
      case EventType.PLAYER_JOINED:
        console.log(`[App.tsx] 🎮 PLAYER JOINED:`, eventData.payload.message);
        // You could dispatch a Redux action here to show a notification
        break;
      default:
        console.log('[App.tsx] Unhandled game_event type:', eventData.type, eventData);
        break;
    }
  }, []);

  useEffect(() => {
    console.log('[App.tsx] useEffect for socket connection is running.');
    
    // Add a small delay to ensure page is fully loaded before connecting
    const connectTimeout = setTimeout(() => {
      console.log('[App.tsx] Starting delayed socket connection...');
      // Establish WebSocket connection when the App component mounts
      socketService.connect();

      console.log('[App.tsx] Attaching "game_event" listener to socketService.');
      // Attach event listener
      socketService.on('game_event', handleGameEvent);

    }, 1000); // 1 second delay to ensure page is loaded
    
    // Clean up the connection and listener when the component unmounts
    return () => {
      clearTimeout(connectTimeout);
      socketService.off('game_event', handleGameEvent);
      socketService.disconnect();
    };
  }, [handleGameEvent]);

  const navigateTo = (view: ViewName) => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'play':
        return <GameBoard />;
      case 'deckbuilder':
        return <Deckbuilder onBack={() => navigateTo('main_menu')} />; // Use the actual Deckbuilder
      case 'settings':
        return <SettingsPlaceholder onBack={() => navigateTo('main_menu')} />;
      case 'main_menu':
      default:
        return <MainMenu onNavigate={navigateTo} />;
    }
  };

  return (
    <Provider store={store}>
      {renderCurrentView()}
    </Provider>
  );
};

export default App;
