'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GemIcon from './GemIcon'
import { GEM_COLOR_NAMES } from '@/lib/game/goals'
import type { GemType } from '@/types/game'
import {
  X,
  Target,
  Gamepad2,
  Zap,
  Sparkles,
  Bomb,
  Clock,
  CalendarDays,
  Swords,
  Users,
  type LucideIcon,
} from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon: LucideIcon
  subtitle?: string
  children: React.ReactNode
  size?: 'md' | 'lg'
  // Tabbed dialogs keep one height on mobile so the tab row stays put
  fill?: boolean
}

export function Modal({ isOpen, onClose, title, icon: Icon, subtitle, children, size = 'md', fill }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      firstElement?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const sizeClass = size === 'lg' ? 'max-w-3xl' : 'max-w-lg'

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 backdrop-blur-sm sm:items-start sm:p-4 sm:pt-[8vh]"
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className={`card w-full ${sizeClass} max-h-[85dvh] overflow-hidden flex flex-col rounded-b-none border-b-0 sm:max-h-[calc(100dvh-8vh-1rem)] sm:rounded-b-2xl sm:border-b ${fill ? 'h-[85dvh] sm:h-auto' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2">
                  <Icon size={18} className="text-fg" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-fg">{title}</h2>
                  {subtitle && <p className="text-sm text-fg-muted">{subtitle}</p>}
                </div>
              </div>
              <button onClick={onClose} className="btn btn-icon btn-ghost" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ModalTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly { id: T; label: string; icon: LucideIcon }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="-mx-6 flex overflow-x-auto border-b border-line px-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm sm:px-4 font-medium transition-colors ${
            active === tab.id
              ? 'border-violet bg-surface-2 text-fg'
              : 'border-transparent text-fg-muted hover:bg-surface-2/60 hover:text-fg'
          }`}
        >
          <tab.icon size={16} />
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// Game Guide Modal Component
export function GameGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'basics' | 'gems' | 'powerups' | 'modes'>('basics')

  const tabs = [
    { id: 'basics', label: 'Basics', icon: Target },
    { id: 'gems', label: 'Tiles', icon: Sparkles },
    { id: 'powerups', label: 'Power-ups', icon: Zap },
    { id: 'modes', label: 'Game Modes', icon: Gamepad2 },
  ] as const

  const powerups = [
    { name: 'Lightning', icon: Zap, desc: 'Made by a straight line of 4. Clears its whole row and column.' },
    { name: 'Rainbow', icon: Sparkles, desc: 'Made by a straight line of 5. Clears every gem of the color it is swapped with.' },
    { name: 'Bomb', icon: Bomb, desc: 'Made by a straight line of 6 or more. Clears the 3x3 area around it.' },
  ]

  const modes = [
    { name: 'Classic', icon: Target, desc: 'Levels with a move limit. Reach the goal, a score or a set number of gems per color, before the moves run out.' },
    { name: 'Time Rush', icon: Clock, desc: 'Score as many points as you can in 60 seconds.' },
    { name: 'Daily Quest', icon: CalendarDays, desc: 'One round a day. Reach the target score; no move limit.' },
    { name: 'Divine Conquest', icon: Swords, desc: 'Locked.' },
    { name: 'Multiplayer', icon: Users, desc: 'Locked.' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Game Guide" icon={Target} size="lg" fill>
      <div className="flex flex-col gap-5">
        <ModalTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        <div>
          {activeTab === 'basics' && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Game Basics</h3>
              <div>
                <h4 className="text-base font-semibold text-fg mb-2 flex items-center gap-2">
                  <Target size={18} /> Objective
                </h4>
                <p className="text-fg-muted">
                  Match 3 or more identical gems in a row or column to clear them and score points. In Classic, reach the level goal before the moves run out.
                </p>
              </div>
              <div>
                <h4 className="text-base font-semibold text-fg mb-2 flex items-center gap-2">
                  <Gamepad2 size={18} /> How to Play
                </h4>
                <ul className="text-fg-muted space-y-2 list-disc list-inside">
                  <li>Click on a gem to select it</li>
                  <li>Click on an adjacent gem to swap their positions</li>
                  <li>Swaps are only allowed if they create a match of 3+ gems</li>
                  <li>When gems are matched, they disappear and new gems fall down</li>
                  <li>Chain reactions create combo multipliers for bonus points</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'gems' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Gem tiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(GEM_COLOR_NAMES) as GemType[]).map((type) => (
                  <div key={type} className="card bg-ink-2 p-4 flex items-center gap-3">
                    <GemIcon type={type} size={32} />
                    <h4 className="font-semibold text-fg capitalize">{GEM_COLOR_NAMES[type]}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'powerups' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Power-ups</h3>
              <div className="divide-y divide-line">
                {powerups.map((p) => {
                  const PIcon = p.icon
                  return (
                    <div key={p.name} className="flex items-start gap-3 py-3">
                      <PIcon size={20} className="text-violet mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-fg">{p.name}</h4>
                        <p className="text-fg-muted text-sm">{p.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-fg-muted text-sm">
                Swap a power-up with a neighboring gem to set it off. When no move is left, the board reshuffles by itself. Moves left when a level is won set off random power-ups.
              </p>
            </div>
          )}

          {activeTab === 'modes' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Game Modes</h3>
              <div className="divide-y divide-line">
                {modes.map((m) => {
                  const MIcon = m.icon
                  return (
                    <div key={m.name} className="flex items-start gap-3 py-3">
                      <MIcon size={20} className="text-violet mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-fg">{m.name}</h4>
                        <p className="text-fg-muted text-sm">{m.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

// Credits Modal Component
export function CreditsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const sections = [
    {
      title: 'Game Development',
      icon: Gamepad2,
      rows: [
        ['Game Design', 'Gemelon Studios'],
        ['Programming', 'Next.js & TypeScript'],
        ['UI/UX Design', 'Tailwind CSS & Framer Motion'],
        ['Game Engine', 'Custom Match-3 Engine'],
      ],
    },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Credits" icon={Users}>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-fg mb-1">Gems Rush</h3>
        </div>

        {sections.map((section) => {
          const SectionIcon = section.icon
          return (
            <div key={section.title} className="card bg-ink-2 p-5">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-fg-dim mb-3 flex items-center gap-2">
                <SectionIcon size={16} /> {section.title}
              </h4>
              <div className="divide-y divide-line">
                {section.rows.map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 text-sm">
                    <span className="text-fg-muted">{label}</span>
                    <span className="text-fg font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="border-t border-line pt-4 text-center">
          <p className="text-sm text-fg-dim">Version 1.0.0 &middot; &copy; 2026 Gemelon Studios</p>
        </div>
      </div>
    </Modal>
  )
}
