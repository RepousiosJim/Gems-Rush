'use client'

import React from 'react'
import { TrendingUp, Trophy, Coins, Star, Target, BarChart3 } from 'lucide-react'
import { Modal } from './Modal'

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

const StatisticsModal: React.FC<StatisticsModalProps> = ({ isOpen, onClose, stats }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Statistics & Progress" subtitle="Track your journey" icon={BarChart3} size="lg">
    <div className="space-y-6">
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
  </Modal>
)

export default StatisticsModal
