'use client'

import { useState, useEffect } from 'react'

interface Venue {
  id: string
  name: string
  code: string
  address: string | null
  active: boolean
  active_checkins: number
  created_at: string
}

function busyness(count: number): { label: string; color: string } {
  if (count === 0) return { label: 'Empty', color: 'text-zinc-600' }
  if (count <= 2) return { label: 'Quiet', color: 'text-green-500' }
  if (count <= 5) return { label: 'Active', color: 'text-yellow-400' }
  return { label: 'Busy', color: 'text-red-400' }
}

export default function VenueManager() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add form state
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/venues')
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to load venues.'); return }
      setVenues(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAdding(true)
    try {
      const res = await fetch('/api/admin/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), code: code.trim(), address: address.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error ?? 'Failed to add venue.'); return }
      setVenues(prev => [{ ...data, active_checkins: 0 }, ...prev])
      setName(''); setCode(''); setAddress('')
    } finally {
      setAdding(false)
    }
  }

  async function toggleActive(venue: Venue) {
    const res = await fetch(`/api/admin/venues/${venue.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !venue.active }),
    })
    if (!res.ok) return
    setVenues(prev => prev.map(v => v.id === venue.id ? { ...v, active: !v.active } : v))
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/venues/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setVenues(prev => prev.filter(v => v.id !== id))
    setConfirmDelete(null)
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading venues...</p>
  if (error) return <p className="text-sm text-red-400">{error}</p>

  return (
    <div className="space-y-8">

      {/* Add venue form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Add a venue</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Devlux Coffee"
                maxLength={80}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">Short code</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="devlux"
                maxLength={20}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 font-mono"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Address <span className="text-zinc-700 normal-case">(optional)</span></label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="123 Main St, Austin TX"
              maxLength={200}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400"
            />
          </div>
          {addError && <p className="text-xs text-red-400">{addError}</p>}
          <button
            type="submit"
            disabled={adding || !name.trim() || !code.trim()}
            className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {adding ? 'Adding...' : 'Add venue'}
          </button>
        </form>
      </div>

      {/* Venue list */}
      {venues.length === 0 ? (
        <p className="text-sm text-zinc-600 text-center py-8">No venues yet. Add one above.</p>
      ) : (
        <ul className="space-y-3">
          {venues.map(venue => {
            const busy = busyness(venue.active_checkins)
            return (
              <li
                key={venue.id}
                className={`bg-zinc-900 border rounded-xl p-4 flex items-start justify-between gap-4 ${
                  venue.active ? 'border-zinc-800' : 'border-zinc-800/40 opacity-60'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{venue.name}</span>
                    <span className="font-mono text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
                      {venue.code}
                    </span>
                    {!venue.active && (
                      <span className="text-xs text-zinc-600 italic">inactive</span>
                    )}
                  </div>
                  {venue.address && (
                    <p className="text-xs text-zinc-500">{venue.address}</p>
                  )}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className={`text-xs font-medium ${busy.color}`}>{busy.label}</span>
                    <span className="text-zinc-700 text-xs">·</span>
                    <span className="text-xs text-zinc-600">
                      {venue.active_checkins} checked in
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(venue)}
                    className="px-3 py-1.5 text-xs border border-zinc-700 text-zinc-400 rounded-lg hover:border-zinc-500 hover:text-white transition-colors"
                  >
                    {venue.active ? 'Deactivate' : 'Activate'}
                  </button>
                  {confirmDelete === venue.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(venue.id)}
                        className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(venue.id)}
                      className="px-3 py-1.5 text-xs text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
