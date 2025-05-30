/**
 * GameOverModal.tsx
 * Modal component to display game over state with winner, statistics, and options
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store.js';
import { GameState } from '../store/slices/gameSlice.js';

interface GameOverModalProps {
    isVisible: boolean;
    onPlayAgain: () => void;
    onReturnToMenu: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ isVisible, onPlayAgain, onReturnToMenu }) => {
  const gameState = useSelector((state: RootState) => state.game) as GameState | null;
  
  if (!isVisible || !gameState) {
    return null;
  }
  
  const winner = gameState.winner;
  const winReason = 'Game completed'; // Simple win reason since winReason doesn't exist in GameState
    const turnNumber = gameState.turnNumber;
    const players = gameState.players;

    // Calculate game statistics
    const winnerPlayer = players.find(p => p.playerId === winner);
    const loserPlayer = players.find(p => p.playerId !== winner);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-4 text-gray-800">
                        Game Over!
                    </h2>
                    
                    <div className="mb-6">
                        <div className="text-2xl font-semibold mb-2">
                            🎉 {winnerPlayer?.playerId || winner} Wins!
                        </div>
                        <div className="text-gray-600">
                            Reason: {winReason}
                        </div>
                    </div>
                    
                    <div className="bg-gray-100 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold mb-3 text-gray-700">Game Statistics</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="font-medium">Turns Played</div>
                                <div className="text-gray-600">{turnNumber}</div>
                            </div>
                            <div>
                                <div className="font-medium">Players</div>
                                <div className="text-gray-600">{players.length}</div>
                            </div>
                            {winnerPlayer && (
                                <div>
                                    <div className="font-medium">Winner Life</div>
                                    <div className="text-gray-600">{winnerPlayer.life} ❤️</div>
                                </div>
                            )}
                            {loserPlayer && (
                                <div>
                                    <div className="font-medium">Loser Life</div>
                                    <div className="text-gray-600">{loserPlayer.life} ❤️</div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onPlayAgain}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            🎮 Play Again
                        </button>
                        <button
                            onClick={onReturnToMenu}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            🏠 Return to Menu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameOverModal;

