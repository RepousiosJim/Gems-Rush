'use client'

import React from 'react'
import { X, TrendingUp, Trophy, Coins, Star, Target, BarChart3 } from 'lucide-react'

interface PlayerStats {
  level: number
  xp: number
  coins: number
  gems: number
  streak: number
  gamesPlayed: number
  gamesWon: number
  bestScore: number
  totalScore: number
  averageScore: number
  bestTimeRushScore: number
}

interface StatisticsModalProps {
  isOpen: boolean
  onClose: () => void
  stats: PlayerStats
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

const StatCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; valueClass: string }> = ({ title, value, icon, valueClass }) => (
  <div className="card bg-ink-2 p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="stat-label">{title}</span>
      <span className="text-fg-dim">{icon}</span>
    </div>
    <div className={`stat-value ${valueClass}`}>{value}</div>
  </div>
)

const StatisticsModal: React.FC<StatisticsModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
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
          <button onClick={onClose} className="btn btn-icon btn-ghost" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Games Played" value={stats.gamesPlayed} icon={<Target className="w-5 h-5" />} valueClass="text-fg" />
            <StatCard title="Wins" value={stats.gamesWon} icon={<Trophy className="w-5 h-5" />} valueClass="text-fg" />
            <StatCard title="Best Score" value={stats.bestScore.toLocaleString()} icon={<Star className="w-5 h-5" />} valueClass="text-gold" />
            <StatCard title="Level" value={stats.level} icon={<TrendingUp className="w-5 h-5" />} valueClass="text-violet" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card bg-ink-2 p-4">
              <SectionHeading icon={<TrendingUp className="w-4 h-4" />}>Scores</SectionHeading>
              <div className="divide-y divide-line">
                <DetailRow label="Total Score" value={stats.totalScore.toLocaleString()} />
                <DetailRow label="Average Score" value={stats.averageScore.toLocaleString()} />
                <DetailRow label="Best Time Rush" value={stats.bestTimeRushScore.toLocaleString()} valueClass="text-gold" />
              </div>
            </div>

            <div className="card bg-ink-2 p-4">
              <SectionHeading icon={<Coins className="w-4 h-4" />}>Progress</SectionHeading>
              <div className="divide-y divide-line">
                <DetailRow label="XP" value={stats.xp.toLocaleString()} valueClass="text-violet" />
                <DetailRow label="Coins" value={stats.coins.toLocaleString()} valueClass="text-gold" />
                <DetailRow label="Gems" value={stats.gems.toLocaleString()} valueClass="text-gold" />
                <DetailRow label="Daily Streak" value={`${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatisticsModal
