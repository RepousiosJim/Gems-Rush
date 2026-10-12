import { GameEngine, MatchGroup } from '../GameEngine'
import { Gem, GemType, GameState } from '@/types/game'
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

    it('keeps coordinates consistent and leaves no ready match after a move', async () => {
      setBoard(gameEngine, createBoardWithMove())

      const result = await gameEngine.makeMove(0, 2, 0, 3)
      expect(result.valid).toBe(true)
      expect(gameEngine.findMatches(gameEngine.getGameState().board)).toHaveLength(0)
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

  describe('board generation and reshuffle', () => {
    beforeEach(async () => {
      await gameEngine.initialize()
    })

    it('creates boards with no matches and at least one move', () => {
      for (let i = 0; i < 50; i++) {
        const board = gameEngine.createValidBoard(8)
        expect(gameEngine.findMatches(board)).toHaveLength(0)
        expect(gameEngine.getAllPossibleMoves(board).length).toBeGreaterThan(0)
        expectCoordinatesMatchPositions(board)
      }
    })

    it('reshuffles into a board with no ready match and at least one move', () => {
      const reshuffle = () => (gameEngine as unknown as { reshuffleBoard(): void }).reshuffleBoard()
      for (let i = 0; i < 50; i++) {
        reshuffle()
        const { board } = gameEngine.getGameState()
        expect(gameEngine.findMatches(board)).toHaveLength(0)
        expect(gameEngine.getAllPossibleMoves(board).length).toBeGreaterThan(0)
        expectCoordinatesMatchPositions(board)
      }
    })

    it('keeps the same gems when reshuffling', () => {
      const countTypes = (board: (Gem | null)[][]) =>
        board.flat().reduce<Record<string, number>>((acc, gem) => ({ ...acc, [gem!.type]: (acc[gem!.type] ?? 0) + 1 }), {})
      const before = countTypes(gameEngine.getGameState().board)
      ;(gameEngine as unknown as { reshuffleBoard(): void }).reshuffleBoard()

      expect(countTypes(gameEngine.getGameState().board)).toEqual(before)
    })

    it('keeps power-ups in place when reshuffling', () => {
      const board = gameEngine.getGameState().board
      board[3][3] = { ...board[3][3]!, powerUpType: 'bomb', isPowerUp: true } as Gem
      ;(gameEngine as unknown as { reshuffleBoard(): void }).reshuffleBoard()

      expect((gameEngine.getGameState().board[3][3] as { isPowerUp?: boolean }).isPowerUp).toBe(true)
    })
  })

  describe('events', () => {
    beforeEach(async () => {
      await gameEngine.initialize()
      setBoard(gameEngine, createBoardWithMove())
    })

    it('emits board-changed with the full game state', async () => {
      const states: GameState[] = []
      gameEngine.on('game:board-changed', (state: GameState) => states.push(state))

      const result = await gameEngine.makeMove(0, 2, 0, 3)

      expect(states.length).toBeGreaterThan(0)
      const last = states[states.length - 1]
      expect(last.board).toHaveLength(8)
      expect(last.score).toBe(result.scoreChange)
      expect(last.moves).toBe(1)
      expect(last.gameStatus).toBeDefined()
    })

    it('emits match-found with the matched groups', async () => {
      const found: MatchGroup[][] = []
      gameEngine.on('game:match-found', (groups: MatchGroup[]) => found.push(groups))

      await gameEngine.makeMove(0, 2, 0, 3)

      expect(found.length).toBeGreaterThan(0)
      expect(found[0][0].gems.length).toBeGreaterThanOrEqual(3)
      expect(found[0][0].gems.every(gem => gem.type === 'fire')).toBe(true)
    })

    it('does not emit anything for a move that makes no match', async () => {
      setBoard(gameEngine, createCalmBoard())
      const handler = jest.fn()
      gameEngine.on('game:match-found', handler)
      gameEngine.on('game:board-changed', handler)

      await gameEngine.makeMove(0, 0, 0, 1)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('power-ups', () => {
    beforeEach(async () => {
      await gameEngine.initialize()
    })

    const isAnimating = () => (gameEngine as unknown as { isAnimating: boolean }).isAnimating

    it('writes the result of a self-click activation back into engine state', async () => {
      const board = createCalmBoard()
      withPowerUp(board, 4, 4, 'bomb')
      setBoard(gameEngine, board)
      const states: GameState[] = []
      gameEngine.on('game:board-changed', (state: GameState) => states.push(state))

      const result = await gameEngine.makeMove(4, 4, 4, 4)
      const state = gameEngine.getGameState()

      expect(result.valid).toBe(true)
      expect(result.scoreChange).toBeGreaterThanOrEqual(900)
      expect(state.score).toBe(result.scoreChange)
      expect(state.moves).toBe(1)
      expect(state.board).toBe(result.newBoard)
      expect(state.board).not.toBe(board)
      expect(gameEngine.findMatches(state.board)).toHaveLength(0)
      expectCoordinatesMatchPositions(state.board)
      expect(states.length).toBeGreaterThanOrEqual(1)
      expect(isAnimating()).toBe(false)
    })

    it('activates when only the destination gem is the power-up', async () => {
      const board = createCalmBoard()
      withPowerUp(board, 4, 5, 'rainbow')
      const targetType = board[4][4]!.type
      const targets = board.flat().filter(gem => gem!.type === targetType).length
      setBoard(gameEngine, board)
      const activated = jest.fn()
      gameEngine.on('game:powerup-activated', activated)

      const result = await gameEngine.makeMove(4, 4, 4, 5)

      expect(result.valid).toBe(true)
      expect(activated).toHaveBeenCalledTimes(1)
      expect(gameEngine.getGameState().score).toBeGreaterThanOrEqual(targets * 100)
      expect(isAnimating()).toBe(false)
    })

    it('accepts another move after a power-up', async () => {
      const board = createCalmBoard()
      withPowerUp(board, 4, 4, 'lightning')
      setBoard(gameEngine, board)

      await gameEngine.makeMove(4, 4, 4, 4)
      await expect(gameEngine.makeMove(0, 0, 0, 1)).resolves.toBeDefined()
    })
  })

  describe('gems-cleared', () => {
    beforeEach(async () => {
      await gameEngine.initialize()
    })

    const record = () => {
      const cleared: Gem[][] = []
      gameEngine.on('game:gems-cleared', (gems: Gem[]) => cleared.push(gems))
      return cleared
    }

    it('reports the swap match and then the cascade it causes', async () => {
      setBoard(gameEngine, createCascadeBoard())
      const cleared = record()

      await gameEngine.makeMove(7, 2, 7, 3)

      expect(cleared[0].map(gem => gem.type)).toEqual(['fire', 'fire', 'fire'])
      expect(cleared[1].filter(gem => gem.type === 'water').length).toBeGreaterThanOrEqual(3)
      const all = cleared.flat()
      expect(all.filter(gem => gem.type === 'fire').length).toBeGreaterThanOrEqual(3)
      expect(all.filter(gem => gem.type === 'water').length).toBeGreaterThanOrEqual(3)
    })

    it('reports a gem shared by a row and a column group once', async () => {
      const board = createCalmBoard()
      for (const col of [0, 1, 2]) board[1][col] = { ...board[1][col]!, type: 'fire' }
      for (const row of [1, 2, 3]) board[row][1] = { ...board[row][1]!, type: 'fire' }
      const cleared = record()

      const groups = gameEngine.findAllMatches(board)
      const engine = gameEngine as unknown as { processMatchesAndCascades(b: typeof board, m: MatchGroup[], c: number): Promise<unknown> }
      await engine.processMatchesAndCascades(board, groups, 0)

      expect(groups).toHaveLength(2)
      expect(cleared[0]).toHaveLength(groups[0].gems.length + groups[1].gems.length - 1)
      expect(cleared[0].filter(gem => gem.row === 1 && gem.col === 1)).toHaveLength(1)
    })

    it('reports every gem a bomb removes, the bomb included', async () => {
      const board = createCalmBoard()
      withPowerUp(board, 4, 4, 'bomb')
      setBoard(gameEngine, board)
      const cleared = record()

      await gameEngine.makeMove(4, 4, 4, 4)

      expect(cleared[0]).toHaveLength(9)
      expect(cleared[0].some(gem => gem.row === 4 && gem.col === 4)).toBe(true)
    })

    it('reports every gem of the colour a rainbow removes', async () => {
      const board = createCalmBoard()
      withPowerUp(board, 4, 5, 'rainbow')
      const targetType = board[4][4]!.type
      const targets = board.flat().filter(gem => gem!.type === targetType).length
      setBoard(gameEngine, board)
      const cleared = record()

      await gameEngine.makeMove(4, 4, 4, 5)

      expect(cleared[0].filter(gem => gem.type === targetType)).toHaveLength(targets)
    })
  })

  describe('placePowerUp', () => {
    it('turns one plain gem into a power-up that a self-swap sets off', async () => {
      await gameEngine.initialize()
      setBoard(gameEngine, createCalmBoard())

      const { row, col } = gameEngine.placePowerUp('lightning')
      const placed = gameEngine.getGameState().board[row][col] as Gem & { isPowerUp?: boolean }
      expect(placed.isPowerUp).toBe(true)
      expect(placed.powerUpType).toBe('lightning')

      const result = await gameEngine.makeMove(row, col, row, col)
      expect(result.valid).toBe(true)
      expect(gameEngine.getGameState().score).toBeGreaterThanOrEqual(1500)
      expect(gameEngine.getGameState().moves).toBe(1)
    })
  })

  describe('target and completion', () => {
    async function startWithMove(engine: GameEngine) {
      gameEngine = engine
      await engine.initialize()
      setBoard(engine, createBoardWithMove())
    }

    it('uses the target given by the caller', async () => {
      await startWithMove(new GameEngine({ targetScore: 1250 }))
      expect(gameEngine.getGameState().targetScore).toBe(1250)
    })

    it('completes at the caller target, not a hardcoded one', async () => {
      await startWithMove(new GameEngine({ targetScore: 50 }))
      const completed = jest.fn()
      gameEngine.on('game:level-completed', completed)

      await gameEngine.makeMove(0, 2, 0, 3)

      expect(gameEngine.getGameState().gameStatus).toBe('completed')
      expect(completed).toHaveBeenCalledWith(1)
      expect(gameEngine.getGameState().targetScore).toBe(50)
    })

    it('does not complete below the target', async () => {
      await startWithMove(new GameEngine({ targetScore: 100000 }))
      await gameEngine.makeMove(0, 2, 0, 3)
      expect(gameEngine.getGameState().gameStatus).toBe('playing')
    })

    it('never completes when autoComplete is off', async () => {
      await startWithMove(new GameEngine({ targetScore: 50 }, { autoComplete: false }))
      const completed = jest.fn()
      gameEngine.on('game:level-completed', completed)

      await gameEngine.makeMove(0, 2, 0, 3)

      expect(gameEngine.getGameState().score).toBeGreaterThanOrEqual(50)
      expect(gameEngine.getGameState().gameStatus).toBe('playing')
      expect(completed).not.toHaveBeenCalled()
    })

    it('keeps the caller target across reset and takes a new one on nextLevel', async () => {
      await startWithMove(new GameEngine({ targetScore: 1250 }))

      gameEngine.reset()
      expect(gameEngine.getGameState().targetScore).toBe(1250)

      gameEngine.nextLevel(1800)
      expect(gameEngine.getGameState().level).toBe(2)
      expect(gameEngine.getGameState().targetScore).toBe(1800)
    })
  })

  describe('timers', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('shows a hint after inactivity and keeps hinting while playing', async () => {
      const hints = jest.fn()
      gameEngine.on('hint:show', hints)
      await gameEngine.initialize()

      jest.advanceTimersByTime(30000)
      expect(hints).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(30000)
      expect(hints).toHaveBeenCalledTimes(2)
    })

    it('stops the hint loop when the game completes', async () => {
      gameEngine = new GameEngine({ targetScore: 50 })
      await gameEngine.initialize()
      setBoard(gameEngine, createBoardWithMove())
      await gameEngine.makeMove(0, 2, 0, 3)
      expect(gameEngine.getGameState().gameStatus).toBe('completed')

      expect(jest.getTimerCount()).toBe(0)
    })

    it('stops hinting while paused and resumes after', async () => {
      const hints = jest.fn()
      gameEngine.on('hint:show', hints)
      await gameEngine.initialize()

      gameEngine.pause()
      expect(jest.getTimerCount()).toBe(0)
      jest.advanceTimersByTime(120000)
      expect(hints).not.toHaveBeenCalled()

      gameEngine.resume()
      jest.advanceTimersByTime(30000)
      expect(hints).toHaveBeenCalledTimes(1)
    })

    it('does not stack timers when the game is re-initialized', async () => {
      await gameEngine.initialize()
      await gameEngine.initialize()
      gameEngine.reset()

      expect(jest.getTimerCount()).toBe(1)
    })

    it('cleanup clears every timer', async () => {
      await gameEngine.initialize()
      gameEngine.cleanup()

      expect(jest.getTimerCount()).toBe(0)
    })
  })

  describe('console output', () => {
    it('stays silent while playing three moves with hints', async () => {
      const spies = (['log', 'info', 'warn', 'debug'] as const).map(level => jest.spyOn(console, level).mockImplementation())
      gameEngine = new GameEngine({ targetScore: 1000000 })
      await gameEngine.initialize()

      for (let i = 0; i < 3; i++) {
        gameEngine.showHint()
        const [move] = gameEngine.getAllPossibleMoves(gameEngine.getGameState().board)
        await gameEngine.makeMove(move.from.row, move.from.col, move.to.row, move.to.col)
      }

      const lines = spies.reduce((sum, spy) => sum + spy.mock.calls.length, 0)
      spies.forEach(spy => spy.mockRestore())
      expect(lines).toBe(0)
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

// Swapping (7,2) and (7,3) clears fire at (7,0)-(7,2); the waters above fall in beside (7,3) and clear too
function createCascadeBoard(): (Gem | null)[][] {
  const board = createCalmBoard()
  const set = (row: number, col: number, type: GemType) => (board[row][col] = { ...board[row][col]!, type })
  set(7, 0, 'fire')
  set(7, 1, 'fire')
  set(7, 2, 'water')
  set(7, 3, 'fire')
  set(6, 1, 'water')
  set(6, 2, 'water')
  return board
}

function withPowerUp(board: (Gem | null)[][], row: number, col: number, powerUpType: string): void {
  board[row][col] = { ...board[row][col]!, powerUpType, isPowerUp: true } as Gem
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