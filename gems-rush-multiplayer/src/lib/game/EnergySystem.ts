// Energy System Implementation
// Based on best practices from Black Shell Media and LootLocker guides

export interface EnergyConfig {
  maxEnergy: number
  regenRateMinutes: number
  energyCostPerGame: number
  energyCostPerAction: number
}

export const DEFAULT_ENERGY_CONFIG: EnergyConfig = {
  maxEnergy: 100,
  regenRateMinutes: 1, // 1 energy per minute (standard mobile game rate)
  energyCostPerGame: 10,
  energyCostPerAction: 1
}

export class EnergyManager {
  private config: EnergyConfig

  constructor(config: EnergyConfig = DEFAULT_ENERGY_CONFIG) {
    this.config = config
  }

  // Calculate current energy based on time passed
  calculateCurrentEnergy(
    lastEnergy: number,
    lastUpdateTime: number,
    maxEnergy: number = this.config.maxEnergy
  ): { currentEnergy: number; timeToNextEnergy: number; timeToFullEnergy: number } {
    // Validate inputs with proper defaults - don't reset to 0 for new users!
    const validMaxEnergy = isNaN(maxEnergy) || maxEnergy <= 0 ? this.config.maxEnergy : maxEnergy
    const validLastEnergy = isNaN(lastEnergy) || lastEnergy < 0 ? validMaxEnergy : lastEnergy // Use max energy as default, not 0!
    const validLastUpdateTime = isNaN(lastUpdateTime) || lastUpdateTime <= 0 ? Date.now() : lastUpdateTime
    
    const now = Date.now()
    const timePassed = Math.max(0, now - validLastUpdateTime)
    const minutesPassed = timePassed / (1000 * 60)
    
    // Calculate energy regenerated
    const energyRegenerated = Math.floor(minutesPassed / this.config.regenRateMinutes)
    const currentEnergy = Math.min(validLastEnergy + energyRegenerated, validMaxEnergy)
    
    // Calculate time to next energy point (if not at max)
    let timeToNextEnergy = 0
    if (currentEnergy < validMaxEnergy) {
      const minutesIntoCurrentCycle = minutesPassed % this.config.regenRateMinutes
      timeToNextEnergy = (this.config.regenRateMinutes - minutesIntoCurrentCycle) * 60 * 1000
    }
    
    // Calculate time to full energy
    const energyNeeded = validMaxEnergy - currentEnergy
    const timeToFullEnergy = energyNeeded * this.config.regenRateMinutes * 60 * 1000
    
    return {
      currentEnergy: Math.max(0, Math.min(currentEnergy, validMaxEnergy)),
      timeToNextEnergy: Math.max(0, timeToNextEnergy),
      timeToFullEnergy: Math.max(0, timeToFullEnergy)
    }
  }

  // Apply regenerated energy and move the timestamp forward by the points gained,
  // so partial progress toward the next point is kept. A full bar restarts the clock.
  advance(
    energy: number,
    lastUpdate: number,
    maxEnergy: number = this.config.maxEnergy
  ): { energy: number; lastUpdate: number } {
    const { currentEnergy } = this.calculateCurrentEnergy(energy, lastUpdate, maxEnergy)
    const gained = currentEnergy - energy
    const regenMs = this.config.regenRateMinutes * 60 * 1000
    return {
      energy: currentEnergy,
      lastUpdate: currentEnergy >= maxEnergy ? Date.now() : lastUpdate + gained * regenMs
    }
  }

  // Check if player has enough energy for an action
  canPerformAction(currentEnergy: number, actionType: 'game' | 'move' = 'game'): boolean {
    const validEnergy = isNaN(currentEnergy) ? 0 : currentEnergy
    const cost = actionType === 'game' ? this.config.energyCostPerGame : this.config.energyCostPerAction
    return validEnergy >= cost
  }

  // Consume energy for an action
  consumeEnergy(currentEnergy: number, actionType: 'game' | 'move' = 'game'): number {
    const validEnergy = isNaN(currentEnergy) ? 0 : currentEnergy
    const cost = actionType === 'game' ? this.config.energyCostPerGame : this.config.energyCostPerAction
    return Math.max(0, validEnergy - cost)
  }

  // Format time remaining as human readable
  formatTimeRemaining(milliseconds: number): string {
    if (milliseconds <= 0) return '0:00'
    
    const minutes = Math.floor(milliseconds / (1000 * 60))
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Get energy status for UI
  getEnergyStatus(energy: number, lastUpdate: number, maxEnergy: number = this.config.maxEnergy) {
    const { currentEnergy, timeToNextEnergy, timeToFullEnergy } = this.calculateCurrentEnergy(
      energy,
      lastUpdate,
      maxEnergy
    )
    
    return {
      currentEnergy,
      maxEnergy,
      percentage: (currentEnergy / maxEnergy) * 100,
      timeToNextEnergy: this.formatTimeRemaining(timeToNextEnergy),
      timeToFullEnergy: this.formatTimeRemaining(timeToFullEnergy),
      isFull: currentEnergy >= maxEnergy,
      isEmpty: currentEnergy <= 0,
      canPlayGame: this.canPerformAction(currentEnergy, 'game')
    }
  }
}

// Singleton instance
export const energyManager = new EnergyManager() 