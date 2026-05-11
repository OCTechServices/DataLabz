import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileClient from '@/components/ProfileClient'
import type { Profile } from '@/types/database'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/profile/setup')

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
            <p className="text-sm text-zinc-500">Customize how you show up in the Hive.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to hive
          </Link>
        </div>

        <ProfileClient profile={profile as Profile} />

      </div>
    </main>
  )
}
