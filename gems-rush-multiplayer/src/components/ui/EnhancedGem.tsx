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

const ICON_SIZES = { sm: 33, md: 39, lg: 52 }

const gemVariants: Variants = {
  default: { scale: 1, opacity: 1 },
  selected: {
    scale: [1, 1.06, 1],
    transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
  },
  hinted: {
    opacity: [1, 0.55, 1],
    transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
  },
  matched: {
    scale: [1, 1.2, 0],
    opacity: [1, 1, 0],
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
        isSelected && 'ring-2 ring-gold',
        isHinted && !isSelected && 'ring-2 ring-violet',
        isAdjacent && !isSelected && !isHinted && 'ring-1 ring-line-strong',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      )}
      variants={gemVariants}
      animate={variant}
      whileTap={disabled ? undefined : { scale: 0.94 }}
    >
      <GemIcon type={gem.type} size={ICON_SIZES[size]} />
    </motion.button>
  )
}
