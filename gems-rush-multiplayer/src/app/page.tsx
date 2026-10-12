'use client'

import { useState, useEffect, useRef } from 'react'
import { GameEngine, HintMove, PowerUpType } from '@/lib/game/GameEngine'
import { Gem as GemModel, GameState } from '@/types/game'
import { energyManager } from '@/lib/game/EnergySystem'
import { dynamicContentManager } from '@/lib/game/DynamicContentSystem'
import { stageSystem } from '@/lib/game/StageSystem'
import { obstacleBlockManager } from '@/lib/game/ObstacleBlockManager'
import EnhancedMainMenu from '@/components/ui/EnhancedMainMenu'
import UserOnboarding from '@/components/ui/UserOnboarding'
import UserDashboard from '@/components/ui/UserDashboard'
import GameInterface from '@/components/game/GameInterface'
import TimeRushMode, { TimeRushStats } from '@/components/game/TimeRushMode'
import StageSelectScreen from '@/components/ui/StageSelectScreen'
import SettingsModal from '@/components/ui/SettingsModal'
import StatisticsModal from '@/components/ui/StatisticsModal'
import { GameGuideModal, CreditsModal } from '@/components/ui/Modal'
import { Gem } from 'lucide-react'
import { MotionConfig } from 'framer-motion'
import { useSettings } from '@/lib/settings'
import { levelForXp } from '@/lib/game/leveling'
import { addCleared, classicLevel, roundStatus, starsForMovesLeft } from '@/lib/game/goals'

function formatEventTimeLeft(endTime: number): string {
  const remaining = endTime - Date.now()
  if (remaining <= 0) return 'Expired'
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

interface Rewards {
  coins: number
  gems: number
  xp: number
}

const NO_REWARDS: Rewards = { coins: 0, gems: 0, xp: 0 }

const classicRewards = (score: number): Rewards => ({
  coins: Math.floor(score / 10),
  gems: Math.max(1, Math.floor(score / 100)),
  xp: Math.floor(score / 5)
})

// Classic scores swing with the end-of-level bonus, so its rewards follow stars instead
const levelRewards = (stars: number): Rewards => ({ coins: 50 + 30 * stars, gems: 3 * stars, xp: 100 + 50 * stars })

const starsFor = (score: number, targetScore: number) =>
  score >= targetScore * 2.5 ? 3 : score >= targetScore * 1.8 ? 2 : 1

const BONUS_POWER_UPS: PowerUpType[] = ['lightning', 'bomb', 'rainbow']
// Each leftover move shows its power-up for BONUS_SHOW_MS, then the next follows BONUS_GAP_MS after the blast
const BONUS_SHOW_MS = 160
const BONUS_GAP_MS = 110

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const dateKey = (daysAgo = 0) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toLocaleDateString('en-CA')
}

type AppState = 'menu' | 'game' | 'timeRush' | 'loading' | 'stageSelect'
type ModalState = 'settings' | 'guide' | 'credits' | 'statistics' | 'dashboard' | null

interface UserStatsType {
  level: number
  xp: number
  coins: number
  gems: number
  streak: number
  gamesPlayed: number
  gamesWon: number
  totalScore: number
  averageScore: number
  bestScore: number
  bestTimeRushScore: number // New: Track best Time Rush score
  timeRushGamesPlayed: number // New: Track Time Rush games played
  dailyChallengeCompleted: boolean
  lastDailyChallengeDate: string // local YYYY-MM-DD of the last completed Daily Quest
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

function addRewards(stats: UserStatsType, rewards: Rewards): UserStatsType {
  const xp = stats.xp + rewards.xp
  return {
    ...stats,
    coins: stats.coins + rewards.coins,
    gems: stats.gems + rewards.gems,
    xp,
    level: levelForXp(xp)
  }
}

export default function HomePage() {
  const [settings] = useSettings()
  const [appState, setAppState] = useState<AppState>('loading')
  const [modalState, setModalState] = useState<ModalState>(null)
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userStats, setUserStats] = useState<UserStatsType>({
    level: 1,
    xp: 0,
    coins: 100,
    gems: 10,
    streak: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    averageScore: 0,
    bestScore: 0,
    bestTimeRushScore: 0,
    timeRushGamesPlayed: 0,
    dailyChallengeCompleted: false,
    lastDailyChallengeDate: '',
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
  const gameStateRef = useRef<GameState | null>(null)
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // True from the moment a round starts until its result is recorded, so a round settles exactly once
  const roundOpenRef = useRef(false)
  const userStatsRef = useRef(userStats)
  userStatsRef.current = userStats

  const [currentHint, setCurrentHint] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null)
  const [winRewards, setWinRewards] = useState<(Rewards & { stars: number }) | null>(null)
  // Score added by the end-of-level cascade, shown live and on the win screen
  const [bonusScore, setBonusScore] = useState(0)
  const skipBonusRef = useRef(false)

  const commitGameState = (next: GameState | null) => {
    gameStateRef.current = next
    setGameState(next)
  }

  const clearHint = () => {
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current)
      hintTimeoutRef.current = null
    }
    setCurrentHint(null)
  }

  // Replace or end the current engine: stops its timers and drops its listeners
  const disposeEngine = () => {
    gameEngineRef.current?.cleanup()
    gameEngineRef.current = null
    setGameEngine(null)
    clearHint()
  }

  // Debug win condition test (development only)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const handleDebugWin = () => {
      const current = gameStateRef.current
      if (current?.gameStatus !== 'playing') return
      const won: GameState = { ...current, score: current.targetScore, gameStatus: 'completed' }
      commitGameState(won)
      winRound(won, current.maxMoves! - current.moves)
    }

    window.addEventListener('debug-win-test', handleDebugWin)
    return () => window.removeEventListener('debug-win-test', handleDebugWin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          const regenerated = energyManager.advance(
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
          const lastDaily = parsedStats.lastDailyChallengeDate
          const updatedStats = {
            ...userStats, // defaults for fields missing from older saves
            ...parsedStats,
            dailyChallengeCompleted: lastDaily === dateKey(),
            streak: lastDaily === dateKey() || lastDaily === dateKey(1) ? parsedStats.streak : 0,
            level: levelForXp(parsedStats.xp ?? 0),
            energy: regenerated.energy,
            maxEnergy: validMaxEnergy,
            lastEnergyUpdate: regenerated.lastUpdate,
            currentDailyEvent: currentEvent,
            lastDailyEventCheck: Date.now(),
            // Ensure tutorialProgress is properly initialized
            tutorialProgress: parsedStats.tutorialProgress || defaultTutorialProgress
          }

          setUserStats(updatedStats)
        } else {
          // Check for new daily events
          const currentEvent = dynamicContentManager.getCurrentDailyEvent()

          // Set up complete user stats for new users with full energy
          setUserStats({
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
          })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        const regenerated = energyManager.advance(currentEnergy, lastUpdate, maxEnergy)
        if (regenerated.energy === currentEnergy) return prev

        return {
          ...prev,
          energy: regenerated.energy,
          lastEnergyUpdate: regenerated.lastUpdate
        }
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

  // The engine owns the board, score and moves; listeners only touch refs and setters, never render state
  const attachEngineListeners = (engine: GameEngine) => {
    engine.on('game:board-changed', (state: GameState) => {
      const prev = gameStateRef.current
      if (!prev) return
      commitGameState({
        ...prev,
        board: state.board,
        score: state.score,
        moves: state.moves,
        comboMultiplier: state.comboMultiplier,
        lastMoveScore: state.lastMoveScore
      })
    })

    engine.on('game:gems-cleared', (gems: GemModel[]) => {
      const prev = gameStateRef.current
      if (!prev) return
      commitGameState({ ...prev, collected: addCleared(prev.collected!, gems) })
    })

    engine.on('hint:show', (hint: HintMove) => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current)
      setCurrentHint({ from: hint.from, to: hint.to })
      hintTimeoutRef.current = setTimeout(clearHint, 5000)
    })

    engine.on('hint:hide', clearHint)

    engine.on('game:error', (error: Error) => {
      console.error('Game engine error:', error)
    })
  }

  const spendEnergy = () => {
    setUserStats(prev => {
      const regenerated = energyManager.advance(prev.energy, prev.lastEnergyUpdate, prev.maxEnergy)
      return {
        ...prev,
        // The clock keeps its partial progress; a full bar starts regenerating from now
        energy: energyManager.consumeEnergy(regenerated.energy, 'game'),
        lastEnergyUpdate: regenerated.lastUpdate
      }
    })
  }

  const canStartNewGame = () =>
    energyManager.getEnergyStatus(userStats.energy, userStats.lastEnergyUpdate, userStats.maxEnergy).canPlayGame

  // Record the result of the open round once: rewards, game and score stats, and the win energy bonus
  const settleRound = (
    score: number,
    won: boolean,
    rewards: Rewards = NO_REWARDS,
    patch?: (prev: UserStatsType) => Partial<UserStatsType>
  ) => {
    if (!roundOpenRef.current) return
    roundOpenRef.current = false

    setUserStats(prev => {
      const gamesPlayed = prev.gamesPlayed + 1
      const totalScore = prev.totalScore + score
      return {
        ...addRewards(prev, rewards),
        energy: won ? Math.min(prev.energy + 1, prev.maxEnergy) : prev.energy,
        gamesPlayed,
        gamesWon: prev.gamesWon + (won ? 1 : 0),
        totalScore,
        averageScore: Math.floor(totalScore / gamesPlayed),
        bestScore: Math.max(prev.bestScore, score),
        ...patch?.(prev)
      }
    })
  }

  // A Time Rush round has no gameStateRef; its score lives in the engine
  const abandonRound = () => {
    const engineState = gameEngineRef.current?.getGameState()
    const score = gameStateRef.current?.score ?? engineState?.score ?? 0
    const timeRush = engineState?.gameMode === 'timeAttack'
    settleRound(
      score,
      false,
      NO_REWARDS,
      timeRush
        ? prev => ({
            bestTimeRushScore: Math.max(prev.bestTimeRushScore, score),
            timeRushGamesPlayed: prev.timeRushGamesPlayed + 1
          })
        : undefined
    )
  }

  const winRound = (state: GameState, movesLeft: number) => {
    let rewards: Rewards & { stars: number }
    let patch: ((prev: UserStatsType) => Partial<UserStatsType>) | undefined
    if (state.gameMode === 'stage' && state.currentStage) {
      rewards = stageSystem.completeStage(state.currentStage, state.score, state.moves, state.blocksDestroyed ?? 0).rewards
    } else if (state.gameMode === 'dailyChallenge' && userStatsRef.current.lastDailyChallengeDate === dateKey()) {
      // The Daily Quest pays once per calendar day
      rewards = { ...NO_REWARDS, stars: starsFor(state.score, state.targetScore) }
    } else if (state.gameMode === 'dailyChallenge') {
      rewards = { ...classicRewards(state.score), stars: starsFor(state.score, state.targetScore) }
      patch = prev => ({
        dailyChallengeCompleted: true,
        lastDailyChallengeDate: dateKey(),
        streak: prev.lastDailyChallengeDate === dateKey(1) ? prev.streak + 1 : 1
      })
    } else {
      const stars = starsForMovesLeft(movesLeft, state.maxMoves!)
      rewards = { ...levelRewards(stars), stars }
    }

    setWinRewards(rewards)
    settleRound(state.score, true, rewards, patch)
    disposeEngine()
  }

  // Leftover moves become power-ups that go off one by one; a tap skips the waits
  const runEndCascade = async (engine: GameEngine, movesLeft: number) => {
    const scoreAtGoal = gameStateRef.current!.score
    skipBonusRef.current = false
    setBonusScore(0)

    for (let i = 0; i < movesLeft; i++) {
      const { row, col } = engine.placePowerUp(BONUS_POWER_UPS[Math.floor(Math.random() * BONUS_POWER_UPS.length)])
      if (!skipBonusRef.current) await wait(BONUS_SHOW_MS)
      if (gameEngineRef.current !== engine) return
      await engine.makeMove(row, col, row, col)
      setBonusScore(gameStateRef.current!.score - scoreAtGoal)
      if (!skipBonusRef.current) await wait(BONUS_GAP_MS)
    }

    const won: GameState = { ...gameStateRef.current!, gameStatus: 'completed' }
    commitGameState(won)
    winRound(won, movesLeft)
  }

  const failRound = (state: GameState) => {
    settleRound(state.score, false)
    disposeEngine()
  }

  const initializeGame = async (
    mode: string,
    { level = 1, stage, transition = false }: { level?: number; stage?: number; transition?: boolean } = {}
  ) => {
    try {
      // A level transition continues the paid session, so only brand new games need energy
      if (!transition && !canStartNewGame()) {
        console.warn('Not enough energy to start a new game')
        return
      }

      setAppState('loading')
      disposeEngine()

      const stageData = mode === 'stage' && stage ? stageSystem.getStage(stage) : null
      const classic = mode === 'normal' ? classicLevel(level) : null
      const targetScore = stageData?.targetScore ?? (classic?.goal.kind === 'score' ? classic.goal.target : undefined)
      const engine = new GameEngine(
        {
          level,
          gameMode: mode as GameState['gameMode'],
          currentStage: stage,
          ...(targetScore && { targetScore })
        },
        { autoComplete: false }
      )
      await engine.initialize()
      attachEngineListeners(engine)

      if (!transition) spendEnergy()

      const initialGameState: GameState = {
        ...engine.getGameState(),
        goal: classic?.goal ?? { kind: 'score', target: engine.getGameState().targetScore },
        maxMoves: classic?.moves ?? stageData?.maxMoves,
        collected: {}
      }
      if (stageData && stage) {
        initialGameState.obstacleBlocks = obstacleBlockManager.generateObstacleBlocks(
          stage,
          initialGameState.boardSize,
          initialGameState.board
        )
      }

      gameEngineRef.current = engine
      roundOpenRef.current = true
      setWinRewards(null)
      setBonusScore(0)
      commitGameState(initialGameState)
      setAppState('game')
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
      initializeGame(mode)
    }
  }

  const initializeTimeRushMode = async () => {
    try {
      if (!canStartNewGame()) {
        console.warn('Not enough energy to start Time Rush')
        return
      }

      setAppState('loading')
      disposeEngine()

      const engine = new GameEngine({ gameMode: 'timeAttack' }, { autoComplete: false })
      await engine.initialize()

      spendEnergy()

      gameEngineRef.current = engine
      roundOpenRef.current = true
      setGameEngine(engine)
      setAppState('timeRush')
    } catch (error) {
      console.error('Failed to initialize Time Rush mode:', error)
      setAppState('menu')
    }
  }

  const handleTimeRushEnd = (finalScore: number, stats: TimeRushStats) => {
    settleRound(
      finalScore,
      false,
      {
        coins: Math.floor(finalScore / 10) + stats.rushBonus,
        gems: 0,
        xp: stats.rushBonus + Math.floor(finalScore / 5)
      },
      prev => ({
        bestTimeRushScore: Math.max(prev.bestTimeRushScore, finalScore),
        timeRushGamesPlayed: prev.timeRushGamesPlayed + 1
      })
    )
  }

  const handleTimeRushPlayAgain = () => {
    if (!canStartNewGame()) return

    abandonRound()
    initializeTimeRushMode()
  }

  const handleStageSelect = (stageNumber: number) => {
    if (stageSystem.isStageUnlocked(stageNumber)) {
      stageSystem.setCurrentStage(stageNumber)
      initializeGame('stage', { stage: stageNumber })
    }
  }

  const handleShowMenu = () => {
    abandonRound()
    disposeEngine()
    commitGameState(null)
    setAppState('menu')
  }

  const handleRestart = () => {
    const current = gameStateRef.current
    if (!current || !canStartNewGame()) return

    abandonRound()
    initializeGame(current.gameMode, { level: current.level, stage: current.currentStage })
  }

  const handleNextLevel = () => {
    const current = gameStateRef.current
    if (!current) return

    if (current.gameMode === 'stage' && current.currentStage) {
      const nextStage = current.currentStage + 1
      if (!stageSystem.isStageUnlocked(nextStage)) {
        commitGameState(null)
        setAppState('stageSelect')
        return
      }
      stageSystem.setCurrentStage(nextStage)
      initializeGame('stage', { stage: nextStage, transition: true })
    } else {
      initializeGame(current.gameMode, { level: current.level + 1, transition: true })
    }
  }

  const handlePause = () => {
    const engine = gameEngineRef.current
    const current = gameStateRef.current
    if (!engine || !current) return

    if (current.gameStatus === 'paused') {
      engine.resume()
      commitGameState({ ...current, gameStatus: 'playing' })
    } else if (current.gameStatus === 'playing') {
      engine.pause()
      clearHint()
      commitGameState({ ...current, gameStatus: 'paused' })
    }
  }

  const handleShowHint = () => {
    gameEngineRef.current?.showHint()
  }

  const handleMove = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    clearHint()

    const engine = gameEngineRef.current
    if (!engine || gameStateRef.current?.gameStatus !== 'playing') return

    engine.makeMove(fromRow, fromCol, toRow, toCol).then(result => {
      const prev = gameStateRef.current
      // The round may have been restarted or ended while the move was resolving
      if (!result.valid || !prev || gameEngineRef.current !== engine) return

      let obstacleBlocks = prev.obstacleBlocks
      let blocksDestroyed = prev.blocksDestroyed || 0
      if (result.matchesFound.length > 0) {
        const destruction = obstacleBlockManager.checkObstacleDestruction(result.matchesFound.flat(), obstacleBlocks)
        obstacleBlocks = destruction.remainingBlocks
        blocksDestroyed += destruction.destroyedBlocks.length
      }

      const next: GameState = { ...prev, matchesFound: result.matchesFound, obstacleBlocks, blocksDestroyed }

      next.gameStatus = roundStatus(next.goal!, next.maxMoves, { ...next, collected: next.collected! })
      // A stage also needs its blocks broken
      const stageData = next.gameMode === 'stage' && next.currentStage ? stageSystem.getStage(next.currentStage) : null
      if (stageData && blocksDestroyed < stageData.blocksToBreak && next.gameStatus === 'completed') {
        next.gameStatus = next.moves >= stageData.maxMoves ? 'failed' : 'playing'
      }

      const movesLeft = next.maxMoves === undefined ? 0 : next.maxMoves - next.moves
      if (next.gameStatus === 'completed' && movesLeft > 0) next.gameStatus = 'bonus'

      commitGameState(next)
      if (next.gameStatus === 'bonus') runEndCascade(engine, movesLeft)
      else if (next.gameStatus === 'completed') winRound(next, movesLeft)
      else if (next.gameStatus === 'failed') failRound(next)
    }).catch(error => console.error('Move failed:', error))
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

  const handleShowDashboard = () => {
    setModalState('dashboard')
  }

  const handleUpdateProfile = (updates: Partial<UserStatsType>) => {
    setUserStats(prev => ({ ...prev, ...updates }))
  }

  const handleRefillEnergy = () => {
    const REFILL_COST = 50 // gems

    setUserStats(prev => {
      const regenerated = energyManager.advance(prev.energy, prev.lastEnergyUpdate, prev.maxEnergy)
      if (regenerated.energy >= prev.maxEnergy || prev.gems < REFILL_COST) return prev

      return {
        ...prev,
        energy: prev.maxEnergy,
        gems: prev.gems - REFILL_COST,
        lastEnergyUpdate: Date.now()
      }
    })
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
    if (appState === 'game' && gameState) {
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
            rewards={winRewards ?? undefined}
            bonusScore={bonusScore}
            onSkipBonus={() => (skipBonusRef.current = true)}
            disabled={gameState.gameStatus !== 'playing'}
          />
        
          {/* Game modals */}
          <SettingsModal isOpen={modalState === 'settings'} onClose={closeModal} />
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
            onPlayAgain={handleTimeRushPlayAgain}
            onShowMenu={handleShowMenu}
            canPlayAgain={canStartNewGame()}
            hintsEnabled={settings.hints}
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
          <StatisticsModal isOpen={modalState === 'statistics'} onClose={closeModal} stats={userStats} />
          <GameGuideModal isOpen={modalState === 'guide'} onClose={closeModal} />
          <CreditsModal isOpen={modalState === 'credits'} onClose={closeModal} />
        </>
      )
    }

    return null
  })()

  return <MotionConfig reducedMotion={settings.animations ? 'user' : 'always'}>{screen}</MotionConfig>
}
