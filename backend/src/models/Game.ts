import mongoose, { Document, Schema } from 'mongoose';

export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export interface IShip {
  type: ShipType;
  positions: Array<{ row: number; col: number }>;
  hits: number;
  size: number;
}

export interface IPlayerBoard {
  ships: IShip[];
  hits: Array<{ row: number; col: number }>;
  misses: Array<{ row: number; col: number }>;
}

export type GameStatus = 'waiting' | 'setup' | 'active' | 'finished';

export interface IGame extends Document {
  gameId: string;
  player1: {
    userId: mongoose.Types.ObjectId;
    username: string;
    board: IPlayerBoard;
    ready: boolean;
  };
  player2: {
    userId: mongoose.Types.ObjectId;
    username: string;
    board: IPlayerBoard;
    ready: boolean;
  };
  currentTurn: 'player1' | 'player2';
  status: GameStatus;
  winner: 'player1' | 'player2' | null;
  createdAt: Date;
  updatedAt: Date;
}

const shipSchema = new Schema<IShip>({
  type: {
    type: String,
    enum: ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'],
    required: true
  },
  positions: [{
    row: Number,
    col: Number
  }],
  hits: {
    type: Number,
    default: 0
  },
  size: {
    type: Number,
    required: true
  }
}, { _id: false });

const playerBoardSchema = new Schema<IPlayerBoard>({
  ships: [shipSchema],
  hits: [{
    row: Number,
    col: Number
  }],
  misses: [{
    row: Number,
    col: Number
  }]
}, { _id: false });

const gameSchema = new Schema<IGame>({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  player1: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    board: playerBoardSchema,
    ready: {
      type: Boolean,
      default: false
    }
  },
  player2: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    board: playerBoardSchema,
    ready: {
      type: Boolean,
      default: false
    }
  },
  currentTurn: {
    type: String,
    enum: ['player1', 'player2'],
    default: 'player1'
  },
  status: {
    type: String,
    enum: ['waiting', 'setup', 'active', 'finished'],
    default: 'waiting'
  },
  winner: {
    type: String,
    enum: ['player1', 'player2', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

gameSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Game = mongoose.model<IGame>('Game', gameSchema);

