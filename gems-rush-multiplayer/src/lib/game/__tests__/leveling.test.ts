import { xpForLevel, levelForXp } from '../leveling'

describe('leveling', () => {
  it('each level costs 500 XP more than the last', () => {
    expect([1, 2, 3, 4].map(xpForLevel)).toEqual([0, 500, 1500, 3000])
  })

  it('levelForXp inverts xpForLevel at and between thresholds', () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(499)).toBe(1)
    expect(levelForXp(500)).toBe(2)
    expect(levelForXp(1499)).toBe(2)
    expect(levelForXp(1500)).toBe(3)
    for (let level = 1; level <= 50; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level)
      expect(levelForXp(xpForLevel(level + 1) - 1)).toBe(level)
    }
  })

  it('a first win (~200 XP) no longer levels up', () => {
    expect(levelForXp(200)).toBe(1)
  })
})
