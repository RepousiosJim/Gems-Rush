import { GemType } from '@/types/game'

// Game Configuration Constants
export const GAME_CONFIG = {
  // Board dimensions - Standardized to 8x8 for optimal multiplayer balance
  BOARD_SIZE: 8,
  MIN_MATCH_SIZE: 3,
  MAX_BOARD_SIZE: 12,
  MIN_BOARD_SIZE: 3,
  
  // Timing (in milliseconds)
  ANIMATION_DURATION: 300,
  CASCADE_DELAY: 200,
  HINT_DURATION: 3000,
  FLOATING_SCORE_DURATION: 1500,
  MOVE_TIMEOUT: 30000, // 30 seconds per move in multiplayer
  
  // Auto block breaking cascade settings
  MAX_CASCADE_DEPTH: 10,
  CASCADE_SCORE_MULTIPLIER: 1.5,
  
  // Power-ups
  POWER_UP_THRESHOLDS: {
    LIGHTNING: 4,  // 4+ gems in a line
    BOMB: 5,       // 5+ gems in L/T shape
    RAINBOW: 6     // 6+ gems
  },
  
  // Scoring
  BASE_SCORES: {
    THREE_MATCH: 50,
    FOUR_MATCH: 150,
    FIVE_MATCH: 300,
    SIX_PLUS_MATCH: 500
  },

  // Enhanced Time Rush Scoring
  TIME_RUSH_SCORES: {
    THREE_MATCH: 100,    // 2x normal
    FOUR_MATCH: 300,     // 2x normal + Lightning power-up
    FIVE_MATCH: 600,     // 2x normal + Rainbow power-up
    SIX_MATCH: 1000,     // 2x normal + Bomb power-up
    SEVEN_PLUS_MATCH: 1500, // Meteor power-up + bonus per extra gem
    EXTRA_GEM_BONUS: 250,   // Bonus per gem beyond 6
    
    // Time-based multipliers
    ADRENALINE_MULTIPLIER: 2.0,  // Last 15 seconds
    WARNING_MULTIPLIER: 1.5,     // Last 30 seconds
    COMBO_BASE_MULTIPLIER: 0.5,  // Added per combo level
    MAX_COMBO_MULTIPLIER: 5.0,
    
    // Power-up activation bonuses
    POWER_UP_CLICK_BONUS: 100,   // Bonus for clicking to activate
    LIGHTNING_CLEAR_BONUS: 50,   // Per gem cleared by lightning
    BOMB_EXPLOSION_BONUS: 75,    // Per gem cleared by bomb
    RAINBOW_COLOR_BONUS: 100,    // Per gem of target color cleared
  },
  
  // Multiplier bonuses
  COMBO_MULTIPLIERS: [1, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0],
  MAX_COMBO_MULTIPLIER: 5.0,
  
  // Game modes
  MODE_CONFIGS: {
    CLASSIC: {
      TIME_LIMIT: undefined,
      MOVE_LIMIT: undefined,
      TARGET_SCORE: 1000
    },
    TIME_ATTACK: {
      TIME_LIMIT: 60000, // 1 minute (60 seconds)
      MOVE_LIMIT: undefined,
      TARGET_SCORE: 5000, // Higher target for Time Rush
      ADRENALINE_THRESHOLD: 15, // Seconds
      WARNING_THRESHOLD: 30,    // Seconds
      RUSH_BONUS_PERCENTAGE: 10, // 10% final score bonus
    },
    MOVES_LIMITED: {
      TIME_LIMIT: undefined,
      MOVE_LIMIT: 20,
      TARGET_SCORE: 1500
    },
    DAILY_CHALLENGE: {
      TIME_LIMIT: 120000, // 2 minutes
      MOVE_LIMIT: 30,
      TARGET_SCORE: 3000
    }
  },

  // Time Rush specific configuration
  TIME_RUSH_CONFIG: {
    // Visual effect thresholds
    ADRENALINE_TIME: 15,        // Seconds when adrenaline mode starts
    WARNING_TIME: 10,           // Seconds when warning effects start
    CRITICAL_TIME: 5,           // Seconds when critical effects start
    
    // Power-up mechanics
    MIN_MATCH_FOR_POWERUP: 4,   // Minimum match size to create power-up
    POWERUP_CHARGE_TIME: 0,     // Instant activation in Time Rush
    POWERUP_VISUAL_DURATION: 2000, // How long power-up indicators show
    
    // Animation speeds (multipliers)
    ANIMATION_SPEED_NORMAL: 1.0,
    ANIMATION_SPEED_ADRENALINE: 1.3,
    ANIMATION_SPEED_CRITICAL: 1.6,
    
    // Background effects
    PARTICLE_COUNT_NORMAL: 8,
    PARTICLE_COUNT_ADRENALINE: 15,
    PARTICLE_COUNT_CRITICAL: 25,
    
    // Sound effect triggers
    COMBO_SOUND_THRESHOLD: 2,   // Combo level to trigger special sound
    POWERUP_SOUND_DELAY: 200,   // ms delay for power-up activation sound
    ADRENALINE_MUSIC_FADE: 1000, // ms to fade to adrenaline music
  },
  
  // Multiplayer
  MULTIPLAYER: {
    MAX_PLAYERS: 4,
    MIN_PLAYERS: 2,
    READY_TIMEOUT: 30000,
    GAME_START_COUNTDOWN: 3000,
    TURN_TIMEOUT: 30000,
    RECONNECT_TIMEOUT: 60000
  },
  
  // Performance
  MAX_RETRIES: 3,
  INITIALIZATION_TIMEOUT: 10000,
  MAX_TOUCH_DURATION: 5000,
  
  // UI
  NOTIFICATION_DURATION: 3000,
  MAX_NOTIFICATIONS: 5,
  TOUCH_THRESHOLD: 50,
  
  // Validation
  REQUIRED_GEM_PROPERTIES: ['type', 'id', 'row', 'col'] as const,
  REQUIRED_STATE_PROPERTIES: ['board', 'score', 'level', 'gameStatus'] as const
} as const

// Time Rush Power-up Effects Configuration
export const TIME_RUSH_POWERUPS = {
  lightning: {
    name: 'Lightning Strike',
    description: 'Clears entire row and column',
    emoji: '⚡',
    matchSize: 4,
    clearPattern: 'cross', // Clears row + column
    scoreMultiplier: 2.0,
    visualEffect: 'electric',
    soundEffect: 'lightning_crack',
    activationDelay: 0, // Instant in Time Rush
  },
  rainbow: {
    name: 'Rainbow Burst',
    description: 'Clears all gems of the same color',
    emoji: '🌈',
    matchSize: 5,
    clearPattern: 'color', // Clears all of target color
    scoreMultiplier: 2.5,
    visualEffect: 'rainbow_wave',
    soundEffect: 'rainbow_burst',
    activationDelay: 0,
  },
  bomb: {
    name: 'Explosive Blast',
    description: 'Destroys 3x3 area around target',
    emoji: '💥',
    matchSize: 6,
    clearPattern: 'area', // 3x3 explosion
    scoreMultiplier: 3.0,
    visualEffect: 'explosion',
    soundEffect: 'bomb_blast',
    activationDelay: 0,
  },
  meteor: {
    name: 'Meteor Strike',
    description: 'Massive area destruction',
    emoji: '☄️',
    matchSize: 7,
    clearPattern: 'massive', // 5x5 explosion
    scoreMultiplier: 4.0,
    visualEffect: 'meteor_impact',
    soundEffect: 'meteor_crash',
    activationDelay: 0,
  }
} as const

// Time Rush Visual Effects
export const TIME_RUSH_EFFECTS = {
  backgrounds: {
    normal: 'from-orange-900 via-red-900 to-purple-900',
    adrenaline: 'from-red-900 via-orange-800 to-yellow-700',
    warning: 'from-red-800 via-orange-700 to-red-600',
    critical: 'from-red-600 via-red-700 to-red-800'
  },
  
  particles: {
    normal: { count: 8, color: 'bg-orange-400', speed: 'normal' },
    adrenaline: { count: 15, color: 'bg-yellow-400', speed: 'fast' },
    warning: { count: 20, color: 'bg-red-400', speed: 'faster' },
    critical: { count: 25, color: 'bg-white', speed: 'fastest' }
  },
  
  pulseEffects: {
    adrenaline: { duration: 0.8, intensity: 0.3 },
    warning: { duration: 0.6, intensity: 0.4 },
    critical: { duration: 0.4, intensity: 0.6 }
  },
  
  screenShake: {
    powerup: { intensity: 2, duration: 200 },
    adrenaline: { intensity: 1, duration: 100 },
    combo: { intensity: 3, duration: 300 }
  }
} as const

// Gem type definitions for Time Rush enhanced visuals
export const TIME_RUSH_GEM_EFFECTS = {
  fire: {
    normalEmoji: '🔥',
    adrenalineEmoji: '🌋',
    trailColor: 'rgb(239, 68, 68)',
    glowColor: 'rgba(239, 68, 68, 0.5)'
  },
  water: {
    normalEmoji: '💧',
    adrenalineEmoji: '🌊',
    trailColor: 'rgb(59, 130, 246)',
    glowColor: 'rgba(59, 130, 246, 0.5)'
  },
  earth: {
    normalEmoji: '🌍',
    adrenalineEmoji: '⛰️',
    trailColor: 'rgb(245, 158, 11)',
    glowColor: 'rgba(245, 158, 11, 0.5)'
  },
  nature: {
    normalEmoji: '🌿',
    adrenalineEmoji: '🌳',
    trailColor: 'rgb(34, 197, 94)',
    glowColor: 'rgba(34, 197, 94, 0.5)'
  },
  lightning: {
    normalEmoji: '⚡',
    adrenalineEmoji: '🌩️',
    trailColor: 'rgb(147, 51, 234)',
    glowColor: 'rgba(147, 51, 234, 0.5)'
  },
  magic: {
    normalEmoji: '🔮',
    adrenalineEmoji: '✨',
    trailColor: 'rgb(236, 72, 153)',
    glowColor: 'rgba(236, 72, 153, 0.5)'
  },
  crystal: {
    normalEmoji: '💎',
    adrenalineEmoji: '💠',
    trailColor: 'rgb(6, 182, 212)',
    glowColor: 'rgba(6, 182, 212, 0.5)'
  }
} as const

// Elemental gem set. Visual presentation lives in GemIcon.tsx / globals.css tokens.
export const GEM_TYPES: Record<GemType, { name: string }> = {
  fire: { name: 'Ember Crystal' },
  water: { name: 'Aqua Sphere' },
  earth: { name: 'Terra Gem' },
  nature: { name: 'Life Crystal' },
  lightning: { name: 'Storm Shard' }
}

export const GEM_COLORS: Record<GemType, {
  primary: string;
  secondary: string;
  glow: string;
}> = {
  fire: {
    primary: '#E53E3E',
    secondary: '#FD8B1E',
    glow: 'rgba(229, 62, 62, 0.8)'
  },
  water: {
    primary: '#2B6CB0',
    secondary: '#3182CE',
    glow: 'rgba(43, 108, 176, 0.8)'
  },
  earth: {
    primary: '#744210',
    secondary: '#A0522D',
    glow: 'rgba(116, 66, 16, 0.8)'
  },
  nature: {
    primary: '#22543D',
    secondary: '#38A169',
    glow: 'rgba(34, 84, 61, 0.8)'
  },
  lightning: {
    primary: '#D69E2E',
    secondary: '#F6E05E',
    glow: 'rgba(214, 158, 46, 0.9)'
  }
}

// Animation Constants
export const ANIMATION_CONSTANTS = {
  STAGGER_DELAY: 50,
  MATCH_DURATION: 600,
  CASCADE_DURATION: 400,
  GRAVITY_DURATION: 300,
  SPAWN_DURATION: 200,
  HINT_PULSE_DURATION: 2000
} as const

// Power-up Types
export const POWER_UP_TYPES = {
  BOMB: { emoji: '💥', name: 'Bomb', description: 'Destroys surrounding gems' },
  LIGHTNING: { emoji: '🌟', name: 'Lightning', description: 'Clears entire row or column' },
  RAINBOW: { emoji: '🌈', name: 'Rainbow', description: 'Clears all gems of selected color' },
  ROW_CLEAR: { emoji: '🔥', name: 'Row Clear', description: 'Clears entire row' },
  COL_CLEAR: { emoji: '⚡', name: 'Column Clear', description: 'Clears entire column' },
  COLOR_BLAST: { emoji: '💫', name: 'Color Blast', description: 'Removes all gems of selected color' },
  SHUFFLE: { emoji: '🌀', name: 'Shuffle', description: 'Shuffles the board' },
  TIME_FREEZE: { emoji: '❄️', name: 'Time Freeze', description: 'Freezes time temporarily' }
} as const

// Power-up type keys for easier access
export const POWER_UP_KEYS = {
  BOMB: 'BOMB',
  LIGHTNING: 'LIGHTNING', 
  RAINBOW: 'RAINBOW',
  ROW_CLEAR: 'ROW_CLEAR',
  COL_CLEAR: 'COL_CLEAR',
  COLOR_BLAST: 'COLOR_BLAST',
  SHUFFLE: 'SHUFFLE',
  TIME_FREEZE: 'TIME_FREEZE'
} as const

// Validation Rules
export const VALIDATION_RULES = {
  MIN_BOARD_SIZE: 3,
  MAX_BOARD_SIZE: 12,
  REQUIRED_GEM_PROPERTIES: ['type', 'id', 'row', 'col'] as const,
  REQUIRED_STATE_PROPERTIES: ['board', 'score', 'level', 'gameStatus'] as const,
  MAX_USERNAME_LENGTH: 20,
  MIN_USERNAME_LENGTH: 3,
  MAX_DISPLAYNAME_LENGTH: 50,
  MIN_PASSWORD_LENGTH: 8
} as const

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_MOVE: 'Invalid move - gems must be adjacent',
  NO_MATCHES: 'No matches found for this move',
  GAME_OVER: 'Game over - no more possible moves',
  CONNECTION_LOST: 'Connection lost - attempting to reconnect',
  INVALID_BOARD: 'Invalid board state detected',
  INITIALIZATION_FAILED: 'Failed to initialize game engine'
} as const

// Success Messages  
export const SUCCESS_MESSAGES = {
  GAME_INITIALIZED: 'Game initialized successfully',
  LEVEL_COMPLETED: 'Level completed! Well done!',
  NEW_HIGH_SCORE: 'New high score achieved!',
  MULTIPLAYER_CONNECTED: 'Connected to multiplayer session',
  SETTINGS_SAVED: 'Settings saved successfully'
} as const

// Game Events
export const EVENT_TYPES = {
  // Core game events
  GEM_CLICK: 'gemClick',
  SWAP_GEMS: 'swapGems',
  MATCH_FOUND: 'matchFound',
  LEVEL_COMPLETE: 'levelComplete',
  GAME_OVER: 'gameOver',
  UPDATE_UI: 'updateUI',
  
  // Multiplayer events
  PLAYER_JOINED: 'playerJoined',
  PLAYER_LEFT: 'playerLeft',
  PLAYER_READY: 'playerReady',
  GAME_STARTED: 'gameStarted',
  MOVE_MADE: 'moveMade',
  TURN_CHANGED: 'turnChanged',
  
  // Power-up events
  POWER_UP_ACTIVATED: 'powerUpActivated',
  POWER_UP_COOLDOWN: 'powerUpCooldown',
  
  // Achievement events
  ACHIEVEMENT_UNLOCKED: 'achievementUnlocked',
  DAILY_CHALLENGE_COMPLETE: 'dailyChallengeComplete'
} as const

// CSS Classes for styling
export const CSS_CLASSES = {
  // Gem classes
  GEM: 'gem',
  GEM_SELECTED: 'gem-selected',
  GEM_MATCHED: 'gem-matched',
  GEM_ANIMATING: 'gem-animating',
  
  // Power-up classes
  POWER_UP: 'power-up',
  POWER_UP_ACTIVE: 'power-up-active',
  POWER_UP_COOLDOWN: 'power-up-cooldown',
  
  // Animation classes
  HINT_GLOW: 'hint-glow',
  MATCH_PULSE: 'match-pulse',
  FLOATING_SCORE: 'floating-score',
  CASCADE_ANIMATION: 'cascade-animation',
  
  // UI classes
  LOADING: 'loading',
  DISABLED: 'disabled',
  HIGHLIGHTED: 'highlighted',
  HIDDEN: 'hidden'
} as const

// Socket.io event names
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Room management
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  ROOM_CREATED: 'room-created',
  ROOM_JOINED: 'room-joined',
  
  // Game flow
  READY_UP: 'ready-up',
  GAME_MOVE: 'game-move',
  CHAT_MESSAGE: 'chat-message',
  
  // Updates
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  PLAYER_READY: 'player-ready',
  GAME_STARTING: 'game-starting',
  GAME_STARTED: 'game-started',
  GAME_MOVE_UPDATE: 'game-move-update',
  GAME_ENDED: 'game-ended',
  
  // Errors
  ERROR: 'error',
  INVALID_MOVE: 'invalid-move'
} as const

// Achievement configurations
export const ACHIEVEMENT_CONFIGS = {
  FIRST_MATCH: {
    name: 'First Match',
    description: 'Make your first match',
    points: 10,
    rarity: 'bronze' as const
  },
  COMBO_MASTER: {
    name: 'Combo Master',
    description: 'Achieve a 5x combo',
    points: 50,
    rarity: 'silver' as const
  },
  POWER_USER: {
    name: 'Power User',
    description: 'Use 10 power-ups',
    points: 100,
    rarity: 'gold' as const
  },
  MULTIPLAYER_WINNER: {
    name: 'Multiplayer Champion',
    description: 'Win your first multiplayer game',
    points: 75,
    rarity: 'silver' as const
  }
} as const

// Local storage keys
export const STORAGE_KEYS = {
  GAME_STATE: 'gems_rush_game_state',
  USER_PREFERENCES: 'gems_rush_preferences',
  ACHIEVEMENTS: 'gems_rush_achievements',
  STATISTICS: 'gems_rush_statistics',
  SETTINGS: 'gems_rush_settings'
} as const 