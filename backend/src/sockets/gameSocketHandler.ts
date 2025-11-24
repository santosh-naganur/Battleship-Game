import { Server, Socket } from 'socket.io';
import { Game } from '../models/Game';
import { BattleshipGame, SHIP_TYPES } from '../game/BattleshipGame';

export const gameSocketHandler = (io: Server, socket: Socket) => {
  // Join game room
  socket.on('game:join', async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const game = await Game.findOne({ gameId });

      if (!game) {
        socket.emit('game:error', { message: 'Game not found' });
        return;
      }

      socket.join(gameId);
      socket.emit('game:joined', { gameId, status: game.status });

      // Send current game state to all players in the room
      io.to(gameId).emit('game:state', {
        gameId,
        status: game.status,
        player1: {
          username: game.player1.username,
          ready: game.player1.ready,
          shipsPlaced: game.player1.board.ships.length
        },
        player2: {
          username: game.player2.username,
          ready: game.player2.ready,
          shipsPlaced: game.player2.board.ships.length
        },
        currentTurn: game.currentTurn
      });
    } catch (error) {
      console.error('Error in game:join:', error);
      socket.emit('game:error', { message: 'Failed to join game' });
    }
  });

  // Place a ship
  socket.on('game:placeShip', async (data: {
    gameId: string;
    playerNumber: 1 | 2;
    shipType: string;
    positions: Array<{ row: number; col: number }>;
  }) => {
    try {
      const { gameId, playerNumber, shipType, positions } = data;
      const game = await Game.findOne({ gameId });

      if (!game) {
        socket.emit('game:error', { message: 'Game not found' });
        return;
      }

      if (game.status !== 'setup') {
        socket.emit('game:error', { message: 'Game is not in setup phase' });
        return;
      }

      const player = playerNumber === 1 ? game.player1 : game.player2;
      const success = BattleshipGame.placeShip(
        player.board,
        shipType as any,
        positions
      );

      if (!success) {
        socket.emit('game:placeShip:error', { message: 'Invalid ship placement' });
        return;
      }

      await game.save();

      // Check if both players are ready
      const board1Complete = BattleshipGame.isBoardSetupComplete(game.player1.board);
      const board2Complete = BattleshipGame.isBoardSetupComplete(game.player2.board);

      if (board1Complete && board2Complete) {
        game.status = 'active';
        game.currentTurn = 'player1';
        await game.save();
      }

      // Notify all players in the room
      io.to(gameId).emit('game:shipPlaced', {
        playerNumber,
        shipType,
        positions,
        setupComplete: BattleshipGame.isBoardSetupComplete(player.board)
      });

      io.to(gameId).emit('game:state', {
        gameId,
        status: game.status,
        player1: {
          username: game.player1.username,
          ready: game.player1.ready,
          shipsPlaced: game.player1.board.ships.length
        },
        player2: {
          username: game.player2.username,
          ready: game.player2.ready,
          shipsPlaced: game.player2.board.ships.length
        },
        currentTurn: game.currentTurn
      });
    } catch (error) {
      console.error('Error in game:placeShip:', error);
      socket.emit('game:error', { message: 'Failed to place ship' });
    }
  });

  // Make an attack
  socket.on('game:attack', async (data: {
    gameId: string;
    playerNumber: 1 | 2;
    row: number;
    col: number;
  }) => {
    try {
      const { gameId, playerNumber, row, col } = data;
      const game = await Game.findOne({ gameId });

      if (!game) {
        socket.emit('game:error', { message: 'Game not found' });
        return;
      }

      if (game.status !== 'active') {
        socket.emit('game:error', { message: 'Game is not active' });
        return;
      }

      // Check if it's the player's turn
      const expectedPlayer = game.currentTurn;
      if ((playerNumber === 1 && expectedPlayer !== 'player1') ||
          (playerNumber === 2 && expectedPlayer !== 'player2')) {
        socket.emit('game:error', { message: 'Not your turn' });
        return;
      }

      // Process attack
      const defender = playerNumber === 1 ? game.player2 : game.player1;

      // Validate attack coordinates
      if (row < 0 || row >= BattleshipGame.getBoardSize() ||
          col < 0 || col >= BattleshipGame.getBoardSize()) {
        socket.emit('game:error', { message: 'Invalid coordinates' });
        return;
      }

      const result = BattleshipGame.processAttack(defender.board, row, col);

      // Switch turns if it was a miss
      if (!result.hit) {
        game.currentTurn = playerNumber === 1 ? 'player2' : 'player1';
      }

      // Check for game over
      if (result.gameOver) {
        game.status = 'finished';
        game.winner = playerNumber === 1 ? 'player1' : 'player2';
        
        // Update user stats
        const winner = playerNumber === 1 ? game.player1.userId : game.player2.userId;
        const loser = playerNumber === 1 ? game.player2.userId : game.player1.userId;
        
        await Promise.all([
          game.save(),
          // Update winner stats
          // Update loser stats
        ]);
      } else {
        await game.save();
      }

      // Notify all players
      io.to(gameId).emit('game:attackResult', {
        attacker: playerNumber,
        row,
        col,
        hit: result.hit,
        sunk: result.sunk,
        gameOver: result.gameOver,
        winner: game.winner,
        currentTurn: game.currentTurn
      });

      io.to(gameId).emit('game:state', {
        gameId,
        status: game.status,
        player1: {
          username: game.player1.username,
          ready: game.player1.ready,
          shipsPlaced: game.player1.board.ships.length
        },
        player2: {
          username: game.player2.username,
          ready: game.player2.ready,
          shipsPlaced: game.player2.board.ships.length
        },
        currentTurn: game.currentTurn
      });
    } catch (error) {
      console.error('Error in game:attack:', error);
      socket.emit('game:error', { message: 'Failed to process attack' });
    }
  });

  // Get game state
  socket.on('game:getState', async (data: { gameId: string; userId?: string }) => {
    try {
      const { gameId, userId } = data;
      const game = await Game.findOne({ gameId });

      if (!game) {
        socket.emit('game:error', { message: 'Game not found' });
        return;
      }

      const response: any = {
        gameId,
        status: game.status,
        player1: {
          username: game.player1.username,
          ready: game.player1.ready,
          shipsPlaced: game.player1.board.ships.length
        },
        player2: {
          username: game.player2.username,
          ready: game.player2.ready,
          shipsPlaced: game.player2.board.ships.length
        },
        currentTurn: game.currentTurn,
        winner: game.winner
      };

      // Send player's own board if userId matches
      if (userId) {
        const isPlayer1 = game.player1.userId.toString() === userId;
        const isPlayer2 = game.player2.userId.toString() === userId;
        
        if (isPlayer1) {
          response.playerBoard = {
            ships: game.player1.board.ships,
            hits: game.player1.board.hits,
            misses: game.player1.board.misses
          };
          response.opponentBoard = {
            hits: game.player2.board.hits,
            misses: game.player2.board.misses
          };
        } else if (isPlayer2) {
          response.playerBoard = {
            ships: game.player2.board.ships,
            hits: game.player2.board.hits,
            misses: game.player2.board.misses
          };
          response.opponentBoard = {
            hits: game.player1.board.hits,
            misses: game.player1.board.misses
          };
        }
      }

      socket.emit('game:state', response);
    } catch (error) {
      console.error('Error in game:getState:', error);
      socket.emit('game:error', { message: 'Failed to get game state' });
    }
  });
};

