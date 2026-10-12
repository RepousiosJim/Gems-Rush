'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Pause, Play, RotateCcw, Lightbulb, Timer } from 'lucide-react'
import { GameState } from '@/types/game'
import { GameEngine, HintMove, MatchGroup } from '@/lib/game/GameEngine'
import GameBoard from './GameBoard'

const ROUND_SECONDS = 60
const WARNING_SECONDS = 10
const HINT_VISIBLE_MS = 5000
const MAX_BOARD_SIZE = 600
const BOARD_VERTICAL_MARGIN = 16

export interface TimeRushStats {
  finalScore: number
  totalMatches: number
  powerUpsActivated: number
  maxCombo: number
  rushBonus: number
}

interface TimeRushModeProps {
  gameEngine: GameEngine
  onGameEnd: (finalScore: number, stats: TimeRushStats) => void
  onPlayAgain: () => void
  onShowMenu: () => void
  canPlayAgain: boolean
  hintsEnabled: boolean
}

type Hint = { from: { row: number; col: number }; to: { row: number; col: number } }

interface Live {
  score: number
  matches: number
  powerUps: number
  maxCombo: number
}

const formatTime = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

export default function TimeRushMode({
  gameEngine,
  onGameEnd,
  onPlayAgain,
  onShowMenu,
  canPlayAgain,
  hintsEnabled
}: TimeRushModeProps) {
  const [gameState, setGameState] = useState<GameState>(() => gameEngine.getGameState())
  const [timeRemaining, setTimeRemaining] = useState(ROUND_SECONDS)
  const [phase, setPhase] = useState<'playing' | 'paused' | 'ended'>('playing')
  const [live, setLive] = useState<Live>({ score: 0, matches: 0, powerUps: 0, maxCombo: 1 })
  const [finalStats, setFinalStats] = useState<TimeRushStats | null>(null)
  const [currentHint, setCurrentHint] = useState<Hint | null>(null)
  const [boardSize, setBoardSize] = useState(0)

  // The engine's events and the end-of-round effect read the latest values from here
  const liveRef = useRef(live)
  const endedRef = useRef(false)
  const busyRef = useRef(false)
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null)
  const boardAreaRef = useRef<HTMLDivElement>(null)
  // Where the current second started and how much of it a pause already used
  const tickStartRef = useRef(0)
  const tickCarryRef = useRef(0)

  const updateLive = useCallback((patch: (prev: Live) => Partial<Live>) => {
    liveRef.current = { ...liveRef.current, ...patch(liveRef.current) }
    setLive(liveRef.current)
  }, [])

  const clearHint = useCallback(() => {
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current)
      hintTimerRef.current = null
    }
    setCurrentHint(null)
  }, [])

  // Engine events: the board and score arrive as a full GameState, matches as MatchGroup[]
  useEffect(() => {
    const onBoardChanged = (state: GameState) => {
      if (endedRef.current) return
      setGameState(state)
      updateLive(prev => ({ score: state.score, maxCombo: Math.max(prev.maxCombo, state.comboMultiplier) }))
    }
    const onMatchFound = (groups: MatchGroup[]) => {
      if (endedRef.current) return
      updateLive(prev => ({ matches: prev.matches + groups.length }))
    }
    const onPowerUpActivated = () => {
      if (endedRef.current) return
      updateLive(prev => ({ powerUps: prev.powerUps + 1 }))
    }
    const onHintShow = (hint: HintMove) => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
      setCurrentHint({ from: hint.from, to: hint.to })
      hintTimerRef.current = setTimeout(clearHint, HINT_VISIBLE_MS)
    }

    gameEngine.on('game:board-changed', onBoardChanged)
    gameEngine.on('game:match-found', onMatchFound)
    gameEngine.on('game:powerup-activated', onPowerUpActivated)
    gameEngine.on('hint:show', onHintShow)
    gameEngine.on('hint:hide', clearHint)

    return () => {
      gameEngine.off('game:board-changed', onBoardChanged)
      gameEngine.off('game:match-found', onMatchFound)
      gameEngine.off('game:powerup-activated', onPowerUpActivated)
      gameEngine.off('hint:show', onHintShow)
      gameEngine.off('hint:hide', clearHint)
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    }
  }, [gameEngine, updateLive, clearHint])

  // The clock only runs while playing
  useEffect(() => {
    if (phase !== 'playing') return
    let timer: ReturnType<typeof setTimeout>
    const schedule = (delay: number) => {
      tickStartRef.current = Date.now()
      timer = setTimeout(() => {
        tickCarryRef.current = 0
        setTimeRemaining(prev => Math.max(0, prev - 1))
        schedule(1000)
      }, delay)
    }
    schedule(1000 - tickCarryRef.current)
    return () => {
      clearTimeout(timer)
      tickCarryRef.current = Math.min(999, tickCarryRef.current + Date.now() - tickStartRef.current)
    }
  }, [phase])

  // Time is up: lock the engine and settle the round once
  useEffect(() => {
    if (timeRemaining > 0 || endedRef.current) return
    endedRef.current = true

    gameEngine.pause()
    clearHint()
    setPhase('ended')

    const { score, matches, powerUps, maxCombo } = liveRef.current
    const stats: TimeRushStats = {
      finalScore: score,
      totalMatches: matches,
      powerUpsActivated: powerUps,
      maxCombo,
      rushBonus: Math.floor(score * 0.1)
    }
    setFinalStats(stats)
    onGameEnd(score, stats)
  }, [timeRemaining, gameEngine, clearHint, onGameEnd])

  // The board takes the largest square the space under the HUD allows
  useEffect(() => {
    const area = boardAreaRef.current
    if (!area) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBoardSize(Math.max(0, Math.floor(Math.min(width, height - BOARD_VERTICAL_MARGIN, MAX_BOARD_SIZE))))
    })
    observer.observe(area)
    return () => observer.disconnect()
  }, [])

  const play = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    if (phase !== 'playing' || busyRef.current) return
    busyRef.current = true
    gameEngine.makeMove(fromRow, fromCol, toRow, toCol).finally(() => {
      busyRef.current = false
    })
  }, [phase, gameEngine])

  // Clicking a power-up fires it in place
  const handlePowerUpClick = useCallback((row: number, col: number) => play(row, col, row, col), [play])

  const togglePause = () => {
    if (phase === 'playing') {
      gameEngine.pause()
      clearHint()
      setPhase('paused')
    } else if (phase === 'paused') {
      gameEngine.resume()
      setPhase('playing')
    }
  }

  const warning = timeRemaining <= WARNING_SECONDS
  const timePct = (timeRemaining / ROUND_SECONDS) * 100

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-ink page-glow">
      {/* Top bar */}
      <motion.div
        className="relative z-10 flex h-14 shrink-0 items-center justify-between px-4 md:px-6"
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-2">
          <button onClick={onShowMenu} className="btn btn-icon btn-ghost" aria-label="Menu">
            <Home size={20} />
          </button>
        </div>

        <div className="text-center">
          <div className="text-sm font-semibold text-fg">Gems Rush</div>
          <div className="text-xs text-fg-muted">Time Rush</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            disabled={phase === 'ended'}
            className="btn btn-icon btn-ghost"
            aria-label={phase === 'paused' ? 'Resume' : 'Pause'}
          >
            {phase === 'paused' ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </div>
      </motion.div>

      {/* HUD */}
      <motion.div
        className="card relative z-10 mx-4 mt-2 w-[calc(100%-2rem)] max-w-[560px] shrink-0 self-center p-4"
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      >
        <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
          <div>
            <div className="stat-label">Time</div>
            <div className={`stat-value ${warning ? 'text-bad' : 'text-fg'}`} data-testid="time-remaining">
              {formatTime(timeRemaining)}
            </div>
            {phase === 'paused' && <div className="text-xs text-fg-dim">Paused</div>}
          </div>
          <div>
            <div className="stat-label">Score</div>
            <div className="stat-value text-gold" data-testid="score">{live.score.toLocaleString()}</div>
            {gameState.lastMoveScore > 0 && (
              <div className="text-xs font-semibold text-good">+{gameState.lastMoveScore}</div>
            )}
          </div>
          <div>
            <div className="stat-label">Matches</div>
            <div className="stat-value text-fg" data-testid="matches">{live.matches}</div>
          </div>
          <div>
            <div className="stat-label">Combo</div>
            <div className="stat-value text-violet">{gameState.comboMultiplier.toFixed(1)}x</div>
          </div>
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink-2">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${warning ? 'bg-bad' : 'bg-violet'}`}
            style={{ width: `${timePct}%` }}
          />
        </div>
      </motion.div>

      {/* Board */}
      <div ref={boardAreaRef} className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4">
        {boardSize > 0 && (
          <GameBoard
            gameState={gameState}
            size={boardSize}
            onMove={play}
            onPowerUpClick={handlePowerUpClick}
            disabled={phase !== 'playing'}
            currentHint={currentHint}
          />
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 flex shrink-0 justify-center gap-3 px-4 pb-4">
        <button onClick={onPlayAgain} disabled={!canPlayAgain} className="btn btn-secondary">
          <RotateCcw size={18} />
          <span className="hidden sm:inline">Restart</span>
        </button>
        {hintsEnabled && (
          <button
            onClick={() => gameEngine.showHint()}
            disabled={phase !== 'playing'}
            className="btn btn-secondary"
          >
            <Lightbulb size={18} />
            <span className="hidden sm:inline">Hint</span>
          </button>
        )}
      </div>

      {/* Results: stays until the player chooses */}
      <AnimatePresence>
        {finalStats && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="time-rush-results-title"
              className="card mx-4 w-full max-w-md p-8 text-center"
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Timer className="mx-auto mb-4 text-violet" size={40} />
              <h2 id="time-rush-results-title" className="mb-6 text-2xl font-bold text-fg">Time&apos;s up</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-fg-muted">Final score</span>
                  <span className="font-semibold text-gold" data-testid="final-score">{finalStats.finalScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-muted">Total matches</span>
                  <span className="font-semibold text-fg">{finalStats.totalMatches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-muted">Power-ups used</span>
                  <span className="font-semibold text-fg">{finalStats.powerUpsActivated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-muted">Max combo</span>
                  <span className="font-semibold text-violet">{finalStats.maxCombo.toFixed(1)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-muted">Rush bonus (coins and XP)</span>
                  <span className="font-semibold text-good">+{finalStats.rushBonus.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <button onClick={onPlayAgain} disabled={!canPlayAgain} className="btn btn-primary" autoFocus>
                  <RotateCcw size={18} />
                  <span>Play again</span>
                </button>
                <button onClick={onShowMenu} className="btn btn-secondary">
                  <Home size={18} />
                  <span>Menu</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
