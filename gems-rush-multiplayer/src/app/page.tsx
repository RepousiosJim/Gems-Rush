'use client'

import { useState, useEffect, useRef } from 'react'
import { GameEngine } from '@/lib/game/GameEngine'
import { GameState } from '@/types/game'
import { energyManager } from '@/lib/game/EnergySystem'
import { dynamicContentManager } from '@/lib/game/DynamicContentSystem'
import { tutorialManager } from '@/lib/game/ProgressiveTutorialSystem'
import { stageSystem } from '@/lib/game/StageSystem'
import { obstacleBlockManager } from '@/lib/game/ObstacleBlockManager'
import EnhancedMainMenu from '@/components/ui/EnhancedMainMenu'
import UserOnboarding from '@/components/ui/UserOnboarding'
import UserDashboard from '@/components/ui/UserDashboard'
import GameInterface from '@/components/game/GameInterface'
import TimeRushMode from '@/components/game/TimeRushMode'
import StageSelectScreen from '@/components/ui/StageSelectScreen'
import SettingsModal from '@/components/ui/SettingsModal'
import StatisticsModal from '@/components/ui/StatisticsModal'
import { GameGuideModal, CreditsModal } from '@/components/ui/Modal'
import { Gem } from 'lucide-react'
import { MotionConfig } from 'framer-motion'
import { useSettings } from '@/lib/settings'

function formatEventTimeLeft(endTime: number): string {
  const remaining = endTime - Date.now()
  if (remaining <= 0) return 'Expired'
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

type AppState = 'menu' | 'game' | 'timeRush' | 'loading' | 'stageSelect'
type ModalState = 'settings' | 'guide' | 'credits' | 'statistics' | 'dashboard' | null

interface TimeRushStats {
  finalScore: number
  totalMatches: number
  powerUpsActivated: number
  maxCombo: number
  rushBonus: number
  timeUsed: number
}

interface UserStatsType {
  level: number
  xp: number
  coins: number
  gems: number
  streak: number
  gamesPlayed: number
  totalScore: number
  averageScore: number
  bestScore: number
  bestTimeRushScore: number // New: Track best Time Rush score
  timeRushGamesPlayed: number // New: Track Time Rush games played
  dailyChallengeCompleted: boolean
  achievements: Array<{
    id: string
    name: string
    description: string
    icon: string
    rarity: 'bronze' | 'silver' | 'gold' | 'platinum'
    unlockedAt?: Date
  }>
  favoriteMode: string
  totalPlayTime: number
  // Energy System
  energy: number
  maxEnergy: number
  lastEnergyUpdate: number // timestamp
  energyRegenRate: number // minutes per energy point
  // Dynamic Content
  lastDailyEventCheck: number
  currentDailyEvent: {
    type: string
    name: string
    description: string
    multiplier?: number
    bonus?: number
    endTime: number
  } | null
  // Progressive Tutorial
  tutorialProgress: {
    currentStep: number
    completedSteps: string[]
    isActive: boolean
    skipped: boolean
    lastStepTime: number
  }
}

export default function HomePage() {
  const [settings] = useSettings()
  const [appState, setAppState] = useState<AppState>('loading')
  const [modalState, setModalState] = useState<ModalState>(null)
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentStage, setCurrentStage] = useState(1)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userStats, setUserStats] = useState<UserStatsType>({
    level: 1,
    xp: 0,
    coins: 100,
    gems: 10,
    streak: 0,
    gamesPlayed: 0,
    totalScore: 0,
    averageScore: 0,
    bestScore: 0,
    bestTimeRushScore: 0,
    timeRushGamesPlayed: 0,
    dailyChallengeCompleted: false,
    achievements: [],
    favoriteMode: 'Classic',
    totalPlayTime: 0,
    energy: 100,
    maxEnergy: 100,
    lastEnergyUpdate: 0,
    energyRegenRate: 1,
    lastDailyEventCheck: 0,
    currentDailyEvent: null,
    tutorialProgress: {
      currentStep: 1,
      completedSteps: [],
      isActive: true,
      skipped: false,
      lastStepTime: Date.now()
    }
  })
    const gameEngineRef = useRef<GameEngine | null>(null)

  // Add hint state management
  const [currentHint, setCurrentHint] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null)
  const [hintTimeout, setHintTimeout] = useState<NodeJS.Timeout | null>(null)

  // Add energy session tracking
  const [currentGameSession, setCurrentGameSession] = useState<{
    id: string
    startTime: number
    mode: string
    energyConsumed: boolean
  } | null>(null)

  // Debug win condition test (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const handleDebugWin = () => {
        if (gameState && gameState.gameStatus === 'playing') {
          console.log('🧪 Debug: Manually triggering win condition')
          setGameState(prev => {
            if (!prev) return null
            return {
              ...prev,
              score: prev.targetScore, // Set score to exactly target score
              gameStatus: 'completed'
            }
          })
        }
      }

      const handleResetEnergy = () => {
        console.log('🧪 Debug: Resetting energy system')
        localStorage.removeItem('gems-rush-user-stats')
        localStorage.removeItem('gems-rush-has-played')
        window.location.reload()
      }

      window.addEventListener('debug-win-test', handleDebugWin)
      window.addEventListener('debug-reset-energy', handleResetEnergy)
      
      // Add a global function for easy testing
      ;(window as any).resetEnergySystem = handleResetEnergy
      ;(window as any).debugEnergyStatus = () => {
        console.log('⚡ Current energy status:', {
          userStats: userStats,
          localStorage: localStorage.getItem('gems-rush-user-stats')
        })
        
        const testEnergyStatus = energyManager.getEnergyStatus(
          userStats.energy,
          userStats.lastEnergyUpdate,
          userStats.maxEnergy
        )
        console.log('⚡ Calculated energy status:', testEnergyStatus)
      }
      
      return () => {
        window.removeEventListener('debug-win-test', handleDebugWin)
        window.removeEventListener('debug-reset-energy', handleResetEnergy)
      }
    }
  }, [gameState, userStats])

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load user stats from localStorage
        const savedStats = localStorage.getItem('gems-rush-user-stats')
        if (savedStats) {
          const parsedStats = JSON.parse(savedStats)
          
          // Validate and sanitize energy values
          const validEnergy = isNaN(parsedStats.energy) ? 100 : Math.max(0, parsedStats.energy)
          const validMaxEnergy = isNaN(parsedStats.maxEnergy) ? 100 : Math.max(1, parsedStats.maxEnergy)
          const validLastUpdate = isNaN(parsedStats.lastEnergyUpdate) ? Date.now() : parsedStats.lastEnergyUpdate
          
          // Update energy based on time passed
          const energyStatus = energyManager.getEnergyStatus(
            validEnergy,
            validLastUpdate,
            validMaxEnergy
          )
          
          // Check for new daily events
          const currentEvent = dynamicContentManager.getCurrentDailyEvent()
          
          // Ensure tutorialProgress has proper defaults
          const defaultTutorialProgress = {
            currentStep: 1,
            completedSteps: [],
            isActive: true,
            skipped: false,
            lastStepTime: Date.now()
          }
          
          // Update stats with current energy and event
          const updatedStats = {
            ...parsedStats,
            energy: energyStatus.currentEnergy,
            maxEnergy: validMaxEnergy,
            lastEnergyUpdate: Date.now(),
            currentDailyEvent: currentEvent,
            lastDailyEventCheck: Date.now(),
            // Ensure tutorialProgress is properly initialized
            tutorialProgress: parsedStats.tutorialProgress || defaultTutorialProgress
          }
          
          console.log(`⚡ Energy initialized: ${validEnergy} → ${energyStatus.currentEnergy}/${validMaxEnergy}`)
          setUserStats(updatedStats)
        } else {
          // Initialize with default energy values for new users
          console.log('⚡ New user - initializing with default energy values')
          
          // Check for new daily events
          const currentEvent = dynamicContentManager.getCurrentDailyEvent()
          
          // Set up complete user stats for new users with full energy
          const newUserStats = {
            ...userStats, // Use the default state values
            energy: 100, // Start with full energy
            maxEnergy: 100,
            lastEnergyUpdate: Date.now(), // Set current time as last update
            currentDailyEvent: currentEvent,
            lastDailyEventCheck: Date.now(),
            tutorialProgress: {
              currentStep: 1,
              completedSteps: [],
              isActive: true,
              skipped: false,
              lastStepTime: Date.now()
            }
          }
          
          console.log(`⚡ New user energy initialized: ${newUserStats.energy}/${newUserStats.maxEnergy}`)
          console.log('⚡ Full new user stats:', newUserStats)
          
          // Double-check by testing energy calculation immediately
          const testEnergyStatus = energyManager.getEnergyStatus(
            newUserStats.energy,
            newUserStats.lastEnergyUpdate,
            newUserStats.maxEnergy
          )
          console.log(`⚡ Energy status after initialization: ${testEnergyStatus.currentEnergy}/${testEnergyStatus.maxEnergy}`)
          
          setUserStats(newUserStats)
        }

        // Check if user has played before
        const hasPlayed = localStorage.getItem('gems-rush-has-played')
        if (!hasPlayed) {
          setShowOnboarding(true)
        }

        setIsInitialized(true)
        setAppState('menu')
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setAppState('menu') // Fallback to menu even if initialization fails
      }
    }

    initializeApp()
  }, [])

  // Enhanced energy regeneration timer with better state management
  useEffect(() => {
    if (!isInitialized) return

    const energyTimer = setInterval(() => {
      setUserStats(prev => {
        // Validate energy values before processing - use proper defaults, not 0!
        const maxEnergy = isNaN(prev.maxEnergy) ? 100 : prev.maxEnergy
        const currentEnergy = isNaN(prev.energy) ? maxEnergy : prev.energy // Use max energy as default for NaN, not 0!
        const lastUpdate = isNaN(prev.lastEnergyUpdate) ? Date.now() : prev.lastEnergyUpdate
        
        // Get current energy status
        const energyStatus = energyManager.getEnergyStatus(
          currentEnergy,
          lastUpdate,
          maxEnergy
        )
        
        // Only update if energy has actually changed and is valid
        if (!isNaN(energyStatus.currentEnergy) && energyStatus.currentEnergy !== currentEnergy) {
          console.log(`⚡ Energy regenerated: ${currentEnergy} → ${energyStatus.currentEnergy}`)
          return {
            ...prev,
            energy: energyStatus.currentEnergy,
            lastEnergyUpdate: Date.now()
          }
        }
        
        return prev
      })
    }, 30000) // Check every 30 seconds instead of every minute for more responsive updates

    return () => clearInterval(energyTimer)
  }, [isInitialized])

  // Save user stats when they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('gems-rush-user-stats', JSON.stringify(userStats))
    }
  }, [userStats, isInitialized])

  const setupGameEngineListeners = (engine: GameEngine) => {
    engine.on('game:score-updated', (score: number, _change: number) => {
      if (gameState) {
        const newGameState = { ...gameState, score }
        setGameState(newGameState)
      }
    })

    engine.on('game:level-completed', (level: number) => {
      if (gameState) {
        const newGameState = { ...gameState, level }
        setGameState(newGameState)
        setCurrentStage(level)
        
        // Update user XP and level
        setUserStats(prev => ({
          ...prev,
          level: Math.max(prev.level, level),
          xp: prev.xp + (level * 100)
        }))
      }
    })

    engine.on('game:game-over', (_reason: string) => {
      if (gameState) {
        const newGameState = { ...gameState, gameStatus: 'failed' as const }
        setGameState(newGameState)
        
        // Base rewards based on performance (even for failed games)
        const baseCoinsEarned = Math.floor(gameState.score / 200) // Reduced for failed games
        const baseXP = Math.floor(gameState.score / 2) // Reduced XP for failed games
        
        // Apply dynamic content modifiers
        const modifiedRewards = dynamicContentManager.applyEventModifiers(
          { coins: baseCoinsEarned, xp: baseXP },
          userStats.currentDailyEvent as any
        )
        
        // Update user stats with modified rewards
        setUserStats(prev => {
          const updatedStats = {
            ...prev,
            coins: prev.coins + (modifiedRewards.coins || 0),
            xp: prev.xp + (modifiedRewards.xp || 0),
            totalScore: prev.totalScore + gameState.score,
            averageScore: Math.floor((prev.totalScore + gameState.score) / Math.max(prev.gamesPlayed, 1)),
            bestScore: Math.max(prev.bestScore, gameState.score)
          }
          
          // Check for tutorial step completion
          if (gameState.score > 5000 && prev.tutorialProgress && !prev.tutorialProgress.completedSteps.includes('first_match')) {
            const updatedProgress = tutorialManager.completeStep('first_match', prev.tutorialProgress)
            updatedStats.tutorialProgress = updatedProgress
          }
          
          return updatedStats
        })
        
        // End game session without completion bonus
        endGameSession(false)
        
        console.log('💀 Game Over - Session ended, partial rewards given:', modifiedRewards)
      }
    })

    // Enhanced power-up system listeners
    engine.on('game:powerup-created', (powerUpGem: any) => {
      console.log(`⚡ Power-up created: ${powerUpGem.powerUpType} at (${powerUpGem.row}, ${powerUpGem.col})`)
      // Could show special effects or notifications here
    })

    engine.on('game:powerup-activated', (powerUpGem: any, effects: any) => {
      console.log(`💥 Power-up activated: ${powerUpGem.powerUpType}, affected ${effects.affectedGems.length} gems`)
      // Could show dramatic visual effects here
    })

    // Enhanced hint system listeners with visual highlighting
    engine.on('hint:show', (hintMove: any) => {
      console.log(`💡 Hint: Try swapping (${hintMove.from.row}, ${hintMove.from.col}) with (${hintMove.to.row}, ${hintMove.to.col})`)
      console.log(`💰 Potential score: ${hintMove.score}, Match count: ${hintMove.matchCount}`)
      
      // Set the hint for visual highlighting
      setCurrentHint({
        from: { row: hintMove.from.row, col: hintMove.from.col },
        to: { row: hintMove.to.row, col: hintMove.to.col }
      })
      
      // Clear hint after 5 seconds
      if (hintTimeout) {
        clearTimeout(hintTimeout)
      }
      const timeout = setTimeout(() => {
        setCurrentHint(null)
      }, 5000)
      setHintTimeout(timeout)
    })

    engine.on('hint:hide', () => {
      console.log('💡 Hiding hint')
      setCurrentHint(null)
      if (hintTimeout) {
        clearTimeout(hintTimeout)
        setHintTimeout(null)
      }
    })

    // Board management listeners
    engine.on('board:no-moves', () => {
      console.log('🔄 No moves available - preparing for reshuffle')
      // Could show "Reshuffling..." message
    })

    engine.on('board:reshuffled', () => {
      console.log('🔄 Board reshuffled - new moves available!')
      // Could show "New moves available!" message
    })

    engine.on('game:error', (error: Error) => {
      console.error('🎮 Game Engine Error:', error)
    })
  }

  const initializeGame = async (mode: string, isLevelTransition: boolean = false) => {
    try {
      let gameSession = currentGameSession

      // Only check energy and create new session if not a level transition
      if (!isLevelTransition) {
        if (!canStartNewGame()) {
          console.warn('⚡ Not enough energy to start a new game!')
          // Show energy insufficient modal or offer refill
          return
        }

        // Start new game session
        gameSession = startNewGameSession(mode)
      }

      setAppState('loading')
      
      if (gameEngineRef.current) {
        gameEngineRef.current.removeAllListeners()
      }

        const engine = new GameEngine()
      await engine.initialize()
      
      setupGameEngineListeners(engine)
      
      // Only consume energy for brand new games (not level transitions)
      if (!isLevelTransition && gameSession && !gameSession.energyConsumed) {
        const energyConsumed = consumeEnergyForSession(gameSession)
        if (!energyConsumed) {
          console.error('⚡ Failed to consume energy for game session')
          setAppState('menu')
          return
        }
      }
      
      // Check for tutorial progression (only for new sessions)
      if (!isLevelTransition) {
        const nextTutorialStep = tutorialManager.getNextStep(
          userStats.tutorialProgress,
          {
            level: userStats.level,
            gamesPlayed: userStats.gamesPlayed,
            achievements: userStats.achievements
          }
        )
        
        if (nextTutorialStep && nextTutorialStep.trigger === 'auto') {
          console.log('🎓 Tutorial step available:', nextTutorialStep.title)
        }
      }
      
      const initialGameState: GameState = {
        board: engine.getGameState().board,
        obstacleBlocks: [],
        boardSize: 8,
        score: 0,
        level: 1,
        moves: 0,
        timeRemaining: mode === 'timeAttack' ? 60 : undefined,
        selectedGem: null,
        gameMode: mode as 'normal' | 'timeAttack' | 'dailyChallenge' | 'campaign' | 'stage',
        gameStatus: 'playing',
        isAnimating: false,
        matchesFound: [],
        isMultiplayer: false,
        players: [],
        powerUps: [],
        comboMultiplier: 1,
        lastMoveScore: 0,
        targetScore: 1000,
        currentStage: mode === 'stage' ? currentStage : undefined,
        blocksDestroyed: 0
      }

      // Generate obstacle blocks for stage mode
      if (mode === 'stage') {
        const currentStageData = stageSystem.getStage(currentStage)
        if (currentStageData) {
          const obstacles = obstacleBlockManager.generateObstacleBlocks(
            currentStage,
            initialGameState.boardSize,
            initialGameState.board
          )
          initialGameState.obstacleBlocks = obstacles
          initialGameState.targetScore = currentStageData.targetScore
          
          console.log(`🎮 Stage ${currentStage}: ${currentStageData.name}`)
          console.log(`🎯 Target: ${currentStageData.targetScore} | Max Moves: ${currentStageData.maxMoves} | Blocks to Break: ${currentStageData.blocksToBreak}`)
        }
      }

      setGameEngine(engine)
      setGameState(initialGameState)
      gameEngineRef.current = engine
      setAppState('game')
      
      console.log(`🎮 Game initialized - Mode: ${mode}, Session: ${gameSession?.id}, Energy consumed: ${gameSession?.energyConsumed}`)
    } catch (error) {
      console.error('Failed to initialize game:', error)
      setAppState('menu')
    }
  }

  const handleModeSelect = (mode: string) => {
    if (mode === 'stage') {
      setAppState('stageSelect')
    } else if (mode === 'timeAttack') {
      // Initialize Time Rush mode
      initializeTimeRushMode()
    } else {
      initializeGame(mode, false) // false = new game session
    }
  }

  const initializeTimeRushMode = async () => {
    try {
      if (!canStartNewGame()) {
        console.warn('⚡ Not enough energy to start Time Rush!')
        return
      }

      setAppState('loading')
      
      // Start new game session for Time Rush
      const gameSession = startNewGameSession('timeAttack')
      
      if (gameEngineRef.current) {
        gameEngineRef.current.removeAllListeners()
      }

      const engine = new GameEngine()
      await engine.initialize()
      
      setupGameEngineListeners(engine)
      
      // Consume energy for Time Rush session
      if (gameSession && !gameSession.energyConsumed) {
        const energyConsumed = consumeEnergyForSession(gameSession)
        if (!energyConsumed) {
          console.error('⚡ Failed to consume energy for Time Rush session')
          setAppState('menu')
          return
        }
      }
      
      setGameEngine(engine)
      gameEngineRef.current = engine
      setAppState('timeRush')
      
      console.log('🚀 Time Rush mode initialized!')
    } catch (error) {
      console.error('Failed to initialize Time Rush mode:', error)
      setAppState('menu')
    }
  }

  const handleTimeRushEnd = (finalScore: number, stats: TimeRushStats) => {
    console.log('⚡ Time Rush completed!', { finalScore, stats })
    
    // End game session with completion
    endGameSession(true)
    
    // Update user stats with Time Rush specific data
    setUserStats(prev => {
      const levelUpData = calculateLevelUp(prev.xp, stats.rushBonus + Math.floor(finalScore / 5))
      
      return {
        ...prev,
        coins: prev.coins + Math.floor(finalScore / 10) + stats.rushBonus,
        xp: prev.xp + stats.rushBonus + Math.floor(finalScore / 5),
        level: levelUpData.newLevel,
        totalScore: prev.totalScore + finalScore,
        bestScore: Math.max(prev.bestScore, finalScore),
        bestTimeRushScore: Math.max(prev.bestTimeRushScore, finalScore),
        timeRushGamesPlayed: prev.timeRushGamesPlayed + 1,
        averageScore: Math.floor((prev.totalScore + finalScore) / (prev.gamesPlayed + 1))
      }
    })
    
    // Show results for a moment before returning to menu
    setTimeout(() => {
      setAppState('menu')
    }, 3000)
  }

  const calculateLevelUp = (currentXP: number, xpGained: number) => {
    const newXP = currentXP + xpGained
    const currentLevel = Math.floor(newXP / 100) + 1 // 100 XP per level
    
    return {
      newLevel: currentLevel,
      newXP: newXP,
      leveledUp: Math.floor(currentXP / 100) + 1 < currentLevel
    }
  }

  const handleStageSelect = (stageNumber: number) => {
    if (stageSystem.isStageUnlocked(stageNumber)) {
      setCurrentStage(stageNumber)
      stageSystem.setCurrentStage(stageNumber)
      initializeGame('stage', false) // false = new game session
    } else {
      console.warn(`Stage ${stageNumber} is not unlocked yet!`)
    }
  }

  const handleShowMenu = () => {
    // End current game session when going back to menu
    endGameSession(false) // false = not completed
    
    if (gameEngineRef.current) {
      gameEngineRef.current.removeAllListeners()
      gameEngineRef.current = null
    }
    setGameEngine(null)
    setGameState(null)
    setAppState('menu')
    
    console.log('🏠 Returned to menu - Game session ended')
  }

  const handleRestart = () => {
    if (gameState) {
      // For restart, check if we have energy for a new session
      if (!canStartNewGame()) {
        console.warn('⚡ Not enough energy to restart!')
        // Could show energy insufficient modal
        return
      }
      
      // End current session and start fresh
      endGameSession(false)
      initializeGame(gameState.gameMode, false) // false = new game session
    }
  }

  const handleNextLevel = () => {
    const nextStage = currentStage + 1
    setCurrentStage(nextStage)
    
    // Calculate and apply level completion rewards
    if (gameState) {
      const levelRewards = {
        coins: Math.floor(gameState.score / 10),
        gems: Math.floor(gameState.score / 100),
        xp: Math.floor(gameState.score / 5)
      }
      
      // Apply rewards to user stats (energy bonus handled in endGameSession)
      setUserStats(prev => ({
        ...prev,
        coins: prev.coins + levelRewards.coins,
        gems: prev.gems + levelRewards.gems,
        xp: prev.xp + levelRewards.xp,
        totalScore: prev.totalScore + gameState.score
      }))
      
      console.log('🏆 Level completed! Rewards given:', levelRewards)
      
      // End current session with completion bonus
      endGameSession(true) // true = completed successfully
      
      // Continue to next level within the same energy session
      setTimeout(() => {
        initializeGame(gameState.gameMode, true) // true = level transition, don't consume new energy
      }, 100)
    }
  }

  const handleLevelComplete = () => {
    // This function handles immediate level completion rewards
    if (gameState) {
      const levelRewards = {
        coins: Math.floor(gameState.score / 10),
        gems: Math.floor(gameState.score / 100),
        xp: Math.floor(gameState.score / 5)
      }
      
      // Update user stats with rewards (energy bonus handled elsewhere)
      setUserStats(prev => ({
        ...prev,
        coins: prev.coins + levelRewards.coins,
        gems: prev.gems + levelRewards.gems,
        xp: prev.xp + levelRewards.xp,
        bestScore: Math.max(prev.bestScore, gameState.score),
        totalScore: prev.totalScore + gameState.score,
        averageScore: Math.floor((prev.totalScore + gameState.score) / Math.max(prev.gamesPlayed, 1))
      }))
      
      // End game session with completion bonus
      endGameSession(true)
      
      return levelRewards
    }
    return { coins: 0, gems: 0, xp: 0 }
  }

  const handlePause = () => {
    if (gameState && gameEngine) {
      const newStatus: 'playing' | 'paused' = gameState.gameStatus === 'paused' ? 'playing' : 'paused'
      const newGameState = { ...gameState, gameStatus: newStatus }
      setGameState(newGameState)
    }
  }

  const handleShowHint = () => {
    if (gameEngine) {
      const hintResult = gameEngine.showHint()
      if (hintResult.success) {
        console.log('🔍 Showing hint:', hintResult.message)
        // UI will automatically receive the hint via the event listener
      } else {
        console.warn('⚠️ Cannot show hint:', hintResult.message)
      }
    } else {
      console.log('🔍 No game engine available for hints')
    }
  }

  // Clear hint when player makes a move
  const handleMove = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    // Clear current hint when player makes a move
    if (currentHint) {
      setCurrentHint(null)
      if (hintTimeout) {
        clearTimeout(hintTimeout)
        setHintTimeout(null)
      }
    }

    if (gameEngine && gameState && gameState.gameStatus === 'playing' && !gameState.isAnimating) {
      gameEngine.makeMove(fromRow, fromCol, toRow, toCol).then((result) => {
        if (result.valid) {
          setGameState(prevState => {
            if (!prevState) return null
            
            const newScore = prevState.score + result.scoreChange
            let newObstacleBlocks = [...prevState.obstacleBlocks]
            let blocksDestroyed = prevState.blocksDestroyed || 0
            
            // Check for obstacle block destruction when gems are matched
            if (result.matchesFound && result.matchesFound.length > 0) {
              const allMatchedGems = result.matchesFound.flat()
              const destructionResult = obstacleBlockManager.checkObstacleDestruction(
                allMatchedGems,
                newObstacleBlocks
              )
              
              newObstacleBlocks = destructionResult.remainingBlocks
              blocksDestroyed += destructionResult.destroyedBlocks.length
              
              if (destructionResult.destroyedBlocks.length > 0) {
                console.log(`💥 Destroyed ${destructionResult.destroyedBlocks.length} obstacle blocks!`)
              }
            }
            
            const newGameState = {
              ...prevState,
              board: result.newBoard,
              score: newScore,
              moves: prevState.moves + 1,
              matchesFound: result.matchesFound,
              comboMultiplier: result.comboCount > 0 ? result.comboCount : 1,
              lastMoveScore: result.scoreChange,
              obstacleBlocks: newObstacleBlocks,
              blocksDestroyed
            }
            
            // Check win condition based on game mode
            if (prevState.gameMode === 'stage' && prevState.currentStage) {
              const stageData = stageSystem.getStage(prevState.currentStage)
              if (stageData) {
                const scoreReached = newScore >= stageData.targetScore
                const blocksDestroyed_req = blocksDestroyed >= stageData.blocksToBreak
                const movesValid = newGameState.moves <= stageData.maxMoves
                
                if (scoreReached && blocksDestroyed_req && movesValid) {
                  console.log(`🏆 Stage ${prevState.currentStage} completed!`)
                  console.log(`📊 Score: ${newScore}/${stageData.targetScore} | Blocks: ${blocksDestroyed}/${stageData.blocksToBreak} | Moves: ${newGameState.moves}/${stageData.maxMoves}`)
                  newGameState.gameStatus = 'completed'
                  
                  // Complete the stage and get rewards
                  setTimeout(() => {
                    const completion = stageSystem.completeStage(
                      prevState.currentStage!,
                      newScore,
                      newGameState.moves,
                      blocksDestroyed
                    )
                    
                    if (completion.success) {
                      console.log(`⭐ Earned ${completion.stars} stars! Rewards:`, completion.rewards)
                      
                      // Update user stats with stage rewards
                      setUserStats(prev => ({
                        ...prev,
                        coins: prev.coins + completion.rewards.coins,
                        gems: prev.gems + completion.rewards.gems,
                        xp: prev.xp + completion.rewards.xp,
                        totalScore: prev.totalScore + newScore
                      }))
                      
                      // End current session with completion bonus
                      endGameSession(true)
                      
                      if (completion.nextStageUnlocked) {
                        console.log(`🔓 Stage ${completion.nextStageUnlocked} unlocked!`)
                      }
                    }
                  }, 500)
                } else if (newGameState.moves >= stageData.maxMoves && !scoreReached) {
                  // Failed due to running out of moves
                  console.log(`💔 Stage failed - not enough score in time`)
                  newGameState.gameStatus = 'failed'
                  
                  // End session without completion bonus
                  setTimeout(() => {
                    endGameSession(false)
                  }, 500)
                }
              }
            } else {
              // Regular win condition for non-stage modes
              if (newScore >= prevState.targetScore) {
                console.log(`🏆 Level completed! Score: ${newScore} / Target: ${prevState.targetScore}`)
                newGameState.gameStatus = 'completed'
                
                // Call the level complete handler to award rewards
                setTimeout(() => {
                  handleLevelComplete()
                }, 500) // Small delay to let the UI update first
              }
            }
            
            return newGameState
          })
        }
      })
    }
  }

  const closeModal = () => {
    setModalState(null)
  }

  const handleOnboardingComplete = () => {
    localStorage.setItem('gems-rush-has-played', 'true')
    setShowOnboarding(false)
    // Start with normal mode for first-time users
    handleModeSelect('normal')
  }

  const handleOnboardingSkip = () => {
    localStorage.setItem('gems-rush-has-played', 'true')
    setShowOnboarding(false)
  }

  const handleQuickPlay = () => {
    handleModeSelect('normal')
  }

  const handleShowDailyChallenge = () => {
    handleModeSelect('dailyChallenge')
  }

  const handleShowDashboard = () => {
    setModalState('dashboard')
  }

  const handleUpdateProfile = (updates: Partial<UserStatsType>) => {
    setUserStats(prev => ({ ...prev, ...updates }))
  }

  const handleRefillEnergy = () => {
    const REFILL_COST = 50 // gems
    
    if (userStats.gems >= REFILL_COST) {
      setUserStats(prev => ({
        ...prev,
        energy: prev.maxEnergy,
        gems: prev.gems - REFILL_COST,
        lastEnergyUpdate: Date.now()
      }))
      console.log('⚡ Energy refilled!')
    } else {
      console.warn('💎 Not enough gems to refill energy!')
      // Could show purchase gems modal here
    }
  }

  const handleCompleteTutorialStep = (stepId: string) => {
    setUserStats(prev => {
      const updatedProgress = tutorialManager.completeStep(stepId, prev.tutorialProgress)
      const rewards = tutorialManager.getMilestoneRewards(updatedProgress)
      
      return {
        ...prev,
        tutorialProgress: updatedProgress,
        coins: prev.coins + (rewards.coins || 0),
        gems: prev.gems + (rewards.gems || 0),
        xp: prev.xp + (rewards.xp || 0),
        energy: Math.min(prev.energy + (rewards.energy || 0), prev.maxEnergy)
      }
    })
  }

  // Enhanced energy management functions
  const canStartNewGame = () => {
    const currentEnergy = isNaN(userStats.energy) ? 0 : userStats.energy
    const lastUpdate = isNaN(userStats.lastEnergyUpdate) ? Date.now() : userStats.lastEnergyUpdate
    const maxEnergy = isNaN(userStats.maxEnergy) ? 100 : userStats.maxEnergy
    
    const energyStatus = energyManager.getEnergyStatus(
      currentEnergy,
      lastUpdate,
      maxEnergy
    )
    return energyStatus.canPlayGame
  }

  const startNewGameSession = (mode: string) => {
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const session = {
      id: sessionId,
      startTime: Date.now(),
      mode,
      energyConsumed: false
    }
    setCurrentGameSession(session)
    return session
  }

  const consumeEnergyForSession = (session: { id: string; startTime: number; mode: string; energyConsumed: boolean }) => {
    if (session.energyConsumed) {
      console.log('⚡ Energy already consumed for this session')
      return false
    }

    const currentEnergy = isNaN(userStats.energy) ? 0 : userStats.energy
    const lastUpdate = isNaN(userStats.lastEnergyUpdate) ? Date.now() : userStats.lastEnergyUpdate
    const maxEnergy = isNaN(userStats.maxEnergy) ? 100 : userStats.maxEnergy

    const energyStatus = energyManager.getEnergyStatus(
      currentEnergy,
      lastUpdate,
      maxEnergy
    )

    if (!energyStatus.canPlayGame) {
      console.warn('⚡ Not enough energy to play!')
      return false
    }

    // Consume energy and mark session
    const newEnergy = energyManager.consumeEnergy(energyStatus.currentEnergy, 'game')
    
    // Validate the new energy value
    const validNewEnergy = isNaN(newEnergy) ? 0 : newEnergy
    
    setUserStats(prev => ({
      ...prev,
      energy: validNewEnergy,
      lastEnergyUpdate: Date.now(),
      gamesPlayed: prev.gamesPlayed + 1
    }))

    setCurrentGameSession(prev => prev ? { ...prev, energyConsumed: true } : null)
    
    console.log(`⚡ Energy consumed: ${energyStatus.currentEnergy} → ${validNewEnergy}`)
    return true
  }

  const endGameSession = (completed: boolean = false) => {
    if (currentGameSession && completed) {
      // Award bonus energy for completing levels
      setUserStats(prev => {
        const currentEnergy = isNaN(prev.energy) ? 0 : prev.energy
        const maxEnergy = isNaN(prev.maxEnergy) ? 100 : prev.maxEnergy
        const bonusEnergy = Math.min(currentEnergy + 1, maxEnergy)
        
        console.log(`⚡ Level completed! Energy bonus: ${currentEnergy} + 1 = ${bonusEnergy}`)
        
        return {
          ...prev,
          energy: bonusEnergy
        }
      })
      console.log('⚡ Bonus energy awarded for level completion!')
    }
    
    setCurrentGameSession(null)
  }

  // Add energy status display for debugging and user feedback
  const getEnergyStatusMessage = () => {
    const currentEnergy = isNaN(userStats.energy) ? 0 : userStats.energy
    const lastUpdate = isNaN(userStats.lastEnergyUpdate) ? Date.now() : userStats.lastEnergyUpdate
    const maxEnergy = isNaN(userStats.maxEnergy) ? 100 : userStats.maxEnergy
    
    const energyStatus = energyManager.getEnergyStatus(
      currentEnergy,
      lastUpdate,
      maxEnergy
    )
    
    if (energyStatus.isFull) {
      return '⚡ Energy Full - Ready to play!'
    } else if (energyStatus.isEmpty) {
      return '💤 No energy - Wait or refill to continue'
    } else {
      return `⚡ Energy: ${energyStatus.currentEnergy}/${energyStatus.maxEnergy} - Next: ${energyStatus.timeToNextEnergy}`
    }
  }

  const screen = (() => {
    // Show loading screen
    if (!isInitialized || appState === 'loading') {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink">
          <div className="flex flex-col items-center gap-4">
            <Gem className="h-10 w-10 text-gold" />
            <div className="text-fg text-lg font-semibold">Gems Rush</div>
            <div className="h-0.5 w-40 overflow-hidden rounded-full bg-ink-2">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-violet" />
            </div>
          </div>
        </div>
      )
    }

    // Game interface
    if (appState === 'game' && gameEngine && gameState) {
      return (
        <>
          <GameInterface
            gameState={gameState}
            onMove={handleMove}
            onRestart={handleRestart}
            onNextLevel={handleNextLevel}
            onPause={handlePause}
            onShowMenu={handleShowMenu}
            onShowSettings={() => setModalState('settings')}
            onShowHint={settings.hints ? handleShowHint : undefined}
            currentHint={currentHint}
          />
        
          {/* Game modals */}
          <SettingsModal isOpen={modalState === 'settings'} onClose={closeModal} />
          <StatisticsModal isOpen={modalState === 'statistics'} onClose={closeModal} />
        </>
      )
    }

    // Time Rush mode interface
    if (appState === 'timeRush' && gameEngine) {
      return (
        <>
          <TimeRushMode
            gameEngine={gameEngine}
            onGameEnd={handleTimeRushEnd}
            onPause={() => console.log('Pause not supported in Time Rush')}
            onShowMenu={handleShowMenu}
          />
        
          {/* Time Rush modals */}
          <SettingsModal isOpen={modalState === 'settings'} onClose={closeModal} />
        </>
      )
    }

    // Stage selection screen
    if (appState === 'stageSelect') {
      return (
        <StageSelectScreen
          onStageSelect={handleStageSelect}
          onBackToMenu={() => setAppState('menu')}
        />
      )
    }

    // Main menu
    if (appState === 'menu') {
      const dailyEvent = userStats.currentDailyEvent
        ? {
            name: userStats.currentDailyEvent.name,
            description: userStats.currentDailyEvent.description,
            timeLeft: formatEventTimeLeft(userStats.currentDailyEvent.endTime),
          }
        : null

      return (
        <>
          <EnhancedMainMenu
            onModeSelect={handleModeSelect}
            onShowSettings={() => setModalState('settings')}
            onShowGuide={() => setModalState('guide')}
            onShowCredits={() => setModalState('credits')}
            onShowStats={() => setModalState('statistics')}
            onShowDashboard={handleShowDashboard}
            userLevel={userStats.level}
            userXP={userStats.xp}
            userCoins={userStats.coins}
            userGems={userStats.gems}
            dailyChallengeCompleted={userStats.dailyChallengeCompleted}
            streak={userStats.streak}
            energy={userStats.energy}
            maxEnergy={userStats.maxEnergy}
            onRefillEnergy={handleRefillEnergy}
            dailyEvent={dailyEvent}
          />

          {/* User onboarding */}
          <UserOnboarding
            isVisible={showOnboarding}
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />

          {/* User Dashboard */}
          <UserDashboard
            isVisible={modalState === 'dashboard'}
            onClose={closeModal}
            userStats={userStats}
            onUpdateProfile={handleUpdateProfile}
          />
        
          {/* Modals */}
          <SettingsModal isOpen={modalState === 'settings'} onClose={closeModal} />
          <StatisticsModal isOpen={modalState === 'statistics'} onClose={closeModal} />
          <GameGuideModal isOpen={modalState === 'guide'} onClose={closeModal} />
          <CreditsModal isOpen={modalState === 'credits'} onClose={closeModal} />
        </>
      )
    }

    return null
  })()

  return <MotionConfig reducedMotion={settings.animations ? 'user' : 'always'}>{screen}</MotionConfig>
}
