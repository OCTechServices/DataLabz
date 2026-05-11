'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CreateRoomModal from '@/components/CreateRoomModal'
import type { RoomWithCreator, Milestone, RoomLink } from '@/types/database'

interface Props {
  rooms: RoomWithCreator[]
  venueId: string | null
}

export default function HistoryClient({ rooms, venueId }: Props) {
  const router = useRouter()
  const [cloneSource, setCloneSource] = useState<RoomWithCreator | null>(null)

  if (rooms.length === 0) {
    return (
      <div className="text-center py-20 space-y-2">
        <p className="text-zinc-500 text-sm">No closed sessions yet.</p>
        <p className="text-zinc-600 text-xs">Rooms appear here once they close at EOD.</p>
      </div>
    )
  }

  function buildPrefill(room: RoomWithCreator) {
    // Carry forward only incomplete milestones, reset to unchecked
    const incompleteMilestones = (room.milestones as Milestone[])
      .filter(m => !m.done)
      .map(m => ({ ...m, done: false }))

    return {
      name: room.name,
      stack_tags: room.stack_tags,
      milestones: incompleteMilestones,
      links: room.links as RoomLink[],
      session: room.session + 1,
    }
  }

  function handleCreated() {
    setCloneSource(null)
    router.push('/dashboard')
  }

  return (
    <>
      <ul className="space-y-3">
        {rooms.map(room => {
          const total = (room.milestones as Milestone[]).length
          const done = (room.milestones as Milestone[]).filter(m => m.done).length
          const incomplete = total - done
          const closedDate = new Date(room.updated_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })

          return (
            <li
              key={room.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600 font-mono">S{room.session}</span>
                  <h3 className="text-sm font-medium text-white truncate">{room.name}</h3>
                </div>

                {/* Tags */}
                {room.stack_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {room.stack_tags.map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Milestone summary */}
                <p className="text-xs text-zinc-500">
                  {done}/{total} goals completed
                  {incomplete > 0 && (
                    <span className="text-zinc-600"> · {incomplete} carry over</span>
                  )}
                  <span className="text-zinc-700"> · {closedDate}</span>
                </p>
              </div>

              <button
                onClick={() => setCloneSource(room)}
                className="shrink-0 px-3 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
              >
                Start again
              </button>
            </li>
          )
        })}
      </ul>

      {cloneSource && (
        <CreateRoomModal
          onCreated={handleCreated}
          onClose={() => setCloneSource(null)}
          venueId={venueId}
          prefill={buildPrefill(cloneSource)}
        />
      )}
    </>
  )
}
