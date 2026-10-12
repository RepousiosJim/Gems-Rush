import { GameEngine } from '../GameEngine'
import { addCleared, classicLevel, goalProgress, nearMissText, roundStatus, starsForMovesLeft, stillNeeded } from '../goals'
import { Collected, Gem, LevelGoal } from '@/types/game'

const collect = (gems: Collected): LevelGoal => ({ kind: 'collect', gems })

describe('classicLevel', () => {
  it('starts with a score level, then alternates score and collect', () => {
    expect([1, 2, 3, 4, 5, 6].map(level => classicLevel(level).goal.kind)).toEqual([
      'score', 'collect', 'score', 'collect', 'score', 'collect'
    ])
  })

  it('is the same for the same level number', () => {
    for (let level = 1; level <= 20; level++) expect(classicLevel(level)).toEqual(classicLevel(level))
  })

  it('keeps moves within 18-28, never growing', () => {
    const moves = Array.from({ length: 30 }, (_, i) => classicLevel(i + 1).moves)
    moves.forEach(m => expect(m).toBeGreaterThanOrEqual(18))
    moves.forEach(m => expect(m).toBeLessThanOrEqual(28))
    const scoreMoves = moves.filter((_, i) => i % 2 === 0)
    scoreMoves.slice(1).forEach((m, i) => expect(m).toBeLessThanOrEqual(scoreMoves[i]))
  })

  it('asks for two colours from level 8', () => {
    expect(Object.keys((classicLevel(6).goal as { gems: Collected }).gems)).toHaveLength(1)
    expect(Object.keys((classicLevel(8).goal as { gems: Collected }).gems)).toHaveLength(2)
  })
})

describe('goal counting', () => {
  const gem = (type: Gem['type']): Gem => ({ id: type, type, row: 0, col: 0 })

  it('counts cleared gems by colour', () => {
    const collected = addCleared(addCleared({}, [gem('fire'), gem('fire'), gem('water')]), [gem('fire')])
    expect(collected).toEqual({ fire: 3, water: 1 })
  })

  it('owes only the goal colours and never below zero', () => {
    expect(stillNeeded(collect({ fire: 5, water: 2 }), { fire: 2, water: 4, earth: 9 })).toEqual([
      ['fire', 3],
      ['water', 0]
    ])
  })

  it('tracks progress toward a collect goal', () => {
    expect(goalProgress(collect({ fire: 10, water: 10 }), 0, { fire: 10, water: 5 })).toBe(0.75)
  })
})

describe('roundStatus', () => {
  const scoreGoal: LevelGoal = { kind: 'score', target: 1000 }

  it('fails when the last move is spent short of the goal', () => {
    expect(roundStatus(scoreGoal, 20, { score: 880, moves: 19, collected: {} })).toBe('playing')
    expect(roundStatus(scoreGoal, 20, { score: 880, moves: 20, collected: {} })).toBe('failed')
  })

  it('wins on the last move when the goal is met', () => {
    expect(roundStatus(scoreGoal, 20, { score: 1000, moves: 20, collected: {} })).toBe('completed')
    expect(roundStatus(collect({ fire: 3 }), 20, { score: 0, moves: 20, collected: { fire: 3 } })).toBe('completed')
  })

  it('never fails without a move limit', () => {
    expect(roundStatus(scoreGoal, undefined, { score: 0, moves: 500, collected: {} })).toBe('playing')
  })

  it('fails a real engine round once its moves run out', async () => {
    const engine = new GameEngine({}, { autoComplete: false })
    await engine.initialize()
    let collected: Collected = {}
    engine.on('game:gems-cleared', (gems: Gem[]) => (collected = addCleared(collected, gems)))
    const goal = collect({ fire: 1000 })
    const maxMoves = 3

    const statuses: string[] = []
    for (let i = 0; i < maxMoves; i++) {
      const [move] = engine.getAllPossibleMoves(engine.getGameState().board)
      await engine.makeMove(move.from.row, move.from.col, move.to.row, move.to.col)
      const { score, moves } = engine.getGameState()
      statuses.push(roundStatus(goal, maxMoves, { score, moves, collected }))
    }
    engine.cleanup()

    expect(statuses).toEqual(['playing', 'playing', 'failed'])
    expect(Object.values(collected).reduce((a, b) => a! + b!, 0)).toBeGreaterThanOrEqual(9)
  })
})

describe('nearMissText', () => {
  it('names the points still missing', () => {
    expect(nearMissText({ kind: 'score', target: 5000 }, 4880, {})).toBe('120 points short')
  })

  it('names each colour still owed', () => {
    expect(nearMissText(collect({ fire: 20 }), 0, { fire: 17 })).toBe('Only 3 more red!')
    expect(nearMissText(collect({ fire: 20, water: 20 }), 0, { fire: 18, water: 20 })).toBe('Only 2 more red!')
    expect(nearMissText(collect({ fire: 20, water: 20 }), 0, { fire: 18, water: 19 })).toBe('Only 2 more red and 1 more blue!')
  })
})

describe('starsForMovesLeft', () => {
  it('gives more stars for more moves to spare', () => {
    expect([0, 3, 9].map(left => starsForMovesLeft(left, 25))).toEqual([1, 2, 3])
  })
})
