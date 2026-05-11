import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import VenueManager from '@/components/VenueManager'

export default async function AdminVenuesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!process.env.ADMIN_USER_ID || user.id !== process.env.ADMIN_USER_ID) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">Venue Manager</h1>
            <p className="text-sm text-zinc-500">Operator view — manage café and co-working locations.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to hive
          </Link>
        </div>

        <VenueManager />

      </div>
    </main>
  )
}
