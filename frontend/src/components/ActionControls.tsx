import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import socketService from '../services/socketService';

interface ActionControlsProps {
  onStartGame: () => Promise<void>;
  isLoading: boolean;
  onPassPriority?: () => Promise<void>; 
  gameActive?: boolean; 
  currentPlayerId?: string | null; // ID of the player using this UI instance
  priorityHolderId?: string | null; // ID of the player who currently has priority
}

const ActionControls: React.FC<ActionControlsProps> = ({ onStartGame, isLoading, onPassPriority, gameActive, currentPlayerId, priorityHolderId }) => {
  const [selectedAttackers, setSelectedAttackers] = useState<string[]>([]);
  const [selectedBlockers, setSelectedBlockers] = useState<{[blockerId: string]: string}>({});
  const [combatActionLoading, setCombatActionLoading] = useState(false);

  // Get game state from Redux
  const gameState = useSelector((state: RootState) => state.game);
  const localPlayerId = gameState.localPlayerId;
  const currentPhase = gameState.currentPhase;
  const currentStep = gameState.currentStep;
  const activePlayerId = gameState.activePlayerId;
  const priorityPlayerId = gameState.priorityPlayerId;

  // Combat conditions
  const isMyTurn = activePlayerId === localPlayerId;
  const isAttackStep = currentPhase === 'COMBAT' && currentStep === 'DECLARE_ATTACKERS';
  const isBlockStep = currentPhase === 'COMBAT' && currentStep === 'DECLARE_BLOCKERS';
  const canDeclareAttackers = isMyTurn && isAttackStep && priorityPlayerId === localPlayerId;
  const canDeclareBlockers = !isMyTurn && isBlockStep && priorityPlayerId === localPlayerId;

  const handleStartGame = async () => {
    await onStartGame();
  };

  const handlePassPriority = async () => {
    if (!localPlayerId) {
      console.warn('No player ID available for pass priority');
      return;
    }

    try {
      setCombatActionLoading(true);
      console.log(`Passing priority: ${localPlayerId}`);
      
      // Emit WebSocket event for pass priority
      socketService.emit('pass_priority', {
        playerId: localPlayerId
      });
      
    } catch (error) {
      console.error('Failed to pass priority:', error);
    } finally {
      setCombatActionLoading(false);
    }
  };

  const handleDeclareAttackers = async () => {
    if (!localPlayerId || selectedAttackers.length === 0) {
      console.warn('No attackers selected or no player ID');
      return;
    }

    try {
      setCombatActionLoading(true);
      console.log(`Declaring attackers: ${selectedAttackers.join(', ')}`);
      
      // Emit WebSocket event for declare attackers
      socketService.emit('declare_attackers', {
        playerId: localPlayerId,
        attackerInstanceIds: selectedAttackers
      });
      
      // Clear selected attackers
      setSelectedAttackers([]);
    } catch (error) {
      console.error('Failed to declare attackers:', error);
    } finally {
      setCombatActionLoading(false);
    }
  };

  const handleDeclareBlockers = async () => {
    if (!localPlayerId || Object.keys(selectedBlockers).length === 0) {
      console.warn('No blockers selected or no player ID');
      return;
    }

    try {
      setCombatActionLoading(true);
      console.log(`Declaring blockers:`, selectedBlockers);
      
      // Emit WebSocket event for declare blockers
      socketService.emit('declare_blockers', {
        playerId: localPlayerId,
        blockerAssignments: selectedBlockers
      });
      
      // Clear selected blockers
      setSelectedBlockers({});
    } catch (error) {
      console.error('Failed to declare blockers:', error);
    } finally {
      setCombatActionLoading(false);
    }
  };

  // Helper function to clear all combat selections
  const clearCombatSelections = () => {
    setSelectedAttackers([]);
    setSelectedBlockers({});
  };

  return (
    <div className="action-controls" style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
      <h3>Game Actions</h3>
      
      {/* Basic Game Controls */}
      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleStartGame} disabled={isLoading || gameActive} style={{ marginRight: '10px' }}>
          {isLoading && !gameActive ? '↻ Starting...' : (gameActive ? 'Game Active' : 'Start Game')}
        </button>
        <button 
          onClick={handlePassPriority} 
          disabled={!gameActive || isLoading || !onPassPriority || priorityPlayerId !== localPlayerId} 
        >
          {isLoading && gameActive && priorityPlayerId === localPlayerId ? '↻ Passing...' : 'Pass Priority'}
        </button>
      </div>

      {/* Combat Actions */}
      {gameActive && (isAttackStep || isBlockStep) && (
        <div style={{ marginBottom: '10px', padding: '10px', border: '1px dashed red', borderRadius: '5px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'red' }}>⚔️ Combat Phase</h4>
          
          {/* Declare Attackers */}
          {canDeclareAttackers && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Select creatures to attack, then click Declare Attackers</p>
              <button 
                onClick={handleDeclareAttackers}
                disabled={combatActionLoading || selectedAttackers.length === 0}
                style={{ 
                  marginRight: '10px',
                  backgroundColor: selectedAttackers.length > 0 ? '#ff4444' : '#ccc',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {combatActionLoading ? '↻ Declaring...' : `⚔️ Declare Attackers (${selectedAttackers.length})`}
              </button>
              <button 
                onClick={clearCombatSelections}
                disabled={combatActionLoading}
                style={{ marginRight: '10px' }}
              >
                Clear
              </button>
              {selectedAttackers.length > 0 && (
                <span style={{ fontSize: '0.9em', color: '#666' }}>
                  Selected: {selectedAttackers.join(', ')}
                </span>
              )}
            </div>
          )}

          {/* Declare Blockers */}
          {canDeclareBlockers && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Select your creatures to block attackers, then click Declare Blockers</p>
              <button 
                onClick={handleDeclareBlockers}
                disabled={combatActionLoading || Object.keys(selectedBlockers).length === 0}
                style={{ 
                  marginRight: '10px',
                  backgroundColor: Object.keys(selectedBlockers).length > 0 ? '#4444ff' : '#ccc',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {combatActionLoading ? '↻ Declaring...' : `🛡️ Declare Blockers (${Object.keys(selectedBlockers).length})`}
              </button>
              <button 
                onClick={clearCombatSelections}
                disabled={combatActionLoading}
                style={{ marginRight: '10px' }}
              >
                Clear
              </button>
              {Object.keys(selectedBlockers).length > 0 && (
                <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                  Assignments: {Object.entries(selectedBlockers).map(([blocker, attacker]) => 
                    `${blocker} blocks ${attacker}`
                  ).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Combat Status */}
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            Phase: {currentPhase} - {currentStep} | Priority: {priorityPlayerId === localPlayerId ? 'You' : 'Opponent'}
          </div>
        </div>
      )}

      {/* Game State Info */}
      {gameActive && (
        <div style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
          Turn: {gameState.turnNumber} | Active: {activePlayerId === localPlayerId ? 'You' : 'Opponent'} | 
          Phase: {currentPhase || 'Unknown'} - {currentStep || 'Unknown'}
        </div>
      )}
    </div>
  );
};

export default ActionControls;
