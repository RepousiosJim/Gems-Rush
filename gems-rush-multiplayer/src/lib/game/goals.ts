import { Collected, Gem, GemType, LevelGoal } from '@/types/game'

export interface ClassicLevel {
  moves: number
  goal: LevelGoal
}

export const GEM_COLOR_NAMES: Record<GemType, string> = {
  fire: 'red',
  water: 'blue',
  earth: 'yellow',
  nature: 'green',
  lightning: 'purple'
}

const COLLECT_ORDER: GemType[] = ['fire', 'water', 'nature', 'earth', 'lightning']

// Level 1 is a generous score level; after that score and collect levels alternate and moves shrink slowly.
// Tuned with a bot simulation: a greedy bot clears most early levels, random play fails often.
export function classicLevel(level: number): ClassicLevel {
  if (level % 2 === 1) {
    return {
      moves: Math.max(20, 28 - Math.floor((level - 1) / 2)),
      goal: { kind: 'score', target: 4000 + 550 * (level - 1) }
    }
  }

  const n = level / 2 - 1
  const moves = Math.max(18, 24 - Math.floor(level / 4))
  const first = COLLECT_ORDER[n % COLLECT_ORDER.length]
  if (level < 8) return { moves, goal: { kind: 'collect', gems: { [first]: 24 + 3 * n } } }

  const second = COLLECT_ORDER[(n + 2) % COLLECT_ORDER.length]
  return { moves, goal: { kind: 'collect', gems: { [first]: 19 + n, [second]: 19 + n } } }
}

export function addCleared(collected: Collected, gems: Gem[]): Collected {
  const next = { ...collected }
  for (const gem of gems) next[gem.type] = (next[gem.type] ?? 0) + 1
  return next
}

// Colours still owed, in goal order
export function stillNeeded(goal: LevelGoal, collected: Collected): [GemType, number][] {
  if (goal.kind !== 'collect') return []
  return (Object.entries(goal.gems) as [GemType, number][])
    .map(([type, count]): [GemType, number] => [type, Math.max(0, count - (collected[type] ?? 0))])
}

export function goalMet(goal: LevelGoal, score: number, collected: Collected): boolean {
  return goal.kind === 'score' ? score >= goal.target : stillNeeded(goal, collected).every(([, left]) => left === 0)
}

// 0..1 toward the goal, for the progress bar
export function goalProgress(goal: LevelGoal, score: number, collected: Collected): number {
  if (goal.kind === 'score') return Math.min(1, score / goal.target)
  const owed = Object.values(goal.gems).reduce((sum, count) => sum + (count ?? 0), 0)
  const left = stillNeeded(goal, collected).reduce((sum, [, n]) => sum + n, 0)
  return 1 - left / owed
}

export function roundStatus(
  goal: LevelGoal,
  maxMoves: number | undefined,
  { score, moves, collected }: { score: number; moves: number; collected: Collected }
): 'playing' | 'completed' | 'failed' {
  if (goalMet(goal, score, collected)) return 'completed'
  return maxMoves !== undefined && moves >= maxMoves ? 'failed' : 'playing'
}

export function nearMissText(goal: LevelGoal, score: number, collected: Collected): string {
  if (goal.kind === 'score') return `${(goal.target - score).toLocaleString()} points short`
  const owed = stillNeeded(goal, collected)
    .filter(([, left]) => left > 0)
    .map(([type, left]) => `${left} more ${GEM_COLOR_NAMES[type]}`)
  return `Only ${owed.join(' and ')}!`
}

// Stars reward finishing with moves to spare
export function starsForMovesLeft(movesLeft: number, maxMoves: number): number {
  const spare = movesLeft / maxMoves
  return spare >= 0.3 ? 3 : spare >= 0.12 ? 2 : 1
}
