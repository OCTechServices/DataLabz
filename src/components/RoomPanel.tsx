'use client'

import { useState } from 'react'
import type { RoomWithCreator, Milestone, RoomLink } from '@/types/database'
import { LINK_LABELS } from '@/lib/constants'

interface Props {
  room: RoomWithCreator
  isCreator: boolean
  onUpdated: (room: RoomWithCreator) => void
  onClose: () => void
}

export default function RoomPanel({ room, isCreator, onUpdated, onClose }: Props) {
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(room.name)
  const [milestones, setMilestones] = useState<Milestone[]>(room.milestones ?? [])
  const [milestoneInput, setMilestoneInput] = useState('')
  const [links, setLinks] = useState<RoomLink[]>(room.links ?? [])
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      onUpdated({ ...room, ...data })
    } finally {
      setSaving(false)
    }
  }

  async function saveName() {
    if (nameValue.trim() === room.name) { setEditingName(false); return }
    await patch({ name: nameValue.trim() })
    setEditingName(false)
  }

  async function saveMilestones(updated: Milestone[]) {
    setMilestones(updated)
    await patch({ milestones: updated })
  }

  function addMilestone() {
    const text = milestoneInput.trim()
    if (!text) return
    const updated = [...milestones, { id: crypto.randomUUID(), text, done: false }]
    setMilestoneInput('')
    saveMilestones(updated)
  }

  function toggleMilestone(id: string) {
    const updated = milestones.map(m => m.id === id ? { ...m, done: !m.done } : m)
    saveMilestones(updated)
  }

  function removeMilestone(id: string) {
    const updated = milestones.filter(m => m.id !== id)
    saveMilestones(updated)
  }

  async function saveLinks(updated: RoomLink[]) {
    setLinks(updated)
    await patch({ links: updated })
  }

  function addLink() {
    const label = linkLabel.trim()
    const url = linkUrl.trim()
    if (!label || !url) return
    setLinkLabel('')
    setLinkUrl('')
    saveLinks([...links, { id: crypto.randomUUID(), label, url }])
  }

  function removeLink(id: string) {
    saveLinks(links.filter(l => l.id !== id))
  }

  const doneCount = milestones.filter(m => m.done).length
  const statusLabel = room.status === 'active' ? 'Active' : room.status === 'paused' ? 'Paused' : 'Frozen'
  const statusColor = room.status === 'active' ? 'text-emerald-400' : room.status === 'paused' ? 'text-amber-400' : 'text-blue-400'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-zinc-900 border-l border-zinc-700 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <span className={`text-xs font-medium uppercase tracking-widest ${statusColor}`}>
            {statusLabel}
          </span>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Task name */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Task</label>
            {isCreator && editingName ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                  maxLength={80}
                  className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-400"
                />
                <button
                  onClick={saveName}
                  disabled={saving}
                  className="px-3 py-2 text-xs bg-white text-black rounded-lg hover:bg-zinc-200 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameValue(room.name) }}
                  className="px-3 py-2 text-xs bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-2 group">
                <p className="text-white text-base font-medium flex-1">{room.name}</p>
                {isCreator && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-zinc-600 hover:text-zinc-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">Goals</label>
              {milestones.length > 0 && (
                <span className="text-xs text-zinc-600">{doneCount}/{milestones.length} done</span>
              )}
            </div>

            <ul className="space-y-2">
              {milestones.map(m => (
                <li key={m.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => isCreator && toggleMilestone(m.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      m.done
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-zinc-600 hover:border-zinc-400'
                    } ${!isCreator ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {m.done && <span className="text-black text-[10px] font-bold">✓</span>}
                  </button>
                  <span className={`flex-1 text-sm ${m.done ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                    {m.text}
                  </span>
                  {isCreator && (
                    <button
                      onClick={() => removeMilestone(m.id)}
                      className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {isCreator && (
              <div className="flex gap-2 pt-1">
                <input
                  value={milestoneInput}
                  onChange={e => setMilestoneInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMilestone() } }}
                  placeholder="Add a goal..."
                  maxLength={100}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <button
                  onClick={addMilestone}
                  className="px-3 py-2 text-xs bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Links */}
          {(links.length > 0 || isCreator) && (
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">Links</label>
              <div className="flex flex-wrap gap-2">
                {links.map(l => (
                  <div key={l.id} className="flex items-center gap-1 group">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-zinc-800 text-zinc-300 rounded-md hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                      <span>↗</span>
                      {l.label}
                    </a>
                    {isCreator && (
                      <button
                        onClick={() => removeLink(l.id)}
                        className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isCreator && (
                <div className="flex gap-2 pt-1">
                  <input
                    value={linkLabel}
                    onChange={e => setLinkLabel(e.target.value)}
                    list="panel-link-labels"
                    placeholder="Label"
                    maxLength={24}
                    className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                  <datalist id="panel-link-labels">
                    {LINK_LABELS.map(l => <option key={l} value={l} />)}
                  </datalist>
                  <input
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
                    placeholder="https://..."
                    maxLength={500}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                  <button onClick={addLink} className="px-2.5 py-1.5 text-xs bg-zinc-700 text-white rounded-lg hover:bg-zinc-600">
                    Add
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {room.stack_tags.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">Stack</label>
              <div className="flex flex-wrap gap-1.5">
                {room.stack_tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-300 rounded-md">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Creator */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Builder</label>
            <p className="text-zinc-300 text-sm">{room.profiles?.display_name ?? 'unknown'}</p>
          </div>

          {/* Members */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">In the room</label>
            <p className="text-zinc-300 text-sm">{room.member_count ?? 1} builder{(room.member_count ?? 1) !== 1 ? 's' : ''}</p>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        {/* Footer — creator controls */}
        {isCreator && room.status !== 'closed' && (
          <div className="px-6 py-5 border-t border-zinc-800 space-y-2">
            {room.status === 'active' && (
              <button
                onClick={() => patch({ status: 'paused' })}
                disabled={saving}
                className="w-full py-2.5 text-sm font-medium bg-zinc-800 text-amber-400 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Take a break
              </button>
            )}
            {room.status === 'paused' && (
              <button
                onClick={() => patch({ status: 'active' })}
                disabled={saving}
                className="w-full py-2.5 text-sm font-medium bg-zinc-800 text-emerald-400 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Resume
              </button>
            )}
            <button
              onClick={() => patch({ status: 'closed' }).then(() => onClose())}
              disabled={saving}
              className="w-full py-2.5 text-sm font-medium bg-zinc-800 text-red-400 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Close room
            </button>
          </div>
        )}

        {/* Footer — non-creator */}
        {!isCreator && (
          <div className="px-6 py-5 border-t border-zinc-800">
            <button
              disabled
              className="w-full py-2.5 text-sm font-medium bg-zinc-800 text-zinc-500 rounded-lg cursor-not-allowed"
            >
              Request to join — coming soon
            </button>
          </div>
        )}
      </div>
    </>
  )
}
