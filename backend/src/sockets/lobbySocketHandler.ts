import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Game } from '../models/Game';
import { User } from '../models/User';

interface QueueUser {
  socketId: string;
  userId: string;
  username: string;
}

// In-memory queue for matchmaking
const matchmakingQueue: QueueUser[] = [];
const waitingGames = new Map<string, { gameId: string; player1: QueueUser }>();

export const lobbySocketHandler = (io: Server, socket: Socket) => {
  // Join lobby
  socket.on('lobby:join', async (data: { userId: string; username: string }) => {
    try {
      const { userId, username } = data;
      
      // Check if user is already in queue
      const existingInQueue = matchmakingQueue.find(u => u.userId === userId);
      if (existingInQueue) {
        socket.emit('lobby:error', { message: 'Already in matchmaking queue' });
        return;
      }

      // Check if user is already in a waiting game
      for (const [socketId, game] of waitingGames.entries()) {
        if (game.player1.userId === userId) {
          socket.emit('lobby:error', { message: 'Already has a pending game' });
          return;
        }
      }

      // Add user to matchmaking queue
      const queueUser: QueueUser = {
        socketId: socket.id,
        userId,
        username
      };

      // Try to find a match
      if (matchmakingQueue.length > 0) {
        const opponent = matchmakingQueue.shift()!;
        
        // Create a new game
        const gameId = uuidv4();
        
        const game = await Game.create({
          gameId,
          player1: {
            userId: opponent.userId,
            username: opponent.username,
            board: { ships: [], hits: [], misses: [] },
            ready: false
          },
          player2: {
            userId,
            username,
            board: { ships: [], hits: [], misses: [] },
            ready: false
          },
          status: 'setup',
          currentTurn: 'player1'
        });

        // Notify both players
        io.to(opponent.socketId).emit('lobby:matched', {
          gameId,
          opponent: { userId, username },
          playerNumber: 1
        });

        socket.emit('lobby:matched', {
          gameId,
          opponent: { userId: opponent.userId, username: opponent.username },
          playerNumber: 2
        });

        // Join game room
        socket.join(gameId);
        io.sockets.sockets.get(opponent.socketId)?.join(gameId);

        console.log(`✅ Matched ${opponent.username} with ${username} in game ${gameId}`);
      } else {
        // Add to queue
        matchmakingQueue.push(queueUser);
        socket.emit('lobby:queued', { message: 'Added to matchmaking queue' });
        console.log(`⏳ ${username} added to matchmaking queue`);
      }
    } catch (error) {
      console.error('Error in lobby:join:', error);
      socket.emit('lobby:error', { message: 'Failed to join lobby' });
    }
  });

  // Leave lobby/queue
  socket.on('lobby:leave', () => {
    const index = matchmakingQueue.findIndex(u => u.socketId === socket.id);
    if (index !== -1) {
      const user = matchmakingQueue[index];
      matchmakingQueue.splice(index, 1);
      console.log(`❌ ${user.username} left matchmaking queue`);
    }
    socket.emit('lobby:left', { message: 'Left matchmaking queue' });
  });

  // Get queue status
  socket.on('lobby:status', () => {
    socket.emit('lobby:status', {
      queueLength: matchmakingQueue.length,
      inQueue: matchmakingQueue.some(u => u.socketId === socket.id)
    });
  });


  // Handle disconnect - remove from queue
  socket.on('disconnect', () => {
    const index = matchmakingQueue.findIndex(u => u.socketId === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
    }
    
    // Remove from waiting games
    waitingGames.delete(socket.id);
  });
};

