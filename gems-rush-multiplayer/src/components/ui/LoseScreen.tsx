'use client'

import { motion } from 'framer-motion'
import { Home, RotateCcw } from 'lucide-react'
import { GameState } from '@/types/game'
import GemIcon from '@/components/ui/GemIcon'
import { nearMissText, stillNeeded } from '@/lib/game/goals'

interface LoseScreenProps {
  gameState: GameState
  onRetry: () => void
  onMainMenu?: () => void
}

export default function LoseScreen({ gameState, onRetry, onMainMenu }: LoseScreenProps) {
  const goal = gameState.goal!
  const collected = gameState.collected!

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lose-title"
    >
      <motion.div
        className="card w-full max-w-sm p-6 text-center"
        initial={{ scale: 0.92, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <h1 id="lose-title" className="text-sm font-semibold uppercase tracking-wider text-bad">
          Out of moves
        </h1>

        <motion.div
          className="mt-3 text-3xl font-bold leading-tight text-fg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.08, 1], opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          {nearMissText(goal, gameState.score, collected)}
        </motion.div>

        <div className="mt-5 flex justify-center gap-5">
          {goal.kind === 'score' ? (
            <div className="tabular-nums text-fg-muted">
              <span className="text-lg font-semibold text-gold">{gameState.score.toLocaleString()}</span>
              {' / '}
              {goal.target.toLocaleString()}
            </div>
          ) : (
            stillNeeded(goal, collected).map(([type]) => (
              <div key={type} className="flex items-center gap-2 tabular-nums text-fg-muted">
                <GemIcon type={type} size={28} />
                <span>
                  <span className="text-lg font-semibold text-fg">{Math.min(collected[type] ?? 0, goal.gems[type]!)}</span>
                  {' / '}
                  {goal.gems[type]}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onRetry} className="btn btn-primary flex-1" autoFocus>
            <RotateCcw size={18} />
            <span>Retry</span>
          </button>
          {onMainMenu && (
            <button onClick={onMainMenu} className="btn btn-secondary flex-1">
              <Home size={18} />
              <span>Menu</span>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
