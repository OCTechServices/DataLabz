'use client'

import { useState } from 'react'
import type { Milestone, RoomLink } from '@/types/database'
import { LINK_LABELS } from '@/lib/constants'

const SUGGESTED_TAGS = ['React', 'Next.js', 'Node', 'Python', 'TypeScript', 'Design', 'Mobile', 'API', 'Data', 'DevOps']

interface Prefill {
  name: string
  stack_tags: string[]
  milestones: Milestone[]
  links: RoomLink[]
  session: number
}

interface Props {
  onCreated: (room: unknown) => void
  onClose: () => void
  venueId: string | null
  prefill?: Prefill
}

export default function CreateRoomModal({ onCreated, onClose, venueId, prefill }: Props) {
  const [name, setName] = useState(prefill?.name ?? '')
  const [tags, setTags] = useState<string[]>(prefill?.stack_tags ?? [])
  const [customTag, setCustomTag] = useState('')
  const [milestones, setMilestones] = useState<Milestone[]>(prefill?.milestones ?? [])
  const [milestoneInput, setMilestoneInput] = useState('')
  const [links, setLinks] = useState<RoomLink[]>(prefill?.links ?? [])
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag].slice(0, 5))
  }

  function addCustomTag() {
    const t = customTag.trim()
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags(prev => [...prev, t])
      setCustomTag('')
    }
  }

  function addMilestone() {
    const text = milestoneInput.trim()
    if (!text) return
    setMilestones(prev => [...prev, { id: crypto.randomUUID(), text, done: false }])
    setMilestoneInput('')
  }

  function removeMilestone(id: string) {
    setMilestones(prev => prev.filter(m => m.id !== id))
  }

  function addLink() {
    const label = linkLabel.trim()
    const url = linkUrl.trim()
    if (!label || !url) return
    setLinks(prev => [...prev, { id: crypto.randomUUID(), label, url }])
    setLinkLabel('')
    setLinkUrl('')
  }

  function removeLink(id: string) {
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name.trim().length < 3) {
      setError('Room name must be at least 3 characters.')
      return
    }
    if (milestones.length === 0) {
      setError('Add at least one goal before locking in.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), stack_tags: tags, milestones, links, venue_id: venueId, session: prefill?.session ?? 1 }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create room.'); return }
      onCreated(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            {prefill ? `Session ${prefill.session} — Start again` : 'Open a room'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Task name */}
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">What are you building?</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={80}
              placeholder="e.g. Building the auth flow for data-labz"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
            />
          </div>

          {/* Milestones — required */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">
              Session goals <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-zinc-600">What do you want to ship today? Add at least one.</p>
            <div className="flex gap-2">
              <input
                value={milestoneInput}
                onChange={e => setMilestoneInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMilestone() } }}
                placeholder="e.g. Wire up the login flow"
                maxLength={100}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              />
              <button
                type="button"
                onClick={addMilestone}
                className="px-3 py-2 text-xs bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
              >
                Add
              </button>
            </div>
            {milestones.length > 0 && (
              <ul className="space-y-1.5">
                {milestones.map(m => (
                  <li key={m.id} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                    <span className="flex-1">{m.text}</span>
                    <button type="button" onClick={() => removeMilestone(m.id)} className="text-zinc-600 hover:text-red-400">&times;</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">Stack / tags (max 5)</label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    tags.includes(tag)
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
                placeholder="Custom tag"
                maxLength={20}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              />
              <button type="button" onClick={addCustomTag} className="px-3 py-2 text-xs bg-zinc-700 text-white rounded-lg hover:bg-zinc-600">
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-zinc-800 text-zinc-300 rounded-md">
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)} className="text-zinc-500 hover:text-white">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Links — optional */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">Links <span className="text-zinc-600 normal-case">(optional)</span></label>
            <p className="text-xs text-zinc-600">GitHub repo, PR, Figma, Loom — anything relevant.</p>
            <div className="flex gap-2">
              <input
                value={linkLabel}
                onChange={e => setLinkLabel(e.target.value)}
                list="link-labels"
                placeholder="Label"
                maxLength={24}
                className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              />
              <datalist id="link-labels">
                {LINK_LABELS.map(l => <option key={l} value={l} />)}
              </datalist>
              <input
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
                placeholder="https://..."
                maxLength={500}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              />
              <button type="button" onClick={addLink} className="px-3 py-2 text-xs bg-zinc-700 text-white rounded-lg hover:bg-zinc-600">
                Add
              </button>
            </div>
            {links.length > 0 && (
              <ul className="space-y-1.5">
                {links.map(l => (
                  <li key={l.id} className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500 shrink-0">{l.label}</span>
                    <span className="flex-1 text-zinc-400 truncate">{l.url}</span>
                    <button type="button" onClick={() => removeLink(l.id)} className="text-zinc-600 hover:text-red-400">&times;</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading || milestones.length === 0}
            className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Opening room...' : 'Lock in'}
          </button>
        </form>
      </div>
    </div>
  )
}
