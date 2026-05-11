'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import RoomCard from './RoomCard'
import CreateRoomModal from './CreateRoomModal'
import RoomPanel from './RoomPanel'
import type { RoomWithCreator, WorldTheme } from '@/types/database'

const VirtualHive = dynamic(() => import('./VirtualHive'), { ssr: false })

interface Props {
  initialRooms: RoomWithCreator[]
  currentUserId: string
  venueId: string | null
  theme: WorldTheme
}

export default function HiveBoard({ initialRooms, currentUserId, venueId, theme }: Props) {
  const [rooms, setRooms] = useState<RoomWithCreator[]>(initialRooms)
  const [showModal, setShowModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<RoomWithCreator | null>(null)
  const [view, setView] = useState<'board' | 'world'>('board')

  async function refetch() {
    const res = await fetch('/api/rooms')
    const data = await res.json()
    if (Array.isArray(data)) setRooms(data)
  }

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('rooms-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, refetch)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function handleRoomCreated() {
    setShowModal(false)
    refetch()
  }

  function handleRoomUpdated(updated: RoomWithCreator) {
    if (updated.status === 'closed') {
      setRooms(prev => prev.filter(r => r.id !== updated.id))
      setSelectedRoom(null)
    } else {
      setRooms(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
      setSelectedRoom(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev)
    }
  }

  const activeRooms = rooms.filter(r => r.status === 'active')
  const pausedRooms = rooms.filter(r => r.status === 'paused')
  const frozenRooms = rooms.filter(r => r.status === 'frozen')

  return (
    <div className="space-y-8">
      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-zinc-500 text-sm">
          {activeRooms.length} active · {pausedRooms.length} paused · {frozenRooms.length} frozen
        </p>
        <div className="flex items-center gap-2">
          {/* Board / World toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1.5 rounded-md transition-colors ${view === 'board' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Board
            </button>
            <button
              onClick={() => setView('world')}
              className={`px-3 py-1.5 rounded-md transition-colors ${view === 'world' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              World
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
          >
            + Open room
          </button>
        </div>
      </div>

      {/* World view */}
      {view === 'world' && (
        <VirtualHive rooms={rooms} currentUserId={currentUserId} theme={theme} />
      )}

      {/* Board view */}
      {view === 'board' && activeRooms.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest">Live now</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeRooms.map(room => (
              <RoomCard key={room.id} room={room} onClick={() => setSelectedRoom(room)} />
            ))}
          </div>
        </section>
      )}

      {/* Paused rooms */}
      {view === 'board' && pausedRooms.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest">On a break</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pausedRooms.map(room => (
              <RoomCard key={room.id} room={room} onClick={() => setSelectedRoom(room)} />
            ))}
          </div>
        </section>
      )}

      {/* Frozen rooms */}
      {view === 'board' && frozenRooms.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest">Frozen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {frozenRooms.map(room => (
              <RoomCard key={room.id} room={room} onClick={() => setSelectedRoom(room)} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {view === 'board' && rooms.length === 0 && (
        <div className="border border-zinc-800 rounded-xl p-12 text-center space-y-2">
          <p className="text-zinc-400 text-sm">No rooms open right now.</p>
          <p className="text-zinc-600 text-xs">Be the first to lock in.</p>
        </div>
      )}

      {showModal && (
        <CreateRoomModal
          onCreated={handleRoomCreated}
          onClose={() => setShowModal(false)}
          venueId={venueId}
        />
      )}

      {selectedRoom && (
        <RoomPanel
          room={selectedRoom}
          isCreator={selectedRoom.creator_id === currentUserId}
          onUpdated={handleRoomUpdated}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  )
}
