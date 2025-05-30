import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { StackItem } from '../interfaces/gameState';

interface StackItemDisplayProps {
  item: StackItem;
  index: number;
  isTop: boolean;
}

const StackItemDisplay: React.FC<StackItemDisplayProps> = ({ item, index, isTop }) => {
  const gameObjects = useSelector((state: RootState) => state.game.gameObjects);
  const players = useSelector((state: RootState) => state.game.players);
  
  // Get the card information from gameObjects
  const cardInfo = gameObjects[item.sourceInstanceId];
  const controller = players.find(p => p.playerId === item.controllerId);
  const localPlayerId = useSelector((state: RootState) => state.game.localPlayerId);
  
  const getStackItemIcon = () => {
    switch (item.type) {
      case 'Spell': return '📜';
      case 'Ability': return '✨';
      default: return '❓';
    }
  };
  
  const getStackItemStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '10px',
      margin: '2px 0',
      border: '2px solid #444',
      borderRadius: '5px',
      backgroundColor: isTop ? '#ffffcc' : '#f0f0f0',
      position: 'relative',
      minHeight: '60px',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
    };
    
    if (isTop) {
      return {
        ...baseStyle,
        boxShadow: '0 0 10px #ffaa00',
        border: '2px solid #ffaa00',
        transform: 'scale(1.02)',
      };
    }
    
    return baseStyle;
  };
  
  const controllerName = controller?.playerId === localPlayerId ? 'You' : 'Opponent';
  
  return (
    <div style={getStackItemStyle()}>
      {/* Stack position indicator */}
      <div style={{
        position: 'absolute',
        top: '-5px',
        left: '-5px',
        background: isTop ? '#ffaa00' : '#666',
        color: 'white',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8em',
        fontWeight: 'bold',
      }}>
        {index + 1}
      </div>
      
      {/* Card/ability info */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
        <span style={{ fontSize: '1.2em', marginRight: '8px' }}>
          {getStackItemIcon()}
        </span>
        <strong style={{ fontSize: '1em' }}>
          {cardInfo?.name || `Unknown ${item.type}`}
        </strong>
      </div>
      
      {/* Controller info */}
      <div style={{ fontSize: '0.8em', color: '#666', marginBottom: '5px' }}>
        Cast by: <strong>{controllerName}</strong>
      </div>
      
      {/* Targets info */}
      {item.targets && item.targets.length > 0 && (
        <div style={{ fontSize: '0.8em', color: '#444' }}>
          Targets: {item.targets.join(', ')}
        </div>
      )}
      
      {/* Rules text if available */}
      {cardInfo?.rulesText && (
        <div style={{ 
          fontSize: '0.7em', 
          color: '#555', 
          marginTop: '5px',
          fontStyle: 'italic',
          borderTop: '1px solid #ccc',
          paddingTop: '5px'
        }}>
          {cardInfo.rulesText}
        </div>
      )}
      
      {/* Resolution indicator for top item */}
      {isTop && (
        <div style={{
          fontSize: '0.7em',
          color: '#ff6600',
          fontWeight: 'bold',
          marginTop: '5px',
          textAlign: 'center'
        }}>
          ⏱️ WILL RESOLVE NEXT
        </div>
      )}
    </div>
  );
};

const StackZone: React.FC = () => {
  const stack = useSelector((state: RootState) => state.game.stack);
  const gameState = useSelector((state: RootState) => state.game);
  const localPlayerId = gameState.localPlayerId;
  const priorityPlayerId = gameState.priorityPlayerId;
  const consecutivePriorityPasses = gameState.consecutivePriorityPasses;
  
  // Stack resolves LIFO (Last In, First Out)
  const stackInResolveOrder = [...stack].reverse();
  
  const getStackStatus = () => {
    if (stack.length === 0) {
      return { message: 'Stack is empty', color: '#999' };
    }
    
    if (consecutivePriorityPasses >= 2) {
      return { message: 'Both players passed - resolving top item...', color: '#ff6600' };
    }
    
    const priorityHolder = priorityPlayerId === localPlayerId ? 'You have' : 'Opponent has';
    return { message: `${priorityHolder} priority to respond`, color: '#0066cc' };
  };
  
  const status = getStackStatus();
  
  return (
    <div className="stack-zone" style={{ 
      padding: '10px',
      minHeight: '100px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Stack header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px',
        borderBottom: '1px solid #ccc',
        paddingBottom: '5px'
      }}>
        <h4 style={{ margin: 0, fontSize: '1.1em' }}>
          🎯 Stack ({stack.length} item{stack.length !== 1 ? 's' : ''})
        </h4>
        <div style={{ 
          fontSize: '0.8em', 
          color: status.color,
          fontWeight: 'bold'
        }}>
          {status.message}
        </div>
      </div>
      
      {/* Stack contents */}
      {stack.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#999', 
          fontSize: '0.9em',
          padding: '20px',
          fontStyle: 'italic'
        }}>
          No spells or abilities on the stack
        </div>
      ) : (
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          maxHeight: '300px'
        }}>
          {/* Show stack in resolution order (top item first) */}
          {stackInResolveOrder.map((item, index) => (
            <StackItemDisplay
              key={item.stackId}
              item={item}
              index={index}
              isTop={index === 0}
            />
          ))}
          
          {/* Resolution order explanation */}
          {stack.length > 1 && (
            <div style={{
              marginTop: '10px',
              fontSize: '0.7em',
              color: '#666',
              textAlign: 'center',
              fontStyle: 'italic',
              borderTop: '1px solid #eee',
              paddingTop: '5px'
            }}>
              ℹ️ Items resolve in Last In, First Out (LIFO) order
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StackZone;
