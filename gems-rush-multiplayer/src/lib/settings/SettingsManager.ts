import { 
  GameSettings, 
  SettingsAction, 
  SettingsValidation, 
  SettingsError,
  SettingsWarning,
  HotKey,
  ThemeType,
  AudioSettings,
  VisualSettings,
  GameplaySettings,
  ThemeSettings,
  AccessibilitySettings,
  InputSettings,
  PerformanceSettings,
  PrivacySettings
} from '@/types/settings'
import { 
  DEFAULT_SETTINGS, 
  SETTINGS_STORAGE_KEYS, 
  SETTINGS_VALIDATION,
  DEFAULT_HOTKEYS,
  THEME_CONFIGS
} from './constants'

export class SettingsManager {
  private settings: GameSettings
  private listeners: Map<string, Function[]> = new Map()
  private hotkeys: HotKey[] = []
  private isInitialized = false

  constructor() {
    this.settings = this.createDefaultSettings()
    this.hotkeys = [...DEFAULT_HOTKEYS]
    this.initializeEventListeners()
  }

  // Initialization
  public async initialize(): Promise<void> {
    try {
      await this.loadSettings()
      await this.loadHotkeys()
      this.applySettings()
      this.detectSystemPreferences()
      this.isInitialized = true
      this.emit('settings:initialized', this.settings)
    } catch (error) {
      console.error('Failed to initialize settings:', error)
      this.settings = this.createDefaultSettings()
      this.emit('settings:error', { message: 'Failed to initialize settings' })
    }
  }

  // Settings Management
  public getSettings(): GameSettings {
    return { ...this.settings }
  }

  public updateSettings<T extends keyof GameSettings>(category: T, updates: Partial<GameSettings[T]>): void {
    if (!this.isInitialized) {
      console.warn('Settings manager not initialized')
      return
    }

    const oldSettings = { ...this.settings }
    
    try {
      // Validate updates
      const validation = this.validateSettingsUpdate(category, updates)
      if (!validation.isValid) {
        this.emit('settings:validation-error', validation)
        return
      }

      // Apply updates
      if (this.settings[category] && typeof this.settings[category] === 'object') {
        this.settings[category] = {
          ...this.settings[category],
          ...updates
        } as GameSettings[T]
      }

      // Update last modified
      this.settings.lastModified = new Date()

      // Save to storage
      this.saveSettings()

      // Apply changes
      this.applySettings()

      // Emit events
      this.emit('settings:updated', {
        category,
        oldValue: oldSettings[category],
        newValue: this.settings[category]
      })

      this.emit(`settings:${category}:updated`, this.settings[category])

    } catch (error) {
      console.error('Failed to update settings:', error)
      this.settings = oldSettings
      this.emit('settings:error', { message: 'Failed to update settings' })
    }
  }

  public resetSettings<T extends keyof GameSettings>(category?: T): void {
    const oldSettings = { ...this.settings }

    try {
      if (category) {
        this.settings[category] = DEFAULT_SETTINGS[category]
      } else {
        this.settings = this.createDefaultSettings()
      }

      this.settings.lastModified = new Date()
      this.saveSettings()
      this.applySettings()

      this.emit('settings:reset', { category, oldSettings, newSettings: this.settings })

    } catch (error) {
      console.error('Failed to reset settings:', error)
      this.settings = oldSettings
      this.emit('settings:error', { message: 'Failed to reset settings' })
    }
  }

  // Settings Persistence
  private async loadSettings(): Promise<void> {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEYS.MAIN_SETTINGS)
      if (stored) {
        const parsedSettings = JSON.parse(stored)
        
        // Validate loaded settings
        const validation = this.validateSettings(parsedSettings)
        if (validation.isValid) {
          this.settings = {
            ...this.createDefaultSettings(),
            ...parsedSettings,
            lastModified: new Date(parsedSettings.lastModified || Date.now())
          }
        } else {
          console.warn('Invalid settings found, using defaults:', validation.errors)
          this.settings = this.createDefaultSettings()
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      this.settings = this.createDefaultSettings()
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEYS.MAIN_SETTINGS,
        JSON.stringify(this.settings)
      )
      
      // Create backup
      const backup = {
        settings: this.settings,
        timestamp: Date.now()
      }
      localStorage.setItem(
        SETTINGS_STORAGE_KEYS.SETTINGS_BACKUP,
        JSON.stringify(backup)
      )

    } catch (error) {
      console.error('Failed to save settings:', error)
      this.emit('settings:error', { message: 'Failed to save settings' })
    }
  }

  // Hot Keys Management
  public getHotkeys(): HotKey[] {
    return [...this.hotkeys]
  }

  public updateHotkey(hotkeyId: string, newKey: string, modifiers: string[] = []): boolean {
    try {
      const hotkey = this.hotkeys.find(hk => hk.id === hotkeyId)
      if (!hotkey || !hotkey.isCustomizable) {
        return false
      }

      // Check for conflicts
      const conflict = this.hotkeys.find(hk => 
        hk.id !== hotkeyId && 
        hk.currentKey === newKey && 
        JSON.stringify(hk.modifiers) === JSON.stringify(modifiers)
      )

      if (conflict) {
        this.emit('hotkey:conflict', { hotkey, conflict })
        return false
      }

      hotkey.currentKey = newKey
      hotkey.modifiers = modifiers

      this.saveHotkeys()
      this.emit('hotkey:updated', hotkey)
      return true

    } catch (error) {
      console.error('Failed to update hotkey:', error)
      return false
    }
  }

  private async loadHotkeys(): Promise<void> {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEYS.HOTKEYS)
      if (stored) {
        const parsedHotkeys = JSON.parse(stored)
        this.hotkeys = parsedHotkeys.length > 0 ? parsedHotkeys : [...DEFAULT_HOTKEYS]
      }
    } catch (error) {
      console.error('Failed to load hotkeys:', error)
      this.hotkeys = [...DEFAULT_HOTKEYS]
    }
  }

  private saveHotkeys(): void {
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEYS.HOTKEYS,
        JSON.stringify(this.hotkeys)
      )
    } catch (error) {
      console.error('Failed to save hotkeys:', error)
    }
  }

  // Settings Validation
  private validateSettings(settings: any): SettingsValidation {
    const errors: SettingsError[] = []
    const warnings: SettingsWarning[] = []

    try {
      // Validate structure
      const requiredCategories = ['audio', 'visual', 'gameplay', 'theme', 'accessibility', 'input', 'performance', 'privacy']
      for (const category of requiredCategories) {
        if (!settings[category]) {
          errors.push({
            path: category,
            message: `Missing settings category: ${category}`,
            severity: 'high'
          })
        }
      }

      // Validate ranges
      this.validateRanges(settings, errors, warnings)

      // Validate enums
      this.validateEnums(settings, errors, warnings)

      return {
        isValid: errors.filter(e => e.severity === 'high' || e.severity === 'critical').length === 0,
        errors,
        warnings
      }

    } catch (error) {
      errors.push({
        path: 'root',
        message: 'Failed to validate settings structure',
        severity: 'critical'
      })

      return { isValid: false, errors, warnings }
    }
  }

  private validateSettingsUpdate(category: string, updates: Record<string, any>): SettingsValidation {
    const errors: SettingsError[] = []
    const warnings: SettingsWarning[] = []

    try {
      const validation = SETTINGS_VALIDATION[category as keyof typeof SETTINGS_VALIDATION]
      if (!validation) {
        return { isValid: true, errors, warnings }
      }

      for (const [key, value] of Object.entries(updates)) {
        const rule = validation[key as keyof typeof validation] as any
        if (!rule) continue

        if (rule && typeof rule === 'object' && 'min' in rule && 'max' in rule) {
          if (typeof value === 'number' && (value < rule.min || value > rule.max)) {
            errors.push({
              path: `${category}.${key}`,
              message: `Value must be between ${rule.min} and ${rule.max}`,
              severity: 'medium'
            })
          }
        }

        if (rule && typeof rule === 'object' && 'values' in rule) {
          if (!rule.values.includes(value)) {
            errors.push({
              path: `${category}.${key}`,
              message: `Value must be one of: ${rule.values.join(', ')}`,
              severity: 'medium'
            })
          }
        }
      }

      return {
        isValid: errors.filter(e => e.severity === 'high' || e.severity === 'critical').length === 0,
        errors,
        warnings
      }

    } catch (error) {
      errors.push({
        path: `${category}`,
        message: 'Failed to validate settings update',
        severity: 'high'
      })

      return { isValid: false, errors, warnings }
    }
  }

  private validateRanges(settings: any, errors: SettingsError[], warnings: SettingsWarning[]): void {
    // Audio validation
    if (settings.audio) {
      const audioRanges = ['masterVolume', 'soundEffects', 'backgroundMusic', 'voiceOver']
      audioRanges.forEach(prop => {
        const value = settings.audio[prop]
        if (typeof value === 'number' && (value < 0 || value > 100)) {
          errors.push({
            path: `audio.${prop}`,
            message: `${prop} must be between 0 and 100`,
            severity: 'medium'
          })
        }
      })
    }

    // Visual validation  
    if (settings.visual) {
      if (settings.visual.brightness && (settings.visual.brightness < 0 || settings.visual.brightness > 200)) {
        errors.push({
          path: 'visual.brightness',
          message: 'Brightness must be between 0 and 200',
          severity: 'medium'
        })
      }

      if (settings.visual.gemSize && (settings.visual.gemSize < 50 || settings.visual.gemSize > 150)) {
        warnings.push({
          path: 'visual.gemSize',
          message: 'Gem size outside recommended range',
          recommendation: 'Use values between 80 and 120 for best experience'
        })
      }
    }
  }

  private validateEnums(settings: any, errors: SettingsError[], warnings: SettingsWarning[]): void {
    // Theme validation
    if (settings.theme?.currentTheme) {
      const validThemes = ['divine', 'space', 'forest', 'ocean', 'fire']
      if (!validThemes.includes(settings.theme.currentTheme)) {
        errors.push({
          path: 'theme.currentTheme',
          message: `Invalid theme: ${settings.theme.currentTheme}`,
          severity: 'medium'
        })
      }
    }

    // Difficulty validation
    if (settings.gameplay?.difficulty) {
      const validDifficulties = ['easy', 'medium', 'hard', 'expert', 'custom']
      if (!validDifficulties.includes(settings.gameplay.difficulty)) {
        errors.push({
          path: 'gameplay.difficulty',
          message: `Invalid difficulty: ${settings.gameplay.difficulty}`,
          severity: 'medium'
        })
      }
    }
  }

  // Apply Settings to DOM/Game
  private applySettings(): void {
    try {
      this.applyThemeSettings()
      this.applyAccessibilitySettings()
      this.applyPerformanceSettings()
      this.applyVisualSettings()
      
      this.emit('settings:applied', this.settings)
    } catch (error) {
      console.error('Failed to apply settings:', error)
      this.emit('settings:error', { message: 'Failed to apply settings' })
    }
  }

  private applyThemeSettings(): void {
    const theme = THEME_CONFIGS[this.settings.theme.currentTheme]
    if (!theme) return

    const root = document.documentElement
    
    // Apply CSS variables
    root.style.setProperty('--theme-background', theme.backgroundColor)
    root.style.setProperty('--theme-accent', theme.accentColor)
    root.style.setProperty('--theme-text', theme.textColor)
    root.style.setProperty('--theme-border', theme.borderColor)
    root.style.setProperty('--theme-shadow', theme.shadowColor)
    
    // Apply font settings
    root.style.setProperty('--font-family', this.settings.theme.fontFamily)
    root.style.setProperty('--font-size-scale', `${this.settings.theme.fontSize / 100}`)
  }

  private applyAccessibilitySettings(): void {
    const root = document.documentElement
    
    // Reduced motion
    if (this.settings.accessibility.reducedMotion || this.settings.visual.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // High contrast
    if (this.settings.accessibility.highContrast || this.settings.visual.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Large text
    if (this.settings.accessibility.largeText) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }

    // Focus indicators
    if (this.settings.accessibility.focusIndicators) {
      root.classList.add('focus-visible')
    } else {
      root.classList.remove('focus-visible')
    }
  }

  private applyPerformanceSettings(): void {
    const root = document.documentElement
    
    // Performance class
    root.setAttribute('data-render-quality', this.settings.performance.renderQuality)
    
    // FPS limit
    if (this.settings.performance.maxFPS > 0) {
      root.style.setProperty('--max-fps', this.settings.performance.maxFPS.toString())
    }
  }

  private applyVisualSettings(): void {
    const root = document.documentElement
    
    // Visual effects
    root.style.setProperty('--brightness', `${this.settings.visual.brightness / 100}`)
    root.style.setProperty('--saturation', `${this.settings.visual.saturation / 100}`)
    root.style.setProperty('--gem-size-scale', `${this.settings.visual.gemSize / 100}`)
    root.style.setProperty('--bg-opacity', `${this.settings.visual.backgroundOpacity / 100}`)

    // Effect toggles
    if (!this.settings.visual.animations) {
      root.classList.add('no-animations')
    } else {
      root.classList.remove('no-animations')
    }

    if (!this.settings.visual.particleEffects) {
      root.classList.add('no-particles')
    } else {
      root.classList.remove('no-particles')
    }
  }

  // System Detection
  private detectSystemPreferences(): void {
    try {
      // Detect reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion && !this.settings.accessibility.reducedMotion) {
        this.updateSettings('accessibility', { reducedMotion: true })
      }

      // Detect high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      if (prefersHighContrast && !this.settings.accessibility.highContrast) {
        this.updateSettings('accessibility', { highContrast: true })
      }

      // Detect color scheme preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark && this.settings.theme.currentTheme === 'divine') {
        // Already using dark theme
      }

    } catch (error) {
      console.warn('Failed to detect system preferences:', error)
    }
  }

  // Import/Export
  public exportSettings(): string {
    try {
      const exportData = {
        settings: this.settings,
        hotkeys: this.hotkeys,
        version: this.settings.version,
        exportedAt: new Date().toISOString()
      }

      const exported = JSON.stringify(exportData, null, 2)
      
      // Save export timestamp
      localStorage.setItem(SETTINGS_STORAGE_KEYS.LAST_EXPORT, Date.now().toString())
      
      this.emit('settings:exported', exportData)
      return exported

    } catch (error) {
      console.error('Failed to export settings:', error)
      throw new Error('Failed to export settings')
    }
  }

  public importSettings(settingsData: string): boolean {
    try {
      const importData = JSON.parse(settingsData)
      
      if (!importData.settings || !importData.version) {
        throw new Error('Invalid settings format')
      }

      // Validate imported settings
      const validation = this.validateSettings(importData.settings)
      if (!validation.isValid) {
        this.emit('settings:import-error', validation)
        return false
      }

      // Backup current settings
      this.saveSettings()

      // Apply imported settings
      this.settings = {
        ...this.createDefaultSettings(),
        ...importData.settings,
        lastModified: new Date()
      }

      if (importData.hotkeys) {
        this.hotkeys = importData.hotkeys
      }

      this.saveSettings()
      this.saveHotkeys()
      this.applySettings()

      this.emit('settings:imported', importData)
      return true

    } catch (error) {
      console.error('Failed to import settings:', error)
      this.emit('settings:import-error', { message: 'Failed to import settings' })
      return false
    }
  }

  // Event System
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  public off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in settings event listener for ${event}:`, error)
        }
      })
    }
  }

  // Helper Methods
  private createDefaultSettings(): GameSettings {
    return {
      ...DEFAULT_SETTINGS,
      lastModified: new Date()
    }
  }

  private initializeEventListeners(): void {
    // Listen for media query changes
    if (typeof window !== 'undefined') {
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      reducedMotionQuery.addEventListener('change', (e) => {
        if (e.matches && !this.settings.accessibility.reducedMotion) {
          this.updateSettings('accessibility', { reducedMotion: true })
        }
      })

      const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
      highContrastQuery.addEventListener('change', (e) => {
        if (e.matches && !this.settings.accessibility.highContrast) {
          this.updateSettings('accessibility', { highContrast: true })
        }
      })
    }
  }

  // Cleanup
  public destroy(): void {
    this.listeners.clear()
    this.isInitialized = false
  }
}

// Singleton instance
export const settingsManager = new SettingsManager() 