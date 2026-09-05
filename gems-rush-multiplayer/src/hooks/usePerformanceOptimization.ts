'use client'

import { useCallback, useEffect, useRef, useMemo, useState } from 'react'

export interface PerformanceMetrics {
  frameRate: number
  memoryUsage: number
  lastUpdate: number
  deviceType: 'mobile' | 'tablet' | 'desktop'
  isLowEnd: boolean
}

// Enhanced performance detection
const detectDevicePerformance = () => {
  const ua = navigator.userAgent
  const hardwareConcurrency = navigator.hardwareConcurrency || 2
  const memory = (navigator as any).deviceMemory || 4
  
  // Mobile detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const isTablet = /iPad|Android(?=.*Tablet)|Tablet/i.test(ua)
  
  // Low-end device detection
  const isLowEnd = hardwareConcurrency <= 2 || memory <= 2 || 
    (isMobile && !(/iPhone 1[2-9]|iPhone [2-9][0-9]/.test(ua)))
  
  const deviceType: 'mobile' | 'tablet' | 'desktop' = isMobile ? 'mobile' : (isTablet ? 'tablet' : 'desktop')
  
  return { deviceType, isLowEnd }
}

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }) as T
}

// Throttle utility
const throttle = <T extends (...args: any[]) => any>(func: T, limit: number): T => {
  let inThrottle: boolean
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}

// Check for reduced motion preference
const prefersReducedMotion = () => {
  if (document.documentElement.classList.contains('reduce-motion')) return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// Performance quality levels
export type PerformanceQuality = 'ultra' | 'high' | 'medium' | 'low' | 'minimal'

// User preference for auto-quality adjustment
export type QualityMode = 'auto' | 'locked'

export const getPerformanceQuality = (
  frameRate: number, 
  isLowEnd: boolean, 
  prefersReduced: boolean,
  currentQuality?: PerformanceQuality,
  qualityMode: QualityMode = 'auto'
): PerformanceQuality => {
  if (prefersReduced) return 'minimal'
  if (isLowEnd) return 'low'
  
  // If quality is locked, don't change it
  if (qualityMode === 'locked' && currentQuality) {
    return currentQuality
  }
  
  // Use much wider hysteresis to prevent oscillation between quality levels
  // Require significant performance difference for quality changes
  const upgradeThresholds = { minimal: 30, low: 40, medium: 52, high: 60 }
  const downgradeThresholds = { ultra: 45, high: 35, medium: 25, low: 15 }
  
  // If we have a current quality, use hysteresis with wider margins
  if (currentQuality) {
    switch (currentQuality) {
      case 'minimal':
        return frameRate >= upgradeThresholds.minimal ? 'low' : 'minimal'
      case 'low':
        if (frameRate <= downgradeThresholds.low) return 'minimal'
        if (frameRate >= upgradeThresholds.low) return 'medium'
        return 'low'
      case 'medium':
        if (frameRate <= downgradeThresholds.medium) return 'low'
        if (frameRate >= upgradeThresholds.medium) return 'high'
        return 'medium'
      case 'high':
        if (frameRate <= downgradeThresholds.high) return 'medium'
        if (frameRate >= upgradeThresholds.high) return 'ultra'
        return 'high'
      case 'ultra':
        return frameRate <= downgradeThresholds.ultra ? 'high' : 'ultra'
      default:
        break
    }
  }
  
  // Conservative initial quality determination to prevent immediate upgrades
  if (frameRate < 20) return 'minimal'
  if (frameRate < 30) return 'low'
  if (frameRate < 40) return 'medium'
  if (frameRate < 50) return 'high'
  return 'ultra'
}

// Get optimized animation config based on performance
export const getOptimizedAnimationConfig = (baseConfig: any, quality: PerformanceQuality) => {
  const configs = {
    minimal: {
      scale: baseConfig.scale || 1,
      opacity: baseConfig.opacity || 1,
      duration: 0,
      transition: { duration: 0 }
    },
    low: {
      scale: baseConfig.scale || 1,
      opacity: baseConfig.opacity || 1,
      duration: (baseConfig.duration || 0.3) * 0.3,
      transition: { ...baseConfig.transition, ease: 'linear', duration: (baseConfig.transition?.duration || 0.3) * 0.3 }
    },
    medium: {
      ...baseConfig,
      duration: (baseConfig.duration || 0.3) * 0.5,
      transition: { ...baseConfig.transition, ease: 'easeOut', duration: (baseConfig.transition?.duration || 0.3) * 0.5 }
    },
    high: {
      ...baseConfig,
      duration: (baseConfig.duration || 0.3) * 0.8,
      transition: { ...baseConfig.transition, duration: (baseConfig.transition?.duration || 0.3) * 0.8 }
    },
    ultra: {
      ...baseConfig
    }
  }
  
  return configs[quality]
}

// Hardware acceleration utilities
export const enableHardwareAcceleration = (element: HTMLElement) => {
  element.style.transform = 'translateZ(0)'
  element.style.willChange = 'transform'
  element.style.backfaceVisibility = 'hidden'
}

export const disableHardwareAcceleration = (element: HTMLElement) => {
  element.style.willChange = 'auto'
  element.style.transform = ''
  element.style.backfaceVisibility = ''
}

// Enhanced performance optimization hook
export const usePerformanceOptimization = (userQualityMode: QualityMode = 'auto') => {
  const frameRateRef = useRef(60)
  const frameTimesRef = useRef<number[]>([])
  const lastFrameTime = useRef(performance.now())
  const [quality, setQuality] = useState<PerformanceQuality>('high')
  const [deviceInfo] = useState(() => detectDevicePerformance())
  const rafIdRef = useRef<number | undefined>(undefined)
  const lastQualityChange = useRef(Date.now())
  const qualityStabilityCounter = useRef(0)
  const [isQualityLocked, setIsQualityLocked] = useState(false)

  // Lock quality if user prefers it
  useEffect(() => {
    setIsQualityLocked(userQualityMode === 'locked')
  }, [userQualityMode])

  // Advanced frame rate monitoring with much more conservative quality changes
  useEffect(() => {
    let frameCount = 0
    const maxSamples = 90 // Longer sampling for stability
    
    const measureFrameRate = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTime.current
      frameTimesRef.current.push(deltaTime)
      
      // Keep only recent samples
      if (frameTimesRef.current.length > maxSamples) {
        frameTimesRef.current.shift()
      }
      
      frameCount++
      lastFrameTime.current = timestamp
      
      // Calculate average FPS every 60 frames (more stable)
      if (frameCount >= 60 && frameTimesRef.current.length >= 30) {
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b) / frameTimesRef.current.length
        const fps = Math.round(1000 / avgFrameTime)
        frameRateRef.current = Math.max(1, Math.min(60, fps))
        
        // Only update quality if auto mode is enabled and not locked
        if (!isQualityLocked && userQualityMode === 'auto') {
          const newQuality = getPerformanceQuality(fps, deviceInfo.isLowEnd, prefersReducedMotion(), quality, userQualityMode)
          const now = Date.now()
          
          // Much more conservative quality changes:
          // 1. At least 5 seconds between changes
          // 2. Need consistent performance for at least 5 cycles (300 frames)
          // 3. Only change if there's a significant performance difference
          if (newQuality !== quality) {
            qualityStabilityCounter.current++
            
            if (now - lastQualityChange.current > 5000 && qualityStabilityCounter.current >= 5) {
              // Additional check: only change if the FPS difference is significant
              const qualityToFpsMap = { minimal: 15, low: 25, medium: 35, high: 45, ultra: 55 }
              const currentQualityExpectedFps = qualityToFpsMap[quality]
              const newQualityExpectedFps = qualityToFpsMap[newQuality]
              
              // Only change if there's at least a 10 FPS difference from expected
              if (Math.abs(fps - currentQualityExpectedFps) > 10) {
                console.log(`🎮 Performance: Quality changed from ${quality} to ${newQuality} (FPS: ${fps})`)
                setQuality(newQuality)
                lastQualityChange.current = now
                qualityStabilityCounter.current = 0
              }
            }
          } else {
            // Reset counter if quality is stable
            qualityStabilityCounter.current = Math.max(0, qualityStabilityCounter.current - 1)
          }
        }
        
        frameCount = 0
      }
      
      rafIdRef.current = requestAnimationFrame(measureFrameRate)
    }

    rafIdRef.current = requestAnimationFrame(measureFrameRate)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [quality, deviceInfo.isLowEnd, isQualityLocked, userQualityMode])

  // Function to manually set quality (locks it)
  const setManualQuality = useCallback((newQuality: PerformanceQuality) => {
    setQuality(newQuality)
    setIsQualityLocked(true)
    console.log(`🎮 Performance: Quality manually locked to ${newQuality}`)
  }, [])

  // Function to enable auto quality
  const enableAutoQuality = useCallback(() => {
    setIsQualityLocked(false)
    console.log('🎮 Performance: Auto quality enabled')
  }, [])

  const optimizedDebounce = useCallback(
    <T extends (...args: any[]) => any>(func: T, delay: number) => {
      const adjustedDelay = quality === 'minimal' ? delay * 2 : 
                           quality === 'low' ? delay * 1.5 : delay
      return debounce(func, adjustedDelay)
    },
    [quality]
  )

  const optimizedThrottle = useCallback(
    <T extends (...args: any[]) => any>(func: T, limit: number) => {
      const adjustedLimit = quality === 'minimal' ? limit * 2 : 
                            quality === 'low' ? limit * 1.5 : limit
      return throttle(func, adjustedLimit)
    },
    [quality]
  )

  const getOptimizedAnimation = useCallback((baseConfig: any) => {
    return getOptimizedAnimationConfig(baseConfig, quality)
  }, [quality])

  const shouldAnimate = useMemo(() => {
    return quality !== 'minimal' && !prefersReducedMotion()
  }, [quality])

  const shouldShowEffects = useMemo(() => {
    return ['high', 'ultra'].includes(quality) && !prefersReducedMotion()
  }, [quality])

  const shouldShowParticles = useMemo(() => {
    return quality === 'ultra' && !prefersReducedMotion()
  }, [quality])

  const isHighPerformance = useMemo(() => frameRateRef.current >= 50 && quality === 'ultra', [quality])
  const isReducedMotion = useMemo(() => prefersReducedMotion(), [])

  // Performance monitoring
  const getPerformanceStats = useCallback(() => {
    return {
      frameRate: frameRateRef.current,
      quality,
      deviceType: deviceInfo.deviceType,
      isLowEnd: deviceInfo.isLowEnd,
      shouldAnimate,
      shouldShowEffects,
      shouldShowParticles,
      isQualityLocked,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    }
  }, [quality, deviceInfo.deviceType, deviceInfo.isLowEnd, shouldAnimate, shouldShowEffects, shouldShowParticles, isQualityLocked])

  return {
    frameRate: frameRateRef.current,
    quality,
    deviceType: deviceInfo.deviceType,
    isLowEnd: deviceInfo.isLowEnd,
    isQualityLocked,
    setManualQuality,
    enableAutoQuality,
    optimizedDebounce,
    optimizedThrottle,
    getOptimizedAnimation,
    isHighPerformance,
    isReducedMotion,
    shouldAnimate,
    shouldShowEffects,
    shouldShowParticles,
    enableHardwareAcceleration,
    disableHardwareAcceleration,
    getPerformanceStats
  }
}

export default usePerformanceOptimization 