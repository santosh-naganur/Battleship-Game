import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { socketService } from '../../services/socket';
import { Socket } from 'socket.io-client';
import GameBoard from './GameBoard';
import ShipPlacement from './ShipPlacement';
import './Game.css';

export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export interface Ship {
  type: ShipType;
  positions: Array<{ row: number; col: number }>;
  hits: number;
  size: number;
}

export interface GameState {
  gameId: string;
  status: 'waiting' | 'setup' | 'active' | 'finished';
  player1: {
    username: string;
    ready: boolean;
    shipsPlaced: number;
  };
  player2: {
    username: string;
    ready: boolean;
    shipsPlaced: number;
  };
  currentTurn: 'player1' | 'player2';
  winner?: 'player1' | 'player2' | null;
}

interface AttackResult {
  attacker: 1 | 2;
  row: number;
  col: number;
  hit: boolean;
  sunk: boolean;
  gameOver: boolean;
  winner?: 'player1' | 'player2' | null;
  currentTurn: 'player1' | 'player2';
}

const Game: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null);
  const [myShips, setMyShips] = useState<Ship[]>([]);
  const [myHits, setMyHits] = useState<Array<{ row: number; col: number }>>([]);
  const [myMisses, setMyMisses] = useState<Array<{ row: number; col: number }>>([]);
  const [opponentHits, setOpponentHits] = useState<Array<{ row: number; col: number }>>([]);
  const [opponentMisses, setOpponentMisses] = useState<Array<{ row: number; col: number }>>([]);
  const [error, setError] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    if (!gameId || !user) return;

    const token = localStorage.getItem('token');
    const sock = socketService.connect(token || undefined);
    setSocket(sock);

    // Join game room
    sock.emit('game:join', { gameId });
    
    // Request full game state
    sock.emit('game:getState', { gameId, userId: user.id });

    // Game state handlers
    sock.on('game:state', (state: any) => {
      // Handle basic game state
      const basicState: GameState = {
        gameId: state.gameId,
        status: state.status,
        player1: state.player1,
        player2: state.player2,
        currentTurn: state.currentTurn,
        winner: state.winner
      };
      setGameState(basicState);
      
      // Handle player board if provided (for reconnection)
      // playerBoard = my board (shows where opponent has hit me)
      if (state.playerBoard) {
        setMyShips(state.playerBoard.ships || []);
        // Hits/misses on my board = opponent's attacks on me
        setOpponentHits(state.playerBoard.hits || []);
        setOpponentMisses(state.playerBoard.misses || []);
      }
      
      // opponentBoard = opponent's board (shows where I have attacked)
      if (state.opponentBoard) {
        setMyHits(state.opponentBoard.hits || []);
        setMyMisses(state.opponentBoard.misses || []);
      }
      
      // Determine player number based on usernames
      if (state.player1.username === user.username) {
        setPlayerNumber(1);
        setIsMyTurn(state.currentTurn === 'player1' && state.status === 'active');
      } else if (state.player2.username === user.username) {
        setPlayerNumber(2);
        setIsMyTurn(state.currentTurn === 'player2' && state.status === 'active');
      }
      setGameState(state);
      // Determine player number based on usernames
      if (state.player1.username === user.username) {
        setPlayerNumber(1);
        setIsMyTurn(state.currentTurn === 'player1' && state.status === 'active');
      } else if (state.player2.username === user.username) {
        setPlayerNumber(2);
        setIsMyTurn(state.currentTurn === 'player2' && state.status === 'active');
      }
    });

    sock.on('game:shipPlaced', (data: {
      playerNumber: 1 | 2;
      shipType: ShipType;
      positions: Array<{ row: number; col: number }>;
      setupComplete: boolean;
    }) => {
      if (data.playerNumber === playerNumber) {
        // Update my ships - avoid duplicates
        setMyShips(prev => {
          const exists = prev.some(ship => ship.type === data.shipType);
          if (exists) return prev;
          return [...prev, {
            type: data.shipType,
            positions: data.positions,
            hits: 0,
            size: data.positions.length
          }];
        });
      }
    });

    sock.on('game:attackResult', (result: AttackResult) => {
      if (result.attacker === playerNumber) {
        // My attack
        if (result.hit) {
          setMyHits(prev => [...prev, { row: result.row, col: result.col }]);
        } else {
          setMyMisses(prev => [...prev, { row: result.row, col: result.col }]);
        }
      } else {
        // Opponent's attack on me
        if (result.hit) {
          setOpponentHits(prev => [...prev, { row: result.row, col: result.col }]);
          // Update ship hits
          setMyShips(prev => prev.map(ship => {
            const wasHit = ship.positions.some(p => p.row === result.row && p.col === result.col);
            if (wasHit) {
              return { ...ship, hits: ship.hits + 1 };
            }
            return ship;
          }));
        } else {
          setOpponentMisses(prev => [...prev, { row: result.row, col: result.col }]);
        }
      }

      setIsMyTurn(result.currentTurn === (playerNumber === 1 ? 'player1' : 'player2'));

      if (result.gameOver) {
        setTimeout(() => {
          alert(result.winner === (playerNumber === 1 ? 'player1' : 'player2') ? 'You Win!' : 'You Lose!');
          navigate('/lobby');
        }, 1000);
      }
    });

    sock.on('game:error', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      sock.off('game:state');
      sock.off('game:shipPlaced');
      sock.off('game:attackResult');
      sock.off('game:error');
    };
  }, [gameId, user, playerNumber, navigate]);

  const handleShipPlacement = (shipType: ShipType, positions: Array<{ row: number; col: number }>) => {
    if (!socket || !gameId || !playerNumber) return;
    socket.emit('game:placeShip', { gameId, playerNumber, shipType, positions });
  };

  const handleAttack = (row: number, col: number) => {
    if (!socket || !gameId || !playerNumber || !isMyTurn || gameState?.status !== 'active') return;
    socket.emit('game:attack', { gameId, playerNumber, row, col });
  };

  if (!gameState) {
    return <div className="loading">Loading game...</div>;
  }

  const opponent = playerNumber === 1 ? gameState.player2 : gameState.player1;
  const mySetupComplete = playerNumber === 1 
    ? gameState.player1.shipsPlaced === 5 
    : gameState.player2.shipsPlaced === 5;
  const opponentSetupComplete = playerNumber === 1
    ? gameState.player2.shipsPlaced === 5
    : gameState.player1.shipsPlaced === 5;

  if (gameState.status === 'setup' && !mySetupComplete) {
    return (
      <div className="game-container">
        <div className="game-header">
          <h1>⚓ Battleship - Setup</h1>
          <button onClick={() => navigate('/lobby')} className="back-button">Back to Lobby</button>
        </div>
        <ShipPlacement
          onShipPlaced={handleShipPlacement}
          placedShips={myShips}
        />
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>⚓ Battleship</h1>
        <div className="game-info-header">
          <span>vs {opponent.username}</span>
          <button onClick={() => navigate('/lobby')} className="back-button">Leave Game</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {gameState.status === 'setup' && (
        <div className="waiting-message">
          Waiting for opponent to finish placing ships...
        </div>
      )}

      {gameState.status === 'active' && (
        <div className="turn-indicator">
          {isMyTurn ? (
            <div className="your-turn">Your Turn - Attack!</div>
          ) : (
            <div className="opponent-turn">Waiting for opponent's turn...</div>
          )}
        </div>
      )}

      {gameState.status === 'finished' && (
        <div className="game-over">
          <h2>{gameState.winner === (playerNumber === 1 ? 'player1' : 'player2') ? 'You Win! 🎉' : 'You Lose 😔'}</h2>
        </div>
      )}

      <div className="boards-container">
        <div className="board-section">
          <h3>Your Board</h3>
          <GameBoard
            ships={myShips}
            hits={opponentHits}
            misses={opponentMisses}
            isOwnBoard={true}
            onCellClick={() => {}} // Can't click on own board
          />
        </div>

        <div className="board-section">
          <h3>Enemy Board</h3>
          <GameBoard
            ships={[]} // Don't show opponent's ships
            hits={myHits}
            misses={myMisses}
            isOwnBoard={false}
            onCellClick={gameState.status === 'active' && isMyTurn ? handleAttack : () => {}}
            disabled={gameState.status !== 'active' || !isMyTurn}
          />
        </div>
      </div>
    </div>
  );
};

export default Game;

