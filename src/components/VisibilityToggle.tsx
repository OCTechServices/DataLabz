'use client'

import { useState } from 'react'
import type { VisibilityStatus } from '@/types/database'

const options: { value: VisibilityStatus; label: string; color: string }[] = [
  { value: 'online',  label: 'Online',  color: 'bg-emerald-500' },
  { value: 'away',    label: 'Away',    color: 'bg-amber-400' },
  { value: 'offline', label: 'Offline', color: 'bg-zinc-500' },
]

export default function VisibilityToggle({ initial }: { initial: VisibilityStatus }) {
  const [visibility, setVisibility] = useState<VisibilityStatus>(initial)
  const [saving, setSaving] = useState(false)

  async function handleChange(next: VisibilityStatus) {
    if (next === visibility || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: next }),
      })
      if (res.ok) setVisibility(next)
    } finally {
      setSaving(false)
    }
  }

  const current = options.find(o => o.value === visibility)!

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        aria-label="Change visibility"
      >
        <span className={`w-2 h-2 rounded-full ${current.color} ${visibility === 'online' ? 'animate-pulse' : ''}`} />
        {current.label}
      </button>

      <div className="absolute right-0 top-6 hidden group-focus-within:flex group-hover:flex flex-col bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden z-10 min-w-[120px]">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleChange(opt.value)}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-800 transition-colors text-left ${opt.value === visibility ? 'text-white' : 'text-zinc-400'}`}
          >
            <span className={`w-2 h-2 rounded-full ${opt.color}`} />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
