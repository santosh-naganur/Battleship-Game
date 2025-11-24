# Battleship Backend

Backend server for the Battleship game built with Node.js, Express, Socket.io, and MongoDB.

## Architecture

- **Express.js** - RESTful API server
- **Socket.io** - WebSocket server for real-time communication
- **MongoDB + Mongoose** - Database and ODM
- **TypeScript** - Type-safe development

## Key Components

### Models
- **User** - User accounts with authentication
- **Game** - Game state and player boards

### Game Logic
- **BattleshipGame** - Core game logic for ship placement and attacks

### Socket Handlers
- **lobbySocketHandler** - Matchmaking queue management
- **gameSocketHandler** - Game events and state management

### Routes
- **auth** - Authentication endpoints (register, login)

## Environment Variables

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/battleship
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```

