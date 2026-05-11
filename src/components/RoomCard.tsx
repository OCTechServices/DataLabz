import type { RoomWithCreator } from '@/types/database'

const statusStyles = {
  active:  { dot: 'bg-emerald-500 animate-pulse', label: 'Active',  card: 'border-zinc-700 hover:border-zinc-500' },
  paused:  { dot: 'bg-amber-400',                 label: 'Paused',  card: 'border-zinc-800 opacity-60 hover:opacity-80' },
  frozen:  { dot: 'bg-blue-400',                  label: 'Frozen',  card: 'border-zinc-800 opacity-40 hover:opacity-60' },
  closed:  { dot: 'bg-zinc-600',                  label: 'Closed',  card: 'border-zinc-800 opacity-30' },
}

export default function RoomCard({ room, onClick }: { room: RoomWithCreator; onClick: () => void }) {
  const style = statusStyles[room.status]

  return (
    <div
      onClick={onClick}
      className={`border rounded-xl p-5 space-y-3 bg-zinc-950 transition-all cursor-pointer ${style.card}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-white leading-snug">{room.name}</h3>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>

      {room.stack_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {room.stack_tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-300 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      )}

      {room.milestones?.length > 0 && (
        <div className="w-full bg-zinc-800 rounded-full h-0.5">
          <div
            className="bg-emerald-500 h-0.5 rounded-full transition-all"
            style={{ width: `${(room.milestones.filter(m => m.done).length / room.milestones.length) * 100}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-zinc-600">
        <span className="flex items-center gap-2">
          {room.profiles?.display_name ?? 'unknown'}
          {room.links?.length > 0 && (
            <span className="text-zinc-700">↗ {room.links.length}</span>
          )}
        </span>
        <span>
          {room.milestones?.length > 0
            ? `${room.milestones.filter(m => m.done).length}/${room.milestones.length} goals`
            : `${room.member_count ?? 1} builder${(room.member_count ?? 1) !== 1 ? 's' : ''}`
          }
        </span>
      </div>
    </div>
  )
}
