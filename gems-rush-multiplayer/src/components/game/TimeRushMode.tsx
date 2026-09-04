'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Zap, Flame, Home } from 'lucide-react'
import { GameState, Gem } from '@/types/game'
import { GameEngine, PowerUpGem } from '@/lib/game/GameEngine'
import GameBoard from './GameBoard'

interface TimeRushModeProps {
  gameEngine: GameEngine
  onGameEnd: (finalScore: number, stats: TimeRushStats) => void
  onPause: () => void
  onShowMenu: () => void
}

interface TimeRushStats {
  finalScore: number
  totalMatches: number
  powerUpsActivated: number
  maxCombo: number
  rushBonus: number
  timeUsed: number
}

interface PowerUpIndicator {
  id: string
  type: string
  row: number
  col: number
  charge: number
  maxCharge: number
  isReady: boolean
}

export default function TimeRushMode({ gameEngine, onGameEnd, onPause, onShowMenu }: TimeRushModeProps) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(60) // 60 seconds
  const [isActive, setIsActive] = useState(false)
  const [rushMultiplier, setRushMultiplier] = useState(1.0)
  const [powerUps, setPowerUps] = useState<PowerUpIndicator[]>([])
  const [adrenalineMode, setAdrenalineMode] = useState(false)
  const [warningMode, setWarningMode] = useState(false)
  const [finalStats, setFinalStats] = useState<TimeRushStats | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const [totalMatches, setTotalMatches] = useState(0)
  const [powerUpsActivated, setPowerUpsActivated] = useState(0)
  const [maxCombo, setMaxCombo] = useState(1)
  const [startTime] = useState(Date.now())

  // Helper function to check if a gem is a power-up
  const isPowerUpGem = useCallback((gem: Gem | null): boolean => {
    if (!gem) return false
    return 'isPowerUp' in gem && gem.isPowerUp === true
  }, [])

  // Enhanced scoring system for Time Rush
  const calculateTimeRushScore = useCallback((matchSize: number, comboLevel: number): number => {
    let baseScore: number

    switch (matchSize) {
      case 3:
        baseScore = 100 // Increased from 50
        break
      case 4:
        baseScore = 300 // Increased from 150 - Lightning power-up
        break
      case 5:
        baseScore = 600 // Increased from 300 - Rainbow power-up
        break
      case 6:
        baseScore = 1000 // Increased from 500 - Bomb power-up
        break
      default:
        baseScore = 1500 + (matchSize - 6) * 250 // Meteor power-up
        break
    }

    // Time Rush multipliers
    const comboMultiplier = Math.min(comboLevel * 0.5 + 1, 5.0)
    const rushMultiplier = timeRemaining <= 15 ? 2.0 : timeRemaining <= 30 ? 1.5 : 1.0

    return Math.floor(baseScore * comboMultiplier * rushMultiplier)
  }, [timeRemaining])

  // Start the timer
  const startTimer = useCallback(() => {
    if (timerRef.current) return

    setIsActive(true)
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1

        // Adrenaline mode at 15 seconds
        if (newTime === 15) {
          setAdrenalineMode(true)
        }

        // Warning mode at 10 seconds
        if (newTime === 10) {
          setWarningMode(true)
        }

        // Game over
        if (newTime <= 0) {
          endGame()
          return 0
        }

        return newTime
      })
    }, 1000)
  }, [])

  // End the game
  const endGame = useCallback(() => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setIsActive(false)

      const finalScore = gameState?.score || 0
      const rushBonus = Math.floor(finalScore * 0.1) // 10% rush bonus

      const stats: TimeRushStats = {
        finalScore,
        totalMatches: totalMatches || 0,
        powerUpsActivated: powerUpsActivated || 0,
        maxCombo: maxCombo || 1,
        rushBonus,
        timeUsed: Math.max(0, 60 - timeRemaining)
      }

      setFinalStats(stats)
      setTimeout(() => {
        try {
          onGameEnd(finalScore, stats)
        } catch (error) {
          console.error('Error calling onGameEnd:', error)
        }
      }, 2000)
    } catch (error) {
      console.error('Error ending game:', error)
      // Fallback: still try to call onGameEnd with safe values
      const safeStats: TimeRushStats = {
        finalScore: 0,
        totalMatches: 0,
        powerUpsActivated: 0,
        maxCombo: 1,
        rushBonus: 0,
        timeUsed: 60
      }
      onGameEnd(0, safeStats)
    }
  }, [gameState, totalMatches, powerUpsActivated, maxCombo, timeRemaining, onGameEnd])

  // Initialize game when component mounts
  useEffect(() => {
    if (gameEngine) {
      // Get initial game state from the already-initialized engine
      const initialState = gameEngine.getGameState()
      setGameState(initialState)
      startTimer()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [gameEngine, startTimer])

  // Set up GameEngine event listeners
  useEffect(() => {
    if (!gameEngine) return

    const handleStateChange = (newState: GameState) => {
      try {
        setGameState(newState)

        // Track max combo with null check
        if (newState?.comboMultiplier && newState.comboMultiplier > maxCombo) {
          setMaxCombo(newState.comboMultiplier)
        }
      } catch (error) {
        console.error('Error handling state change:', error)
      }
    }

    const handleMatchFound = (matches: any[]) => {
      try {
        if (Array.isArray(matches)) {
          setTotalMatches(prev => prev + matches.length)

          // Check for power-ups created from large matches
          matches.forEach(match => {
            if (match?.length >= 4) {
              const powerUpType = match.length === 4 ? 'lightning' :
                                match.length === 5 ? 'rainbow' : 'bomb'

              // Add power-up to tracking with error handling
              setPowerUps(prev => [...prev, {
                id: `${Date.now()}-${Math.random()}`,
                type: powerUpType,
                row: match[0]?.row || 0,
                col: match[0]?.col || 0,
                charge: 100,
                maxCharge: 100,
                isReady: true
              }])
            }
          })
        }
      } catch (error) {
        console.error('Error handling matches found:', error)
      }
    }

    const handlePowerUpActivated = () => {
      try {
        setPowerUpsActivated(prev => prev + 1)
      } catch (error) {
        console.error('Error handling power-up activation:', error)
      }
    }

    // Set up event listeners with error handling
    try {
      gameEngine.on('game:board-changed', handleStateChange)
      gameEngine.on('game:match-found', handleMatchFound)
      gameEngine.on('game:powerup-activated', handlePowerUpActivated)
    } catch (error) {
      console.error('Error setting up event listeners:', error)
    }

    return () => {
      try {
        gameEngine.off('game:board-changed', handleStateChange)
        gameEngine.off('game:match-found', handleMatchFound)
        gameEngine.off('game:powerup-activated', handlePowerUpActivated)
      } catch (error) {
        console.error('Error removing event listeners:', error)
      }
    }
  }, [gameEngine, maxCombo])

  // Handle gem moves
  const handleMove = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    if (!gameEngine || !gameState || !isActive) return

    gameEngine.makeMove(fromRow, fromCol, toRow, toCol).then((result) => {
      if (result.valid) {
        // Update local state with new board and score
        setGameState(prevState => {
          if (!prevState) return null

          const newScore = prevState.score + result.scoreChange

          return {
            ...prevState,
            board: result.newBoard,
            score: newScore,
            moves: prevState.moves + 1,
            matchesFound: result.matchesFound,
            comboMultiplier: result.comboCount > 0 ? result.comboCount : 1,
            lastMoveScore: result.scoreChange
          }
        })
      }
    })
  }, [gameEngine, gameState, isActive])

  // Handle power-up click
  const handlePowerUpClick = useCallback((row: number, col: number) => {
    if (!gameState || !isActive) return

    const gem = gameState.board[row]?.[col]
    if (!gem || !('isPowerUp' in gem) || !gem.isPowerUp) return

    // Activate power-up through game engine
    gameEngine.makeMove(row, col, row, col) // Self-click to activate

    // Remove from power-up tracking
    setPowerUps(prev => prev.filter(p => !(p.row === row && p.col === col)))
  }, [gameState, isActive, gameEngine])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink">
        <div className="text-fg-muted text-lg">Initializing Time Rush...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-ink page-glow">
      {/* Header with Timer and Stats */}
      <motion.div
        className="relative z-10 p-4 md:p-6"
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex h-14 items-center justify-between">
          <button onClick={onShowMenu} className="btn btn-icon btn-ghost" aria-label="Menu">
            <Home size={20} />
          </button>

          <div className="text-center">
            <div className="text-sm font-semibold text-fg">Time Rush</div>
            <div className="text-xs text-fg-muted">60 seconds</div>
          </div>

          <div className="w-11" />
        </div>

        <div className="card mx-auto mt-2 max-w-[560px] p-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Timer className={warningMode ? 'text-bad' : 'text-violet'} size={24} />
            <motion.div
              className={`font-mono text-3xl font-bold tabular-nums ${warningMode ? 'text-bad' : 'text-fg'}`}
              animate={{ scale: warningMode ? [1, 1.06, 1] : 1 }}
              transition={{ duration: 0.5, repeat: warningMode ? Infinity : 0 }}
            >
              {formatTime(timeRemaining)}
            </motion.div>
            {adrenalineMode && (
              <span className="chip text-bad border-bad">
                <Flame size={14} />
                Adrenaline
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="stat-label">Score</div>
              <div className="stat-value text-gold">{(gameState?.score || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="stat-label">Multiplier</div>
              <div className="stat-value text-violet">{(gameState?.comboMultiplier || 1).toFixed(1)}x</div>
            </div>
            <div>
              <div className="stat-label">Matches</div>
              <div className="stat-value text-fg">{totalMatches || 0}</div>
            </div>
            <div>
              <div className="stat-label">Power-ups</div>
              <div className="stat-value text-fg">{powerUpsActivated || 0}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Board */}
      <div className="relative z-10 flex justify-center px-4">
        <div className={`card p-3 bg-ink-2 relative ${adrenalineMode ? 'border-bad' : ''}`}>
          <GameBoard
            gameState={gameState}
            onMove={handleMove}
            disabled={!isActive}
            onGemClick={handlePowerUpClick}
            timeRushMode={true}
          />

          {/* Power-up click indicators */}
          <AnimatePresence>
            {powerUps.map(powerUp => (
              <motion.div
                key={powerUp.id}
                className="absolute pointer-events-none z-20 w-16 h-16 rounded-full border-2 border-violet"
                style={{
                  left: `${powerUp.col * 12.5}%`,
                  top: `${powerUp.row * 12.5}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Tips */}
      <motion.div
        className="card mx-auto mt-4 max-w-[560px] p-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.25 }}
      >
        <div className="text-sm space-y-1 text-fg-muted">
          <div className="font-semibold text-fg">Time Rush tips</div>
          <div>4+ matches create clickable power-ups</div>
          <div>Click power-ups to activate instantly</div>
          <div>Rush bonus at 30s and 15s remaining</div>
        </div>
      </motion.div>

      {gameState?.board && Array.isArray(gameState.board) &&
       gameState.board.some(row => Array.isArray(row) && row.some(gem => gem && isPowerUpGem(gem))) && (
        <div className="mt-4 text-center text-sm text-gold font-semibold">
          Click power-ups to activate instantly
        </div>
      )}

      {/* Game Over Screen */}
      <AnimatePresence>
        {finalStats && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="card max-w-md w-full mx-4 p-8 text-center"
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Timer className="mx-auto mb-4 text-violet" size={40} />
              <h2 className="text-2xl font-bold text-fg mb-6">Time's up</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-fg-muted">Final score</span>
                  <span className="font-semibold text-gold">{(finalStats?.finalScore || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-muted">Total matches</span>
                  <span className="font-semibold text-fg">{finalStats?.totalMatches || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-muted">Power-ups used</span>
                  <span className="font-semibold text-fg">{finalStats?.powerUpsActivated || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-muted">Max combo</span>
                  <span className="font-semibold text-violet">{(finalStats?.maxCombo || 1).toFixed(1)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-muted">Rush bonus</span>
                  <span className="font-semibold text-good">+{(finalStats?.rushBonus || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-line text-xs text-fg-dim">
                Time used: {Math.floor((finalStats?.timeUsed || 0) / 60)}:{((finalStats?.timeUsed || 0) % 60).toString().padStart(2, '0')}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
