# Battleship Game - Turn-Based Multiplayer

A full-stack turn-based Battleship game with live lobby and opponent matching system, built with React, TypeScript, Node.js, Express, Socket.io, and MongoDB.

## Features

- 🎮 **Turn-based Battleship gameplay** - Classic Battleship rules with 5 ships
- 🔄 **Live lobby system** - Real-time matchmaking queue
- ⚡ **Real-time updates** - WebSocket-based game state synchronization
- 👤 **User authentication** - JWT-based authentication system
- 📊 **User statistics** - Win/loss tracking
- 🎨 **Modern UI** - Beautiful, responsive design

## Technical Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Socket.io-client** - Real-time communication
- **React Router** - Navigation
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.io** - WebSocket server
- **MongoDB** - Database
- **Mongoose** - ODM
- **TypeScript** - Type safety
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── models/          # MongoDB models (User, Game)
│   │   ├── game/            # Game logic (BattleshipGame)
│   │   ├── routes/          # API routes (auth)
│   │   ├── sockets/         # Socket.io handlers
│   │   └── server.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── auth/       # Login, Register
│   │   │   ├── lobby/      # Lobby component
│   │   │   └── game/       # Game components
│   │   ├── contexts/        # React contexts (AuthContext)
│   │   ├── services/        # API and Socket services
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/battleship
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. Start MongoDB (if running locally):
```bash
# On macOS/Linux
mongod

# On Windows, start MongoDB service or use mongod.exe
```

5. Start the backend server:
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The backend server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## How to Play

1. **Register/Login**: Create an account or login with existing credentials
2. **Join Lobby**: Click "Find Match" to enter the matchmaking queue
3. **Wait for Match**: The system will automatically match you with an opponent
4. **Place Ships**: Place your 5 ships on the board:
   - Carrier (5 cells)
   - Battleship (4 cells)
   - Cruiser (3 cells)
   - Submarine (3 cells)
   - Destroyer (2 cells)
5. **Play**: Take turns attacking the opponent's board
6. **Win**: Sink all enemy ships to win!

## Game Rules

- Ships cannot overlap or be placed adjacent to each other
- Ships must be placed in a straight line (horizontal or vertical)
- Players take turns attacking
- A hit allows the same player to attack again
- A miss passes the turn to the opponent
- First player to sink all opponent's ships wins

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Health Check
- `GET /health` - Server health check

## Socket.io Events

### Client → Server
- `lobby:join` - Join matchmaking queue
- `lobby:leave` - Leave queue
- `lobby:status` - Get queue status
- `game:join` - Join a game room
- `game:placeShip` - Place a ship
- `game:attack` - Make an attack
- `game:getState` - Get current game state

### Server → Client
- `lobby:queued` - Added to queue
- `lobby:matched` - Matched with opponent
- `lobby:error` - Lobby error
- `game:state` - Game state update
- `game:shipPlaced` - Ship placed confirmation
- `game:attackResult` - Attack result
- `game:error` - Game error

## Code Quality Features

- **TypeScript** - Full type safety across frontend and backend
- **Modular Architecture** - Separated concerns with clear component structure
- **Error Handling** - Comprehensive error handling throughout
- **Validation** - Input validation on both client and server
- **Security** - Password hashing, JWT authentication
- **Real-time Sync** - WebSocket-based state synchronization

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Update `MONGODB_URI` to production database
3. Set a strong `JWT_SECRET`
4. Build: `npm run build`
5. Start: `npm start`

### Frontend
1. Update environment variables for production API URLs
2. Build: `npm run build`
3. Serve the `dist` folder with a web server (nginx, Apache, etc.)

## Future Enhancements

- [ ] Spectator mode
- [ ] Chat functionality
- [ ] Game replays
- [ ] Leaderboards
- [ ] Custom game settings
- [ ] Tournament mode
- [ ] Mobile app support

## License

This project is created for educational purposes.

## Author

Built as a demonstration of full-stack development skills with focus on:
- Code quality and best practices
- Modular architecture
- Production-ready features

