import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfileSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If profile already exists, skip setup
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profile) redirect('/dashboard')

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Set up your profile</h1>
          <p className="text-zinc-400 text-sm">This is how other builders will see you.</p>
        </div>

        <form action="/api/profile/setup" method="POST" className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="display_name" className="text-xs text-zinc-400 uppercase tracking-wider">
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              minLength={2}
              maxLength={32}
              placeholder="your name or handle"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 text-sm hover:bg-zinc-200 transition-colors"
          >
            Enter the Hive
          </button>
        </form>
      </div>
    </main>
  )
}
