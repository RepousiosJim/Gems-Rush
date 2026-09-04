// Settings System Types
export type ThemeType = 'divine' | 'space' | 'forest' | 'ocean' | 'fire'
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert' | 'custom'
export type InputMethod = 'mouse' | 'touch' | 'keyboard' | 'gamepad'
export type MotionPreference = 'no-preference' | 'reduce'

// Audio Settings Interface
export interface AudioSettings {
  masterVolume: number // 0-100
  soundEffects: number // 0-100
  backgroundMusic: number // 0-100
  voiceOver: number // 0-100
  uiSounds: boolean
  matchSounds: boolean
  powerUpSounds: boolean
  ambientSounds: boolean
  audioEnabled: boolean
  muteOnFocusLoss: boolean
}

// Visual Settings Interface
export interface VisualSettings {
  animations: boolean
  particleEffects: boolean
  screenShake: boolean
  visualEffects: boolean
  highContrast: boolean
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  brightness: number // 0-200 (100 = normal)
  saturation: number // 0-200 (100 = normal)
  backgroundOpacity: number // 0-100
  gemSize: number // 50-150 (100 = normal)
  showGrid: boolean
  showHints: boolean
  showTrajectory: boolean
  reducedMotion: boolean
}

// Gameplay Settings Interface
export interface GameplaySettings {
  difficulty: DifficultyLevel
  hintsEnabled: boolean
  autoSave: boolean
  pauseOnFocusLoss: boolean
  confirmMoves: boolean
  swapAnimation: boolean
  cascadeDelay: number // milliseconds
  moveTimeout: number // seconds
  showScoreFloats: boolean
  showComboIndicator: boolean
  autoNextLevel: boolean
  skipTutorials: boolean
  showMoveCounter: boolean
  enablePowerUps: boolean
}

// Theme Settings Interface
export interface ThemeSettings {
  currentTheme: ThemeType
  customThemes: CustomTheme[]
  backgroundStyle: 'static' | 'animated' | 'particles'
  gemStyle: 'classic' | 'modern' | 'minimal' | 'neon'
  boardStyle: 'flat' | '3d' | 'glass' | 'wooden'
  accentColor: string
  fontFamily: string
  fontSize: number // 80-120 (100 = normal)
}

// Custom Theme Interface
export interface CustomTheme {
  id: string
  name: string
  displayName: string
  description: string
  author: string
  version: string
  backgroundImage?: string
  backgroundColor: string
  accentColor: string
  textColor: string
  borderColor: string
  shadowColor: string
  isUserCreated: boolean
  isActive: boolean
}

// Accessibility Settings Interface
export interface AccessibilitySettings {
  reducedMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReaderSupport: boolean
  keyboardNavigation: boolean
  skipAnimations: boolean
  focusIndicators: boolean
  alternativeText: boolean
  colorBlindSupport: boolean
  audioDescriptions: boolean
  captionsEnabled: boolean
  gestureAlternatives: boolean
  timeoutExtension: boolean
  simplifyInterface: boolean
}

// Input Settings Interface
export interface InputSettings {
  primaryInput: InputMethod
  touchSensitivity: number // 1-10
  mouseSensitivity: number // 1-10
  keyboardRepeatRate: number // 1-10
  gesturesEnabled: boolean
  rightClickEnabled: boolean
  doubleClickEnabled: boolean
  dragDistance: number // pixels
  swipeThreshold: number // pixels
  hapticFeedback: boolean
  mouseWheelZoom: boolean
  keyboardShortcuts: Record<string, string>
  customGestures: CustomGesture[]
}

// Custom Gesture Interface
export interface CustomGesture {
  id: string
  name: string
  pattern: string
  action: string
  isEnabled: boolean
}

// Performance Settings Interface
export interface PerformanceSettings {
  maxFPS: number // 30, 60, 120, unlimited
  renderQuality: 'low' | 'medium' | 'high' | 'ultra'
  qualityLevel: 'minimal' | 'low' | 'medium' | 'high' | 'ultra'
  autoQuality: boolean
  enableEffects: boolean
  enableAnimations: boolean
  maxEffects: number
  targetFPS: number
  hardwareAcceleration: boolean
  useWebGL: boolean
  enableShadows: boolean
  antiAliasing: boolean
  textureQuality: 'low' | 'medium' | 'high'
  particleLimit: number
  enableVSync: boolean
  powerSaving: boolean
  backgroundRendering: boolean
}

// Privacy Settings Interface
export interface PrivacySettings {
  analytics: boolean
  crashReporting: boolean
  personalizedAds: boolean
  dataSaving: boolean
  localStorageOnly: boolean
  shareProgress: boolean
  allowSpectators: boolean
  showOnline: boolean
  profileVisibility: 'public' | 'friends' | 'private'
}

// Main Settings Interface
export interface GameSettings {
  audio: AudioSettings
  visual: VisualSettings
  gameplay: GameplaySettings
  theme: ThemeSettings
  accessibility: AccessibilitySettings
  input: InputSettings
  performance: PerformanceSettings
  privacy: PrivacySettings
  version: string
  lastModified: Date
  cloudSync: boolean
}

// Settings Categories for UI Organization
export interface SettingsCategory {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  order: number
  isAdvanced: boolean
  requiresRestart: boolean
}

// Settings Action Types
export type SettingsAction = 
  | { type: 'LOAD_SETTINGS'; payload: GameSettings }
  | { type: 'UPDATE_AUDIO'; payload: Partial<AudioSettings> }
  | { type: 'UPDATE_VISUAL'; payload: Partial<VisualSettings> }
  | { type: 'UPDATE_GAMEPLAY'; payload: Partial<GameplaySettings> }
  | { type: 'UPDATE_THEME'; payload: Partial<ThemeSettings> }
  | { type: 'UPDATE_ACCESSIBILITY'; payload: Partial<AccessibilitySettings> }
  | { type: 'UPDATE_INPUT'; payload: Partial<InputSettings> }
  | { type: 'UPDATE_PERFORMANCE'; payload: Partial<PerformanceSettings> }
  | { type: 'UPDATE_PRIVACY'; payload: Partial<PrivacySettings> }
  | { type: 'RESET_SETTINGS'; payload?: Partial<GameSettings> }
  | { type: 'IMPORT_SETTINGS'; payload: GameSettings }
  | { type: 'EXPORT_SETTINGS' }
  | { type: 'VALIDATE_SETTINGS'; payload: GameSettings }

// Settings Validation Types
export interface SettingsValidation {
  isValid: boolean
  errors: SettingsError[]
  warnings: SettingsWarning[]
}

export interface SettingsError {
  path: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface SettingsWarning {
  path: string
  message: string
  recommendation: string
}

// Hot Key Configuration
export interface HotKey {
  id: string
  name: string
  description: string
  defaultKey: string
  currentKey: string
  modifiers: string[]
  category: string
  isCustomizable: boolean
  isGlobal: boolean
}

// Theme Preview Data
export interface ThemePreview {
  themeId: string
  previewImage: string
  colors: string[]
  description: string
} 