'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { GameState, Gem } from '@/types/game'
import { PowerUpGem } from '@/lib/game/GameEngine'
import { Bomb, Hammer, Shuffle, Sparkles, Zap, type LucideIcon } from 'lucide-react'
import GemIcon from '@/components/ui/GemIcon'

interface GameBoardProps {
  gameState: GameState
  onMove: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void
  onGemClick?: (row: number, col: number) => void
  disabled?: boolean
  timeRushMode?: boolean
  currentHint?: { from: { row: number; col: number }; to: { row: number; col: number } } | null
}

const POWER_UP_ICONS: Record<PowerUpGem['powerUpType'], LucideIcon> = {
  lightning: Zap,
  rainbow: Sparkles,
  bomb: Bomb,
  hammer: Hammer,
  shuffle: Shuffle
}

export default function GameBoard({ 
  gameState, 
  onMove, 
  onGemClick,
  disabled = false,
  timeRushMode = false,
  currentHint 
}: GameBoardProps) {
  // Early return if gameState is not available
  if (!gameState) {
    return (
      <div className="flex items-center justify-center w-96 h-96 bg-black/20 backdrop-blur-sm border border-white/20 rounded-2xl">
        <div className="text-white/70 text-lg">Initializing game board...</div>
      </div>
    )
  }

  const [selectedGem, setSelectedGem] = useState<{ row: number; col: number } | null>(null)
  const [animatingGems, setAnimatingGems] = useState<Set<string>>(new Set())
  const [cascadeLevel, setCascadeLevel] = useState(0)
  
  // Enhanced board size for Time Rush mode
  const boardSize = useMemo(() => {
    const baseSize = timeRushMode ? 520 : 450
    return Math.max(320, baseSize)
  }, [timeRushMode])

  const gemSize = useMemo(() => {
    return Math.floor((boardSize - 32) / 8) // 8x8 grid with padding
  }, [boardSize])

  // Check if gem is a power-up
  const isPowerUpGem = useCallback((gem: Gem | null): gem is PowerUpGem => {
    return gem !== null && 'isPowerUp' in gem && gem.isPowerUp === true
  }, [])

  // Get adjacent positions for move validation
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

  // Handle gem click
  const handleGemClick = useCallback((row: number, col: number) => {
    if (disabled) return
    
    const gem = gameState.board[row]?.[col]
    if (!gem) return

    // Handle power-up click in Time Rush mode
    if (timeRushMode && isPowerUpGem(gem) && onGemClick) {
      onGemClick(row, col)
      return
    }

    // Normal gem selection logic
    if (!selectedGem) {
      setSelectedGem({ row, col })
    } else {
      // Check if clicking the same gem (deselect)
      if (selectedGem.row === row && selectedGem.col === col) {
        setSelectedGem(null)
        return
      }

      // Check if gems are adjacent
      const adjacentPositions = getAdjacentPositions(selectedGem.row, selectedGem.col)
      const isAdjacent = adjacentPositions.some(pos => pos.row === row && pos.col === col)

      if (isAdjacent) {
        // Make the move
        onMove(selectedGem.row, selectedGem.col, row, col)
        setSelectedGem(null)
        
        // Add animation
        const gemId = `${selectedGem.row}-${selectedGem.col}`
        setAnimatingGems(prev => new Set([...prev, gemId]))
        setTimeout(() => {
          setAnimatingGems(prev => {
            const newSet = new Set(prev)
            newSet.delete(gemId)
            return newSet
          })
        }, 500)
      } else {
        // Select new gem
        setSelectedGem({ row, col })
      }
    }
  }, [disabled, gameState.board, timeRushMode, isPowerUpGem, onGemClick, selectedGem, getAdjacentPositions, onMove])

  // Render individual gem
  const renderGem = useCallback((gem: Gem | null, row: number, col: number) => {
    if (!gem) return null

    const isSelected = selectedGem?.row === row && selectedGem?.col === col
    const isAnimating = animatingGems.has(`${row}-${col}`)
    const isHinted = currentHint && 
      ((currentHint.from.row === row && currentHint.from.col === col) ||
       (currentHint.to.row === row && currentHint.to.col === col))
    const isPowerUp = isPowerUpGem(gem)

    const PowerUpIcon = isPowerUp ? POWER_UP_ICONS[gem.powerUpType] : null

    return (
      <motion.div
        key={gem.id}
        className={cn(
          "relative rounded-lg flex items-center justify-center select-none bg-ink/40",
          isPowerUp && 'bg-surface-2 ring-2 ring-gold',
          isSelected && 'ring-2 ring-gold z-20',
          isHinted && !isSelected && 'ring-2 ring-violet',
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        )}
        style={{
          width: gemSize,
          height: gemSize,
        }}
        onClick={() => handleGemClick(row, col)}
        initial={{ scale: 0 }}
        animate={{ scale: isAnimating ? [1, 1.15, 1] : 1 }}
        transition={{
          duration: isAnimating ? 0.4 : 0.6,
          delay: (row + col) * 0.02,
          type: isAnimating ? "tween" : "spring",
          stiffness: 300,
          damping: 20
        }}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        {PowerUpIcon ? (
          <PowerUpIcon className="text-violet" size={Math.round(gemSize * 0.5)} />
        ) : (
          <GemIcon type={gem.type} size={Math.round(gemSize * 0.82)} />
        )}
      </motion.div>
    )
  }, [selectedGem, animatingGems, currentHint, isPowerUpGem, gemSize, handleGemClick, disabled])

  return (
    <div className="relative">
      {/* Main Game Board */}
      <motion.div
        className="grid grid-cols-8 gap-1 p-4 relative"
        style={{
          width: boardSize,
          height: boardSize,
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Hint Connection Line */}
        {currentHint && (
          <motion.svg
            className="absolute inset-0 pointer-events-none z-30"
            style={{ width: '100%', height: '100%' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.line
              x1={16 + currentHint.from.col * (gemSize + 4) + gemSize / 2}
              y1={16 + currentHint.from.row * (gemSize + 4) + gemSize / 2}
              x2={16 + currentHint.to.col * (gemSize + 4) + gemSize / 2}
              y2={16 + currentHint.to.row * (gemSize + 4) + gemSize / 2}
              stroke="rgb(139, 124, 246)"
              strokeWidth="3"
              strokeDasharray="10 5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </motion.svg>
        )}

        {/* Board Grid */}
        {gameState?.board && Array.isArray(gameState.board) ? 
          gameState.board.map((row, rowIndex) =>
            Array.isArray(row) ? row.map((gem, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`} className="relative">
                {renderGem(gem, rowIndex, colIndex)}
              </div>
            )) : null
          ) : (
            // Loading placeholder grid
            <div className="col-span-8 flex items-center justify-center h-full">
              <div className="text-fg-muted text-sm">Loading board...</div>
            </div>
          )
        }
      </motion.div>
    </div>
  )
} 