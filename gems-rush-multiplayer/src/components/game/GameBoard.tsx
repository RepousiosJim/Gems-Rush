'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GameState } from '@/types/game'
import EnhancedGem from '@/components/ui/EnhancedGem'

const GRID = 8
const GAP = 4
// Matches the card's p-3
const PADDING = 12

interface GameBoardProps {
  gameState: GameState
  // Outer size of the board card in px
  size: number
  onMove: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void
  onPowerUpClick?: (row: number, col: number) => void
  disabled?: boolean
  currentHint?: { from: { row: number; col: number }; to: { row: number; col: number } } | null
}

export default function GameBoard({
  gameState,
  size,
  onMove,
  onPowerUpClick,
  disabled = false,
  currentHint
}: GameBoardProps) {
  const [selectedGem, setSelectedGem] = useState<{ row: number; col: number } | null>(null)

  const gemSize = Math.floor((size - PADDING * 2 - GAP * (GRID - 1)) / GRID)
  // The gem slot must fit inside its cell
  const gemSlot = gemSize < 48 ? 'sm' : gemSize < 64 ? 'md' : 'lg'
  const center = (index: number) => index * (gemSize + GAP) + gemSize / 2

  const handleGemClick = useCallback((row: number, col: number) => {
    if (disabled) return

    const gem = gameState.board[row]?.[col]
    if (!gem) return

    if (gem.powerUpType && onPowerUpClick) {
      setSelectedGem(null)
      onPowerUpClick(row, col)
      return
    }

    if (!selectedGem) {
      setSelectedGem({ row, col })
      return
    }

    const isAdjacent = Math.abs(selectedGem.row - row) + Math.abs(selectedGem.col - col) === 1
    if (isAdjacent) {
      onMove(selectedGem.row, selectedGem.col, row, col)
      setSelectedGem(null)
    } else if (selectedGem.row === row && selectedGem.col === col) {
      setSelectedGem(null)
    } else {
      setSelectedGem({ row, col })
    }
  }, [disabled, gameState.board, selectedGem, onMove, onPowerUpClick])

  return (
    <div className="card bg-ink-2 p-3" style={{ width: size, height: size }}>
      <div
        className="relative grid"
        style={{
          gridTemplateColumns: `repeat(${GRID}, ${gemSize}px)`,
          gridAutoRows: `${gemSize}px`,
          gap: GAP
        }}
      >
        {currentHint && (
          <motion.svg
            className="pointer-events-none absolute inset-0 z-10 h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.line
              x1={center(currentHint.from.col)}
              y1={center(currentHint.from.row)}
              x2={center(currentHint.to.col)}
              y2={center(currentHint.to.row)}
              stroke="var(--color-violet)"
              strokeWidth="3"
              strokeDasharray="10 5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
          </motion.svg>
        )}

        {gameState.board.map((row, rowIndex) =>
          row.map((gem, colIndex) => {
            const isHinted =
              (currentHint?.from.row === rowIndex && currentHint.from.col === colIndex) ||
              (currentHint?.to.row === rowIndex && currentHint.to.col === colIndex)

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="flex items-center justify-center"
              >
                <EnhancedGem
                  gem={gem}
                  row={rowIndex}
                  col={colIndex}
                  isSelected={selectedGem?.row === rowIndex && selectedGem?.col === colIndex}
                  isHinted={isHinted}
                  onClick={() => handleGemClick(rowIndex, colIndex)}
                  disabled={disabled}
                  size={gemSlot}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
