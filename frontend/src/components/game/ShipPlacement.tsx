import React, { useState, useCallback, useRef } from 'react';
import { ShipType, Ship } from './Game';
import GameBoard from './GameBoard';
import './ShipPlacement.css';

const BOARD_SIZE = 10;

const SHIP_TYPES: Array<{ type: ShipType; size: number; name: string }> = [
  { type: 'carrier', size: 5, name: 'Carrier (5)' },
  { type: 'battleship', size: 4, name: 'Battleship (4)' },
  { type: 'cruiser', size: 3, name: 'Cruiser (3)' },
  { type: 'submarine', size: 3, name: 'Submarine (3)' },
  { type: 'destroyer', size: 2, name: 'Destroyer (2)' }
];

interface ShipPlacementProps {
  onShipPlaced: (shipType: ShipType, positions: Array<{ row: number; col: number }>) => void;
  placedShips: Ship[];
}

const ShipPlacement: React.FC<ShipPlacementProps> = ({ onShipPlaced, placedShips }) => {
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ row: number; col: number } | null>(null);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const boardRef = useRef<HTMLDivElement>(null);

  const getShipPositions = useCallback((row: number, col: number): Array<{ row: number; col: number }> => {
    if (!selectedShip) return [];
    
    const shipDef = SHIP_TYPES.find(s => s.type === selectedShip);
    if (!shipDef) return [];

    const positions: Array<{ row: number; col: number }> = [];
    const size = shipDef.size;

    if (orientation === 'horizontal') {
      for (let i = 0; i < size; i++) {
        positions.push({ row, col: col + i });
      }
    } else {
      for (let i = 0; i < size; i++) {
        positions.push({ row: row + i, col });
      }
    }

    return positions;
  }, [selectedShip, orientation]);

  const isValidPlacement = useCallback((positions: Array<{ row: number; col: number }>): boolean => {
    // Check bounds
    for (const pos of positions) {
      if (pos.row < 0 || pos.row >= BOARD_SIZE || pos.col < 0 || pos.col >= BOARD_SIZE) {
        return false;
      }
    }

    // Check overlap with placed ships
    for (const placedShip of placedShips) {
      for (const placedPos of placedShip.positions) {
        for (const newPos of positions) {
          if (placedPos.row === newPos.row && placedPos.col === newPos.col) {
            return false;
          }
          // Check adjacency
          const rowDiff = Math.abs(placedPos.row - newPos.row);
          const colDiff = Math.abs(placedPos.col - newPos.col);
          if (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)) {
            return false;
          }
        }
      }
    }

    return true;
  }, [placedShips]);

  const handleCellClick = (row: number, col: number) => {
    if (!selectedShip) return;

    const positions = getShipPositions(row, col);
    if (isValidPlacement(positions)) {
      onShipPlaced(selectedShip, positions);
      setSelectedShip(null);
      setHoverPosition(null);
    }
  };

  const handleCellHover = (row: number, col: number) => {
    if (!selectedShip) return;
    setHoverPosition({ row, col });
  };

  const isCellInPreview = (row: number, col: number): boolean => {
    if (!hoverPosition || !selectedShip) return false;
    const previewPositions = getShipPositions(hoverPosition.row, hoverPosition.col);
    return previewPositions.some(p => p.row === row && p.col === col);
  };

  const getPreviewClass = (row: number, col: number): string => {
    if (!isCellInPreview(row, col)) return '';
    const positions = hoverPosition ? getShipPositions(hoverPosition.row, hoverPosition.col) : [];
    return isValidPlacement(positions) ? 'preview-valid' : 'preview-invalid';
  };

  const remainingShips = SHIP_TYPES.filter(
    ship => !placedShips.some(placed => placed.type === ship.type)
  );

  return (
    <div className="ship-placement-container">
      <div className="placement-instructions">
        <h2>Place Your Ships</h2>
        <p>Click on a ship to select it, then click on the board to place it.</p>
        <button
          onClick={() => setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
          className="orientation-button"
        >
          Orientation: {orientation === 'horizontal' ? 'Horizontal ↔' : 'Vertical ↕'}
        </button>
      </div>

      <div className="placement-content">
        <div className="ship-selector">
          <h3>Available Ships</h3>
          <div className="ship-list">
            {remainingShips.map(ship => (
              <button
                key={ship.type}
                className={`ship-button ${selectedShip === ship.type ? 'selected' : ''}`}
                onClick={() => setSelectedShip(ship.type)}
              >
                {ship.name}
              </button>
            ))}
          </div>
          
          <div className="placed-ships">
            <h3>Placed Ships</h3>
            {placedShips.map(ship => (
              <div key={ship.type} className="placed-ship">
                {SHIP_TYPES.find(s => s.type === ship.type)?.name}
              </div>
            ))}
          </div>
        </div>

        <div className="placement-board-container" ref={boardRef}>
          <CustomBoard
            ships={placedShips}
            hits={[]}
            misses={[]}
            isOwnBoard={true}
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
            getPreviewClass={getPreviewClass}
          />
        </div>
      </div>
    </div>
  );
};

// Custom board component with hover preview
interface CustomBoardProps {
  ships: Ship[];
  hits: Array<{ row: number; col: number }>;
  misses: Array<{ row: number; col: number }>;
  isOwnBoard: boolean;
  onCellClick: (row: number, col: number) => void;
  onCellHover: (row: number, col: number) => void;
  getPreviewClass: (row: number, col: number) => string;
}

const CustomBoard: React.FC<CustomBoardProps> = ({
  ships,
  hits,
  misses,
  isOwnBoard,
  onCellClick,
  onCellHover,
  getPreviewClass
}) => {
  const isCellShip = (row: number, col: number): boolean => {
    return ships.some(ship =>
      ship.positions.some(pos => pos.row === row && pos.col === col)
    );
  };

  const getCellClass = (row: number, col: number): string => {
    const classes = ['cell'];
    if (isCellShip(row, col)) {
      classes.push('ship');
    }
    const previewClass = getPreviewClass(row, col);
    if (previewClass) {
      classes.push(previewClass);
    }
    return classes.join(' ');
  };

  return (
    <div className="game-board">
      <div className="board-grid">
        <div className="corner-cell"></div>
        {Array.from({ length: BOARD_SIZE }, (_, i) => (
          <div key={`col-${i}`} className="label-cell">
            {String.fromCharCode(65 + i)}
          </div>
        ))}
        
        {Array.from({ length: BOARD_SIZE }, (_, row) => (
          <React.Fragment key={`row-${row}`}>
            <div className="label-cell">{row + 1}</div>
            {Array.from({ length: BOARD_SIZE }, (_, col) => (
              <div
                key={`cell-${row}-${col}`}
                className={getCellClass(row, col)}
                onClick={() => onCellClick(row, col)}
                onMouseEnter={() => onCellHover(row, col)}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ShipPlacement;

