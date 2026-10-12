'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Coins, Gem as GemIcon, Zap, Home, RotateCcw, ArrowRight } from 'lucide-react'
import { GameState } from '@/types/game'
import { SUCCESS_MESSAGES } from '@/lib/game/constants'

interface WinScreenProps {
  isOpen: boolean
  gameState: GameState
  onNextLevel: () => void
  onMainMenu: () => void
  onRestart?: () => void
  showRewards?: boolean
  rewards?: {
    coins: number
    gems: number
    xp: number
    stars: number
  }
  // Score earned by the end-of-level cascade, already included in gameState.score
  bonusScore?: number
}

export default function WinScreen({
  isOpen,
  gameState,
  onNextLevel,
  onMainMenu,
  onRestart,
  showRewards = true,
  rewards = { coins: 100, gems: 5, xp: 50, stars: 3 },
  bonusScore = 0
}: WinScreenProps) {
  const [animationPhase, setAnimationPhase] = useState<'celebrating' | 'rewards' | 'options'>('celebrating')
  const [displayedScore, setDisplayedScore] = useState(0)
  const [displayedCoins, setDisplayedCoins] = useState(0)
  const [displayedGems, setDisplayedGems] = useState(0)
  const [displayedXP, setDisplayedXP] = useState(0)

  const earnedStars = rewards.stars

  // Animated number counter
  useEffect(() => {
    if (!isOpen) {
      setDisplayedScore(0)
      setDisplayedCoins(0)
      setDisplayedGems(0)
      setDisplayedXP(0)
      setAnimationPhase('celebrating')
      return
    }

    // Much shorter delays to avoid issues
    const celebrationTimer = setTimeout(() => {
      setAnimationPhase('rewards')
    }, 1000) // Reduced to 1 second

    // Show options immediately after rewards
    const optionsTimer = setTimeout(() => {
      setAnimationPhase('options')
    }, 1500) // Show buttons after 1.5 seconds

    // Emergency fallback - force buttons to show
    const emergencyTimer = setTimeout(() => {
      setAnimationPhase('options')
    }, 2000) // Emergency after 2 seconds

    return () => {
      clearTimeout(celebrationTimer)
      clearTimeout(optionsTimer)
      clearTimeout(emergencyTimer)
    }
  }, [isOpen]) // Only depend on isOpen to prevent resets

  // Separate effect for score animation that doesn't interfere with phase timing
  useEffect(() => {
    if (!isOpen) return

    // Score animation
    const scoreTimer = setTimeout(() => {
      const duration = 1500
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)

        setDisplayedScore(Math.floor(gameState.score * easeOut))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }, 1000)

    return () => clearTimeout(scoreTimer)
  }, [isOpen, gameState.score])

  // Separate effect for rewards animation
  useEffect(() => {
    if (!isOpen || !showRewards) return

    const rewardsTimer = setTimeout(() => {
      const duration = 1000
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)

        setDisplayedCoins(Math.floor(rewards.coins * easeOut))
        setDisplayedGems(Math.floor(rewards.gems * easeOut))
        setDisplayedXP(Math.floor(rewards.xp * easeOut))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }, 1500)

    return () => clearTimeout(rewardsTimer)
  }, [isOpen, showRewards, rewards.coins, rewards.gems, rewards.xp])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="card relative w-full max-w-md mx-4 p-8 text-center"
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: -20, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <AnimatePresence mode="wait">
            {animationPhase === 'celebrating' && (
              <motion.div
                key="celebration"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Star key={i} size={40} className="text-fg-dim" />
                  ))}
                </div>
                <h1 className="text-3xl font-bold text-fg tracking-tight">Level complete</h1>
              </motion.div>
            )}

            {(animationPhase === 'rewards' || animationPhase === 'options') && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <h1 className="text-2xl font-bold text-fg tracking-tight">Level {gameState.level} complete</h1>

                  <div className="flex justify-center items-center gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 300 }}
                      >
                        <Star
                          size={32}
                          className={i < earnedStars ? 'text-gold' : 'text-fg-dim'}
                          fill={i < earnedStars ? 'currentColor' : 'none'}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="card bg-ink-2 p-5">
                  <div className="stat-label mb-1">Final score</div>
                  <div className="stat-value text-3xl text-gold">{displayedScore.toLocaleString()}</div>
                  {gameState.goal?.kind === 'score' && (
                    <div className="text-xs text-fg-dim mt-1">Target: {gameState.goal.target.toLocaleString()}</div>
                  )}
                  {bonusScore > 0 && (
                    <div className="mt-2 text-sm font-semibold text-good" data-testid="win-bonus">
                      Moves bonus +{bonusScore.toLocaleString()}
                    </div>
                  )}
                </div>

                {showRewards && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="chip flex-col h-auto py-3 gap-1">
                      <Coins size={18} className="text-gold" />
                      <div className="text-xs text-fg-muted">Coins</div>
                      <div className="text-sm font-bold text-fg">+{displayedCoins}</div>
                    </div>
                    <div className="chip flex-col h-auto py-3 gap-1">
                      <GemIcon size={18} className="text-violet" />
                      <div className="text-xs text-fg-muted">Gems</div>
                      <div className="text-sm font-bold text-fg">+{displayedGems}</div>
                    </div>
                    <div className="chip flex-col h-auto py-3 gap-1">
                      <Zap size={18} className="text-good" />
                      <div className="text-xs text-fg-muted">XP</div>
                      <div className="text-sm font-bold text-fg">+{displayedXP}</div>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {animationPhase === 'options' && (
                    <motion.div
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex flex-col sm:flex-row gap-3 pt-2"
                    >
                      <button onClick={onNextLevel} className="btn btn-primary flex-1">
                        <span>Next level</span>
                      </button>

                      {onRestart && (
                        <button onClick={onRestart} className="btn btn-secondary flex-1">
                          <RotateCcw size={18} />
                          <span>Replay</span>
                        </button>
                      )}

                      <button onClick={onMainMenu} className="btn btn-ghost flex-1">
                        <Home size={18} />
                        <span>Menu</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
