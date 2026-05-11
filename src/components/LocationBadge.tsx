'use client'

import { useState } from 'react'
import type { ActiveCheckIn } from '@/types/database'

export default function LocationBadge({ checkIn }: { checkIn: ActiveCheckIn | null }) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      await fetch('/api/checkin', { method: 'DELETE' })
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  if (!checkIn) return null

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
      <span className="text-xs text-zinc-400">{checkIn.venues.name}</span>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="text-zinc-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  )
}
