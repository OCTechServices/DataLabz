import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import VisibilityToggle from '@/components/VisibilityToggle'
import LocationBadge from '@/components/LocationBadge'
import HiveBoard from '@/components/HiveBoard'
import CustomCssProvider from '@/components/CustomCssProvider'
import type { RoomWithCreator, ActiveCheckIn, WorldTheme } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: rooms }, { data: checkIn }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('rooms')
      .select('*, profiles!rooms_creator_id_fkey ( display_name, avatar_url ), room_members ( user_id )')
      .neq('status', 'closed')
      .order('created_at', { ascending: false }),
    supabase
      .from('check_ins')
      .select('*, venues ( id, name, code )')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  if (!profile) redirect('/profile/setup')

  const roomsWithCount = (rooms ?? []).map(r => ({
    ...r,
    member_count: Array.isArray(r.room_members) ? r.room_members.length : 0,
  }))

  return (
    <>
    <CustomCssProvider css={profile.custom_css ?? null} />
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">THE HIVE</h1>
          <div className="flex items-center gap-6">
            <Link href="/profile" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Profile
            </Link>
            <Link href="/history" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              History
            </Link>
            <LocationBadge checkIn={checkIn as ActiveCheckIn | null} />
            <VisibilityToggle initial={profile.visibility} />
            <span className="text-zinc-600 text-sm">{profile.display_name}</span>
          </div>
        </div>

        <HiveBoard
          initialRooms={roomsWithCount as RoomWithCreator[]}
          currentUserId={user.id}
          venueId={checkIn?.venue_id ?? null}
          theme={(profile.theme as WorldTheme) ?? 'pixel-dark'}
        />

      </div>
    </main>
    </>
  )
}
