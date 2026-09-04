'use client'

import { useState, useRef, useCallback, useMemo, useEffect, ReactElement } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Settings, Pause, Play, RotateCcw, Lightbulb, ArrowRight } from 'lucide-react'
import { Gem, GameState } from '@/types/game'
import EnhancedGem from '@/components/ui/EnhancedGem'
import ObstacleBlockComponent from '@/components/ui/ObstacleBlock'
import WinScreen from '@/components/ui/WinScreen'
import { VisualEffectsProvider, useVisualEffects } from '@/components/ui/VisualEffectsManager'
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization'
import { obstacleBlockManager } from '@/lib/game/ObstacleBlockManager'
import { stageSystem } from '@/lib/game/StageSystem'

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
  disabled?: boolean
}

// Separate component to avoid provider nesting issues
const GameInterfaceContent = ({ gameState, onMove, onRestart, onNextLevel, onPause, onShowMenu, onShowSettings, onShowHint, currentHint, disabled }: GameInterfaceProps): ReactElement => {
  const [selectedGem, setSelectedGem] = useState<{ row: number; col: number } | null>(null)
  const [adjacentGems, setAdjacentGems] = useState<{ row: number; col: number }[]>([])
  const [combos, setCombos] = useState<number>(0)
  const [showHintMessage, setShowHintMessage] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)

  const { addEffect } = useVisualEffects()

  // Use user's auto quality preference, defaulting to locked for stability
  const {
    quality,
    shouldAnimate,
    shouldShowEffects,
    optimizedThrottle,
    optimizedDebounce,
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

  // Optimized gem size calculation with better spacing
  const gemSize = useMemo(() => {
    const baseSize = Math.floor((boardSize - 32) / 8) // Account for padding and gaps
    return Math.max(32, baseSize) // Minimum 32px per gem
  }, [boardSize])

  // Performance-optimized hint system
  const showHints = useCallback(
    optimizedDebounce(() => {
      if (quality === 'minimal') return
      console.log('💡 Hint system: analyzing board for potential moves...')
    }, 2000),
    [quality]
  )

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

      setCombos(prev => prev + 1)

      if (shouldShowEffects) {
        matchedPositions.forEach((pos, index) => {
          if (boardRef.current) {
            const rect = boardRef.current.getBoundingClientRect()
            const x = rect.left + (pos.col * (gemSize + 4)) + gemSize / 2 + 16
            const y = rect.top + (pos.row * (gemSize + 4)) + gemSize / 2 + 16

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
          onClick={() => handleGemClick(row, col)}
          disabled={disabled}
          size={gemSize < 40 ? 'sm' : gemSize < 60 ? 'md' : 'lg'}
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
              <ArrowRight size={20} />
            </motion.div>
          </motion.div>
        )}
      </div>
    )
  }, [selectedGem, adjacentGems, currentHint, disabled, handleGemClick, gemSize])

  const isStageMode = gameState.gameMode === 'stage'
  const progressPct = Math.round((gameState.score / gameState.targetScore) * 100)

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
        {showHintMessage && currentHint && (
          <motion.div
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 card px-4 py-2"
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
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
          <div>
            <div className="stat-label">Score</div>
            <div className="stat-value text-gold">{gameState.score.toLocaleString()}</div>
            {gameState.lastMoveScore > 0 && (
              <div className="text-xs text-good font-semibold">+{gameState.lastMoveScore}</div>
            )}
          </div>

          <div>
            <div className="stat-label">Target</div>
            <div className="stat-value text-fg">{gameState.targetScore.toLocaleString()}</div>
            <div className="text-xs text-fg-dim">
              {Math.max(0, gameState.targetScore - gameState.score).toLocaleString()} to go
            </div>
          </div>

          <div>
            <div className="stat-label">Moves</div>
            <div className="stat-value text-fg">
              {isStageMode && gameState.currentStage
                ? `${gameState.moves}/${stageSystem.getStage(gameState.currentStage)?.maxMoves ?? '∞'}`
                : gameState.moves}
            </div>
          </div>

          <div>
            <div className="stat-label">Combo</div>
            <div className="stat-value text-violet">{gameState.comboMultiplier.toFixed(1)}x</div>
            {combos > 0 && <div className="text-xs text-fg-dim">{combos} chains</div>}
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
            <span>Target</span>
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
          className="card grid grid-cols-8 gap-1 bg-ink-2 p-3 relative"
          style={{ width: boardSize, height: boardSize }}
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
                x1={16 + currentHint.from.col * (gemSize + 4) + gemSize / 2}
                y1={16 + currentHint.from.row * (gemSize + 4) + gemSize / 2}
                x2={16 + currentHint.to.col * (gemSize + 4) + gemSize / 2}
                y2={16 + currentHint.to.row * (gemSize + 4) + gemSize / 2}
                stroke="var(--color-violet)"
                strokeWidth="3"
                strokeDasharray="10 5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            </motion.svg>
          )}

          {gameState.board.map((row, rowIndex) =>
            row.map((gem, colIndex) =>
              renderGemWithEffects(gem, rowIndex, colIndex)
            )
          )}

          {/* Obstacle blocks overlay */}
          {gameState.obstacleBlocks && gameState.obstacleBlocks.map(block => {
            if (block.isDestroyed) return null

            return (
              <div
                key={block.id}
                className="absolute pointer-events-none"
                style={{
                  left: 16 + block.col * (gemSize + 4),
                  top: 16 + block.row * (gemSize + 4),
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

        {/* Controls */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <button onClick={onRestart} disabled={disabled} className="btn btn-secondary">
            <RotateCcw size={18} />
            <span className="hidden sm:inline">Restart</span>
          </button>

          {onShowHint && quality !== 'minimal' && (
            <button onClick={onShowHint} disabled={disabled} className="btn btn-secondary">
              <Lightbulb size={18} />
              <span className="hidden sm:inline">Hint</span>
            </button>
          )}

          {onNextLevel && gameState.gameStatus === 'completed' && (
            <button onClick={onNextLevel} className="btn btn-primary">
              <span>Next level</span>
            </button>
          )}
        </motion.div>

        {/* Failed state */}
        <AnimatePresence>
          {gameState.gameStatus === 'failed' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="card max-w-md p-6 text-center"
            >
              <div className="text-2xl font-bold text-bad mb-2">Out of moves</div>
              <div className="text-fg-muted mb-4">Not enough score to clear this level</div>
              <div className="text-lg font-semibold text-fg mb-4">
                Score: {gameState.score.toLocaleString()} / {gameState.targetScore.toLocaleString()}
              </div>
              <div className="flex justify-center gap-3">
                <button onClick={onRestart} className="btn btn-primary">
                  <RotateCcw size={18} />
                  <span>Restart</span>
                </button>
                {onShowMenu && (
                  <button onClick={onShowMenu} className="btn btn-secondary">
                    <Home size={18} />
                    <span>Menu</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
        rewards={{
          coins: Math.floor(gameState.score / 10),
          gems: Math.max(1, Math.floor(gameState.score / 100)),
          xp: Math.floor(gameState.score / 5),
          stars: gameState.score >= gameState.targetScore * 2.5 ? 3 :
                 gameState.score >= gameState.targetScore * 1.8 ? 2 : 1
        }}
      />

      {/* Performance indicator (debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 hidden flex-col gap-1.5 sm:flex">
          <div className="chip">Quality: {quality} · Board: {boardSize}px · Gem: {gemSize}px</div>
          <div className="chip">Score: {gameState.score.toLocaleString()} / Target: {gameState.targetScore.toLocaleString()}</div>
          <div className="chip">Status: {gameState.gameStatus}</div>
          <button
            onClick={() => {
              console.log('Debug: Triggering win condition manually')
              window.dispatchEvent(new CustomEvent('debug-win-test'))
            }}
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
