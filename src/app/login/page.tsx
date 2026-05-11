import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const { error } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">DATA.LABZ</h1>
          <p className="text-zinc-400 text-sm">A digital co-working space for builders.</p>
        </div>

        {error && (
          <p className="text-red-400 text-sm">Authentication failed. Please try again.</p>
        )}

        <form action="/api/auth/login" method="POST" className="space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder="your@email.com"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
          />
          <button
            type="submit"
            className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 text-sm hover:bg-zinc-200 transition-colors"
          >
            Continue with Email
          </button>
        </form>

        <p className="text-zinc-600 text-xs text-center">
          Magic link sent to your inbox. No password needed.
        </p>
      </div>
    </main>
  )
}
