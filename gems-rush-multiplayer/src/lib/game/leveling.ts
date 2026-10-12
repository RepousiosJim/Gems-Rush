// Reaching level L+1 from L costs XP_STEP * L, so early levels take 2-3 wins and each later one takes longer.
const XP_STEP = 500

export const xpForLevel = (level: number) => (XP_STEP / 2) * level * (level - 1)

export const levelForXp = (xp: number) =>
  Math.floor((1 + Math.sqrt(1 + (8 * xp) / XP_STEP)) / 2)
