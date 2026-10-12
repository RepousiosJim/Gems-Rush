// Game Types
export type GemType = 'fire' | 'water' | 'earth' | 'nature' | 'lightning'

// New block types for destructible obstacles
export type BlockType = 'green' | 'blue'

export interface Gem {
  id: string
  type: GemType
  row: number
  col: number
  powerUpType?: 'bomb' | 'lightning' | 'swap' | 'multiplier' | 'rainbow' | 'hammer' | 'shuffle'
  comboLevel?: number
  isMatched?: boolean
  isAnimating?: boolean
  isSelected?: boolean
}

// New interface for obstacle blocks
export interface ObstacleBlock {
  id: string
  type: BlockType
  row: number
  col: number
  orientation: 'horizontal' | 'vertical' // How the block spans
  isDestroyed?: boolean
  isAnimating?: boolean
  health?: number // Some blocks might require multiple hits
}

export type Collected = Partial<Record<GemType, number>>

export type LevelGoal =
  | { kind: 'score'; target: number }
  | { kind: 'collect'; gems: Collected }

export interface GameState {
  // Board state
  board: (Gem | null)[][]
  obstacleBlocks: ObstacleBlock[] // New: obstacle blocks on the board
  boardSize: number
  
  // Game status
  score: number
  level: number
  moves: number
  targetScore: number
  timeRemaining?: number
  // bonus: goal met, leftover moves are being spent as power-ups before the win screen
  gameStatus: 'idle' | 'playing' | 'paused' | 'bonus' | 'completed' | 'failed'
  gameMode: 'normal' | 'timeAttack' | 'dailyChallenge' | 'campaign' | 'stage'
  
  // Round rules owned by the page: what wins, how many moves, what has been cleared so far
  goal?: LevelGoal
  maxMoves?: number
  collected?: Collected

  // Stage system integration
  currentStage?: number
  blocksDestroyed?: number // Track blocks destroyed for stage objectives
  
  // Selection and animation
  selectedGem: { row: number; col: number } | null
  isAnimating: boolean
  matchesFound: Gem[][]
  
  // Multiplayer specific
  isMultiplayer: boolean
  roomId?: string
  players: Player[]
  currentTurn?: string
  
  // Power-ups and features
  powerUps: PowerUp[]
  activePowerUp?: PowerUp
  comboMultiplier: number
  lastMoveScore: number
}

export interface Player {
  id: string
  username: string
  displayName: string
  avatar?: string
  score: number
  moves: number
  level: number
  isReady: boolean
  isOnline: boolean
  position: number
  status: 'waiting' | 'ready' | 'playing' | 'finished' | 'disconnected'
}

export interface PowerUp {
  id: string
  type: 'bomb' | 'row_clear' | 'col_clear' | 'color_blast' | 'shuffle' | 'time_freeze'
  name: string
  description: string
  uses: number
  cost: {
    coins?: number
    gems?: number
  }
  unlockLevel: number
  cooldown?: number
  duration?: number
}

export interface GameMove {
  id: string
  playerId: string
  fromRow: number
  fromCol: number
  toRow: number
  toCol: number
  timestamp: number
  type: 'swap' | 'power_up' | 'special'
  result?: GameMoveResult
}

export interface GameMoveResult {
  valid: boolean
  scoreChange: number
  matchesFound: Gem[][]
  newBoard: (Gem | null)[][]
  comboCount: number
  powerUpActivated?: PowerUp
  achievementsUnlocked?: Achievement[]
}

export interface GameRoom {
  id: string
  code: string
  hostId: string
  players: Player[]
  maxPlayers: number
  currentPlayers: number
  status: 'waiting' | 'starting' | 'active' | 'paused' | 'completed' | 'cancelled'
  isPrivate: boolean
  gameMode: GameMode
  settings: GameRoomSettings
  createdAt: Date
  startedAt?: Date
  endedAt?: Date
  winnerId?: string
}

export interface GameRoomSettings {
  timeLimit?: number
  moveLimit?: number
  powerUpsEnabled: boolean
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  boardSize: number
  targetScore?: number
  allowSpectators: boolean
}

export interface GameMode {
  id: number
  name: string
  displayName: string
  description: string
  maxPlayers: number
  timeLimit?: number
  moveLimit?: number
  scoringMultiplier: number
  unlockLevel: number
  isActive: boolean
  config: Record<string, unknown>
}

export interface Achievement {
  id: number
  name: string
  displayName: string
  description: string
  iconUrl?: string
  type: 'progress' | 'milestone' | 'challenge' | 'social'
  category: string
  requirements: Record<string, unknown>
  rewards: Record<string, unknown>
  points: number
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  isHidden: boolean
  progress?: Record<string, unknown>
  completedAt?: Date
  isClaimed?: boolean
}

export interface LeaderboardEntry {
  id: string
  userId: string
  username: string
  displayName: string
  avatar?: string
  score: number
  rank: number
  additionalStats: Record<string, unknown>
  achievedAt: Date
}

export interface Leaderboard {
  id: number
  name: string
  type: 'daily' | 'weekly' | 'monthly' | 'all_time' | 'seasonal'
  entries: LeaderboardEntry[]
  periodStart?: Date
  periodEnd?: Date
  isActive: boolean
  rewards: Record<string, unknown>
}

// Game Events for real-time synchronization
export interface GameEvent {
  type: 'move' | 'powerup' | 'chat' | 'ready' | 'pause' | 'resume' | 'surrender'
  data: unknown
  timestamp: number
  playerId: string
}

// Socket Events
export interface ServerToClientEvents {
  'room-created': (data: { room: GameRoom }) => void
  'room-joined': (data: { room: GameRoom; player: Player }) => void
  'player-joined': (data: { room: GameRoom; player: Player }) => void
  'player-left': (data: { room: GameRoom; playerId: string }) => void
  'player-ready': (data: { playerId: string; allReady: boolean }) => void
  'game-starting': (data: { countdown: number }) => void
  'game-started': (data: { gameState: GameState }) => void
  'game-move-update': (data: { 
    playerId: string
    move: GameMove
    result: GameMoveResult
    gameState: GameState 
  }) => void
  'game-ended': (data: { 
    rankings: { playerId: string; rank: number }[]
    finalScores: Record<string, number>
    winnerId: string 
  }) => void
  'chat-message': (data: {
    id: string
    userId: string
    username: string
    message: string
    timestamp: Date
  }) => void
  'player-disconnected': (data: { playerId: string }) => void
  'player-reconnected': (data: { playerId: string }) => void
  'error': (data: { message: string; code?: string }) => void
  'invalid-move': (data: { reason: string }) => void
}

export interface ClientToServerEvents {
  'create-room': (data: { 
    maxPlayers: number
    isPrivate: boolean
    gameMode: string
    settings: GameRoomSettings 
  }) => void
  'join-room': (data: { roomCode: string; password?: string }) => void
  'leave-room': () => void
  'ready-up': () => void
  'game-move': (data: GameMove) => void
  'use-powerup': (data: { 
    powerUpId: string
    targetRow?: number
    targetCol?: number 
  }) => void
  'chat-message': (data: { message: string }) => void
  'pause-game': () => void
  'resume-game': () => void
  'surrender': () => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  user: {
    id: string
    username: string
    displayName: string
  }
  roomId?: string
} 