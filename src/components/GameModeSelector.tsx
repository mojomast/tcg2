import React from 'react';

interface GameModeSelectorProps {
  onSelectMode: (mode: 'multiplayer' | 'singleplayer' | 'demo') => void;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onSelectMode }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      color: 'white'
    }}>
      <h1 style={{
        fontSize: '3rem',
        marginBottom: '2rem',
        textAlign: 'center',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }}>
        🎮 TCG Game Modes
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        maxWidth: '800px',
        width: '100%'
      }}>
        {/* Multiplayer Mode */}
        <div
          onClick={() => onSelectMode('multiplayer')}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '15px',
            padding: '2rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
        >
          <h2 style={{ marginBottom: '1rem', color: '#FFD700' }}>👥 Multiplayer</h2>
          <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
            Play against real opponents online with real-time synchronization
          </p>
          <ul style={{
            textAlign: 'left',
            marginBottom: '1.5rem',
            opacity: 0.8,
            listStyle: 'none',
            padding: 0
          }}>
            <li>✅ Real-time multiplayer</li>
            <li>✅ Socket.io synchronization</li>
            <li>✅ Competitive gameplay</li>
            <li>✅ Global leaderboard</li>
          </ul>
          <button style={{
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            border: 'none',
            borderRadius: '25px',
            color: '#333',
            padding: '12px 30px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}>
            Play Multiplayer
          </button>
        </div>

        {/* Single Player Mode */}
        <div
          onClick={() => onSelectMode('singleplayer')}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '15px',
            padding: '2rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
        >
          <h2 style={{ marginBottom: '1rem', color: '#00FF00' }}>🎯 Single Player</h2>
          <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
            Test and practice by controlling both players in a single session
          </p>
          <ul style={{
            textAlign: 'left',
            marginBottom: '1.5rem',
            opacity: 0.8,
            listStyle: 'none',
            padding: 0
          }}>
            <li>✅ Control both players</li>
            <li>✅ Practice game mechanics</li>
            <li>✅ Test deck strategies</li>
            <li>✅ Debug and development</li>
          </ul>
          <button style={{
            background: 'linear-gradient(45deg, #00FF00, #32CD32)',
            border: 'none',
            borderRadius: '25px',
            color: '#333',
            padding: '12px 30px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}>
            Start Single Player
          </button>
        </div>

        {/* Demo Mode */}
        <div
          onClick={() => onSelectMode('demo')}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '15px',
            padding: '2rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            gridColumn: '1 / -1'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
        >
          <h2 style={{ marginBottom: '1rem', color: '#FF69B4' }}>🎪 Demo Mode</h2>
          <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
            Watch an AI simulation or showcase mode with pre-programmed actions
          </p>
          <ul style={{
            textAlign: 'left',
            marginBottom: '1.5rem',
            opacity: 0.8,
            listStyle: 'none',
            padding: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem'
          }}>
            <li>✅ AI simulation</li>
            <li>✅ Showcase gameplay</li>
            <li>✅ Tutorial mode</li>
            <li>✅ Performance testing</li>
          </ul>
          <button style={{
            background: 'linear-gradient(45deg, #FF69B4, #FF1493)',
            border: 'none',
            borderRadius: '25px',
            color: 'white',
            padding: '12px 30px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}>
            Start Demo
          </button>
        </div>
      </div>

      <div style={{
        marginTop: '3rem',
        textAlign: 'center',
        opacity: 0.7
      }}>
        <p>✨ New Features: Drag & Drop, Tap Buttons, Enhanced Card IDs</p>
        <p>🎯 Choose your preferred game mode to start playing!</p>
      </div>
    </div>
  );
};

export default GameModeSelector;