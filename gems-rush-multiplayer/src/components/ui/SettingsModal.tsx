'use client'

import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, Trash2 } from 'lucide-react'
import { resetProgress, useSettings } from '@/lib/settings'
import { Modal } from './Modal'

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
    if (isOpen) setConfirmingReset(false)
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" icon={SettingsIcon}>
      <div className="divide-y divide-line">
        <div className="flex items-center justify-between gap-4 pb-4">
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
        <div className="pt-4">
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
      </div>
    </Modal>
  )
}
