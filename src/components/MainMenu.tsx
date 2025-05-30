// src/components/MainMenu.tsx
import React from 'react';
import './MainMenu.css';

// Define the specific routes MainMenu can navigate to
export type MainMenuRoute = 'play' | 'deckbuilder' | 'settings';

interface MainMenuProps {
  onNavigate: (route: MainMenuRoute) => void; // Use the specific type
}

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  return (
    <div className="main-menu-container">
      <h1>Welcome to TCG Master</h1>
      <div className="menu-options">
        <button onClick={() => onNavigate('play')}>Play Game</button>
        <button onClick={() => onNavigate('deckbuilder')}>Deckbuilder</button>
        <button onClick={() => onNavigate('settings')}>Settings (Coming Soon)</button> 
        {/* Removed disabled for settings to match type, App.tsx handles the placeholder */}
      </div>
    </div>
  );
};

export default MainMenu;
