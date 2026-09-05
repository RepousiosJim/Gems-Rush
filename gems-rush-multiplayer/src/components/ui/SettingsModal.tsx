'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings as SettingsIcon, Trash2, X } from 'lucide-react'
import { resetProgress, useSettings } from '@/lib/settings'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-violet' : 'bg-surface-2'}`}
    >
      <span
        className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-[21px]' : 'left-[3px]'}`}
      />
    </button>
  )
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useSettings()
  const [confirmingReset, setConfirmingReset] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setConfirmingReset(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="card w-full max-w-md"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2">
                  <SettingsIcon className="h-5 w-5 text-fg-muted" />
                </div>
                <h2 className="text-lg font-semibold text-fg">Settings</h2>
              </div>
              <button onClick={onClose} aria-label="Close settings" className="btn btn-icon btn-ghost">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="divide-y divide-line px-6">
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <div className="font-medium text-fg">Animations</div>
                  <div className="text-sm text-fg-muted">Motion and transition effects</div>
                </div>
                <Toggle
                  label="Animations"
                  checked={settings.animations}
                  onChange={v => setSettings({ animations: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <div className="font-medium text-fg">Hints</div>
                  <div className="text-sm text-fg-muted">Show the hint button during play</div>
                </div>
                <Toggle label="Hints" checked={settings.hints} onChange={v => setSettings({ hints: v })} />
              </div>
            </div>

            <div className="border-t border-line px-6 py-4">
              {confirmingReset ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-fg">Delete all progress?</span>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmingReset(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button onClick={resetProgress} className="btn bg-bad text-fg">
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmingReset(true)} className="btn btn-secondary text-bad">
                  <Trash2 className="h-4 w-4" />
                  Reset progress
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
