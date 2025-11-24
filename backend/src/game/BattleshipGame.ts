import { IShip, IPlayerBoard, ShipType } from '../models/Game';

export interface ShipDefinition {
  type: ShipType;
  size: number;
}

export const SHIP_TYPES: ShipDefinition[] = [
  { type: 'carrier', size: 5 },
  { type: 'battleship', size: 4 },
  { type: 'cruiser', size: 3 },
  { type: 'submarine', size: 3 },
  { type: 'destroyer', size: 2 }
];

export class BattleshipGame {
  private static readonly BOARD_SIZE = 10;

  /**
   * Check if ship placement is valid
   */
  static isValidShipPlacement(
    board: IPlayerBoard,
    shipType: ShipType,
    positions: Array<{ row: number; col: number }>
  ): boolean {
    // Check if positions are within board bounds
    for (const pos of positions) {
      if (
        pos.row < 0 || pos.row >= this.BOARD_SIZE ||
        pos.col < 0 || pos.col >= this.BOARD_SIZE
      ) {
        return false;
      }
    }

    // Check if ship already placed
    const existingShip = board.ships.find(s => s.type === shipType);
    if (existingShip) {
      return false;
    }

    // Check ship size matches definition
    const shipDef = SHIP_TYPES.find(s => s.type === shipType);
    if (!shipDef || positions.length !== shipDef.size) {
      return false;
    }

    // Check if positions are in a straight line (horizontal or vertical)
    const isHorizontal = positions.every(p => p.row === positions[0].row);
    const isVertical = positions.every(p => p.col === positions[0].col);
    if (!isHorizontal && !isVertical) {
      return false;
    }

    // Check if positions are adjacent (continuous)
    if (isHorizontal) {
      const cols = positions.map(p => p.col).sort((a, b) => a - b);
      for (let i = 0; i < cols.length - 1; i++) {
        if (cols[i + 1] !== cols[i] + 1) {
          return false;
        }
      }
    } else {
      const rows = positions.map(p => p.row).sort((a, b) => a - b);
      for (let i = 0; i < rows.length - 1; i++) {
        if (rows[i + 1] !== rows[i] + 1) {
          return false;
        }
      }
    }

    // Check if positions overlap with existing ships
    for (const existingShip of board.ships) {
      for (const existingPos of existingShip.positions) {
        for (const newPos of positions) {
          if (existingPos.row === newPos.row && existingPos.col === newPos.col) {
            return false;
          }
        }
      }
    }

    // Check adjacency - ships cannot be directly adjacent
    for (const existingShip of board.ships) {
      for (const existingPos of existingShip.positions) {
        for (const newPos of positions) {
          const rowDiff = Math.abs(existingPos.row - newPos.row);
          const colDiff = Math.abs(existingPos.col - newPos.col);
          if (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Place a ship on the board
   */
  static placeShip(
    board: IPlayerBoard,
    shipType: ShipType,
    positions: Array<{ row: number; col: number }>
  ): boolean {
    if (!this.isValidShipPlacement(board, shipType, positions)) {
      return false;
    }

    const shipDef = SHIP_TYPES.find(s => s.type === shipType);
    if (!shipDef) {
      return false;
    }

    const ship: IShip = {
      type: shipType,
      positions: [...positions],
      hits: 0,
      size: shipDef.size
    };

    board.ships.push(ship);
    return true;
  }

  /**
   * Process an attack on the opponent's board
   */
  static processAttack(
    opponentBoard: IPlayerBoard,
    row: number,
    col: number
  ): { hit: boolean; sunk: boolean; gameOver: boolean } {
    // Check if already attacked
    const alreadyHit = opponentBoard.hits.some(
      h => h.row === row && h.col === col
    );
    const alreadyMissed = opponentBoard.misses.some(
      m => m.row === row && m.col === col
    );

    if (alreadyHit || alreadyMissed) {
      return { hit: false, sunk: false, gameOver: false };
    }

    // Check if hit a ship
    let hit = false;
    let hitShip: IShip | null = null;

    for (const ship of opponentBoard.ships) {
      for (const pos of ship.positions) {
        if (pos.row === row && pos.col === col) {
          hit = true;
          hitShip = ship;
          ship.hits++;
          break;
        }
      }
      if (hit) break;
    }

    if (hit && hitShip) {
      opponentBoard.hits.push({ row, col });
      const sunk = hitShip.hits === hitShip.size;
      const gameOver = this.checkGameOver(opponentBoard);
      return { hit: true, sunk, gameOver };
    } else {
      opponentBoard.misses.push({ row, col });
      return { hit: false, sunk: false, gameOver: false };
    }
  }

  /**
   * Check if all ships are sunk (game over)
   */
  static checkGameOver(board: IPlayerBoard): boolean {
    return board.ships.every(ship => ship.hits === ship.size);
  }

  /**
   * Get all valid positions for placing a ship
   */
  static generateShipPositions(
    board: IPlayerBoard,
    shipType: ShipType,
    startRow: number,
    startCol: number,
    orientation: 'horizontal' | 'vertical'
  ): Array<{ row: number; col: number }> | null {
    const shipDef = SHIP_TYPES.find(s => s.type === shipType);
    if (!shipDef) {
      return null;
    }

    const positions: Array<{ row: number; col: number }> = [];
    const size = shipDef.size;

    if (orientation === 'horizontal') {
      for (let i = 0; i < size; i++) {
        positions.push({ row: startRow, col: startCol + i });
      }
    } else {
      for (let i = 0; i < size; i++) {
        positions.push({ row: startRow + i, col: startCol });
      }
    }

    if (this.isValidShipPlacement(board, shipType, positions)) {
      return positions;
    }

    return null;
  }

  /**
   * Check if board setup is complete (all ships placed)
   */
  static isBoardSetupComplete(board: IPlayerBoard): boolean {
    return board.ships.length === SHIP_TYPES.length;
  }

  static getBoardSize(): number {
    return this.BOARD_SIZE;
  }
}

