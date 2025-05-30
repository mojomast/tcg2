import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { GamePhase, GameStep } from '../interfaces/gameState';

// Phase configuration with colors and icons
const PHASE_CONFIG = {
  'BEGIN': { 
    color: '#2196F3', 
    icon: '🌅', 
    name: 'Begin Phase',
    description: 'Untap, upkeep, draw cards'
  },
  'MAIN': { 
    color: '#4CAF50', 
    icon: '🎯', 
    name: 'Main Phase',
    description: 'Play cards, activate abilities'
  },
  'COMBAT': { 
    color: '#f44336', 
    icon: '⚔️', 
    name: 'Combat Phase',
    description: 'Declare attackers and blockers'
  },
  'END': { 
    color: '#9C27B0', 
    icon: '🌙', 
    name: 'End Phase',
    description: 'End step, cleanup'
  }
} as const;

// Step configuration
const STEP_CONFIG = {
  'UNTAP': 'Untap Step',
  'UPKEEP': 'Upkeep Step', 
  'DRAW': 'Draw Step',
  'MAIN_PRE': 'Main Phase',
  'MAIN_POST': 'Second Main',
  'COMBAT_BEGIN': 'Begin Combat',
  'DECLARE_ATTACKERS': 'Declare Attackers',
  'DECLARE_BLOCKERS': 'Declare Blockers',
  'FIRST_STRIKE_DAMAGE': 'First Strike Damage',
  'COMBAT_DAMAGE': 'Combat Damage',
  'COMBAT_END': 'End Combat',
  'END_STEP': 'End Step',
  'CLEANUP': 'Cleanup Step'
} as const;

const PhaseDisplay: React.FC = () => {
  const gameState = useSelector((state: RootState) => state.game);
  const currentPhase = gameState.currentPhase;
  const currentStep = gameState.currentStep;
  const activePlayerId = gameState.activePlayerId;
  const localPlayerId = gameState.localPlayerId;
  const turnNumber = gameState.turnNumber;
  
  // Get phase configuration
  const phaseConfig = currentPhase ? PHASE_CONFIG[currentPhase] : null;
  const stepName = currentStep ? STEP_CONFIG[currentStep] : 'Unknown Step';
  const isMyTurn = activePlayerId === localPlayerId;
  
  // Generate action hints based on current phase/step
  const getActionHints = (): string[] => {
    if (!isMyTurn && currentPhase !== 'COMBAT') {
      return ['Wait for your turn', 'You can play instants and activate abilities'];
    }
    
    switch (currentPhase) {
      case 'BEGIN':
        if (currentStep === 'UPKEEP') return ['Upkeep triggers resolve', 'Priority to respond'];
        if (currentStep === 'DRAW') return ['Draw a card', 'Priority to respond'];
        return ['Beginning of turn actions'];
        
      case 'MAIN':
        const hints = ['Play resource cards (once per turn)', 'Play creatures and other spells'];
        if (currentStep === 'MAIN_POST') {
          hints.push('Second main phase - play more cards');
        }
        return hints;
        
      case 'COMBAT':
        if (currentStep === 'DECLARE_ATTACKERS' && isMyTurn) {
          return ['Select creatures to attack', 'Click creatures then "Declare Attackers"'];
        }
        if (currentStep === 'DECLARE_BLOCKERS' && !isMyTurn) {
          return ['Select creatures to block', 'Assign blockers to attackers'];
        }
        if (currentStep === 'COMBAT_DAMAGE') {
          return ['Combat damage is being calculated', 'Creatures may die from damage'];
        }
        return ['Combat is happening', 'You can play instants and activate abilities'];
        
      case 'END':
        if (currentStep === 'CLEANUP') {
          return ['Discard down to 7 cards', 'Damage is removed from creatures'];
        }
        return ['End of turn triggers', 'Turn is ending soon'];
        
      default:
        return ['Unknown phase'];
    }
  };
  
  const actionHints = getActionHints();
  
  if (!phaseConfig) {
    return (
      <div className="phase-display" style={{ padding: '10px', textAlign: 'center' }}>
        <p>Loading phase information...</p>
      </div>
    );
  }
  
  return (
    <div className="phase-display" style={{ 
      padding: '15px',
      margin: '10px 0',
      border: `3px solid ${phaseConfig.color}`,
      borderRadius: '10px',
      backgroundColor: `${phaseConfig.color}15`,
      textAlign: 'center'
    }}>
      {/* Turn and phase header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <div style={{ fontSize: '0.9em', color: '#666' }}>
          Turn {turnNumber}
        </div>
        <div style={{ 
          fontSize: '1.5em',
          fontWeight: 'bold',
          color: phaseConfig.color
        }}>
          {phaseConfig.icon} {phaseConfig.name}
        </div>
        <div style={{ 
          fontSize: '0.9em', 
          color: isMyTurn ? '#4CAF50' : '#FF9800',
          fontWeight: 'bold'
        }}>
          {isMyTurn ? 'YOUR TURN' : 'OPPONENT\'S TURN'}
        </div>
      </div>
      
      {/* Current step */}
      <div style={{ 
        fontSize: '1.1em',
        marginBottom: '10px',
        fontWeight: '500'
      }}>
        {stepName}
      </div>
      
      {/* Phase description */}
      <div style={{ 
        fontSize: '0.9em',
        color: '#666',
        marginBottom: '15px',
        fontStyle: 'italic'
      }}>
        {phaseConfig.description}
      </div>
      
      {/* Action hints */}
      {actionHints.length > 0 && (
        <div style={{ 
          fontSize: '0.8em',
          textAlign: 'left',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          padding: '8px',
          borderRadius: '5px',
          marginTop: '10px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>💡 Available Actions:</div>
          <ul style={{ margin: 0, paddingLeft: '15px' }}>
            {actionHints.map((hint, index) => (
              <li key={index} style={{ marginBottom: '2px' }}>{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PhaseDisplay;
