import React from 'react';
import { Ship } from './Game';
import './GameBoard.css';

interface GameBoardProps {
  ships: Ship[];
  hits: Array<{ row: number; col: number }>;
  misses: Array<{ row: number; col: number }>;
  isOwnBoard: boolean;
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
}

const BOARD_SIZE = 10;

const GameBoard: React.FC<GameBoardProps> = ({
  ships,
  hits,
  misses,
  isOwnBoard,
  onCellClick,
  disabled = false
}) => {
  const isCellHit = (row: number, col: number): boolean => {
    return hits.some(h => h.row === row && h.col === col);
  };

  const isCellMiss = (row: number, col: number): boolean => {
    return misses.some(m => m.row === row && m.col === col);
  };

  const isCellShip = (row: number, col: number): boolean => {
    if (!isOwnBoard) return false; // Don't show opponent's ships
    return ships.some(ship =>
      ship.positions.some(pos => pos.row === row && pos.col === col)
    );
  };

  const isCellSunk = (row: number, col: number): boolean => {
    if (!isOwnBoard) return false;
    return ships.some(ship => {
      const posInShip = ship.positions.some(pos => pos.row === row && pos.col === col);
      return posInShip && ship.hits === ship.size;
    });
  };

  const getCellClass = (row: number, col: number): string => {
    const classes = ['cell'];
    
    if (isCellShip(row, col)) {
      classes.push('ship');
      if (isCellHit(row, col)) {
        classes.push('ship-hit');
      }
      if (isCellSunk(row, col)) {
        classes.push('ship-sunk');
      }
    }
    
    if (isCellHit(row, col)) {
      classes.push('hit');
    }
    
    if (isCellMiss(row, col)) {
      classes.push('miss');
    }
    
    if (disabled || isCellHit(row, col) || isCellMiss(row, col)) {
      classes.push('disabled');
    }
    
    return classes.join(' ');
  };

  const handleCellClick = (row: number, col: number) => {
    if (disabled || isCellHit(row, col) || isCellMiss(row, col)) return;
    onCellClick(row, col);
  };

  return (
    <div className="game-board">
      <div className="board-grid">
        {/* Column labels */}
        <div className="corner-cell"></div>
        {Array.from({ length: BOARD_SIZE }, (_, i) => (
          <div key={`col-${i}`} className="label-cell">
            {String.fromCharCode(65 + i)}
          </div>
        ))}
        
        {/* Board rows */}
        {Array.from({ length: BOARD_SIZE }, (_, row) => (
          <React.Fragment key={`row-${row}`}>
            {/* Row label */}
            <div className="label-cell">{row + 1}</div>
            {/* Row cells */}
            {Array.from({ length: BOARD_SIZE }, (_, col) => (
              <div
                key={`cell-${row}-${col}`}
                className={getCellClass(row, col)}
                onClick={() => handleCellClick(row, col)}
                title={`${String.fromCharCode(65 + col)}${row + 1}`}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
      
      <div className="board-legend">
        <div className="legend-item">
          <div className="legend-color ship"></div>
          <span>Ship</span>
        </div>
        <div className="legend-item">
          <div className="legend-color hit"></div>
          <span>Hit</span>
        </div>
        <div className="legend-item">
          <div className="legend-color miss"></div>
          <span>Miss</span>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;

