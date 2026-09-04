'use client'

import React, { useState, useEffect } from 'react'
import { X, TrendingUp, Trophy, Coins, Zap, Star, Target, Clock, Award, BarChart3 } from 'lucide-react'
import { statisticsManager } from '@/lib/statistics/StatisticsManager'
import { GameStatistics, PerformanceStats, ProgressionStats, CurrencyStats, MatchStatistics } from '@/types/statistics'

interface StatisticsModalProps {
  isOpen: boolean
  onClose: () => void
}

const TABS = [
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'progression', label: 'Progression', icon: Trophy },
  { id: 'currency', label: 'Currency', icon: Coins },
  { id: 'matches', label: 'Match Analytics', icon: Zap }
] as const

const StatisticsModal: React.FC<StatisticsModalProps> = ({ isOpen, onClose }) => {
  const [statistics, setStatistics] = useState<GameStatistics | null>(null)
  const [activeTab, setActiveTab] = useState<'performance' | 'progression' | 'currency' | 'matches'>('performance')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadStatistics()
    }
  }, [isOpen])

  const loadStatistics = async () => {
    setIsLoading(true)
    try {
      await statisticsManager.initialize()
      const stats = statisticsManager.getStatistics()
      setStatistics(stats)
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="bg-surface-2 rounded-lg h-9 w-9 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-violet" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-fg">Statistics & Progress</h2>
              <p className="text-sm text-fg-muted">Track your journey</p>
            </div>
          </div>
          <button onClick={handleClose} className="btn btn-icon btn-ghost" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line px-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-fg bg-surface-2 border-b-2 border-violet'
                  : 'text-fg-muted hover:text-fg hover:bg-surface-2/60'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-line-strong border-t-violet" />
            </div>
          ) : statistics ? (
            <>
              {activeTab === 'performance' && <PerformanceTab stats={statistics.performance} />}
              {activeTab === 'progression' && <ProgressionTab stats={statistics.progression} />}
              {activeTab === 'currency' && <CurrencyTab stats={statistics.currency} />}
              {activeTab === 'matches' && <MatchesTab stats={statistics.matches} />}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-fg-muted">Failed to load statistics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SectionHeading: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim mb-3 flex items-center gap-2">
    {icon}
    {children}
  </h3>
)

const DetailRow: React.FC<{ label: string; value: React.ReactNode; valueClass?: string }> = ({ label, value, valueClass = 'text-fg' }) => (
  <div className="flex justify-between py-2.5">
    <span className="text-fg-muted text-sm">{label}</span>
    <span className={`font-medium tabular-nums ${valueClass}`}>{value}</span>
  </div>
)

const ProgressBar: React.FC<{ percent: number }> = ({ percent }) => (
  <div className="w-full bg-ink-2 rounded-full h-1.5">
    <div className="bg-violet h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(percent, 100)}%` }} />
  </div>
)

// Performance Tab Component
const PerformanceTab: React.FC<{ stats: PerformanceStats }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Games Played" value={stats.gamesPlayed} icon={<Target className="w-5 h-5" />} variant="count" />
        <StatCard title="Win Rate" value={`${(stats.winRate * 100).toFixed(1)}%`} icon={<Trophy className="w-5 h-5" />} variant="rate" />
        <StatCard title="Best Score" value={stats.bestScore.toLocaleString()} icon={<Star className="w-5 h-5" />} variant="score" />
        <StatCard title="Current Streak" value={stats.currentWinStreak} icon={<Zap className="w-5 h-5" />} variant="count" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-ink-2 p-4">
          <SectionHeading icon={<TrendingUp className="w-4 h-4" />}>Score Statistics</SectionHeading>
          <div className="divide-y divide-line">
            <DetailRow label="Total Score" value={stats.totalScore.toLocaleString()} />
            <DetailRow label="Average Score" value={Math.round(stats.averageScore).toLocaleString()} />
            <DetailRow label="Best Score" value={stats.bestScore.toLocaleString()} valueClass="text-gold" />
          </div>
        </div>

        <div className="card bg-ink-2 p-4">
          <SectionHeading icon={<Clock className="w-4 h-4" />}>Time & Efficiency</SectionHeading>
          <div className="divide-y divide-line">
            <DetailRow label="Fastest Level" value={`${stats.fastestLevel}s`} />
            <DetailRow label="Average Time" value={`${Math.round(stats.averageLevelTime)}s`} />
            <DetailRow label="Best Moves" value={stats.bestMovesPerLevel} valueClass="text-violet" />
          </div>
        </div>
      </div>

      <div className="card bg-ink-2 p-4">
        <SectionHeading icon={<Zap className="w-4 h-4" />}>Streaks & Records</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-fg-muted text-sm">Current Win Streak</span>
              <span className="stat-value text-violet">{stats.currentWinStreak}</span>
            </div>
            <ProgressBar percent={(stats.currentWinStreak / stats.bestWinStreak) * 100} />
            <p className="text-xs text-fg-dim mt-1">Best: {stats.bestWinStreak}</p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-fg-muted text-sm">Play Streak</span>
              <span className="stat-value text-violet">{stats.currentPlayStreak}</span>
            </div>
            <ProgressBar percent={(stats.currentPlayStreak / stats.bestPlayStreak) * 100} />
            <p className="text-xs text-fg-dim mt-1">Best: {stats.bestPlayStreak}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Progression Tab Component
const ProgressionTab: React.FC<{ stats: ProgressionStats }> = ({ stats }) => {
  const achievementsUnlocked = stats.achievements.filter(a => a.isUnlocked).length

  return (
    <div className="space-y-6">
      <div className="card bg-ink-2 p-4">
        <SectionHeading icon={<Trophy className="w-4 h-4" />}>Campaign Progress</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="stat-value text-gold">{stats.campaignProgress.currentWorld}</div>
            <div className="text-fg-muted text-sm">Current World</div>
          </div>
          <div className="text-center">
            <div className="stat-value text-fg">{stats.campaignProgress.currentLevel}</div>
            <div className="text-fg-muted text-sm">Current Level</div>
          </div>
          <div className="text-center">
            <div className="stat-value text-fg">{stats.levelsCompleted}</div>
            <div className="text-fg-muted text-sm">Levels Completed</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm text-fg-muted mb-2">
            <span>Overall Progress</span>
            <span>{stats.levelsCompleted}/{stats.totalLevels}</span>
          </div>
          <ProgressBar percent={(stats.levelsCompleted / stats.totalLevels) * 100} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-ink-2 p-4">
          <SectionHeading icon={<Star className="w-4 h-4" />}>Star Collection</SectionHeading>
          <div className="text-center mb-3">
            <div className="text-3xl font-bold tabular-nums text-gold">{stats.totalStars}</div>
            <div className="text-fg-muted text-sm">Total Stars</div>
          </div>
          <ProgressBar percent={(stats.totalStars / stats.maxStars) * 100} />
          <p className="text-xs text-fg-dim mt-2 text-center">{stats.totalStars}/{stats.maxStars} stars collected</p>
        </div>

        <div className="card bg-ink-2 p-4">
          <SectionHeading icon={<Award className="w-4 h-4" />}>Achievements</SectionHeading>
          <div className="text-center mb-3">
            <div className="text-3xl font-bold tabular-nums text-violet">{achievementsUnlocked}</div>
            <div className="text-fg-muted text-sm">Unlocked</div>
          </div>
          <ProgressBar percent={(achievementsUnlocked / stats.achievements.length) * 100} />
          <p className="text-xs text-fg-dim mt-2 text-center">
            {achievementsUnlocked}/{stats.achievements.length} achievements
          </p>
        </div>
      </div>
    </div>
  )
}

// Currency Tab Component
const CurrencyTab: React.FC<{ stats: CurrencyStats }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Divine Essence"
          value={stats.divineEssence.toLocaleString()}
          icon={<Coins className="w-5 h-5" />}
          variant="score"
          subtitle={`+${stats.totalEssenceEarned.toLocaleString()} earned`}
        />
        <StatCard
          title="Gems"
          value={stats.gems.toLocaleString()}
          icon={<Star className="w-5 h-5" />}
          variant="score"
          subtitle={`+${stats.totalGemsEarned.toLocaleString()} earned`}
        />
        <StatCard
          title="Player Level"
          value={stats.level}
          icon={<Trophy className="w-5 h-5" />}
          variant="count"
          subtitle={`${stats.experience}/${stats.experienceToNext} XP`}
        />
      </div>

      <div className="card bg-ink-2 p-4">
        <SectionHeading icon={<TrendingUp className="w-4 h-4" />}>Experience Progress</SectionHeading>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-fg-muted mb-2">
            <span>Level {stats.level}</span>
            <span>Level {stats.level + 1}</span>
          </div>
          <ProgressBar percent={(stats.experience / stats.experienceToNext) * 100} />
          <p className="text-xs text-fg-dim mt-2">
            {stats.experience.toLocaleString()} / {stats.experienceToNext.toLocaleString()} XP
          </p>
        </div>
        <div className="text-center">
          <div className="stat-value text-fg">{stats.totalExperience.toLocaleString()}</div>
          <div className="text-fg-muted text-sm">Total Experience Earned</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-ink-2 p-4">
          <SectionHeading icon={<Coins className="w-4 h-4" />}>Divine Essence</SectionHeading>
          <div className="divide-y divide-line">
            <DetailRow label="Current Balance" value={stats.divineEssence.toLocaleString()} valueClass="text-gold" />
            <DetailRow label="Total Earned" value={stats.totalEssenceEarned.toLocaleString()} valueClass="text-good" />
            <DetailRow label="Total Spent" value={stats.totalEssenceSpent.toLocaleString()} valueClass="text-bad" />
          </div>
        </div>

        <div className="card bg-ink-2 p-4">
          <SectionHeading icon={<Star className="w-4 h-4" />}>Premium Gems</SectionHeading>
          <div className="divide-y divide-line">
            <DetailRow label="Current Balance" value={stats.gems.toLocaleString()} valueClass="text-gold" />
            <DetailRow label="Total Earned" value={stats.totalGemsEarned.toLocaleString()} valueClass="text-good" />
            <DetailRow label="Total Purchased" value={stats.totalGemsPurchased.toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Matches Tab Component
const MatchesTab: React.FC<{ stats: MatchStatistics }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Matches" value={stats.totalMatches.toLocaleString()} icon={<Zap className="w-5 h-5" />} variant="count" />
        <StatCard title="Best Combo" value={stats.combos.bestCombo} icon={<Star className="w-5 h-5" />} variant="score" />
        <StatCard title="Total Combos" value={stats.combos.totalCombos.toLocaleString()} icon={<TrendingUp className="w-5 h-5" />} variant="count" />
        <StatCard title="Cascades" value={stats.cascades.totalCascades.toLocaleString()} icon={<Target className="w-5 h-5" />} variant="count" />
      </div>

      <div className="card bg-ink-2 p-4">
        <SectionHeading icon={<BarChart3 className="w-4 h-4" />}>Match Size Distribution</SectionHeading>
        <div className="space-y-3">
          {Object.entries(stats.matchesBySize).map(([size, count]) => (
            <div key={size} className="flex items-center justify-between">
              <span className="text-fg-muted text-sm">{size}-match:</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1">
                  <ProgressBar percent={(count / stats.totalMatches) * 100} />
                </div>
                <span className="text-fg font-medium tabular-nums w-16 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card bg-ink-2 p-4">
          <SectionHeading icon={<Star className="w-4 h-4" />}>Combo Statistics</SectionHeading>
          <div className="divide-y divide-line">
            <DetailRow label="Total Combos" value={stats.combos.totalCombos.toLocaleString()} />
            <DetailRow label="Best Combo" value={stats.combos.bestCombo} valueClass="text-gold" />
            <DetailRow label="Average Combo" value={stats.combos.averageCombo.toFixed(1)} valueClass="text-violet" />
          </div>
        </div>

        <div className="card bg-ink-2 p-4">
          <SectionHeading icon={<TrendingUp className="w-4 h-4" />}>Cascade Statistics</SectionHeading>
          <div className="divide-y divide-line">
            <DetailRow label="Total Cascades" value={stats.cascades.totalCascades.toLocaleString()} />
            <DetailRow label="Best Cascade" value={stats.cascades.bestCascade} valueClass="text-violet" />
            <DetailRow label="Average Score" value={Math.round(stats.cascades.averageCascadeScore).toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Reusable Stat Card Component
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  variant: 'score' | 'count' | 'rate'
  subtitle?: string
}

const VALUE_COLOR: Record<StatCardProps['variant'], string> = {
  score: 'text-gold',
  count: 'text-fg',
  rate: 'text-violet'
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, variant, subtitle }) => {
  return (
    <div className="card bg-ink-2 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label">{title}</span>
        <span className="text-fg-dim">{icon}</span>
      </div>
      <div className={`stat-value ${VALUE_COLOR[variant]}`}>{value}</div>
      {subtitle && <div className="text-xs text-fg-dim mt-1">{subtitle}</div>}
    </div>
  )
}

export default StatisticsModal
