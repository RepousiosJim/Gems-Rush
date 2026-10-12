'use client'

import { useState, useRef, useCallback, useMemo, useEffect, ReactElement } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Settings, Pause, Play, RotateCcw, Lightbulb, ArrowRight, Check } from 'lucide-react'
import { Gem, GameState } from '@/types/game'
import EnhancedGem, { SwapDragProvider, useSwapDrag } from '@/components/ui/EnhancedGem'
import ObstacleBlockComponent from '@/components/ui/ObstacleBlock'
import WinScreen from '@/components/ui/WinScreen'
import LoseScreen from '@/components/ui/LoseScreen'
import GemIcon from '@/components/ui/GemIcon'
import { VisualEffectsProvider, useVisualEffects } from '@/components/ui/VisualEffectsManager'
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization'
import { stageSystem } from '@/lib/game/StageSystem'
import { goalProgress, stillNeeded } from '@/lib/game/goals'

// Simple className utility function
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

interface GameInterfaceProps {
  gameState: GameState
  onMove: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void
  onRestart: () => void
  onNextLevel?: () => void
  onPause?: () => void
  onShowMenu?: () => void
  onShowSettings?: () => void
  onShowHint?: () => void
  currentHint?: { from: { row: number; col: number }; to: { row: number; col: number } } | null
  rewards?: { coins: number; gems: number; xp: number; stars: number }
  bonusScore: number
  onSkipBonus: () => void
  disabled?: boolean
}

// At or below this many moves left the counter turns urgent
const URGENT_MOVES = 5

const GRID = 8
const BOARD_GAP = 4
// Matches the board card's p-3
const BOARD_PAD = 12
// The card's 1px border sits outside the padding box that absolute overlays use
const BOARD_BORDER = 1

// Separate component to avoid provider nesting issues
const GameInterfaceContent = ({ gameState, onMove, onRestart, onNextLevel, onPause, onShowMenu, onShowSettings, onShowHint, currentHint, rewards, bonusScore, onSkipBonus, disabled }: GameInterfaceProps): ReactElement => {
  const [selectedGem, setSelectedGem] = useState<{ row: number; col: number } | null>(null)
  const swapDrag = useSwapDrag(gameState.board)
  const [adjacentGems, setAdjacentGems] = useState<{ row: number; col: number }[]>([])
  const [chains, setChains] = useState<number>(0)
  const [showHintMessage, setShowHintMessage] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)

  const { addEffect } = useVisualEffects()

  // Use user's auto quality preference, defaulting to locked for stability
  const {
    quality,
    shouldAnimate,
    shouldShowEffects,
    optimizedThrottle,
    setManualQuality,
    isQualityLocked
  } = usePerformanceOptimization('locked') // Always lock quality during gameplay

  // Lock quality to 'high' when game starts to prevent fluctuations
  useEffect(() => {
    if (gameState?.gameStatus === 'playing' && !isQualityLocked) {
      setManualQuality('high') // Lock to high quality for stable gameplay experience
    }
  }, [gameState?.gameStatus, isQualityLocked, setManualQuality])

  // Show hint message when hint is displayed
  useEffect(() => {
    if (currentHint) {
      setShowHintMessage(true)
      const timer = setTimeout(() => setShowHintMessage(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [currentHint])

  // Responsive board size with better scaling
  const boardSize = useMemo(() => {
    // Get viewport dimensions
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800

    // Calculate optimal size based on available space and quality
    const maxSize = Math.min(vw * 0.9, vh * 0.6) // Take up to 90% width or 60% height

    const sizes = {
      minimal: Math.min(maxSize, 320),
      low: Math.min(maxSize, 380),
      medium: Math.min(maxSize, 450),
      high: Math.min(maxSize, 520),
      ultra: Math.min(maxSize, 600)
    }
    return Math.max(320, sizes[quality] || 450) // Minimum 320px
  }, [quality])

  // Cells are exactly gemSize wide, so the card is sized from them and nothing clips
  const gemSize = Math.floor((boardSize - 2 * (BOARD_PAD + BOARD_BORDER) - BOARD_GAP * (GRID - 1)) / GRID)
  const boardOuter = GRID * gemSize + BOARD_GAP * (GRID - 1) + 2 * (BOARD_PAD + BOARD_BORDER)
  const cellOffset = (index: number) => BOARD_PAD + index * (gemSize + BOARD_GAP)

  // Optimized adjacent positions calculation
  const getAdjacentPositions = useCallback((row: number, col: number) => {
    const positions: { row: number; col: number }[] = []
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]

    for (const [dr, dc] of directions) {
      const newRow = row + dr
      const newCol = col + dc
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        positions.push({ row: newRow, col: newCol })
      }
    }

    return positions
  }, [])

  // Enhanced match detection and visual effects
  const handleMatchDetection = useCallback(
    optimizedThrottle((matchedPositions: { row: number; col: number }[]) => {
      if (matchedPositions.length === 0) return

      if (shouldShowEffects) {
        matchedPositions.forEach((pos, index) => {
          if (boardRef.current) {
            const rect = boardRef.current.getBoundingClientRect()
            const x = rect.left + BOARD_BORDER + cellOffset(pos.col) + gemSize / 2
            const y = rect.top + BOARD_BORDER + cellOffset(pos.row) + gemSize / 2

            setTimeout(() => {
              addEffect({
                type: 'glow',
                position: { x, y },
                duration: 1000,
                intensity: 1,
                priority: 'medium'
              })

              if (quality === 'ultra') {
                addEffect({
                  type: 'particle',
                  position: { x, y },
                  duration: 800,
                  intensity: 0.8,
                  priority: 'low'
                })
              }
            }, index * 50)
          }
        })

        if (matchedPositions.length >= 4 && boardRef.current) {
          const rect = boardRef.current.getBoundingClientRect()
          const centerX = rect.left + rect.width / 2
          const centerY = rect.top + rect.height / 2

          setTimeout(() => {
            addEffect({
              type: 'combo',
              position: { x: centerX, y: centerY },
              duration: 1500,
              intensity: Math.min(matchedPositions.length / 3, 2),
              priority: 'high'
            })
          }, 200)
        }
      }
    }, 100),
    [shouldShowEffects, addEffect, gemSize, quality]
  )

  // Optimized gem click handler
  const handleGemClick = useCallback((row: number, col: number) => {
    if (disabled || !gameState.board[row]?.[col]) return

    if (!selectedGem) {
      setSelectedGem({ row, col })
      setAdjacentGems(getAdjacentPositions(row, col))
    } else if (selectedGem.row === row && selectedGem.col === col) {
      setSelectedGem(null)
      setAdjacentGems([])
    } else {
      const isAdjacent = adjacentGems.some(gem => gem.row === row && gem.col === col)

      if (isAdjacent) {
        onMove(selectedGem.row, selectedGem.col, row, col)
        const matchedGems = [selectedGem, { row, col }]
        handleMatchDetection(matchedGems)
      }

      setSelectedGem(null)
      setAdjacentGems([])
    }
  }, [selectedGem, adjacentGems, disabled, gameState.board, onMove, getAdjacentPositions, handleMatchDetection])

  const handleGemSwipe = useCallback((row: number, col: number, dRow: number, dCol: number) => {
    const toRow = row + dRow
    const toCol = col + dCol
    if (disabled || !gameState.board[row]?.[col] || !gameState.board[toRow]?.[toCol]) return

    onMove(row, col, toRow, toCol)
    handleMatchDetection([{ row, col }, { row: toRow, col: toCol }])
    setSelectedGem(null)
    setAdjacentGems([])
  }, [disabled, gameState.board, onMove, handleMatchDetection])

  // Enhanced gem rendering with hint highlighting
  const renderGemWithEffects = useCallback((gem: Gem | null, row: number, col: number) => {
    const isSelected = selectedGem?.row === row && selectedGem?.col === col
    const isAdjacent = adjacentGems.some(g => g.row === row && g.col === col)
    const isHintFrom = currentHint?.from.row === row && currentHint?.from.col === col
    const isHintTo = currentHint?.to.row === row && currentHint?.to.col === col
    const isHinted = isHintFrom || isHintTo

    return (
      <div
        key={`${row}-${col}-${gem?.id || 'empty'}`}
        className="relative"
        style={{ width: gemSize, height: gemSize }}
      >
        <EnhancedGem
          gem={gem}
          row={row}
          col={col}
          isSelected={isSelected}
          isAdjacent={isAdjacent}
          isHinted={isHinted}
          isMatched={!!gem?.isMatched}
          onClick={() => handleGemClick(row, col)}
          onSwipe={(dRow, dCol) => handleGemSwipe(row, col, dRow, dCol)}
          disabled={disabled && gameState.gameStatus !== 'bonus'}
          size={gemSize}
        />

        {/* Hint dots */}
        {isHintFrom && (
          <motion.div
            className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-violet shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {isHintTo && (
          <motion.div
            className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-violet shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          />
        )}

        {/* Hint arrow */}
        {isHintFrom && currentHint && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-violet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              animate={{
                x: [0, (currentHint.to.col - currentHint.from.col) * 20, 0],
                y: [0, (currentHint.to.row - currentHint.from.row) * 20, 0]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight
                size={20}
                style={{ transform: `rotate(${Math.atan2(currentHint.to.row - currentHint.from.row, currentHint.to.col - currentHint.from.col)}rad)` }}
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    )
  }, [selectedGem, adjacentGems, currentHint, disabled, gameState.gameStatus, handleGemClick, handleGemSwipe, gemSize])

  // A cascade is every extra match the engine resolved after the first one in a move
  useEffect(() => {
    if (gameState.moves > 0 && gameState.comboMultiplier > 1) {
      setChains(prev => prev + gameState.comboMultiplier - 1)
    }
  }, [gameState.moves, gameState.comboMultiplier])

  const isStageMode = gameState.gameMode === 'stage'
  const goal = gameState.goal!
  const collected = gameState.collected!
  const progressPct = Math.round(goalProgress(goal, gameState.score, collected) * 100)
  const movesLeft = gameState.maxMoves === undefined ? null : gameState.maxMoves - gameState.moves
  const inBonus = gameState.gameStatus === 'bonus'
  const urgent = movesLeft !== null && movesLeft <= URGENT_MOVES && gameState.gameStatus === 'playing'

  return (
    <div className="min-h-screen bg-ink page-glow relative">
      {/* Top bar */}
      <motion.div
        className="flex h-14 items-center justify-between px-4 md:px-6 relative z-10"
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-2">
          {onShowMenu && (
            <button onClick={onShowMenu} className="btn btn-icon btn-ghost" aria-label="Menu">
              <Home size={20} />
            </button>
          )}
          {onShowSettings && (
            <button onClick={onShowSettings} className="btn btn-icon btn-ghost" aria-label="Settings">
              <Settings size={20} />
            </button>
          )}
        </div>

        <div className="text-center">
          <div className="text-sm font-semibold text-fg">Gems Rush</div>
          <div className="text-xs text-fg-muted">
            {isStageMode && gameState.currentStage
              ? `Stage ${gameState.currentStage}`
              : gameState.gameMode === 'dailyChallenge'
                ? 'Daily Quest'
                : `Level ${gameState.level} · Classic`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onPause && (
            <button onClick={onPause} className="btn btn-icon btn-ghost" aria-label="Pause">
              {gameState.gameStatus === 'paused' ? <Play size={20} /> : <Pause size={20} />}
            </button>
          )}
          {gameState.gameStatus !== 'playing' && (
            <span className="chip capitalize">{gameState.gameStatus}</span>
          )}
        </div>
      </motion.div>

      {/* Hint toast */}
      <AnimatePresence>
        {showHintMessage && currentHint && gameState.gameStatus === 'playing' && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 card px-4 py-2"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 text-sm text-fg">
              <Lightbulb size={16} className="text-violet" />
              <span>Swap the highlighted gems</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <motion.div
        className="card mx-auto mt-2 max-w-[560px] p-4"
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      >
        <div className={cn('grid gap-4 text-center', isStageMode ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4')}>
          <div data-testid="goal">
            <div className="stat-label">{goal.kind === 'score' ? 'Target' : 'Collect'}</div>
            {goal.kind === 'score' ? (
              <>
                <div className="stat-value text-fg">{goal.target.toLocaleString()}</div>
                <div className="text-xs text-fg-dim">
                  {Math.max(0, goal.target - gameState.score).toLocaleString()} to go
                </div>
              </>
            ) : (
              <div className="mt-1 flex items-center justify-center gap-3">
                {stillNeeded(goal, collected).map(([type, left]) => (
                  <div key={type} className="flex items-center gap-1" data-testid={`goal-${type}`} data-left={left}>
                    <motion.div
                      key={`icon-${left}`}
                      initial={{ scale: 1.35 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    >
                      <GemIcon type={type} size={26} />
                    </motion.div>
                    {left === 0 ? (
                      <Check size={22} className="text-good" aria-label="done" />
                    ) : (
                      <motion.span
                        key={`count-${left}`}
                        className="stat-value"
                        initial={{ scale: 1.6, color: 'var(--color-gold)' }}
                        animate={{ scale: 1, color: 'var(--color-fg)' }}
                        transition={{ duration: 0.35 }}
                      >
                        {left}
                      </motion.span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            data-testid="moves"
            data-urgent={urgent}
            className={cn('rounded-lg transition-colors duration-300', urgent && 'bg-bad/15 ring-1 ring-bad/60')}
          >
            <div className={cn('stat-label', urgent && 'text-bad')}>{movesLeft === null ? 'Moves' : 'Moves left'}</div>
            <motion.div
              className={cn('stat-value', inBonus ? 'text-gold' : urgent ? 'text-bad' : 'text-fg')}
              animate={urgent ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={urgent ? { duration: movesLeft! <= 2 ? 0.5 : 0.8, repeat: Infinity } : { duration: 0.2 }}
            >
              {movesLeft ?? gameState.moves}
            </motion.div>
          </div>

          <div>
            <div className="stat-label">Score</div>
            <div className="stat-value text-gold">{gameState.score.toLocaleString()}</div>
            {gameState.lastMoveScore > 0 && (
              <div className="text-xs text-good font-semibold">+{gameState.lastMoveScore}</div>
            )}
          </div>

          <div>
            <div className="stat-label">Combo</div>
            <div className="stat-value text-violet">{gameState.comboMultiplier.toFixed(1)}x</div>
            {chains > 0 && <div className="text-xs text-fg-dim">{chains} {chains === 1 ? 'chain' : 'chains'}</div>}
          </div>

          {isStageMode && gameState.currentStage && (
            <div>
              <div className="stat-label">Blocks</div>
              <div className="stat-value text-good">{gameState.blocksDestroyed || 0}</div>
              <div className="text-xs text-fg-dim">
                / {stageSystem.getStage(gameState.currentStage)?.blocksToBreak || 0}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-fg-muted mb-1">
            <span>Goal</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-2">
            <motion.div
              className="h-full rounded-full bg-violet"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPct, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Board + controls */}
      <div className="flex flex-col items-center gap-4 px-4 py-4">
        <motion.div
          ref={boardRef}
          className="card grid bg-ink-2 relative"
          style={{
            width: boardOuter,
            height: boardOuter,
            padding: BOARD_PAD,
            gap: BOARD_GAP,
            gridTemplateColumns: `repeat(${GRID}, ${gemSize}px)`,
            gridAutoRows: `${gemSize}px`
          }}
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          {currentHint && shouldAnimate && (
            <motion.svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.line
                x1={cellOffset(currentHint.from.col) + gemSize / 2}
                y1={cellOffset(currentHint.from.row) + gemSize / 2}
                x2={cellOffset(currentHint.to.col) + gemSize / 2}
                y2={cellOffset(currentHint.to.row) + gemSize / 2}
                stroke="var(--color-violet)"
                strokeWidth="3"
                strokeDasharray="10 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            </motion.svg>
          )}

          <SwapDragProvider value={swapDrag}>
            {gameState.board.map((row, rowIndex) =>
              row.map((gem, colIndex) =>
                renderGemWithEffects(gem, rowIndex, colIndex)
              )
            )}
          </SwapDragProvider>

          {/* Obstacle blocks overlay */}
          {gameState.obstacleBlocks && gameState.obstacleBlocks.map(block => {
            if (block.isDestroyed) return null

            return (
              <div
                key={block.id}
                className="absolute pointer-events-none"
                style={{
                  left: cellOffset(block.col),
                  top: cellOffset(block.row),
                  zIndex: 10
                }}
              >
                <ObstacleBlockComponent
                  block={block}
                  size={gemSize}
                  disabled={true}
                />
              </div>
            )
          })}
        </motion.div>

        {/* Controls; the bonus banner takes their place during the end cascade */}
        {!inBonus && (
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.15 }}
          >
            <button onClick={onRestart} className="btn btn-secondary">
              <RotateCcw size={18} />
              <span className="hidden sm:inline">Restart</span>
            </button>

            {onShowHint && quality !== 'minimal' && (
              <button onClick={onShowHint} disabled={disabled} className="btn btn-secondary">
                <Lightbulb size={18} />
                <span className="hidden sm:inline">Hint</span>
              </button>
            )}
          </motion.div>
        )}

      </div>

      {gameState.gameStatus === 'failed' && <LoseScreen gameState={gameState} onRetry={onRestart} onMainMenu={onShowMenu} />}

      {/* End cascade: leftover moves turning into score; a tap anywhere skips ahead */}
      {inBonus && (
        <button
          className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-end pb-5"
          onClick={onSkipBonus}
          aria-label="Skip bonus"
        >
          <div className="card flex items-center gap-3 px-5 py-2" data-testid="bonus-banner">
            <div className="stat-label">Moves bonus</div>
            <motion.div
              key={bonusScore}
              className="text-2xl font-bold tabular-nums text-gold"
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            >
              +{bonusScore.toLocaleString()}
            </motion.div>
            <div className="text-xs text-fg-dim">Tap to skip</div>
          </div>
        </button>
      )}

      {/* Win Screen Modal */}
      <WinScreen
        isOpen={gameState.gameStatus === 'completed'}
        gameState={gameState}
        onNextLevel={() => {
          if (onNextLevel) {
            onNextLevel()
          }
        }}
        onMainMenu={() => {
          if (onShowMenu) {
            onShowMenu()
          }
        }}
        onRestart={onRestart}
        showRewards={true}
        rewards={rewards}
        bonusScore={bonusScore}
      />

      {/* Performance indicator (debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 hidden flex-col gap-1.5 sm:flex">
          <div className="chip">Quality: {quality} · Board: {boardSize}px · Gem: {gemSize}px</div>
          <div className="chip">Score: {gameState.score.toLocaleString()} / Target: {gameState.targetScore.toLocaleString()}</div>
          <div className="chip">Status: {gameState.gameStatus}</div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('debug-win-test'))}
            className="btn btn-secondary h-8 px-3 text-xs"
          >
            Test Win
          </button>
        </div>
      )}
    </div>
  )
}

// Main component with provider wrapper
export default function GameInterface(props: GameInterfaceProps) {
  return (
    <VisualEffectsProvider>
      <GameInterfaceContent {...props} />
    </VisualEffectsProvider>
  )
}
