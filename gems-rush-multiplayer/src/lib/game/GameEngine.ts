import { EventEmitter } from 'events'
import { Gem, GemType, GameState, GameMove, GameMoveResult } from '@/types/game'
import { GAME_CONFIG, GEM_TYPES, ERROR_MESSAGES, SUCCESS_MESSAGES } from './constants'

// Enhanced power-up types
export type PowerUpType = 'lightning' | 'bomb' | 'rainbow' | 'hammer' | 'shuffle'

export interface PowerUpGem extends Gem {
  powerUpType: PowerUpType
  isPowerUp: true
}

export interface CascadeResult {
  totalScore: number
  cascadeLevel: number
  matchesProcessed: Gem[][]
  gemsRemoved: number
  newBoard: (Gem | null)[][]
  powerUpsCreated: PowerUpGem[]
}

export interface MatchGroup {
  gems: Gem[]
  type: GemType
  matchType: 'horizontal' | 'vertical' | 'l_shape' | 't_shape' | 'cross'
  powerUpCreated?: PowerUpType
}

export interface HintMove {
  from: { row: number; col: number }
  to: { row: number; col: number }
  score: number
  matchCount: number
  cascadePotential: number
}

export interface GameEngineEvents {
  'game:initialized': (gameState: GameState) => void
  'game:score-updated': (newScore: number, scoreChange?: number) => void
  'game:level-completed': (level: number) => void
  'game:game-over': (gameState: GameState) => void
  'game:board-changed': (board: (Gem | null)[][]) => void
  'game:move-made': (move: GameMove, result: GameMoveResult) => void
  'game:level-up': (newLevel: number) => void
  'game:powerup-created': (powerUp: PowerUpGem) => void
  'game:powerup-activated': (powerUp: PowerUpGem, effects: { affectedGems: Gem[], scoreEarned: number }) => void
  'game:match-found': (matches: MatchGroup[]) => void
  'game:cascade': (cascadeLevel: number, matches: MatchGroup[]) => void
  'game:no-moves': () => void
  'game:reshuffle': () => void
  'game:error': (error: Error) => void
  'hint:show': (hintMove: { from: { row: number; col: number }; to: { row: number; col: number }; score: number; matchCount: number }) => void
  'hint:hide': () => void
  'board:no-moves': () => void
  'board:reshuffled': () => void
}

export class GameEngine extends EventEmitter {
  private gameState: GameState
  private animationQueue: Array<() => Promise<void>> = []
  private isAnimating: boolean = false
  private cascadeInProgress: boolean = false
  private initialized: boolean = false
  private moveInProgress: boolean = false
  private hintTimeout?: NodeJS.Timeout
  private lastHintTime: number = 0

  constructor(initialState?: Partial<GameState>) {
    super()
    this.gameState = this.createInitialState(initialState)
  }

  // Initialize game state
  private createInitialState(overrides?: Partial<GameState>): GameState {
    const level = overrides?.level || 1
    const defaultState: GameState = {
      board: [],
      obstacleBlocks: [],
      boardSize: GAME_CONFIG.BOARD_SIZE,
      score: 0,
      level,
      moves: 0,
      targetScore: this.calculateTargetScore(level),
      gameStatus: 'idle',
      gameMode: 'normal',
      selectedGem: null,
      isAnimating: false,
      matchesFound: [],
      isMultiplayer: false,
      players: [],
      powerUps: [],
      comboMultiplier: 1,
      lastMoveScore: 0,
      blocksDestroyed: 0
    }

    return { ...defaultState, ...overrides }
  }

  // Calculate target score based on the design document formula
  private calculateTargetScore(level: number): number {
    return level * 1000 + (level - 1) * 500
  }

  // Initialize the game
  async initialize(boardSize: number = GAME_CONFIG.BOARD_SIZE): Promise<boolean> {
    try {
      console.log('🎮 Initializing Game Engine...')
      
      // Create initial board with no matches but guaranteed moves
      const board = this.createValidBoard(boardSize)
      if (!board) {
        throw new Error('Failed to create initial board')
      }

      // Set up game state
      this.gameState.board = board
      this.gameState.boardSize = boardSize
      this.gameState.gameStatus = 'playing'
      
      this.initialized = true
      this.emit('game:initialized', this.gameState)
      
      // Start hint timer (show hint after 30 seconds of inactivity)
      this.startHintTimer()
      
      console.log('✅ Game Engine initialized successfully')
      console.log(`Target score for level ${this.gameState.level}: ${this.gameState.targetScore}`)
      return true
    } catch (error) {
      console.error('❌ Game Engine initialization failed:', error)
      this.emit('game:error', error as Error)
      return false
    }
  }

  // Create a valid board with no initial matches but guaranteed moves
  createValidBoard(size: number, maxAttempts: number = 100): (Gem | null)[][] {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const board = this.generateRandomBoard(size)
      if (!this.hasInitialMatches(board) && this.hasPossibleMoves(board)) {
        console.log(`✅ Valid board created in ${attempt + 1} attempts`)
        return board
      }
    }
    
    // If we can't generate a valid board, create one with forced placement
    console.log('⚠️ Using forced board generation')
    return this.createForcedValidBoard(size)
  }

  // Generate a random board
  private generateRandomBoard(size: number): (Gem | null)[][] {
    const board: (Gem | null)[][] = []
    const gemTypes = Object.keys(GEM_TYPES) as GemType[]

    for (let row = 0; row < size; row++) {
      board[row] = []
      for (let col = 0; col < size; col++) {
        const gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)]
        board[row][col] = this.createGem(gemType, row, col)
      }
    }

    return board
  }

  // Create board with careful placement to avoid matches but ensure moves
  private createForcedValidBoard(size: number): (Gem | null)[][] {
    const board: (Gem | null)[][] = []
    const gemTypes = Object.keys(GEM_TYPES) as GemType[]

    // Fill board ensuring no immediate matches
    for (let row = 0; row < size; row++) {
      board[row] = []
      for (let col = 0; col < size; col++) {
        let gemType: GemType
        let attempts = 0
        
        do {
          gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)]
          attempts++
        } while (
          attempts < 50 && 
          this.wouldCreateMatch(board, row, col, gemType)
        )

        board[row][col] = this.createGem(gemType, row, col)
      }
    }

    // Ensure at least one possible move exists
    if (!this.hasPossibleMoves(board)) {
      this.forcePossibleMove(board)
    }

    return board
  }

  // Force at least one possible move on the board
  private forcePossibleMove(board: (Gem | null)[][]): void {
    const size = board.length
    const gemTypes = Object.keys(GEM_TYPES) as GemType[]
    
    // Create a simple 3-in-a-row opportunity
    if (size >= 3) {
      const targetType = gemTypes[0]
      // Place pattern that will match when swapped
      board[0][0] = this.createGem(targetType, 0, 0)
      board[0][2] = this.createGem(targetType, 0, 2)
      board[0][1] = this.createGem(gemTypes[1], 0, 1) // Different type in middle
    }
  }

  // Check if board has any initial matches
  private hasInitialMatches(board: (Gem | null)[][]): boolean {
    return this.findMatches(board).length > 0
  }

  // Check if board has possible moves
  private hasPossibleMoves(board: (Gem | null)[][]): boolean {
    return this.getAllPossibleMoves(board).length > 0
  }

  // Create a new gem
  private createGem(type: GemType, row: number, col: number, isPowerUp: boolean = false, powerUpType?: PowerUpType): Gem | PowerUpGem {
    const baseGem = {
      type,
      id: `${type}-${row}-${col}-${Date.now()}-${Math.random()}`,
      row,
      col,
      isMatched: false,
      isAnimating: false,
      isSelected: false
    }

    if (isPowerUp && powerUpType) {
      return {
        ...baseGem,
        isPowerUp: true,
        powerUpType
      } as PowerUpGem
    }

    return baseGem
  }

  // Check if placing a gem would create an immediate match
  private wouldCreateMatch(board: (Gem | null)[][], row: number, col: number, gemType: GemType): boolean {
    // Temporarily place the gem
    const originalGem = board[row]?.[col]
    board[row][col] = this.createGem(gemType, row, col)
    
    // Check for matches
    const hasMatch = this.findMatchesAt(board, row, col).length > 0
    
    // Restore original gem
    board[row][col] = originalGem
    
    return hasMatch
  }

  // Find the match group through a position in one direction
  private groupAt(board: (Gem | null)[][], row: number, col: number, direction: 'horizontal' | 'vertical'): MatchGroup | null {
    const gem = board[row]?.[col]
    if (!gem) return null

    const gems = this.getMatchingGemsInDirection(board, row, col, gem.type, direction)
    if (gems.length < GAME_CONFIG.MIN_MATCH_SIZE) return null

    return {
      gems,
      type: gem.type,
      matchType: direction,
      powerUpCreated: this.determinePowerUpType(gems.length)
    }
  }

  // Find matches starting from a specific position
  private findMatchesAt(board: (Gem | null)[][], row: number, col: number): MatchGroup[] {
    return [
      this.groupAt(board, row, col, 'horizontal'),
      this.groupAt(board, row, col, 'vertical')
    ].filter((group): group is MatchGroup => group !== null)
  }

  // Get matching gems in a specific direction
  private getMatchingGemsInDirection(
    board: (Gem | null)[][], 
    startRow: number, 
    startCol: number, 
    gemType: GemType, 
    direction: 'horizontal' | 'vertical'
  ): Gem[] {
    const gems: Gem[] = []
    const size = board.length

    if (direction === 'horizontal') {
      // Find start of horizontal line
      let colStart = startCol
      while (colStart > 0 && board[startRow][colStart - 1]?.type === gemType) {
        colStart--
      }
      
      // Collect all matching gems
      for (let col = colStart; col < board[startRow].length && board[startRow][col]?.type === gemType; col++) {
        gems.push(board[startRow][col]!)
      }
    } else {
      // Find start of vertical line
      let rowStart = startRow
      while (rowStart > 0 && board[rowStart - 1][startCol]?.type === gemType) {
        rowStart--
      }
      
      // Collect all matching gems
      for (let row = rowStart; row < size && board[row][startCol]?.type === gemType; row++) {
        gems.push(board[row][startCol]!)
      }
    }

    return gems
  }

  // Determine what power-up to create based on match
  private determinePowerUpType(matchLength: number): PowerUpType | undefined {
    if (matchLength === 4) {
      return 'lightning' // 4-match creates lightning (clears row/column)
    } else if (matchLength === 5) {
      return 'rainbow' // 5-match creates rainbow (clears all of same type)
    } else if (matchLength >= 6) {
      return 'bomb' // 6+ match creates bomb (3x3 area)
    }
    return undefined
  }

  // Make a move (swap two gems)
  async makeMove(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<GameMoveResult> {
    if (!this.initialized || this.gameState.gameStatus !== 'playing') {
      return {
        valid: false,
        scoreChange: 0,
        matchesFound: [],
        newBoard: this.gameState.board,
        comboCount: 0
      }
    }

    if (this.moveInProgress) {
      throw new Error('Move already in progress')
    }

    // Reset hint timer
    this.resetHintTimer()

    // Validate move
    if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) {
      return {
        valid: false,
        scoreChange: 0,
        matchesFound: [],
        newBoard: this.gameState.board,
        comboCount: 0
      }
    }

    try {
      this.moveInProgress = true
      this.isAnimating = true
      this.emit('moveStarted', { fromRow, fromCol, toRow, toCol })

      // Check if activating a power-up
      const fromGem = this.gameState.board[fromRow][fromCol]
      const toGem = this.gameState.board[toRow][toCol]
      
      if (this.isPowerUpGem(fromGem) || this.isPowerUpGem(toGem)) {
        return await this.activatePowerUp(fromGem as PowerUpGem, toGem)
      }

      // Regular swap
      const newBoard = this.swapGems(this.gameState.board, fromRow, fromCol, toRow, toCol)
      
      // Check for matches
      const matches = this.findAllMatches(newBoard)
      
      if (matches.length === 0) {
        this.isAnimating = false
        return {
          valid: false,
          scoreChange: 0,
          matchesFound: [],
          newBoard: this.gameState.board,
          comboCount: 0
        }
      }

      // Process matches and cascades
      const result = await this.processMatchesAndCascades(newBoard, matches, 0)
      
      // Update game state
      this.gameState.board = result.newBoard
      this.gameState.score += result.scoreChange
      this.gameState.moves++
      this.gameState.lastMoveScore = result.scoreChange
      this.gameState.comboMultiplier = Math.max(1, result.comboCount)

      this.isAnimating = false
      
      // Check for level completion
      this.checkLevelCompletion()
      
      // Check if no moves available after this move
      if (!this.hasPossibleMoves(result.newBoard)) {
        console.log('🔄 No moves available - reshuffling board...')
        this.reshuffleBoard()
      }
      
      this.emit('game:move-made', { id: Date.now().toString(), playerId: 'local', fromRow, fromCol, toRow, toCol, timestamp: Date.now(), type: 'swap' }, result)
      this.emit('game:board-changed', this.gameState.board)
      this.emit('game:score-updated', this.gameState.score, result.scoreChange)

      return result
    } catch (error) {
      this.isAnimating = false
      console.error('Error making move:', error)
      return {
        valid: false,
        scoreChange: 0,
        matchesFound: [],
        newBoard: this.gameState.board,
        comboCount: 0
      }
    } finally {
      this.moveInProgress = false
    }
  }

  // Check if gem is a power-up
  private isPowerUpGem(gem: Gem | null): gem is PowerUpGem {
    return gem !== null && 'isPowerUp' in gem && gem.isPowerUp === true
  }

  // Activate power-up effects
  private async activatePowerUp(powerUpGem: PowerUpGem, targetGem: Gem | null): Promise<GameMoveResult> {
    console.log(`⚡ Activating ${powerUpGem.powerUpType} power-up`)
    
    let affectedGems: Gem[] = []
    const newBoard = this.gameState.board.map(row => [...row])

    switch (powerUpGem.powerUpType) {
      case 'lightning':
        // Clear entire row and column
        affectedGems = this.getLightningEffectGems(newBoard, powerUpGem.row, powerUpGem.col)
        break
      
      case 'bomb':
        // Clear 3x3 area
        affectedGems = this.getBombEffectGems(newBoard, powerUpGem.row, powerUpGem.col)
        break
      
      case 'rainbow':
        // Clear all gems of target type
        if (targetGem) {
          affectedGems = this.getRainbowEffectGems(newBoard, targetGem.type)
        }
        break
    }

    // Remove affected gems
    let totalScore = 0
    for (const gem of affectedGems) {
      newBoard[gem.row][gem.col] = null
      totalScore += 100 // Base score per gem removed by power-up
    }

    // Apply gravity and fill
    const processedBoard = this.fillEmptySpaces(this.applyGravity(newBoard))
    
    // Check for new matches after power-up
    const newMatches = this.findAllMatches(processedBoard)
    if (newMatches.length > 0) {
      const cascadeResult = await this.processMatchesAndCascades(processedBoard, newMatches, 1)
      totalScore += cascadeResult.scoreChange
    }

    this.emit('game:powerup-activated', powerUpGem, { affectedGems, scoreEarned: totalScore })

    return {
      valid: true,
      scoreChange: totalScore,
      matchesFound: newMatches.map(group => group.gems),
      newBoard: processedBoard,
      comboCount: 1
    }
  }

  // Get gems affected by lightning power-up (row + column)
  private getLightningEffectGems(board: (Gem | null)[][], row: number, col: number): Gem[] {
    const gems: Gem[] = []
    const size = board.length

    // Add all gems in row
    for (let c = 0; c < size; c++) {
      if (board[row][c]) gems.push(board[row][c]!)
    }

    // Add all gems in column (avoid duplicates)
    for (let r = 0; r < size; r++) {
      if (r !== row && board[r][col]) gems.push(board[r][col]!)
    }

    return gems
  }

  // Get gems affected by bomb power-up (3x3 area)
  private getBombEffectGems(board: (Gem | null)[][], centerRow: number, centerCol: number): Gem[] {
    const gems: Gem[] = []
    const size = board.length

    for (let r = Math.max(0, centerRow - 1); r <= Math.min(size - 1, centerRow + 1); r++) {
      for (let c = Math.max(0, centerCol - 1); c <= Math.min(size - 1, centerCol + 1); c++) {
        if (board[r][c]) gems.push(board[r][c]!)
      }
    }

    return gems
  }

  // Get gems affected by rainbow power-up (all of same type)
  private getRainbowEffectGems(board: (Gem | null)[][], targetType: GemType): Gem[] {
    const gems: Gem[] = []
    
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col]?.type === targetType) {
          gems.push(board[row][col]!)
        }
      }
    }

    return gems
  }

  // Find all matches on the board
  findAllMatches(board: (Gem | null)[][]): MatchGroup[] {
    const matches: MatchGroup[] = []
    const seen = { horizontal: new Set<string>(), vertical: new Set<string>() }

    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        for (const direction of ['horizontal', 'vertical'] as const) {
          if (seen[direction].has(`${row},${col}`)) continue

          const match = this.groupAt(board, row, col, direction)
          if (!match) continue

          for (const matchGem of match.gems) {
            seen[direction].add(`${matchGem.row},${matchGem.col}`)
          }
          matches.push(match)
        }
      }
    }

    return matches
  }

  // Legacy method for compatibility
  findMatches(board: (Gem | null)[][]): Gem[][] {
    const matchGroups = this.findAllMatches(board)
    return matchGroups.map(group => group.gems)
  }

  // Process matches and handle cascades with power-up creation
  private async processMatchesAndCascades(board: (Gem | null)[][], initialMatches: MatchGroup[], comboLevel: number = 0): Promise<GameMoveResult> {
    let totalScore = 0
    const allMatches: Gem[][] = []
    let currentBoard = [...board.map(row => [...row])]
    const powerUpsCreated: PowerUpGem[] = []

    console.log(`🔍 Processing ${initialMatches.length} match groups at combo level ${comboLevel}`)
    
    // Process each match group
    for (const matchGroup of initialMatches) {
      const matchScore = this.calculateMatchScore(matchGroup.gems, comboLevel)
      totalScore += matchScore
      allMatches.push(matchGroup.gems)

      // Create power-up if applicable
      if (matchGroup.powerUpCreated && matchGroup.gems.length >= 4) {
        const centerGem = this.findCenterGem(matchGroup.gems)
        const powerUpGem = this.createGem(
          centerGem.type, 
          centerGem.row, 
          centerGem.col, 
          true, 
          matchGroup.powerUpCreated
        ) as PowerUpGem
        
        powerUpsCreated.push(powerUpGem)
        this.emit('game:powerup-created', powerUpGem)
      }

      // Remove matched gems
      for (const gem of matchGroup.gems) {
        if (currentBoard[gem.row][gem.col]) {
          console.log(`🗑️ Removing gem at (${gem.row},${gem.col}): ${gem.type}`)
          currentBoard[gem.row][gem.col] = null
        }
      }
    }

    // Place power-ups after removing gems
    for (const powerUp of powerUpsCreated) {
      currentBoard[powerUp.row][powerUp.col] = powerUp
    }

    console.log(`💰 Total score for this cascade: ${totalScore}`)

    // Apply gravity and fill
    currentBoard = this.applyGravity(currentBoard)
    currentBoard = this.fillEmptySpaces(currentBoard)

    // Check for new matches
    const newMatches = this.findAllMatches(currentBoard)
    
    if (newMatches.length > 0) {
      console.log(`🔄 Found ${newMatches.length} new matches after cascade - continuing...`)
      const cascadeResult = await this.processMatchesAndCascades(currentBoard, newMatches, comboLevel + 1)
      totalScore += cascadeResult.scoreChange
      allMatches.push(...cascadeResult.matchesFound)
      currentBoard = cascadeResult.newBoard
    } else {
      console.log('✅ No more matches found - cascade complete')
    }

    return {
      valid: true,
      scoreChange: totalScore,
      matchesFound: allMatches,
      newBoard: currentBoard,
      comboCount: comboLevel + 1
    }
  }

  // Find center gem of a match for power-up placement
  private findCenterGem(gems: Gem[]): Gem {
    // For simplicity, use the middle gem or first gem
    return gems[Math.floor(gems.length / 2)]
  }

  // Calculate score for a match with power-up bonuses
  private calculateMatchScore(match: Gem[], comboLevel: number): number {
    let baseScore: number
    
    switch (match.length) {
      case 3:
        baseScore = 50
        break
      case 4:
        baseScore = 150 // Lightning power-up bonus
        break
      case 5:
        baseScore = 300 // Rainbow power-up bonus
        break
      default:
        baseScore = 500 // Bomb power-up bonus
        if (match.length > 6) {
          baseScore += (match.length - 6) * 100
        }
        break
    }

    // Rush bonus for cascades
    const rushBonus = comboLevel * baseScore
    const finalScore = baseScore + rushBonus
    
    console.log(`Match of ${match.length} gems, combo level ${comboLevel}: ${baseScore} + ${rushBonus} = ${finalScore}`)
    
    return finalScore
  }

  // Advanced move validation
  private isValidMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const { boardSize } = this.gameState

    // Check bounds
    if (fromRow < 0 || fromRow >= boardSize || fromCol < 0 || fromCol >= boardSize ||
        toRow < 0 || toRow >= boardSize || toCol < 0 || toCol >= boardSize) {
      return false
    }

    // Check if gems exist
    if (!this.gameState.board[fromRow][fromCol] || !this.gameState.board[toRow][toCol]) {
      return false
    }

    // Check if gems are adjacent
    const rowDiff = Math.abs(fromRow - toRow)
    const colDiff = Math.abs(fromCol - toCol)
    
    // Allow power-up activation (clicking on power-up)
    if (this.isPowerUpGem(this.gameState.board[fromRow][fromCol]) && rowDiff === 0 && colDiff === 0) {
      return true
    }
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
  }

  // Swap two gems on a copy of the board; gems are cloned so the original board's gems keep their coordinates
  private swapGems(board: (Gem | null)[][], row1: number, col1: number, row2: number, col2: number): (Gem | null)[][] {
    const newBoard = board.map(row => [...row])
    const first = board[row1][col1]
    const second = board[row2][col2]

    newBoard[row1][col1] = second && { ...second, row: row1, col: col1 }
    newBoard[row2][col2] = first && { ...first, row: row2, col: col2 }

    return newBoard
  }

  // Apply gravity to make gems fall
  private applyGravity(board: (Gem | null)[][]): (Gem | null)[][] {
    const newBoard = board.map(row => [...row])
    const boardSize = newBoard.length

    for (let col = 0; col < boardSize; col++) {
      // Get all non-null gems in column from bottom to top
      const gems: Gem[] = []
      for (let row = boardSize - 1; row >= 0; row--) {
        const gem = newBoard[row][col]
        if (gem) {
          gems.push(gem)
          newBoard[row][col] = null
        }
      }

      // Place gems at bottom
      for (let i = 0; i < gems.length; i++) {
        const newRow = boardSize - 1 - i
        const gem = gems[i]
        newBoard[newRow][col] = gem.row === newRow ? gem : { ...gem, row: newRow }
      }
    }

    return newBoard
  }

  // Fill empty spaces with new gems (avoiding immediate matches)
  private fillEmptySpaces(board: (Gem | null)[][]): (Gem | null)[][] {
    const newBoard = board.map(row => [...row])
    const boardSize = newBoard.length
    const gemTypes = Object.keys(GEM_TYPES) as GemType[]

    for (let col = 0; col < boardSize; col++) {
      for (let row = 0; row < boardSize; row++) {
        if (!newBoard[row][col]) {
          // Try to avoid creating immediate matches
          let gemType: GemType
          let attempts = 0
          
          do {
            gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)]
            attempts++
          } while (
            attempts < 10 && 
            this.wouldCreateMatch(newBoard, row, col, gemType)
          )

          newBoard[row][col] = this.createGem(gemType, row, col)
        }
      }
    }

    return newBoard
  }

  // Get all possible moves with scoring for hint system
  getAllPossibleMoves(board: (Gem | null)[][]): HintMove[] {
    const moves: HintMove[] = []
    const boardSize = board.length

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        // Check right swap
        if (col < boardSize - 1) {
          const moveScore = this.evaluateMove(board, row, col, row, col + 1)
          if (moveScore.valid) {
            moves.push({
              from: { row, col },
              to: { row, col: col + 1 },
              score: moveScore.score,
              matchCount: moveScore.matchCount,
              cascadePotential: moveScore.cascadePotential
            })
          }
        }

        // Check down swap
        if (row < boardSize - 1) {
          const moveScore = this.evaluateMove(board, row, col, row + 1, col)
          if (moveScore.valid) {
            moves.push({
              from: { row, col },
              to: { row: row + 1, col },
              score: moveScore.score,
              matchCount: moveScore.matchCount,
              cascadePotential: moveScore.cascadePotential
            })
          }
        }
      }
    }

    // Sort by score descending for best hints first
    return moves.sort((a, b) => b.score - a.score)
  }

  // Evaluate a potential move for scoring
  private evaluateMove(board: (Gem | null)[][], fromRow: number, fromCol: number, toRow: number, toCol: number): {
    valid: boolean
    score: number
    matchCount: number
    cascadePotential: number
  } {
    const testBoard = this.swapGems(board, fromRow, fromCol, toRow, toCol)
    const matches = this.findAllMatches(testBoard)
    
    if (matches.length === 0) {
      return { valid: false, score: 0, matchCount: 0, cascadePotential: 0 }
    }

    let totalScore = 0
    let totalGems = 0
    let cascadePotential = 0

    for (const match of matches) {
      totalScore += this.calculateMatchScore(match.gems, 0)
      totalGems += match.gems.length
      
      // Bonus for longer matches (power-ups)
      if (match.gems.length >= 4) {
        cascadePotential += match.gems.length * 2
      }
    }

    // Bonus for corner/edge matches (more likely to cascade)
    const positionBonus = this.calculatePositionBonus(matches)
    cascadePotential += positionBonus

    return {
      valid: true,
      score: totalScore,
      matchCount: totalGems,
      cascadePotential
    }
  }

  // Calculate bonus for match positions (corners/edges cascade better)
  private calculatePositionBonus(matches: MatchGroup[]): number {
    let bonus = 0
    const boardSize = this.gameState.boardSize

    for (const match of matches) {
      for (const gem of match.gems) {
        // Corner positions
        if ((gem.row === 0 || gem.row === boardSize - 1) && 
            (gem.col === 0 || gem.col === boardSize - 1)) {
          bonus += 5
        }
        // Edge positions
        else if (gem.row === 0 || gem.row === boardSize - 1 || 
                 gem.col === 0 || gem.col === boardSize - 1) {
          bonus += 2
        }
      }
    }

    return bonus
  }

  // Smart hint system with timer
  private startHintTimer(): void {
    this.lastHintTime = Date.now()
    this.scheduleNextHint()
  }

  private scheduleNextHint(): void {
    this.hintTimeout = setTimeout(() => {
      if (this.gameState.gameStatus === 'playing' && !this.isAnimating) {
        this.autoShowHint()
      }
      this.scheduleNextHint()
    }, 30000) // Show hint after 30 seconds of inactivity
  }

  private resetHintTimer(): void {
    this.lastHintTime = Date.now()
    this.emit('hint:hide')
  }

  private autoShowHint(): void {
    const timeSinceLastMove = Date.now() - this.lastHintTime
    if (timeSinceLastMove >= 30000) { // 30 seconds
      this.showHint()
    }
  }

  // Enhanced hint system
  showHint(): { success: boolean; message: string; hintMove?: HintMove } {
    if (this.gameState.gameStatus !== 'playing') {
      return {
        success: false,
        message: '⏸️ Game must be playing to show hints.'
      }
    }

    if (this.isAnimating) {
      return {
        success: false,
        message: '⏳ Please wait for current animation to complete.'
      }
    }

    const possibleMoves = this.getAllPossibleMoves(this.gameState.board)
    
    if (possibleMoves.length === 0) {
      // No moves available - trigger reshuffle
      this.emit('board:no-moves')
      this.reshuffleBoard()
      return {
        success: false,
        message: '🔄 No possible moves found! Reshuffling board...'
      }
    }

    // Select best move or random good move
    const bestMoves = possibleMoves.slice(0, Math.min(3, possibleMoves.length))
    const hintMove = bestMoves[Math.floor(Math.random() * bestMoves.length)]

    // Emit hint event for UI highlighting
    this.emit('hint:show', hintMove)

    return {
      success: true,
      message: `💡 Try swapping gems at (${hintMove.from.row + 1}, ${hintMove.from.col + 1}) with (${hintMove.to.row + 1}, ${hintMove.to.col + 1})! Potential score: ${hintMove.score}`,
      hintMove
    }
  }

  // Reshuffle board when no moves available
  private reshuffleBoard(): void {
    console.log('🔄 Reshuffling board...')
    
    // Collect all gems (excluding power-ups for now)
    const gems: Gem[] = []
    for (let row = 0; row < this.gameState.boardSize; row++) {
      for (let col = 0; col < this.gameState.boardSize; col++) {
        const gem = this.gameState.board[row][col]
        if (gem && !this.isPowerUpGem(gem)) {
          gems.push(gem)
        }
      }
    }

    // Shuffle gems
    for (let i = gems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[gems[i], gems[j]] = [gems[j], gems[i]]
    }

    // Place shuffled gems back
    let gemIndex = 0
    for (let row = 0; row < this.gameState.boardSize; row++) {
      for (let col = 0; col < this.gameState.boardSize; col++) {
        if (!this.isPowerUpGem(this.gameState.board[row][col])) {
          if (gemIndex < gems.length) {
            const gem = gems[gemIndex]
            gem.row = row
            gem.col = col
            this.gameState.board[row][col] = gem
            gemIndex++
          }
        }
      }
    }

    // Ensure the reshuffled board has possible moves
    if (!this.hasPossibleMoves(this.gameState.board)) {
      this.forcePossibleMove(this.gameState.board)
    }

    this.emit('board:reshuffled')
    this.emit('game:board-changed', this.gameState.board)
  }

  // Check level completion
  private checkLevelCompletion(): void {
    if (this.gameState.score >= this.gameState.targetScore) {
      this.gameState.level++
      this.gameState.targetScore = this.calculateTargetScore(this.gameState.level)
      this.gameState.gameStatus = 'completed'
      
      console.log(`🎉 Level ${this.gameState.level - 1} completed! Next target: ${this.gameState.targetScore}`)
      
      this.emit('game:level-completed', this.gameState.level - 1)
    }
  }

  // Legacy compatibility methods
  getPossibleMoves(): Array<{ from: { row: number; col: number }; to: { row: number; col: number } }> {
    return this.getAllPossibleMoves(this.gameState.board).map(move => ({
      from: move.from,
      to: move.to
    }))
  }

  selectGem(row: number, col: number): boolean {
    if (this.gameState.gameStatus !== 'playing' || this.isAnimating) {
      return false
    }

    const gem = this.gameState.board[row][col]
    if (!gem) return false

    // Reset hint timer on interaction
    this.resetHintTimer()

    // Clear previous selection
    if (this.gameState.selectedGem) {
      const prevGem = this.gameState.board[this.gameState.selectedGem.row][this.gameState.selectedGem.col]
      if (prevGem) prevGem.isSelected = false
    }

    // If same gem, deselect
    if (this.gameState.selectedGem?.row === row && this.gameState.selectedGem?.col === col) {
      this.gameState.selectedGem = null
      gem.isSelected = false
      this.emit('gemDeselected')
      return true
    }

    // If different gem and one already selected, attempt move
    if (this.gameState.selectedGem) {
      this.makeMove(this.gameState.selectedGem.row, this.gameState.selectedGem.col, row, col)
      this.gameState.selectedGem = null
      gem.isSelected = false
      return true
    }

    // Select new gem
    this.gameState.selectedGem = { row, col }
    gem.isSelected = true
    this.emit('gemSelected', { row, col })
    return true
  }

  // Utility methods
  getGameState(): GameState {
    return { ...this.gameState }
  }

  reset(): void {
    const currentLevel = this.gameState.level
    this.gameState = this.createInitialState({ level: currentLevel })
    this.initialize()
    this.emit('reset')
  }

  nextLevel(): void {
    this.gameState.gameStatus = 'playing'
    this.gameState.moves = 0
    this.gameState.comboMultiplier = 1
    this.gameState.lastMoveScore = 0
    
    this.initialize()
    this.emit('nextLevel', {
      level: this.gameState.level,
      targetScore: this.gameState.targetScore
    })
  }

  pause(): void {
    if (this.gameState.gameStatus === 'playing') {
      this.gameState.gameStatus = 'paused'
      this.emit('paused')
    }
  }

  resume(): void {
    if (this.gameState.gameStatus === 'paused') {
      this.gameState.gameStatus = 'playing'
      this.emit('resumed')
    }
  }

  cleanup(): void {
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout)
    }
    this.removeAllListeners()
    this.initialized = false
    this.isAnimating = false
    this.cascadeInProgress = false
    this.animationQueue = []
  }
} 