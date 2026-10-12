'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion, MotionValue, useMotionValue, useTransform, Variants } from 'framer-motion'
import { Gem } from '@/types/game'
import { cn } from '@/lib/utils'
import GemIcon from './GemIcon'

interface EnhancedGemProps {
  gem: Gem | null
  row: number
  col: number
  isSelected?: boolean
  isAdjacent?: boolean
  isHinted?: boolean
  isMatched?: boolean
  onClick: () => void
  // Drag past the threshold swaps with the neighbour in that direction
  onSwipe?: (dRow: number, dCol: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SLOT_CLASSES = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16'
}

const ICON_SIZES = { sm: 36, md: 43, lg: 58 }

const SWIPE_THRESHOLD_PX = 16

const SNAP_SPRING = { type: 'spring', stiffness: 600, damping: 35 } as const

const GLIDE = { duration: 0.12, ease: 'easeOut' } as const

// One drag offset per board: the dragged gem moves by it and the neighbour it heads toward moves the opposite way
interface SwapDrag {
  x: MotionValue<number>
  y: MotionValue<number>
  origin: MotionValue<string>
  boardSize: number
}

const SwapDragContext = createContext<SwapDrag | null>(null)

export const SwapDragProvider = SwapDragContext.Provider

// The board resets the drag when its gems change, so a valid swap lands without a jump
export function useSwapDrag(board: unknown[]): SwapDrag {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const origin = useMotionValue('')
  useEffect(() => {
    x.set(0)
    y.set(0)
    origin.set('')
  }, [board, x, y, origin])
  return useMemo(() => ({ x, y, origin, boardSize: board.length }), [x, y, origin, board.length])
}

const offsetFor = (row: number, col: number, origin: string, x: number, y: number) => {
  if (!origin) return { x: 0, y: 0 }
  const [oRow, oCol] = origin.split(',').map(Number)
  if (row === oRow && col === oCol) return { x, y }
  if (row === oRow + Math.sign(y) && col === oCol + Math.sign(x)) return { x: -x, y: -y }
  return { x: 0, y: 0 }
}

// Distance between neighbouring cell centres, measured from the gem's grid cell
const cellPitch = (cell: Element) => {
  const r = cell.getBoundingClientRect()
  const sibling = [cell.nextElementSibling, cell.previousElementSibling]
    .map(el => el?.getBoundingClientRect())
    .find(b => b && Math.abs(b.top - r.top) < 1 && Math.abs(b.width - r.width) < 1)
  return sibling ? Math.abs(sibling.left - r.left) : r.width
}

const gemVariants: Variants = {
  default: { scale: 1, y: 0, opacity: 1, filter: 'brightness(1)' },
  selected: {
    scale: [1.06, 1.12, 1.06],
    filter: 'brightness(1.15)',
    transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
  },
  hinted: {
    y: [0, -3, 0],
    transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
  },
  matched: {
    scale: [1, 1.25, 0],
    opacity: [1, 1, 0],
    filter: ['brightness(1)', 'brightness(2.4)', 'brightness(3)'],
    transition: { duration: 0.45, ease: 'easeOut' }
  }
}

export default function EnhancedGem({
  gem,
  row,
  col,
  isSelected = false,
  isAdjacent = false,
  isHinted = false,
  isMatched = false,
  onClick,
  onSwipe,
  disabled = false,
  size = 'md'
}: EnhancedGemProps) {
  const drag = useRef<{ x: number; y: number; reach: number; active: boolean; swiped: boolean } | null>(null)
  const shared = useContext(SwapDragContext)!
  const offsetX = useTransform(() => offsetFor(row, col, shared.origin.get(), shared.x.get(), shared.y.get()).x)
  const offsetY = useTransform(() => offsetFor(row, col, shared.origin.get(), shared.x.get(), shared.y.get()).y)
  const [dragging, setDragging] = useState(false)

  if (!gem) {
    return <div className={cn('rounded-lg bg-ink/40', SLOT_CLASSES[size])} />
  }

  const variant = isMatched
    ? 'matched'
    : isSelected
      ? 'selected'
      : isHinted
        ? 'hinted'
        : 'default'

  const key = `${row},${col}`

  const snapBack = () => {
    if (shared.origin.get() !== key) return
    animate(shared.x, 0, SNAP_SPRING)
    animate(shared.y, 0, { ...SNAP_SPRING, onComplete: () => shared.origin.set('') })
  }

  const endDrag = (e: React.PointerEvent) => {
    const start = drag.current
    if (!start?.active) return
    start.active = false
    setDragging(false)
    const dx = shared.x.get()
    const dy = shared.y.get()
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD_PX || e.type === 'pointercancel') {
      snapBack()
      return
    }
    start.swiped = true
    const horizontal = Math.abs(dx) > Math.abs(dy)
    // Both gems glide into each other's cells, then the move is made: a valid swap resets
    // the drag as the board changes, an invalid one slides back
    animate(horizontal ? shared.x : shared.y, Math.sign(horizontal ? dx : dy) * start.reach, {
      ...GLIDE,
      onComplete: () => {
        if (horizontal) onSwipe!(0, Math.sign(dx))
        else onSwipe!(Math.sign(dy), 0)
        setTimeout(snapBack, 120)
      }
    })
  }

  return (
    <motion.button
      onPointerDown={e => {
        if (disabled || !onSwipe) return
        drag.current = { x: e.clientX, y: e.clientY, reach: cellPitch(e.currentTarget.parentElement!), active: true, swiped: false }
        e.currentTarget.setPointerCapture(e.pointerId)
        shared.x.set(0)
        shared.y.set(0)
        shared.origin.set(key)
        setDragging(true)
      }}
      onPointerMove={e => {
        const start = drag.current
        if (!start?.active) return
        const dx = e.clientX - start.x
        const dy = e.clientY - start.y
        // Follow the finger along the dominant axis, at most one cell
        const clamp = (v: number) => Math.max(-start.reach, Math.min(start.reach, v))
        // Stay inside the board: no pull toward a missing neighbour
        const horizontal = Math.abs(dx) > Math.abs(dy)
        const allowed = (d: number) => (horizontal ? col + Math.sign(d) : row + Math.sign(d)) >= 0 &&
          (horizontal ? col + Math.sign(d) : row + Math.sign(d)) < shared.boardSize
        shared.x.set(horizontal && allowed(dx) ? clamp(dx) : 0)
        shared.y.set(!horizontal && allowed(dy) ? clamp(dy) : 0)
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={() => {
        // The click that ends a swipe is not a tap
        const swiped = drag.current?.swiped
        drag.current = null
        if (!swiped) onClick()
      }}
      disabled={disabled}
      className={cn(
        'relative flex touch-none select-none items-center justify-center rounded-lg bg-ink/40',
        dragging && 'z-20',
        SLOT_CLASSES[size],
        isSelected && 'bg-gold/15 ring-2 ring-gold shadow-[0_0_14px_rgba(245,196,81,0.55)]',
        isHinted && !isSelected && 'bg-violet/15 ring-2 ring-violet',
        isAdjacent && !isSelected && !isHinted && 'ring-1 ring-line-strong',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      )}
      whileTap={disabled ? undefined : { scale: 0.94 }}
    >
      {isHinted && !isSelected && (
        <motion.span
          className="absolute inset-0 rounded-lg shadow-[0_0_14px_rgba(139,124,246,0.8)]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <motion.span className="flex" style={{ x: offsetX, y: offsetY }}>
        <motion.span className="flex" variants={gemVariants} animate={variant}>
          <GemIcon type={gem.type} size={ICON_SIZES[size]} powerUp={gem.powerUpType} />
        </motion.span>
      </motion.span>
    </motion.button>
  )
}
