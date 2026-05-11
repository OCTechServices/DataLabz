import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CheckInClient from './CheckInClient'

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/checkin?v=${(await searchParams).v ?? ''}`)

  const { v: code } = await searchParams

  if (!code) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white px-6">
        <div className="text-center space-y-2">
          <p className="text-zinc-400 text-sm">Invalid check-in link.</p>
          <a href="/dashboard" className="text-zinc-600 text-xs underline">Back to the Hive</a>
        </div>
      </main>
    )
  }

  // Look up venue server-side so we can show it before the user taps
  const { data: venue } = await supabase
    .from('venues')
    .select('id, name, code, address')
    .eq('code', code.toLowerCase())
    .eq('active', true)
    .single()

  if (!venue) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white px-6">
        <div className="text-center space-y-2">
          <p className="text-zinc-400 text-sm">This venue code is not recognised.</p>
          <a href="/dashboard" className="text-zinc-600 text-xs underline">Back to the Hive</a>
        </div>
      </main>
    )
  }

  return <CheckInClient venue={venue} />
}
