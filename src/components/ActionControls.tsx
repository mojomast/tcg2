import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import socketService from '../services/socketService';

const ActionControls: React.FC = () => {
  const priorityPlayerId = useSelector((state: RootState) => state.game.priorityPlayerId);
  const activePlayerId = useSelector((state: RootState) => state.game.activePlayerId); // Get active player
  const localPlayerId = useSelector((state: RootState) => state.player?.id);

  const handlePassPriority = () => {
    if (localPlayerId) {
      socketService.emit('pass_priority', { playerId: localPlayerId });
      console.log('Pass Priority action emitted by', localPlayerId);
    } else {
      console.error('Cannot pass priority: localPlayerId is not defined.');
    }
  };

  const handlePassTurn = () => {
    if (localPlayerId) {
      socketService.emit('pass_turn', { playerId: localPlayerId });
      console.log('Pass Turn action emitted by', localPlayerId);
    } else {
      console.error('Cannot pass turn: localPlayerId is not defined.');
    }
  };

  const canPassPriority = priorityPlayerId === localPlayerId;
  const canPassTurn = activePlayerId === localPlayerId; // Player can only pass their own turn

  return (
    <div className="action-controls">
      {canPassPriority && (
        <button onClick={handlePassPriority} style={{ marginRight: '10px' }}>
          Pass Priority
        </button>
      )}
      {canPassTurn && (
        <button onClick={handlePassTurn}>
          Pass Turn
        </button>
      )}
      {!canPassPriority && !canPassTurn && ( // Show waiting if neither action is available for the local player
        <div>Waiting for opponent...</div>
      )}
    </div>
  );
};

export default ActionControls;
