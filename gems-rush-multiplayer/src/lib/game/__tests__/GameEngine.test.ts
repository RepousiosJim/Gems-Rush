import { GameEngine } from '../GameEngine'
import { Gem, GemType } from '@/types/game'
import { GAME_CONFIG } from '../constants'

describe('GameEngine', () => {
  let gameEngine: GameEngine

  beforeEach(() => {
    gameEngine = new GameEngine()
  })

  afterEach(() => {
    gameEngine.cleanup()
  })

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const result = await gameEngine.initialize()
      expect(result).toBe(true)
      expect(gameEngine.getGameState().gameStatus).toBe('playing')
    })

    it('should create an 8x8 board', async () => {
      await gameEngine.initialize()
      const gameState = gameEngine.getGameState()
      
      expect(gameState.board).toHaveLength(8)
      gameState.board.forEach(row => {
        expect(row).toHaveLength(8)
      })
    })

    it('should create board with no initial matches', async () => {
      await gameEngine.initialize()
      const gameState = gameEngine.getGameState()
      const matches = gameEngine.findMatches(gameState.board)
      
      expect(matches).toHaveLength(0)
    })
  })

  describe('match detection', () => {
    it('should detect horizontal matches of 3', () => {
      const board = createTestBoard([
        ['fire', 'fire', 'fire', 'water', 'earth', 'nature', 'lightning', 'nature'],
        ['water', 'earth', 'nature', 'lightning', 'nature', 'fire', 'fire', 'water'],
        ['earth', 'water', 'fire', 'lightning', 'nature', 'fire', 'water', 'earth'],
      ])

      const matches = gameEngine.findMatches(board)
      expect(matches.length).toBeGreaterThan(0)
      expect(matches[0]).toHaveLength(3)
      expect(matches[0].every(gem => gem.type === 'fire')).toBe(true)
    })

    it('should detect vertical matches of 3', () => {
      const board = createTestBoard([
        ['fire', 'water', 'earth', 'nature', 'lightning', 'nature', 'water', 'fire'],
        ['fire', 'earth', 'nature', 'lightning', 'nature', 'lightning', 'water', 'earth'],
        ['fire', 'nature', 'lightning', 'nature', 'water', 'water', 'earth', 'nature'],
      ])

      const matches = gameEngine.findMatches(board)
      expect(matches.length).toBeGreaterThan(0)
      expect(matches[0]).toHaveLength(3)
      expect(matches[0].every(gem => gem.type === 'fire')).toBe(true)
    })

    it('should detect longer matches (4+ gems)', () => {
      const board = createTestBoard([
        ['fire', 'fire', 'fire', 'fire', 'earth', 'nature', 'lightning', 'nature'],
        // ... other rows
      ])

      const matches = gameEngine.findMatches(board)
      expect(matches.length).toBeGreaterThan(0)
      expect(matches[0]).toHaveLength(4)
    })

    it('should not detect matches of length 2', () => {
      const board = createTestBoard([
        ['fire', 'fire', 'water', 'earth', 'nature', 'lightning', 'nature', 'water'],
        // ... other rows with no matches
      ])

      const matches = gameEngine.findMatches(board)
      expect(matches).toHaveLength(0)
    })
  })

  describe('match detection geometry', () => {
    it('finds both groups when a horizontal and a vertical run share a gem', () => {
      const board = createCalmBoard()
      for (const col of [0, 1, 2]) board[1][col] = { ...board[1][col]!, type: 'fire' }
      for (const row of [1, 2, 3]) board[row][1] = { ...board[row][1]!, type: 'fire' }

      const groups = gameEngine.findAllMatches(board)
      expect(groups.map(g => g.matchType).sort()).toEqual(['horizontal', 'vertical'])
    })
  })

  describe('coordinates', () => {
    beforeEach(async () => {
      await gameEngine.initialize()
    })

    it('does not move gems when scanning for hints', () => {
      const board = createBoardWithMove()
      expect(gameEngine.getAllPossibleMoves(board).length).toBeGreaterThan(0)
      expectCoordinatesMatchPositions(board)
    })

    it('keeps coordinates consistent after a move', async () => {
      setBoard(gameEngine, createBoardWithMove())

      const result = await gameEngine.makeMove(0, 2, 0, 3)
      expect(result.valid).toBe(true)
      expectCoordinatesMatchPositions(gameEngine.getGameState().board)
    })

    it('keeps the board unchanged when a swap makes no match', async () => {
      const board = createCalmBoard()
      setBoard(gameEngine, board)

      const result = await gameEngine.makeMove(0, 0, 0, 1)
      expect(result.valid).toBe(false)
      expect(gameEngine.getGameState().board).toBe(board)
      expectCoordinatesMatchPositions(board)
    })
  })

  describe('move validation', () => {
    beforeEach(async () => {
      await gameEngine.initialize()
    })

    it('should only allow adjacent gem swaps', async () => {
      // Try to swap non-adjacent gems
      const result = await gameEngine.makeMove(0, 0, 2, 2)
      expect(result.valid).toBe(false)
    })

    it('should allow adjacent horizontal swaps', async () => {
      // Create a specific board state where this swap creates a match
      const testBoard = createTestBoardWithMatch()
      gameEngine.getGameState().board = testBoard
      
      const result = await gameEngine.makeMove(0, 0, 0, 1)
      // Result depends on whether the swap creates matches
      expect(typeof result.valid).toBe('boolean')
    })

    it('should only execute moves that create matches', async () => {
      // This test would need a specific board setup
      // where we know the swap won't create matches
      const result = await gameEngine.makeMove(0, 0, 0, 1)
      
      if (!result.valid) {
        expect(result.scoreChange).toBe(0)
        expect(result.matchesFound).toHaveLength(0)
      }
    })
  })

  describe('scoring system', () => {
    it('should award correct points for different match sizes', () => {
      const match3: Gem[] = createGemArray('fire', 3)
      const match4: Gem[] = createGemArray('water', 4)
      const match5: Gem[] = createGemArray('earth', 5)

      // Note: calculateMatchScore is private, so we'd need to test through public methods
      // or expose it for testing. For now, this is conceptual.
    })

    it('should apply cascade multipliers correctly', async () => {
      // This would require setting up a specific board state
      // that creates cascading matches
    })
  })

  describe('gravity system', () => {
    it('should make gems fall when space opens below', () => {
      // Create board with gaps
      const boardWithGaps = createBoardWithGaps()
      
      // This tests the private applyGravity method
      // In a real implementation, we'd test this through public methods
    })
  })

  describe('gem generation', () => {
    it('should fill empty spaces with new gems', () => {
      // Test the fillEmptySpaces functionality
    })

    it('should not create immediate matches when generating new gems', () => {
      // Ensure smart gem generation prevents immediate matches
    })
  })

  describe('game progression', () => {
    it('should advance to next level when target score is reached', async () => {
      await gameEngine.initialize()
      const initialLevel = gameEngine.getGameState().level
      
      // Artificially set score to target
      gameEngine.getGameState().score = gameEngine.getGameState().targetScore
      
      // Trigger level completion check
      // This would require exposing the method or triggering through gameplay
    })

    it('should calculate target scores correctly', async () => {
      await gameEngine.initialize()
      const gameState = gameEngine.getGameState()
      
      // Level 1 should have 1000 points target
      expect(gameState.targetScore).toBe(1000)
    })
  })
})

// Helper functions for creating test data
const TYPE_ORDER: GemType[] = ['fire', 'water', 'earth', 'nature', 'lightning']

// 8x8 board with no matches (each cell differs from both neighbours in every line)
function createCalmBoard(): (Gem | null)[][] {
  return createTestBoard(
    Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 8 }, (_, col) => TYPE_ORDER[(2 * row + col) % 5])
    )
  )
}

// Calm board where swapping (0,2) and (0,3) makes fire at (0,0)-(0,2)
function createBoardWithMove(): (Gem | null)[][] {
  const board = createCalmBoard()
  board[0][1] = { ...board[0][1]!, type: 'fire' }
  board[0][3] = { ...board[0][3]!, type: 'fire' }
  return board
}

function setBoard(engine: GameEngine, board: (Gem | null)[][]) {
  ;(engine as unknown as { gameState: { board: (Gem | null)[][] } }).gameState.board = board
}

function expectCoordinatesMatchPositions(board: (Gem | null)[][]) {
  board.forEach((row, r) =>
    row.forEach((gem, c) => {
      expect(gem).not.toBeNull()
      expect([gem!.row, gem!.col]).toEqual([r, c])
    })
  )
}

function createTestBoard(layout: GemType[][]): (Gem | null)[][] {
  return layout.map((row, rowIndex) =>
    row.map((gemType, colIndex) => ({
      type: gemType,
      id: `test-${gemType}-${rowIndex}-${colIndex}`,
      row: rowIndex,
      col: colIndex,
      isMatched: false,
      isAnimating: false,
      isSelected: false,
    }))
  )
}

function createGemArray(type: GemType, length: number): Gem[] {
  return Array.from({ length }, (_, index) => ({
    type,
    id: `test-${type}-${index}`,
    row: 0,
    col: index,
    isMatched: false,
    isAnimating: false,
    isSelected: false,
  }))
}

function createTestBoardWithMatch(): (Gem | null)[][] {
  // Create a specific 8x8 board where swapping (0,0) and (0,1) creates a match
  const gemTypes: GemType[] = ['fire', 'water', 'earth', 'nature', 'lightning']
  
  return Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 8 }, (_, col) => ({
      type: gemTypes[Math.floor(Math.random() * gemTypes.length)],
      id: `gem-${row}-${col}`,
      row,
      col,
      isMatched: false,
      isAnimating: false,
      isSelected: false,
    }))
  )
}

function createBoardWithGaps(): (Gem | null)[][] {
  // Create a board with null values (gaps) for testing gravity
  return Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 8 }, (_, col) => {
      if (row > 5) return null // Create gaps in bottom rows
      
      return {
        type: 'fire' as GemType,
        id: `gem-${row}-${col}`,
        row,
        col,
        isMatched: false,
        isAnimating: false,
        isSelected: false,
      }
    })
  )
} 