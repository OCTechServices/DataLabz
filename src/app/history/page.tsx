import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import HistoryClient from '@/components/HistoryClient'
import type { RoomWithCreator } from '@/types/database'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: rooms }] = await Promise.all([
    supabase.from('profiles').select('id').eq('id', user.id).single(),
    supabase
      .from('rooms')
      .select('*, profiles!rooms_creator_id_fkey ( display_name, avatar_url )')
      .eq('creator_id', user.id)
      .eq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (!profile) redirect('/profile/setup')

  // Fetch active check-in for venue_id (needed if user clones from history)
  const { data: checkIn } = await supabase
    .from('check_ins')
    .select('venue_id')
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">Session History</h1>
            <p className="text-sm text-zinc-500">Your closed rooms — start again to carry forward.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to hive
          </Link>
        </div>

        <HistoryClient
          rooms={(rooms ?? []) as RoomWithCreator[]}
          venueId={checkIn?.venue_id ?? null}
        />

      </div>
    </main>
  )
}
