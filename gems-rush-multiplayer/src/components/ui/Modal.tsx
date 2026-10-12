'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Target,
  Gamepad2,
  Flame,
  Droplet,
  Mountain,
  Wind,
  Zap,
  Leaf,
  Sparkles,
  Bomb,
  Rows3,
  Columns3,
  Shuffle,
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
    { id: 'gems', label: 'Gems', icon: Sparkles },
    { id: 'powerups', label: 'Power-ups', icon: Zap },
    { id: 'modes', label: 'Game Modes', icon: Gamepad2 },
  ] as const

  const gems = [
    { name: 'Fire Gem', desc: 'Passion & energy', icon: Flame },
    { name: 'Water Gem', desc: 'Flow & adaptability', icon: Droplet },
    { name: 'Earth Gem', desc: 'Strength & endurance', icon: Mountain },
    { name: 'Air Gem', desc: 'Freedom & movement', icon: Wind },
    { name: 'Lightning Gem', desc: 'Power & speed', icon: Zap },
    { name: 'Nature Gem', desc: 'Growth & harmony', icon: Leaf },
  ]

  const powerups = [
    { name: 'Gem Bomb', icon: Bomb, desc: 'Destroys a 3x3 area around the target. Perfect for clearing difficult areas.' },
    { name: 'Row Blaster', icon: Rows3, desc: 'Clears an entire row of gems instantly. Great for creating space for new combos.' },
    { name: 'Column Crusher', icon: Columns3, desc: 'Eliminates a complete column. Use strategically to set up cascade opportunities.' },
    { name: 'Color Bomb', icon: Sparkles, desc: 'Removes all gems of the selected color from the board. Massive score potential.' },
    { name: 'Shuffle', icon: Shuffle, desc: 'Shuffles the entire board when you’re stuck. New opportunities await.' },
  ]

  const modes = [
    { name: 'Classic', icon: Target, desc: 'No time pressure. Focus on strategy and planning your moves carefully.' },
    { name: 'Time Rush', icon: Clock, desc: 'Race against the clock. Score as many points as possible before time runs out.' },
    { name: 'Daily Quest', icon: CalendarDays, desc: 'New challenges every day with special objectives and limited moves.' },
    { name: 'Divine Conquest', icon: Swords, desc: 'Campaign mode with progressive difficulty and boss battles.' },
    { name: 'Multiplayer', icon: Users, desc: 'Compete head to head against other players.' },
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
                  Match 3 or more identical gems in a row (horizontally or vertically) to clear them from the board and score points. Reach the target score to advance to the next level.
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
              <div>
                <h4 className="text-base font-semibold text-fg mb-2 flex items-center gap-2">
                  <Zap size={18} /> Combo System
                </h4>
                <p className="text-fg-muted">
                  Create chain reactions for large point bonuses. Each cascade increases your combo multiplier, boosting your score.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'gems' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Gems</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gems.map((gem) => {
                  const GemIcon = gem.icon
                  return (
                    <div key={gem.name} className="card bg-ink-2 p-4 flex items-center gap-3">
                      <GemIcon size={24} className="text-violet" />
                      <div>
                        <h4 className="font-semibold text-fg">{gem.name}</h4>
                        <p className="text-sm text-fg-muted">{gem.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'powerups' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Power-ups & Special Effects</h3>
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
    {
      title: 'Technology Stack',
      icon: Sparkles,
      rows: [
        ['Frontend', 'Next.js, React, TypeScript'],
        ['Styling', 'Tailwind CSS'],
        ['Animations', 'Framer Motion'],
        ['Database', 'PostgreSQL with Prisma'],
        ['Real-time', 'Socket.io (coming soon)'],
      ],
    },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Credits" icon={Users}>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-fg mb-1">Gems Rush</h3>
          <p className="text-fg-muted">Match-3 Adventure Game</p>
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
