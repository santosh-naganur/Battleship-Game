import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { socketService } from '../../services/socket';
import { Socket } from 'socket.io-client';
import './Lobby.css';

const Lobby: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Connect to socket
    const token = localStorage.getItem('token');
    const sock = socketService.connect(token || undefined);
    setSocket(sock);

    // Lobby event handlers
    sock.on('lobby:queued', () => {
      setIsSearching(true);
      setError('');
    });

    sock.on('lobby:matched', (data: { gameId: string; opponent: { username: string }; playerNumber: number }) => {
      setIsSearching(false);
      navigate(`/game/${data.gameId}`);
    });

    sock.on('lobby:error', (data: { message: string }) => {
      setError(data.message);
      setIsSearching(false);
    });

    sock.on('lobby:status', (data: { queueLength: number }) => {
      setQueueLength(data.queueLength);
    });

    return () => {
      sock.off('lobby:queued');
      sock.off('lobby:matched');
      sock.off('lobby:error');
      sock.off('lobby:status');
    };
  }, [user, navigate]);

  const handleFindMatch = () => {
    if (!socket || !user) return;
    setError('');
    socket.emit('lobby:join', {
      userId: user.id,
      username: user.username
    });
  };

  const handleLeaveQueue = () => {
    if (!socket) return;
    socket.emit('lobby:leave');
    setIsSearching(false);
  };

  const handleAddTestOpponent = () => {
    // Open a second window for testing - user can register/login there
    const testWindow = window.open(
      'http://localhost:3000/register',
      '_blank',
      'width=900,height=700'
    );
    
    if (testWindow) {
      // Show helpful message
      alert('Test window opened! Please register/login as a second player, then both players click "Find Match" to test the matchmaking.');
    } else {
      setError('Popup blocked. Please allow popups or open a new window manually.');
    }
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    logout();
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>⚓ Battleship</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="lobby-content">
        <div className="lobby-card">
          <h2>Game Lobby</h2>
          {error && <div className="error-message">{error}</div>}
          
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">Wins</span>
              <span className="stat-value">{user?.wins || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Losses</span>
              <span className="stat-value">{user?.losses || 0}</span>
            </div>
          </div>

          {isSearching ? (
            <div className="searching-container">
              <div className="spinner"></div>
              <p>Searching for opponent...</p>
              <p className="queue-info">Players in queue: {queueLength}</p>
              <button onClick={handleLeaveQueue} className="cancel-button">
                Cancel Search
              </button>
            </div>
          ) : (
            <>
              <button onClick={handleFindMatch} className="find-match-button">
                Find Match
              </button>
              <button 
                onClick={handleAddTestOpponent} 
                className="test-opponent-button"
                title="Add a test opponent for development/testing"
              >
                🧪 Add Test Opponent
              </button>
            </>
          )}

          <div className="game-info">
            <h3>How to Play</h3>
            <ul>
              <li>Place your 5 ships on the board</li>
              <li>Take turns attacking the opponent's board</li>
              <li>Sink all enemy ships to win!</li>
            </ul>
            <div className="test-instructions">
              <h4>🧪 Testing Matchmaking:</h4>
              <p>Click "Add Test Opponent" to open a second window. Register/login as Player 2, then both players click "Find Match" to test!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;

