'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Settings, X, Search, RotateCcw, Download, Upload,
  Volume2, Music, Radio, Mic, MousePointerClick, Gem, Zap, Waves, VolumeX,
  Eye, Sparkles, Vibrate, Sun, Contrast, Image, Ruler, EyeOff, Grid3x3,
  Lightbulb, Target, Gamepad2, Palette, Accessibility, Keyboard, Gauge,
  RefreshCw, Film, TrendingUp, Info, Lock, type LucideIcon
} from 'lucide-react'
import { settingsManager } from '@/lib/settings/SettingsManager'
import { SETTINGS_CATEGORIES, THEME_CONFIGS, THEME_PREVIEWS } from '@/lib/settings/constants'
import { GameSettings, SettingsCategory, ThemeType } from '@/types/settings'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SettingsTabProps {
  category: SettingsCategory
  settings: GameSettings
  onUpdateSettings: (category: keyof GameSettings, updates: any) => void
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  audio: Volume2,
  visual: Eye,
  gameplay: Gamepad2,
  theme: Palette,
  accessibility: Accessibility,
  input: Keyboard,
  performance: Zap,
  privacy: Lock
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<GameSettings>(settingsManager.getSettings())
  const [activeTab, setActiveTab] = useState<string>('audio')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load settings on mount
  useEffect(() => {
    const handleSettingsUpdate = (updatedSettings: GameSettings) => {
      setSettings(updatedSettings)
      setHasUnsavedChanges(false)
    }

    settingsManager.on('settings:updated', handleSettingsUpdate)
    settingsManager.on('settings:reset', handleSettingsUpdate)

    return () => {
      settingsManager.off('settings:updated', handleSettingsUpdate)
      settingsManager.off('settings:reset', handleSettingsUpdate)
    }
  }, [])

  // Handle settings updates
  const handleUpdateSettings = useCallback((category: keyof GameSettings, updates: any) => {
    settingsManager.updateSettings(category, updates)
    setHasUnsavedChanges(true)
  }, [])

  // Handle reset settings
  const handleResetSettings = useCallback((category?: keyof GameSettings) => {
    if (confirm('Are you sure you want to reset these settings to default?')) {
      settingsManager.resetSettings(category)
      setHasUnsavedChanges(false)
    }
  }, [])

  // Handle export settings
  const handleExportSettings = useCallback(() => {
    try {
      const exportData = settingsManager.exportSettings()
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gems-rush-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export settings')
    }
  }, [])

  // Handle import settings
  const handleImportSettings = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const success = settingsManager.importSettings(content)
        if (success) {
          alert('Settings imported successfully!')
          setSettings(settingsManager.getSettings())
        } else {
          alert('Failed to import settings. Please check the file format.')
        }
      } catch (error) {
        alert('Failed to read settings file')
      }
    }
    reader.readAsText(file)
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === 'Escape') {
        onClose()
      } else if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault()
            // Settings are auto-saved
            break
          case 'r':
            event.preventDefault()
            handleResetSettings()
            break
          case 'e':
            event.preventDefault()
            handleExportSettings()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleResetSettings, handleExportSettings])

  // Filter categories based on search and advanced settings
  const filteredCategories = SETTINGS_CATEGORIES.filter(category => {
    const matchesSearch = searchQuery === '' ||
      category.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesAdvanced = showAdvanced || !category.isAdvanced

    return matchesSearch && matchesAdvanced
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="bg-surface-2 rounded-lg h-9 w-9 flex items-center justify-center">
              <Settings size={18} className="text-fg" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-fg">Settings</h2>
              <p className="text-sm text-fg-muted">Customize your Gems Rush experience</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-fg-dim text-xs">
                <div className="w-1.5 h-1.5 bg-violet rounded-full" />
                Auto-saved
              </div>
            )}

            <button
              onClick={onClose}
              className="btn btn-icon btn-ghost"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-72 border-r border-line flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-line space-y-3">
              <div className="relative">
                <Search size={16} className="text-fg-dim absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 h-10 bg-ink-2 border border-line rounded-lg text-fg placeholder:text-fg-dim focus:outline-none focus:ring-2 focus:ring-violet"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-fg-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  className="accent-violet"
                />
                Show advanced settings
              </label>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredCategories.map((category) => {
                const Icon = CATEGORY_ICONS[category.id] ?? Settings
                const selected = activeTab === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors border-l-2 ${
                      selected
                        ? 'bg-surface-2 text-fg border-violet'
                        : 'text-fg-muted hover:bg-surface-2/60 border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    <div className="flex-1">
                      <div className="font-medium">{category.displayName}</div>
                      <div className="text-xs text-fg-dim">{category.description}</div>
                    </div>
                    {category.isAdvanced && (
                      <span className="chip h-6 px-2 text-xs">Advanced</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-2 p-4 border-t border-line">
              <button
                onClick={() => handleResetSettings()}
                className="btn btn-secondary flex-1"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                onClick={handleExportSettings}
                className="btn btn-secondary btn-icon"
                aria-label="Export settings"
              >
                <Download size={16} />
              </button>

              <label className="btn btn-secondary btn-icon cursor-pointer" aria-label="Import settings">
                <Upload size={16} />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {filteredCategories.map((category) => (
              activeTab === category.id && (
                <SettingsTab
                  key={category.id}
                  category={category}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Tab Component
const SettingsTab: React.FC<SettingsTabProps> = ({ category, settings, onUpdateSettings }) => {
  const renderSettings = () => {
    switch (category.id) {
      case 'audio':
        return <AudioSettings settings={settings.audio} onUpdate={(updates) => onUpdateSettings('audio', updates)} />
      case 'visual':
        return <VisualSettings settings={settings.visual} onUpdate={(updates) => onUpdateSettings('visual', updates)} />
      case 'gameplay':
        return <GameplaySettings settings={settings.gameplay} onUpdate={(updates) => onUpdateSettings('gameplay', updates)} />
      case 'theme':
        return <ThemeSettings settings={settings.theme} onUpdate={(updates) => onUpdateSettings('theme', updates)} />
      case 'accessibility':
        return <AccessibilitySettings settings={settings.accessibility} onUpdate={(updates) => onUpdateSettings('accessibility', updates)} />
      case 'input':
        return <InputSettings settings={settings.input} onUpdate={(updates) => onUpdateSettings('input', updates)} />
      case 'performance':
        return <PerformanceSettings settings={settings.performance} onUpdate={(updates) => onUpdateSettings('performance', updates)} />
      case 'privacy':
        return <PrivacySettings settings={settings.privacy} onUpdate={(updates) => onUpdateSettings('privacy', updates)} />
      default:
        return <div className="text-fg-muted">Settings category not implemented yet.</div>
    }
  }

  const Icon = CATEGORY_ICONS[category.id] ?? Settings

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-fg flex items-center gap-2">
          <Icon size={20} className="text-violet" />
          {category.displayName}
        </h3>
        <p className="text-fg-muted mt-1">{category.description}</p>
      </div>

      {renderSettings()}
    </div>
  )
}

// Audio Settings Component
const AudioSettings: React.FC<{
  settings: GameSettings['audio']
  onUpdate: (updates: Partial<GameSettings['audio']>) => void
}> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      {/* Volume Controls */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Volume</h4>

        <SettingsSlider
          label="Master Volume"
          value={settings.masterVolume}
          onChange={(value) => onUpdate({ masterVolume: value })}
          min={0}
          max={100}
          unit="%"
          icon={Volume2}
        />

        <SettingsSlider
          label="Sound Effects"
          value={settings.soundEffects}
          onChange={(value) => onUpdate({ soundEffects: value })}
          min={0}
          max={100}
          unit="%"
          icon={Music}
        />

        <SettingsSlider
          label="Background Music"
          value={settings.backgroundMusic}
          onChange={(value) => onUpdate({ backgroundMusic: value })}
          min={0}
          max={100}
          unit="%"
          icon={Radio}
        />

        <SettingsSlider
          label="Voice Over"
          value={settings.voiceOver}
          onChange={(value) => onUpdate({ voiceOver: value })}
          min={0}
          max={100}
          unit="%"
          icon={Mic}
        />
      </div>

      {/* Audio Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Audio Options</h4>

        <SettingsToggle
          label="Enable Audio"
          description="Master audio toggle for the entire game"
          checked={settings.audioEnabled}
          onChange={(checked) => onUpdate({ audioEnabled: checked })}
          icon={Volume2}
        />

        <SettingsToggle
          label="UI Sounds"
          description="Button clicks and interface sounds"
          checked={settings.uiSounds}
          onChange={(checked) => onUpdate({ uiSounds: checked })}
          icon={MousePointerClick}
        />

        <SettingsToggle
          label="Match Sounds"
          description="Sound effects when making matches"
          checked={settings.matchSounds}
          onChange={(checked) => onUpdate({ matchSounds: checked })}
          icon={Gem}
        />

        <SettingsToggle
          label="Power-up Sounds"
          description="Sound effects for power-up activations"
          checked={settings.powerUpSounds}
          onChange={(checked) => onUpdate({ powerUpSounds: checked })}
          icon={Zap}
        />

        <SettingsToggle
          label="Ambient Sounds"
          description="Background environmental sounds"
          checked={settings.ambientSounds}
          onChange={(checked) => onUpdate({ ambientSounds: checked })}
          icon={Waves}
        />

        <SettingsToggle
          label="Mute on Focus Loss"
          description="Automatically mute when the game window loses focus"
          checked={settings.muteOnFocusLoss}
          onChange={(checked) => onUpdate({ muteOnFocusLoss: checked })}
          icon={VolumeX}
        />
      </div>
    </div>
  )
}

// Visual Settings Component
const VisualSettings: React.FC<{
  settings: GameSettings['visual']
  onUpdate: (updates: Partial<GameSettings['visual']>) => void
}> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      {/* Effects */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Visual Effects</h4>

        <SettingsToggle
          label="Animations"
          description="Enable smooth animations and transitions"
          checked={settings.animations}
          onChange={(checked) => onUpdate({ animations: checked })}
          icon={Film}
        />

        <SettingsToggle
          label="Particle Effects"
          description="Sparkles and particle systems"
          checked={settings.particleEffects}
          onChange={(checked) => onUpdate({ particleEffects: checked })}
          icon={Sparkles}
        />

        <SettingsToggle
          label="Screen Shake"
          description="Screen shake effects for big matches"
          checked={settings.screenShake}
          onChange={(checked) => onUpdate({ screenShake: checked })}
          icon={Vibrate}
        />

        <SettingsToggle
          label="Visual Effects"
          description="Advanced visual effects and shaders"
          checked={settings.visualEffects}
          onChange={(checked) => onUpdate({ visualEffects: checked })}
          icon={Palette}
        />
      </div>

      {/* Display Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Display</h4>

        <SettingsSlider
          label="Brightness"
          value={settings.brightness}
          onChange={(value) => onUpdate({ brightness: value })}
          min={0}
          max={200}
          unit="%"
          icon={Sun}
        />

        <SettingsSlider
          label="Saturation"
          value={settings.saturation}
          onChange={(value) => onUpdate({ saturation: value })}
          min={0}
          max={200}
          unit="%"
          icon={Contrast}
        />

        <SettingsSlider
          label="Background Opacity"
          value={settings.backgroundOpacity}
          onChange={(value) => onUpdate({ backgroundOpacity: value })}
          min={0}
          max={100}
          unit="%"
          icon={Image}
        />

        <SettingsSlider
          label="Gem Size"
          value={settings.gemSize}
          onChange={(value) => onUpdate({ gemSize: value })}
          min={50}
          max={150}
          unit="%"
          icon={Gem}
        />
      </div>

      {/* Accessibility */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Accessibility</h4>

        <SettingsToggle
          label="High Contrast"
          description="Increase contrast for better visibility"
          checked={settings.highContrast}
          onChange={(checked) => onUpdate({ highContrast: checked })}
          icon={Contrast}
        />

        <SettingsToggle
          label="Reduced Motion"
          description="Minimize animations for sensitive users"
          checked={settings.reducedMotion}
          onChange={(checked) => onUpdate({ reducedMotion: checked })}
          icon={RefreshCw}
        />

        <SettingsSelect
          label="Color Blind Mode"
          value={settings.colorBlindMode}
          onChange={(value) => onUpdate({ colorBlindMode: value as any })}
          options={[
            { value: 'none', label: 'None' },
            { value: 'protanopia', label: 'Protanopia (Red-Green)' },
            { value: 'deuteranopia', label: 'Deuteranopia (Red-Green)' },
            { value: 'tritanopia', label: 'Tritanopia (Blue-Yellow)' }
          ]}
          icon={EyeOff}
        />
      </div>

      {/* Helpers */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Game Helpers</h4>

        <SettingsToggle
          label="Show Grid"
          description="Display grid lines on the game board"
          checked={settings.showGrid}
          onChange={(checked) => onUpdate({ showGrid: checked })}
          icon={Grid3x3}
        />

        <SettingsToggle
          label="Show Hints"
          description="Visual hints for possible moves"
          checked={settings.showHints}
          onChange={(checked) => onUpdate({ showHints: checked })}
          icon={Lightbulb}
        />

        <SettingsToggle
          label="Show Trajectory"
          description="Show gem movement paths"
          checked={settings.showTrajectory}
          onChange={(checked) => onUpdate({ showTrajectory: checked })}
          icon={Target}
        />
      </div>
    </div>
  )
}

// Reusable Components
const SettingsSlider: React.FC<{
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  unit?: string
  icon?: LucideIcon
  description?: string
}> = ({ label, value, onChange, min, max, unit = '', icon: Icon, description }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-ink-2 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        {Icon && <Icon size={18} className="text-fg-muted" />}
        <div>
          <div className="text-fg font-medium">{label}</div>
          {description && <div className="text-xs text-fg-dim">{description}</div>}
        </div>
      </div>

      <div className="flex items-center gap-3 min-w-0 ml-4">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 min-w-32 accent-violet"
        />
        <div className="chip tabular-nums">
          {value}{unit}
        </div>
      </div>
    </div>
  )
}

const SettingsToggle: React.FC<{
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon?: LucideIcon
}> = ({ label, description, checked, onChange, icon: Icon }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-ink-2 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        {Icon && <Icon size={18} className="text-fg-muted" />}
        <div>
          <div className="text-fg font-medium">{label}</div>
          <div className="text-xs text-fg-dim">{description}</div>
        </div>
      </div>

      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-[22px] w-10 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-violet' : 'bg-surface-2'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-[18px] w-[18px] rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

const SettingsSelect: React.FC<{
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  icon?: LucideIcon
  description?: string
}> = ({ label, value, onChange, options, icon: Icon, description }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-ink-2 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        {Icon && <Icon size={18} className="text-fg-muted" />}
        <div>
          <div className="text-fg font-medium">{label}</div>
          {description && <div className="text-xs text-fg-dim">{description}</div>}
        </div>
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-ink-2 border border-line rounded-lg h-10 px-3 min-w-40 text-fg focus:outline-none focus:ring-2 focus:ring-violet"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// Placeholder components for other tabs
const GameplaySettings: React.FC<{
  settings: GameSettings['gameplay']
  onUpdate: (updates: Partial<GameSettings['gameplay']>) => void
}> = ({ settings, onUpdate }) => {
  return (
    <div className="text-fg-muted">
      Gameplay settings will be implemented next...
    </div>
  )
}

const ThemeSettings: React.FC<{
  settings: GameSettings['theme']
  onUpdate: (updates: Partial<GameSettings['theme']>) => void
}> = ({ settings, onUpdate }) => {
  return (
    <div className="text-fg-muted">
      Theme settings will be implemented next...
    </div>
  )
}

const AccessibilitySettings: React.FC<{
  settings: GameSettings['accessibility']
  onUpdate: (updates: Partial<GameSettings['accessibility']>) => void
}> = ({ settings, onUpdate }) => {
  return (
    <div className="text-fg-muted">
      Accessibility settings will be implemented next...
    </div>
  )
}

const InputSettings: React.FC<{
  settings: GameSettings['input']
  onUpdate: (updates: Partial<GameSettings['input']>) => void
}> = ({ settings, onUpdate }) => {
  return (
    <div className="text-fg-muted">
      Input settings will be implemented next...
    </div>
  )
}

const PerformanceSettings: React.FC<{
  settings: GameSettings['performance']
  onUpdate: (updates: Partial<GameSettings['performance']>) => void
}> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Graphics Quality</h3>

        <SettingsSelect
          label="Quality Level"
          value={settings?.qualityLevel || 'high'}
          onChange={(value) => onUpdate({ qualityLevel: value as any })}
          options={[
            { value: 'minimal', label: 'Minimal - Best Performance' },
            { value: 'low', label: 'Low - Good Performance' },
            { value: 'medium', label: 'Medium - Balanced' },
            { value: 'high', label: 'High - Good Quality' },
            { value: 'ultra', label: 'Ultra - Best Quality' }
          ]}
          icon={Palette}
          description="Set graphics quality level for stable performance"
        />

        <SettingsToggle
          label="Auto Quality Adjustment"
          description="Automatically adjust quality based on performance (may cause fluctuations)"
          checked={settings?.autoQuality ?? false}
          onChange={(checked) => onUpdate({ autoQuality: checked })}
          icon={RefreshCw}
        />

        <SettingsToggle
          label="Enable Visual Effects"
          description="Show particle effects, glows, and animations"
          checked={settings?.enableEffects ?? true}
          onChange={(checked) => onUpdate({ enableEffects: checked })}
          icon={Sparkles}
        />

        <SettingsToggle
          label="Enable Animations"
          description="Show smooth transitions and movements"
          checked={settings?.enableAnimations ?? true}
          onChange={(checked) => onUpdate({ enableAnimations: checked })}
          icon={Film}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-fg-dim">Performance Optimization</h3>

        <SettingsSlider
          label="Max Visual Effects"
          value={settings?.maxEffects ?? 15}
          onChange={(value) => onUpdate({ maxEffects: value })}
          min={2}
          max={50}
          icon={Sparkles}
          description="Maximum number of visual effects shown simultaneously"
        />

        <SettingsSlider
          label="Frame Rate Target"
          value={settings?.targetFPS ?? 60}
          onChange={(value) => onUpdate({ targetFPS: value })}
          min={30}
          max={120}
          unit=" FPS"
          icon={TrendingUp}
          description="Target frame rate for performance optimization"
        />

        <SettingsToggle
          label="Hardware Acceleration"
          description="Use GPU acceleration for better performance"
          checked={settings?.hardwareAcceleration ?? true}
          onChange={(checked) => onUpdate({ hardwareAcceleration: checked })}
          icon={Gauge}
        />
      </div>

      <div className="card bg-ink-2 p-4">
        <div className="flex items-center gap-2 text-violet mb-2">
          <Info size={16} />
          <span className="font-medium">Performance Tips</span>
        </div>
        <ul className="text-sm text-fg-muted space-y-1">
          <li>- Disable "Auto Quality" to prevent quality fluctuations during gameplay</li>
          <li>- Use "High" quality for the best balance of performance and visuals</li>
          <li>- Lower "Max Visual Effects" if experiencing lag</li>
          <li>- Enable "Hardware Acceleration" for smooth animations</li>
        </ul>
      </div>
    </div>
  )
}

const PrivacySettings: React.FC<{
  settings: GameSettings['privacy']
  onUpdate: (updates: Partial<GameSettings['privacy']>) => void
}> = ({ settings, onUpdate }) => {
  return (
    <div className="text-fg-muted">
      Privacy settings will be implemented next...
    </div>
  )
}

export default SettingsModal
