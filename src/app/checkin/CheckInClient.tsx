'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Venue {
  id: string
  name: string
  code: string
  address: string | null
}

export default function CheckInClient({ venue }: { venue: Venue }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCheckIn() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: venue.code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Check-in failed.'); return }
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">You&apos;re at</p>
          <h1 className="text-2xl font-bold tracking-tight">{venue.name}</h1>
          {venue.address && <p className="text-zinc-500 text-sm">{venue.address}</p>}
        </div>

        <div className="border border-zinc-800 rounded-xl p-4 space-y-1">
          <p className="text-xs text-zinc-500">Check-in lasts 8 hours</p>
          <p className="text-xs text-zinc-600">Your location will show on the Hive while you&apos;re here.</p>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          onClick={handleCheckIn}
          disabled={loading}
          className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking in...' : 'Lock in here'}
        </button>

        <a href="/dashboard" className="block text-center text-zinc-600 text-xs hover:text-zinc-400">
          Skip — go to the Hive
        </a>
      </div>
    </main>
  )
}
