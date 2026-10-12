'use client'

import {
  Crown,
  Coins,
  Gem,
  Zap,
  Flame,
  BarChart3,
  CircleHelp,
  Settings,
  Star,
  CalendarDays,
  Timer,
  Map,
  Users,
  Lock,
} from 'lucide-react'

interface EnhancedMainMenuProps {
  onModeSelect: (mode: string) => void
  onShowSettings: () => void
  onShowGuide: () => void
  onShowCredits: () => void
  onShowStats: () => void
  onShowDashboard?: () => void
  userLevel?: number
  userXP?: number
  userCoins?: number
  userGems?: number
  dailyChallengeCompleted?: boolean
  streak?: number
  energy: number
  maxEnergy: number
  onRefillEnergy: () => void
  dailyEvent: { name: string; description: string; timeLeft: string } | null
}

interface GameMode {
  id: string
  icon: React.ReactNode
  color: string
  title: string
  subtitle: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
  reward?: number
  locked?: boolean
}

const gameModesData: GameMode[] = [
  {
    id: 'normal',
    icon: <Gem className="h-6 w-6" />,
    color: 'var(--gem-water)',
    title: 'Classic',
    subtitle: 'Timeless match-3 fun',
    description: 'Match elemental gems and chain combos in endless mode.',
    difficulty: 'Easy',
  },
  {
    id: 'timeAttack',
    icon: <Timer className="h-6 w-6" />,
    color: 'var(--gem-fire)',
    title: 'Time Rush',
    subtitle: 'Beat the clock',
    description: 'Race against the timer for the highest score.',
    difficulty: 'Medium',
  },
  {
    id: 'dailyChallenge',
    icon: <CalendarDays className="h-6 w-6" />,
    color: 'var(--gem-nature)',
    title: 'Daily Quest',
    subtitle: 'Fresh challenges',
    description: 'A unique challenge that refreshes every 24 hours.',
    difficulty: 'Hard',
    reward: 100,
  },
  {
    id: 'campaign',
    icon: <Map className="h-6 w-6" />,
    color: 'var(--gem-earth)',
    title: 'Divine Conquest',
    subtitle: 'Epic adventure',
    description: 'A journey through mystical realms.',
    difficulty: 'Expert',
    locked: true,
  },
  {
    id: 'multiplayer',
    icon: <Users className="h-6 w-6" />,
    color: 'var(--gem-lightning)',
    title: 'Multiplayer',
    subtitle: 'Challenge friends',
    description: 'Compete with players from around the world.',
    difficulty: 'Medium',
    locked: true,
  },
]

export default function EnhancedMainMenu({
  onModeSelect,
  onShowSettings,
  onShowGuide,
  onShowStats,
  onShowCredits,
  onShowDashboard,
  userLevel = 1,
  userXP = 0,
  userCoins = 100,
  userGems = 10,
  dailyChallengeCompleted = false,
  streak = 0,
  energy,
  maxEnergy,
  onRefillEnergy,
  dailyEvent,
}: EnhancedMainMenuProps) {
  const energyPct = Math.max(0, Math.min(100, Math.round((energy / maxEnergy) * 100)))

  const handleCardActivate = (mode: GameMode) => {
    if (mode.locked) return
    onModeSelect(mode.id)
  }

  const handleCardKeyDown = (e: React.KeyboardEvent, mode: GameMode) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardActivate(mode)
    }
  }

  return (
    <div className="page-glow relative flex min-h-screen flex-col bg-ink">
      {/* Top bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:h-16 md:px-6 md:py-0">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={onShowDashboard}
            className="card flex items-center gap-3 px-4 py-2 transition-colors hover:border-line-strong"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold">
              <Crown className="h-5 w-5 text-ink-on-gold" />
            </span>
            <span className="text-left">
              <span className="block whitespace-nowrap text-sm font-semibold text-fg">Level {userLevel}</span>
              <span className="block text-xs text-fg-dim tabular-nums">{userXP} XP</span>
            </span>
          </button>

          <div className="chip">
            <Coins className="h-4 w-4 text-gold" />
            <span>{userCoins}</span>
          </div>
          <div className="chip">
            <Gem className="h-4 w-4 text-violet" />
            <span>{userGems}</span>
          </div>

          <button
            onClick={onRefillEnergy}
            className="chip h-auto flex-col items-stretch gap-1 py-1.5"
            aria-label="Energy, click to refill"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-violet" />
              <span>
                {energy}/{maxEnergy}
              </span>
            </span>
            <span className="h-1 w-full overflow-hidden rounded-full bg-ink-2">
              <span className="block h-full bg-violet" style={{ width: `${energyPct}%` }} />
            </span>
          </button>

          {streak > 0 && (
            <div className="chip">
              <Flame className="h-4 w-4 text-gem-fire" />
              <span>{streak}-day streak</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onShowStats} className="btn btn-icon btn-ghost" aria-label="Stats">
            <BarChart3 className="h-5 w-5" />
          </button>
          <button onClick={onShowGuide} className="btn btn-icon btn-ghost" aria-label="Guide">
            <CircleHelp className="h-5 w-5" />
          </button>
          <button onClick={onShowSettings} className="btn btn-icon btn-ghost" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative z-10 mt-14 flex flex-col items-center px-6 text-center">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gold">
          <Gem className="h-7 w-7 text-ink-on-gold" />
        </span>
        <h1 className="text-5xl font-bold tracking-tight text-fg md:text-6xl">Gems Rush</h1>
        <p className="mt-3 text-fg-muted">Match elemental gems. Chain combos. Climb the realms.</p>
      </div>

      {/* Mode grid */}
      <div className="relative z-10 mx-auto mt-12 grid w-full max-w-5xl grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3">
        {gameModesData.map((mode) => (
          <div
            key={mode.id}
            role={mode.locked ? undefined : 'button'}
            tabIndex={mode.locked ? undefined : 0}
            onClick={() => handleCardActivate(mode)}
            onKeyDown={(e) => handleCardKeyDown(e, mode)}
            className={`card flex flex-col gap-4 p-5 transition-all duration-150 ${
              mode.locked
                ? 'cursor-not-allowed opacity-60'
                : 'cursor-pointer hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet'
            }`}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `color-mix(in srgb, ${mode.color} 15%, transparent)`, color: mode.color }}
            >
              {mode.icon}
            </span>

            <div>
              <h3 className="text-lg font-semibold text-fg">{mode.title}</h3>
              <p className="text-sm text-fg-muted">{mode.subtitle}</p>
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-2">
              <span className="chip">{mode.difficulty}</span>
              {mode.reward !== undefined && (
                <span className="chip">
                  <Coins className="h-3.5 w-3.5 text-gold" />+{mode.reward}
                </span>
              )}
              <span
                className={`btn pointer-events-none ml-auto ${
                  mode.locked ? 'btn-secondary' : mode.id === 'normal' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {mode.locked ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Locked
                  </>
                ) : (
                  'Play'
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Daily strip */}
      {!dailyChallengeCompleted && (
        <div className="relative z-10 mx-auto mt-4 w-full max-w-5xl px-6">
          <div className="card flex flex-col gap-3 p-4">
            <div className="flex items-center gap-4">
              <CalendarDays className="h-5 w-5 text-violet" />
              <div className="flex-1">
                <p className="text-sm font-medium text-fg">Daily quest available</p>
                <p className="text-xs text-fg-muted">Fresh challenge every 24h</p>
              </div>
              <button onClick={() => onModeSelect('dailyChallenge')} className="btn btn-secondary">
                Play
              </button>
            </div>

            {dailyEvent && (
              <div className="flex items-center gap-4 border-t border-line pt-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gold">{dailyEvent.name}</p>
                  <p className="text-xs text-fg-muted">{dailyEvent.description}</p>
                </div>
                <span className="chip">{dailyEvent.timeLeft}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 mt-auto flex justify-center gap-3 py-6">
        <button onClick={onShowCredits} className="btn btn-ghost">
          <Star className="h-4 w-4" />
          About
        </button>
      </div>
    </div>
  )
}
