import { 
  GameSettings, 
  ThemeType, 
  SettingsCategory, 
  HotKey, 
  CustomTheme,
  ThemePreview
} from '@/types/settings'
import { GemType } from '@/types/game'

// Default Settings Configuration
export const DEFAULT_SETTINGS: GameSettings = {
  audio: {
    masterVolume: 80,
    soundEffects: 100,
    backgroundMusic: 60,
    voiceOver: 100,
    uiSounds: true,
    matchSounds: true,
    powerUpSounds: true,
    ambientSounds: true,
    audioEnabled: true,
    muteOnFocusLoss: true
  },
  visual: {
    animations: true,
    particleEffects: true,
    screenShake: true,
    visualEffects: true,
    highContrast: false,
    colorBlindMode: 'none',
    brightness: 100,
    saturation: 100,
    backgroundOpacity: 80,
    gemSize: 100,
    showGrid: false,
    showHints: true,
    showTrajectory: true,
    reducedMotion: false
  },
  gameplay: {
    difficulty: 'medium',
    hintsEnabled: true,
    autoSave: true,
    pauseOnFocusLoss: true,
    confirmMoves: false,
    swapAnimation: true,
    cascadeDelay: 200,
    moveTimeout: 30,
    showScoreFloats: true,
    showComboIndicator: true,
    autoNextLevel: false,
    skipTutorials: false,
    showMoveCounter: true,
    enablePowerUps: true
  },
  theme: {
    currentTheme: 'divine',
    customThemes: [],
    backgroundStyle: 'animated',
    gemStyle: 'modern',
    boardStyle: 'glass',
    accentColor: '#9932CC',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 100
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReaderSupport: false,
    keyboardNavigation: true,
    skipAnimations: false,
    focusIndicators: true,
    alternativeText: true,
    colorBlindSupport: false,
    audioDescriptions: false,
    captionsEnabled: false,
    gestureAlternatives: true,
    timeoutExtension: false,
    simplifyInterface: false
  },
  input: {
    primaryInput: 'mouse',
    touchSensitivity: 5,
    mouseSensitivity: 5,
    keyboardRepeatRate: 5,
    gesturesEnabled: true,
    rightClickEnabled: true,
    doubleClickEnabled: true,
    dragDistance: 50,
    swipeThreshold: 100,
    hapticFeedback: true,
    mouseWheelZoom: true,
    keyboardShortcuts: {},
    customGestures: []
  },
  performance: {
    maxFPS: 60,
    renderQuality: 'high',
    qualityLevel: 'high',
    autoQuality: false,
    enableEffects: true,
    enableAnimations: true,
    maxEffects: 15,
    targetFPS: 60,
    hardwareAcceleration: true,
    useWebGL: true,
    enableShadows: true,
    antiAliasing: true,
    textureQuality: 'high',
    particleLimit: 1000,
    enableVSync: true,
    powerSaving: false,
    backgroundRendering: true
  },
  privacy: {
    analytics: true,
    crashReporting: true,
    personalizedAds: false,
    dataSaving: false,
    localStorageOnly: false,
    shareProgress: true,
    allowSpectators: true,
    showOnline: true,
    profileVisibility: 'public'
  },
  version: '1.0.0',
  lastModified: new Date(),
  cloudSync: false
}

// Settings Categories for Organization
export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: 'audio',
    name: 'audio',
    displayName: 'Audio',
    description: 'Sound and music settings',
    icon: '🔊',
    order: 1,
    isAdvanced: false,
    requiresRestart: false
  },
  {
    id: 'visual',
    name: 'visual',
    displayName: 'Visual',
    description: 'Graphics and visual effects settings',
    icon: '👁️',
    order: 2,
    isAdvanced: false,
    requiresRestart: false
  },
  {
    id: 'gameplay',
    name: 'gameplay',
    displayName: 'Gameplay',
    description: 'Game mechanics and difficulty settings',
    icon: '🎮',
    order: 3,
    isAdvanced: false,
    requiresRestart: false
  },
  {
    id: 'theme',
    name: 'theme',
    displayName: 'Themes',
    description: 'Visual themes and customization',
    icon: '🎨',
    order: 4,
    isAdvanced: false,
    requiresRestart: false
  },
  {
    id: 'accessibility',
    name: 'accessibility',
    displayName: 'Accessibility',
    description: 'Accessibility and inclusion features',
    icon: '♿',
    order: 5,
    isAdvanced: false,
    requiresRestart: false
  },
  {
    id: 'input',
    name: 'input',
    displayName: 'Input',
    description: 'Control and input device settings',
    icon: '📱',
    order: 6,
    isAdvanced: false,
    requiresRestart: false
  },
  {
    id: 'performance',
    name: 'performance',
    displayName: 'Performance',
    description: 'Graphics performance and optimization',
    icon: '⚡',
    order: 7,
    isAdvanced: true,
    requiresRestart: true
  },
  {
    id: 'privacy',
    name: 'privacy',
    displayName: 'Privacy',
    description: 'Data sharing and privacy settings',
    icon: '🔒',
    order: 8,
    isAdvanced: true,
    requiresRestart: false
  }
]

// Theme Configurations
export const THEME_CONFIGS: Record<ThemeType, CustomTheme> = {
  divine: {
    id: 'divine',
    name: 'divine',
    displayName: 'Divine Realm',
    description: 'Mystical celestial theme with divine energy',
    author: 'Gems Rush Team',
    version: '1.0.0',
    backgroundColor: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accentColor: '#9932CC',
    textColor: '#ffffff',
    borderColor: '#444466',
    shadowColor: 'rgba(153, 50, 204, 0.3)',
    isUserCreated: false,
    isActive: true
  },
  space: {
    id: 'space',
    name: 'space',
    displayName: 'Cosmic Voyage',
    description: 'Journey through the depths of space',
    author: 'Gems Rush Team',
    version: '1.0.0',
    backgroundColor: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a3a 50%, #2a2a5a 100%)',
    accentColor: '#4CC9F0',
    textColor: '#ffffff',
    borderColor: '#333366',
    shadowColor: 'rgba(76, 201, 240, 0.3)',
    isUserCreated: false,
    isActive: false
  },
  forest: {
    id: 'forest',
    name: 'forest',
    displayName: 'Enchanted Forest',
    description: 'Nature\'s magic in an ancient woodland',
    author: 'Gems Rush Team',
    version: '1.0.0',
    backgroundColor: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a2d 50%, #407040 100%)',
    accentColor: '#228B22',
    textColor: '#ffffff',
    borderColor: '#446644',
    shadowColor: 'rgba(34, 139, 34, 0.3)',
    isUserCreated: false,
    isActive: false
  },
  ocean: {
    id: 'ocean',
    name: 'ocean',
    displayName: 'Ocean Depths',
    description: 'Dive into the mysterious underwater world',
    author: 'Gems Rush Team',
    version: '1.0.0',
    backgroundColor: 'linear-gradient(135deg, #001f3f 0%, #0074D9 50%, #39CCCC 100%)',
    accentColor: '#00CED1',
    textColor: '#ffffff',
    borderColor: '#336688',
    shadowColor: 'rgba(0, 206, 209, 0.3)',
    isUserCreated: false,
    isActive: false
  },
  fire: {
    id: 'fire',
    name: 'fire',
    displayName: 'Volcanic Fury',
    description: 'Harness the power of molten lava and flame',
    author: 'Gems Rush Team',
    version: '1.0.0',
    backgroundColor: 'linear-gradient(135deg, #2c0a0a 0%, #4d1414 50%, #6b1f1f 100%)',
    accentColor: '#FF4500',
    textColor: '#ffffff',
    borderColor: '#662222',
    shadowColor: 'rgba(255, 69, 0, 0.3)',
    isUserCreated: false,
    isActive: false
  }
}

// Theme Previews
export const THEME_PREVIEWS: Record<ThemeType, ThemePreview> = {
  divine: {
    themeId: 'divine',
    previewImage: '/themes/divine-preview.jpg',
    colors: ['#9932CC', '#1a1a2e', '#16213e', '#0f3460'],
    description: 'Mystical and ethereal with divine energy'
  },
  space: {
    themeId: 'space',
    previewImage: '/themes/space-preview.jpg',
    colors: ['#4CC9F0', '#0a0a0a', '#1a1a3a', '#2a2a5a'],
    description: 'Dark cosmic theme with stellar highlights'
  },
  forest: {
    themeId: 'forest',
    previewImage: '/themes/forest-preview.jpg',
    colors: ['#228B22', '#1a3d1a', '#2d5a2d', '#407040'],
    description: 'Natural woodland with earthy tones'
  },
  ocean: {
    themeId: 'ocean',
    previewImage: '/themes/ocean-preview.jpg',
    colors: ['#00CED1', '#001f3f', '#0074D9', '#39CCCC'],
    description: 'Deep sea blues with aquatic vibes'
  },
  fire: {
    themeId: 'fire',
    previewImage: '/themes/fire-preview.jpg',
    colors: ['#FF4500', '#2c0a0a', '#4d1414', '#6b1f1f'],
    description: 'Volcanic reds with burning intensity'
  }
}

// Default Hot Keys Configuration
export const DEFAULT_HOTKEYS: HotKey[] = [
  // Game Controls
  {
    id: 'pause',
    name: 'pause',
    description: 'Pause/Resume Game',
    defaultKey: 'Space',
    currentKey: 'Space',
    modifiers: [],
    category: 'game',
    isCustomizable: true,
    isGlobal: false
  },
  {
    id: 'restart',
    name: 'restart',
    description: 'Restart Game',
    defaultKey: 'R',
    currentKey: 'R',
    modifiers: ['Ctrl'],
    category: 'game',
    isCustomizable: true,
    isGlobal: false
  },
  {
    id: 'hint',
    name: 'hint',
    description: 'Show Hint',
    defaultKey: 'H',
    currentKey: 'H',
    modifiers: [],
    category: 'game',
    isCustomizable: true,
    isGlobal: false
  },
  {
    id: 'undo',
    name: 'undo',
    description: 'Undo Last Move',
    defaultKey: 'Z',
    currentKey: 'Z',
    modifiers: ['Ctrl'],
    category: 'game',
    isCustomizable: true,
    isGlobal: false
  },
  // Navigation
  {
    id: 'menu',
    name: 'menu',
    description: 'Open Main Menu',
    defaultKey: 'Escape',
    currentKey: 'Escape',
    modifiers: [],
    category: 'navigation',
    isCustomizable: true,
    isGlobal: false
  },
  {
    id: 'settings',
    name: 'settings',
    description: 'Open Settings',
    defaultKey: 'S',
    currentKey: 'S',
    modifiers: ['Ctrl'],
    category: 'navigation',
    isCustomizable: true,
    isGlobal: false
  },
  {
    id: 'fullscreen',
    name: 'fullscreen',
    description: 'Toggle Fullscreen',
    defaultKey: 'F11',
    currentKey: 'F11',
    modifiers: [],
    category: 'navigation',
    isCustomizable: true,
    isGlobal: false
  },
  // Movement
  {
    id: 'moveUp',
    name: 'moveUp',
    description: 'Move Cursor Up',
    defaultKey: 'ArrowUp',
    currentKey: 'ArrowUp',
    modifiers: [],
    category: 'movement',
    isCustomizable: true,
    isGlobal: false
  },
  {
    id: 'moveDown',
    name: 'moveDown',
    description: 'Move Cursor Down',
    defaultKey: 'ArrowDown',
    currentKey: 'ArrowDown',
    modifiers: [],
    category: 'movement',
    isCustomizable: true,
    isGlobal: false
  },
  {
    id: 'moveLeft',
    name: 'moveLeft',
    description: 'Move Cursor Left',
    defaultKey: 'ArrowLeft',
    currentKey: 'ArrowLeft',
    modifiers: [],
    category: 'movement',
    isCustomizable: true,
    isGlobal: false
  },
  {
    id: 'moveRight',
    name: 'moveRight',
    description: 'Move Cursor Right',
    defaultKey: 'ArrowRight',
    currentKey: 'ArrowRight',
    modifiers: [],
    category: 'movement',
    isCustomizable: true,
    isGlobal: false
  },
  {
    id: 'select',
    name: 'select',
    description: 'Select/Activate',
    defaultKey: 'Enter',
    currentKey: 'Enter',
    modifiers: [],
    category: 'movement',
    isCustomizable: true,
    isGlobal: false
  }
]

// Difficulty Level Configurations
export const DIFFICULTY_CONFIGS = {
  easy: {
    targetScoreMultiplier: 0.8,
    timeMultiplier: 1.5,
    hintsAvailable: true,
    hintsUnlimited: true,
    undoAvailable: true,
    powerUpsEnabled: true,
    description: 'Perfect for beginners with generous scoring and unlimited hints'
  },
  medium: {
    targetScoreMultiplier: 1.0,
    timeMultiplier: 1.0,
    hintsAvailable: true,
    hintsUnlimited: false,
    undoAvailable: true,
    powerUpsEnabled: true,
    description: 'Balanced gameplay with moderate challenge'
  },
  hard: {
    targetScoreMultiplier: 1.3,
    timeMultiplier: 0.8,
    hintsAvailable: true,
    hintsUnlimited: false,
    undoAvailable: false,
    powerUpsEnabled: true,
    description: 'Challenging gameplay for experienced players'
  },
  expert: {
    targetScoreMultiplier: 1.6,
    timeMultiplier: 0.6,
    hintsAvailable: false,
    hintsUnlimited: false,
    undoAvailable: false,
    powerUpsEnabled: false,
    description: 'Ultimate challenge with no assistance'
  },
  custom: {
    targetScoreMultiplier: 1.0,
    timeMultiplier: 1.0,
    hintsAvailable: true,
    hintsUnlimited: false,
    undoAvailable: true,
    powerUpsEnabled: true,
    description: 'Fully customizable difficulty settings'
  }
} as const

// Local Storage Keys for Settings
export const SETTINGS_STORAGE_KEYS = {
  MAIN_SETTINGS: 'gems_rush_settings',
  HOTKEYS: 'gems_rush_hotkeys',
  CUSTOM_THEMES: 'gems_rush_custom_themes',
  SETTINGS_BACKUP: 'gems_rush_settings_backup',
  LAST_EXPORT: 'gems_rush_settings_export'
} as const

// Settings Validation Rules
export const SETTINGS_VALIDATION = {
  audio: {
    masterVolume: { min: 0, max: 100 },
    soundEffects: { min: 0, max: 100 },
    backgroundMusic: { min: 0, max: 100 },
    voiceOver: { min: 0, max: 100 }
  },
  visual: {
    brightness: { min: 0, max: 200 },
    saturation: { min: 0, max: 200 },
    backgroundOpacity: { min: 0, max: 100 },
    gemSize: { min: 50, max: 150 }
  },
  gameplay: {
    cascadeDelay: { min: 0, max: 1000 },
    moveTimeout: { min: 5, max: 300 }
  },
  theme: {
    fontSize: { min: 80, max: 120 }
  },
  input: {
    touchSensitivity: { min: 1, max: 10 },
    mouseSensitivity: { min: 1, max: 10 },
    keyboardRepeatRate: { min: 1, max: 10 },
    dragDistance: { min: 10, max: 200 },
    swipeThreshold: { min: 20, max: 300 }
  },
  performance: {
    maxFPS: { values: [30, 60, 120, -1] }, // -1 = unlimited
    particleLimit: { min: 0, max: 5000 }
  }
} as const 