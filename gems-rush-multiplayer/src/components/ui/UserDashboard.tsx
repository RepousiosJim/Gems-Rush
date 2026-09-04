'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Star,
  TrendingUp,
  Calendar,
  Award,
  Target,
  Clock,
  Flame,
  Crown,
  Edit3,
  X,
  Check,
  Coins,
  Gem,
  Lock,
  User
} from 'lucide-react'

interface UserStats {
  level: number
  xp: number
  coins: number
  gems: number
  streak: number
  gamesPlayed: number
  totalScore: number
  averageScore: number
  bestScore: number
  dailyChallengeCompleted: boolean
  achievements: Achievement[]
  favoriteMode: string
  totalPlayTime: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum'
  unlockedAt?: Date
  progress?: number
  maxProgress?: number
}

interface UserDashboardProps {
  isVisible: boolean
  onClose: () => void
  userStats: UserStats
  onUpdateProfile: (updates: Partial<UserStats>) => void
}

const ACHIEVEMENT_ICONS: Record<string, typeof Target> = {
  'first-match': Target,
  'score-master': Trophy,
  'streak-warrior': Flame,
  'gem-collector': Gem
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'statistics', label: 'Statistics', icon: TrendingUp }
] as const

export default function UserDashboard({
  isVisible,
  onClose,
  userStats,
  onUpdateProfile
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'statistics'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [editingStats, setEditingStats] = useState(userStats)

  useEffect(() => {
    setEditingStats(userStats)
  }, [userStats])

  const handleSaveProfile = () => {
    onUpdateProfile(editingStats)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditingStats(userStats)
    setIsEditing(false)
  }

  const xpToNextLevel = (level: number) => {
    return level * 1000
  }

  const currentLevelXP = userStats.xp % xpToNextLevel(userStats.level)
  const xpNeeded = xpToNextLevel(userStats.level)
  const progressPercentage = (currentLevelXP / xpNeeded) * 100

  const mockAchievements: Achievement[] = [
    {
      id: 'first-match',
      name: 'First Steps',
      description: 'Complete your first match',
      icon: 'first-match',
      rarity: 'bronze',
      unlockedAt: new Date()
    },
    {
      id: 'score-master',
      name: 'Score Master',
      description: 'Reach 10,000 points in a single game',
      icon: 'score-master',
      rarity: 'gold',
      progress: userStats.bestScore,
      maxProgress: 10000
    },
    {
      id: 'streak-warrior',
      name: 'Streak Warrior',
      description: 'Maintain a 7-day play streak',
      icon: 'streak-warrior',
      rarity: 'silver',
      progress: userStats.streak,
      maxProgress: 7
    },
    {
      id: 'gem-collector',
      name: 'Gem Collector',
      description: 'Collect 1000 gems',
      icon: 'gem-collector',
      rarity: 'platinum',
      progress: userStats.gems,
      maxProgress: 1000
    }
  ]

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="bg-surface-2 rounded-lg h-9 w-9 flex items-center justify-center">
                <Crown className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg">Player Dashboard</h2>
                <p className="text-sm text-fg-muted">Level {userStats.level} profile</p>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-icon btn-ghost" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Profile summary */}
            <div className="card bg-ink-2 p-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center">
                    <Crown className="w-8 h-8 text-ink-on-gold" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet rounded-full flex items-center justify-center text-fg text-xs font-bold">
                    {userStats.level}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-fg">Level {userStats.level}</h3>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <button onClick={handleSaveProfile} className="btn btn-icon btn-ghost h-8 w-8 text-good">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleCancelEdit} className="btn btn-icon btn-ghost h-8 w-8 text-bad">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="btn btn-icon btn-ghost h-8 w-8">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between text-xs text-fg-muted mb-1">
                    <span>{currentLevelXP.toLocaleString()} XP</span>
                    <span>{xpNeeded.toLocaleString()} XP</span>
                  </div>
                  <div className="w-full bg-ink rounded-full h-1.5">
                    <motion.div
                      className="bg-violet h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card bg-ink-2 p-4">
                <div className="stat-label mb-1">Coins</div>
                <div className="stat-value text-gold">{userStats.coins.toLocaleString()}</div>
              </div>
              <div className="card bg-ink-2 p-4">
                <div className="stat-label mb-1">Gems</div>
                <div className="stat-value text-gold">{userStats.gems}</div>
              </div>
              <div className="card bg-ink-2 p-4">
                <div className="stat-label mb-1">Streak</div>
                <div className="stat-value text-violet">{userStats.streak}</div>
              </div>
              <div className="card bg-ink-2 p-4">
                <div className="stat-label mb-1">Games</div>
                <div className="stat-value text-fg">{userStats.gamesPlayed}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-line -mx-6 px-6">
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

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="card bg-ink-2 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Recent Activity
                    </h3>
                    <div className="divide-y divide-line">
                      <div className="flex items-center gap-3 py-3">
                        <div className="w-10 h-10 bg-surface-2 rounded-lg flex items-center justify-center shrink-0">
                          <Trophy className="w-5 h-5 text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-fg font-medium text-sm">High score achieved</div>
                          <div className="text-fg-muted text-xs">Scored {userStats.bestScore.toLocaleString()} points</div>
                        </div>
                        <div className="text-fg-dim text-xs shrink-0">Today</div>
                      </div>

                      <div className="flex items-center gap-3 py-3">
                        <div className="w-10 h-10 bg-surface-2 rounded-lg flex items-center justify-center shrink-0">
                          <Flame className="w-5 h-5 text-violet" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-fg font-medium text-sm">{userStats.streak} day streak</div>
                          <div className="text-fg-muted text-xs">Keep it up</div>
                        </div>
                        <div className="text-fg-dim text-xs shrink-0">Active</div>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-ink-2 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button className="card bg-surface-2 p-4 text-center text-fg hover:border-line-strong transition-colors">
                        <Star className="w-6 h-6 mx-auto mb-2 text-gold" />
                        <div className="text-sm font-medium">Daily Challenge</div>
                      </button>
                      <button className="card bg-surface-2 p-4 text-center text-fg hover:border-line-strong transition-colors">
                        <Trophy className="w-6 h-6 mx-auto mb-2 text-gold" />
                        <div className="text-sm font-medium">Leaderboard</div>
                      </button>
                      <button className="card bg-surface-2 p-4 text-center text-fg hover:border-line-strong transition-colors">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-violet" />
                        <div className="text-sm font-medium">Time Attack</div>
                      </button>
                      <button className="card bg-surface-2 p-4 text-center text-fg hover:border-line-strong transition-colors">
                        <Crown className="w-6 h-6 mx-auto mb-2 text-violet" />
                        <div className="text-sm font-medium">Campaign</div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'achievements' && (
                <motion.div
                  key="achievements"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {mockAchievements.map(achievement => {
                    const Icon = ACHIEVEMENT_ICONS[achievement.icon] ?? Award
                    const earned = Boolean(achievement.unlockedAt)
                    return (
                      <div key={achievement.id} className={`card bg-ink-2 p-4 ${earned ? '' : 'opacity-60'}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                            {earned ? <Icon className="w-6 h-6 text-gold" /> : <Lock className="w-5 h-5 text-fg-dim" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-fg">{achievement.name}</h4>
                            <p className="text-fg-muted text-xs mb-2">{achievement.description}</p>

                            {achievement.progress !== undefined && achievement.maxProgress && (
                              <div className="w-full bg-ink rounded-full h-1.5">
                                <div
                                  className="bg-violet h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%` }}
                                />
                              </div>
                            )}

                            {achievement.unlockedAt && (
                              <div className="text-fg-dim text-xs mt-1">
                                Unlocked {achievement.unlockedAt.toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          <div className="chip shrink-0">
                            {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              )}

              {activeTab === 'statistics' && (
                <motion.div
                  key="statistics"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid md:grid-cols-2 gap-4"
                >
                  <div className="card bg-ink-2 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim mb-3">Game Statistics</h3>
                    <div className="divide-y divide-line">
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-fg-muted text-sm">Games Played</span>
                        <span className="text-fg font-medium tabular-nums">{userStats.gamesPlayed}</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-fg-muted text-sm">Total Score</span>
                        <span className="text-fg font-medium tabular-nums">{userStats.totalScore.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-fg-muted text-sm">Average Score</span>
                        <span className="text-fg font-medium tabular-nums">{userStats.averageScore.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-fg-muted text-sm">Best Score</span>
                        <span className="text-gold font-medium tabular-nums">{userStats.bestScore.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-fg-muted text-sm">Favorite Mode</span>
                        <span className="text-fg font-medium">{userStats.favoriteMode}</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-fg-muted text-sm">Total Play Time</span>
                        <span className="text-fg font-medium tabular-nums">{formatPlayTime(userStats.totalPlayTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card bg-ink-2 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim mb-3">Progress</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-fg-muted text-sm">Current Level</span>
                          <span className="text-violet font-medium tabular-nums">Level {userStats.level}</span>
                        </div>
                        <div className="w-full bg-ink rounded-full h-1.5">
                          <div
                            className="bg-violet h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <div className="text-fg-dim text-xs mt-1">
                          {(xpNeeded - currentLevelXP).toLocaleString()} XP to next level
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-fg-muted text-sm">Current Streak</span>
                        <span className="text-violet font-medium tabular-nums flex items-center gap-1">
                          <Flame className="w-4 h-4" />
                          {userStats.streak} days
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-fg-muted text-sm">Achievements</span>
                        <span className="text-violet font-medium tabular-nums">
                          {mockAchievements.filter(a => a.unlockedAt).length}/{mockAchievements.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
