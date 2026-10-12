'use client'

import { motion, Variants } from 'framer-motion'
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
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SLOT_CLASSES = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16'
}

const ICON_SIZES = { sm: 36, md: 43, lg: 58 }

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
  isSelected = false,
  isAdjacent = false,
  isHinted = false,
  isMatched = false,
  onClick,
  disabled = false,
  size = 'md'
}: EnhancedGemProps) {
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

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center justify-center rounded-lg bg-ink/40',
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
      <motion.span className="flex" variants={gemVariants} animate={variant}>
        <GemIcon type={gem.type} size={ICON_SIZES[size]} powerUp={gem.powerUpType} />
      </motion.span>
    </motion.button>
  )
}
