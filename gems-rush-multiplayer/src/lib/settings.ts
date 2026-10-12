'use client'

import { useEffect, useSyncExternalStore } from 'react'

export type Settings = { animations: boolean; hints: boolean }

const STORAGE_KEY = 'gems-rush-settings'
const DEFAULTS: Settings = { animations: true, hints: true }

let current: Settings | null = null
const subscribers = new Set<() => void>()

function read(): Settings {
  if (typeof window === 'undefined') return DEFAULTS
  if (current) return current
  const raw = localStorage.getItem(STORAGE_KEY)
  const loaded: Settings = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  current = loaded
  return loaded
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...read(), ...patch }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  subscribers.forEach(fn => fn())
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const settings = useSyncExternalStore(
    fn => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
    read,
    () => DEFAULTS
  )
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', !settings.animations)
  }, [settings.animations])
  return [settings, updateSettings]
}

export function resetProgress() {
  for (const key of [
    'gems-rush-user-stats',
    'gems-rush-stage-progress',
    'gems_rush_statistics',
    'gems-rush-has-played',
    STORAGE_KEY,
  ]) {
    localStorage.removeItem(key)
  }
  location.reload()
}
