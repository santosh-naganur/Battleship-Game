# Battleship Frontend

React + TypeScript frontend for the Battleship game.

## Features

- React 18 with TypeScript
- Vite for fast development and building
- Socket.io-client for real-time updates
- React Router for navigation
- Modern, responsive UI

## Components

### Auth
- **Login** - User login form
- **Register** - User registration form

### Lobby
- **Lobby** - Matchmaking interface

### Game
- **Game** - Main game component
- **GameBoard** - Interactive game board
- **ShipPlacement** - Ship placement interface

## Services

- **api.ts** - REST API client
- **socket.ts** - Socket.io client service

## Contexts

- **AuthContext** - Authentication state management

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The built files will be in the `dist` directory.

