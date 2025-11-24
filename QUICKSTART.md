# Quick Start Guide

## Prerequisites

- Node.js (v16+)
- MongoDB (local installation or MongoDB Atlas connection string)

## Installation

1. **Clone or navigate to the project directory**

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```
   Or manually:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Set up MongoDB**:
   - Install MongoDB locally, or
   - Use MongoDB Atlas (cloud) and get connection string

4. **Configure Backend**:
   - Copy `backend/.env.example` to `backend/.env` (or create it)
   - Update the values:
     ```env
     PORT=3001
     MONGODB_URI=mongodb://localhost:27017/battleship
     JWT_SECRET=your-secret-key-here
     NODE_ENV=development
     FRONTEND_URL=http://localhost:3000
     ```

5. **Configure Frontend** (optional):
   - Copy `frontend/.env.example` to `frontend/.env` if you need custom URLs

## Running the Application

### Option 1: Run Both Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Use npm scripts from root

**Terminal 1:**
```bash
npm run dev:backend
```

**Terminal 2:**
```bash
npm run dev:frontend
```

## Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## First Steps

1. Open http://localhost:3000 in your browser
2. Register a new account
3. Click "Find Match" to enter the lobby
4. Wait for an opponent (open another browser/incognito window to test)
5. Place your ships
6. Start playing!

## Testing with Two Players

1. Open two browser windows (or use incognito mode)
2. Register/log in as two different users
3. Both click "Find Match" - they should be matched automatically
4. Play the game!

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running: `mongod` (or start MongoDB service)
- Check your `MONGODB_URI` in `backend/.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### Port Already in Use
- Backend uses port 3001, Frontend uses port 3000
- Change ports in config files if needed

### Socket Connection Failed
- Ensure backend is running on port 3001
- Check `VITE_SOCKET_URL` in frontend `.env` file

### Game Not Matching
- Ensure both players are in the queue
- Check browser console for errors
- Verify WebSocket connection in browser DevTools

## Building for Production

```bash
# Build both
npm run build:all

# Or separately
npm run build:backend
npm run build:frontend
```

Frontend build output: `frontend/dist/`
Backend build output: `backend/dist/`

