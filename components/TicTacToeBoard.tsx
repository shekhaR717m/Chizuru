import React from 'react';
import { GameState, Player } from '../types';

interface TicTacToeBoardProps {
  gameState: GameState;
  onMove: (row: number, col: number) => void;
}

const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ gameState, onMove }) => {
  const { board, status, winner, isComputerThinking } = gameState;

  const getStatusMessage = () => {
    if (status === 'playing') {
      return isComputerThinking ? "Chizuru is thinking..." : "Your turn (X)";
    }
    if (status === 'win') return "You win! 🎉";
    if (status === 'lose') return "Chizuru wins!";
    if (status === 'draw') return "It's a draw!";
    return '';
  };
  
  const renderCell = (cell: Player | null, row: number, col: number) => {
    const isClickable = status === 'playing' && cell === null && !isComputerThinking;
    const cellContent = cell === 'user' ? 'X' : cell === 'model' ? 'O' : 'empty';
    const label = isClickable ? `Play at row ${row + 1}, column ${col + 1}` : `Cell at row ${row + 1}, column ${col + 1} contains ${cellContent}`;
    
    return (
      <button
        key={`${row}-${col}`}
        onClick={() => onMove(row, col)}
        disabled={!isClickable}
        aria-label={label}
        className="w-16 h-16 bg-gray-600 rounded-md flex items-center justify-center text-3xl font-bold transition-colors duration-200 disabled:cursor-not-allowed hover:bg-gray-500"
      >
        {cell === 'user' ? 'X' : cell === 'model' ? 'O' : ''}
      </button>
    );
  };

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg">
      <div className="grid grid-cols-3 gap-2 mb-3" role="grid" aria-label="Tic-Tac-Toe board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))
        )}
      </div>
      <p className="text-center text-sm text-gray-300 h-5" role="status" aria-live="polite">
        {getStatusMessage()}
      </p>
    </div>
  );
};

export default TicTacToeBoard;