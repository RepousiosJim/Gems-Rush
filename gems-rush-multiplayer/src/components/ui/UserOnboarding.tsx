'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ArrowLeft,
  Gamepad2,
  Gem,
  Target,
  Clock,
  CalendarDays,
  Medal,
  Zap,
  Sparkles,
  Star,
  Coins,
  Rocket,
  type LucideIcon,
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: LucideIcon
  action?: string
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Gems Rush',
    description: 'Match elemental gems, chain combos, and climb the realms in this match-3 adventure.',
    icon: Gamepad2,
  },
  {
    id: 'gameplay',
    title: 'How to Play',
    description: 'Swap adjacent gems to create matches of 3 or more. The more gems you match, the higher your score.',
    icon: Gem,
  },
  {
    id: 'modes',
    title: 'Game Modes',
    description: 'Choose from multiple game modes: Classic for endless play, Time Rush for fast-paced action, and Daily Quest for special rewards.',
    icon: Target,
  },
  {
    id: 'combos',
    title: 'Power Combos',
    description: 'Create L-shapes and T-shapes for bomb gems, match 4 in a row for lightning gems, or match 5 for rainbow gems that clear entire colors.',
    icon: Zap,
  },
  {
    id: 'progression',
    title: 'Level Up & Earn Rewards',
    description: 'Gain XP, level up, and unlock new features. Earn coins and gems along the way.',
    icon: Star,
  },
  {
    id: 'ready',
    title: 'Ready to Start?',
    description: 'You\'re all set. Start with Classic Mode to get familiar with the gameplay, then explore other modes as you progress.',
    icon: Rocket,
    action: 'Start Playing',
  },
]

interface UserOnboardingProps {
  isVisible: boolean
  onComplete: () => void
  onSkip: () => void
}

export default function UserOnboarding({ isVisible, onComplete, onSkip }: UserOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleNext = () => {
    if (isAnimating) return

    if (currentStep === onboardingSteps.length - 1) {
      onComplete()
      return
    }

    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, onboardingSteps.length - 1))
      setIsAnimating(false)
    }, 300)
  }

  const handlePrevious = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep(prev => Math.max(prev - 1, 0))
      setIsAnimating(false)
    }, 300)
  }

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0)
    }
  }, [isVisible])

  const currentStepData = onboardingSteps[currentStep]
  const StepIcon = currentStepData.icon

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="card w-full max-w-lg overflow-hidden"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <div className="flex gap-1.5 flex-1 mr-4">
                {onboardingSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      index === currentStep ? 'bg-gold' : index < currentStep ? 'bg-violet' : 'bg-ink-2'
                    }`}
                  />
                ))}
              </div>
              <button onClick={onSkip} className="btn btn-ghost">
                Skip
              </button>
            </div>

            <div className="px-8 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  className="text-center"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex justify-center mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-violet">
                      <StepIcon size={32} />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-fg mb-3">{currentStepData.title}</h2>

                  <p className="text-fg-muted leading-relaxed mb-6">{currentStepData.description}</p>

                  {currentStep === 2 && (
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div className="card bg-ink-2 p-3">
                        <Target className="h-6 w-6 text-good mx-auto mb-1" />
                        <div className="text-fg text-xs font-medium">Classic</div>
                      </div>
                      <div className="card bg-ink-2 p-3">
                        <Clock className="h-6 w-6 text-warn mx-auto mb-1" />
                        <div className="text-fg text-xs font-medium">Time Rush</div>
                      </div>
                      <div className="card bg-ink-2 p-3">
                        <CalendarDays className="h-6 w-6 text-violet mx-auto mb-1" />
                        <div className="text-fg text-xs font-medium">Daily Quest</div>
                      </div>
                      <div className="card bg-ink-2 p-3">
                        <Medal className="h-6 w-6 text-gold mx-auto mb-1" />
                        <div className="text-fg text-xs font-medium">Campaign</div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="flex justify-center gap-3 mb-2 text-violet">
                      <Sparkles className="h-7 w-7" />
                      <Zap className="h-7 w-7" />
                      <Star className="h-7 w-7" />
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="flex justify-center gap-2 mb-2">
                      <span className="chip"><Coins size={14} className="text-gold" /> Coins</span>
                      <span className="chip"><Gem size={14} className="text-violet" /> Gems</span>
                      <span className="chip"><Star size={14} className="text-gold" /> XP</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-between items-center px-8 pb-8">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0 || isAnimating}
                className="btn btn-ghost"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button onClick={handleNext} disabled={isAnimating} className="btn btn-primary">
                {currentStepData.action || 'Next'}
                {!currentStepData.action && <ArrowRight size={16} />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
