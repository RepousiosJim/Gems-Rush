'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Crown, Lock, Star, Coins, Gem } from 'lucide-react'
import { stageSystem, Stage } from '@/lib/game/StageSystem'

interface StageSelectScreenProps {
  onStageSelect: (stageNumber: number) => void
  onBackToMenu: () => void
}

export default function StageSelectScreen({ onStageSelect, onBackToMenu }: StageSelectScreenProps) {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null)
  const allStages = stageSystem.getAllStages()
  const stageProgress = stageSystem.getProgress()

  const handleStageClick = (stage: Stage) => {
    if (stageSystem.isStageUnlocked(stage.id)) {
      setSelectedStage(stage)
    }
  }

  const handlePlayStage = () => {
    if (selectedStage) {
      onStageSelect(selectedStage.id)
    }
  }

  const renderStageCard = (stage: Stage) => {
    const isUnlocked = stageSystem.isStageUnlocked(stage.id)
    const isCompleted = stageSystem.isStageCompleted(stage.id)
    const stars = stageSystem.getStageStars(stage.id)
    const isCurrent = stageProgress.currentStage === stage.id
    const isSelected = selectedStage?.id === stage.id

    return (
      <button
        key={stage.id}
        type="button"
        onClick={() => handleStageClick(stage)}
        disabled={!isUnlocked}
        className={`card relative p-4 text-left transition-colors ${
          isUnlocked
            ? isSelected
              ? 'border-gold'
              : 'hover:border-line-strong'
            : 'opacity-60 cursor-not-allowed'
        } ${stage.isBoss ? 'border-bad' : ''}`}
      >
        <div className="text-center mb-2">
          <div className={`text-2xl font-bold ${stage.isBoss ? 'text-bad' : isCompleted ? 'text-good' : 'text-fg'}`}>
            {stage.id}
          </div>
          {stage.isBoss && <div className="text-xs text-bad font-semibold">BOSS</div>}
        </div>

        <div className="flex justify-center mb-3 text-violet">
          {isUnlocked ? <Gem size={32} /> : <Lock size={32} className="text-fg-dim" />}
        </div>

        <div className="text-center mb-2">
          <div className="text-sm font-semibold text-fg truncate">{stage.name}</div>
        </div>

        {isCompleted && (
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3].map(starNum => (
              <Star
                key={starNum}
                size={16}
                className={starNum <= stars ? 'text-gold fill-gold' : 'text-fg-dim'}
              />
            ))}
          </div>
        )}

        {isCurrent && isUnlocked && (
          <div className="absolute -top-2 -right-2 chip bg-violet text-ink-on-gold border-0 h-6 px-2 text-xs">
            Current
          </div>
        )}

        <div className="chip absolute bottom-2 left-2 h-6 px-2 text-xs">
          {stage.difficulty}
        </div>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-ink page-glow p-4">
      <motion.div
        className="flex items-center justify-between mb-6 h-14 px-2"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button onClick={onBackToMenu} className="btn btn-icon btn-ghost">
          <ArrowLeft size={20} />
        </button>

        <div className="text-center">
          <h1 className="text-xl font-bold text-fg">Stages</h1>
          <div className="text-sm text-fg-muted">
            {stageProgress.completedStages.length}/{allStages.length} completed
          </div>
        </div>

        <div className="chip">
          <Star size={14} className="text-gold" />
          {stageProgress.totalStars}
        </div>
      </motion.div>

      <div className="flex gap-6">
        <div className="flex-1">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            {allStages.map(stage => renderStageCard(stage))}
          </motion.div>
        </div>

        <AnimatePresence>
          {selectedStage && (
            <motion.div
              className="card w-96 p-6 h-fit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-fg mb-1">{selectedStage.name}</h2>
                {selectedStage.isBoss && (
                  <div className="chip mx-auto w-fit text-bad border-bad">
                    <Crown size={14} /> Boss Stage
                  </div>
                )}
              </div>

              <p className="text-sm text-fg-muted leading-relaxed mb-4">{selectedStage.description}</p>

              <div className="mb-6 space-y-2">
                <div className="text-sm font-semibold text-fg-dim uppercase tracking-wider mb-1">Objectives</div>

                <div className="flex justify-between items-center card bg-ink-2 p-3">
                  <span className="text-fg-muted text-sm">Target</span>
                  <span className="text-gold font-bold tabular-nums">{selectedStage.targetScore.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center card bg-ink-2 p-3">
                  <span className="text-fg-muted text-sm">Max Moves</span>
                  <span className="text-violet font-bold tabular-nums">{selectedStage.maxMoves}</span>
                </div>

                <div className="flex justify-between items-center card bg-ink-2 p-3">
                  <span className="text-fg-muted text-sm">Blocks to Break</span>
                  <span className="text-good font-bold tabular-nums">{selectedStage.blocksToBreak}</span>
                </div>

                {selectedStage.specialObjectives && (
                  <div className="card bg-ink-2 p-3">
                    <div className="text-violet font-semibold text-sm mb-1">Special</div>
                    {selectedStage.specialObjectives.greenBlocks && (
                      <div className="text-sm text-fg-muted">
                        Destroy {selectedStage.specialObjectives.greenBlocks} green blocks
                      </div>
                    )}
                    {selectedStage.specialObjectives.blueBlocks && (
                      <div className="text-sm text-fg-muted">
                        Destroy {selectedStage.specialObjectives.blueBlocks} blue blocks
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="text-sm font-semibold text-fg-dim uppercase tracking-wider mb-2">Rewards</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="card bg-ink-2 p-2 text-center">
                    <div className="text-gold font-bold flex items-center justify-center gap-1">
                      <Coins size={14} /> {selectedStage.rewards.coins}
                    </div>
                    <div className="text-fg-muted text-xs">Coins</div>
                  </div>
                  <div className="card bg-ink-2 p-2 text-center">
                    <div className="text-violet font-bold flex items-center justify-center gap-1">
                      <Gem size={14} /> {selectedStage.rewards.gems}
                    </div>
                    <div className="text-fg-muted text-xs">Gems</div>
                  </div>
                  <div className="card bg-ink-2 p-2 text-center">
                    <div className="text-fg font-bold">{selectedStage.rewards.xp}</div>
                    <div className="text-fg-muted text-xs">XP</div>
                  </div>
                  <div className="card bg-ink-2 p-2 text-center">
                    <div className="text-gold font-bold flex items-center justify-center gap-1">
                      <Star size={14} /> 3
                    </div>
                    <div className="text-fg-muted text-xs">Stars</div>
                  </div>
                </div>
              </div>

              {stageSystem.isStageCompleted(selectedStage.id) && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-fg-dim uppercase tracking-wider mb-2">Best Performance</div>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3].map(starNum => (
                      <Star
                        key={starNum}
                        size={20}
                        className={starNum <= stageSystem.getStageStars(selectedStage.id) ? 'text-gold fill-gold' : 'text-fg-dim'}
                      />
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handlePlayStage}
                disabled={!stageSystem.isStageUnlocked(selectedStage.id)}
                className="btn btn-primary w-full"
              >
                {stageSystem.isStageUnlocked(selectedStage.id) ? 'Play Stage' : (
                  <>
                    <Lock size={16} /> Locked
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
