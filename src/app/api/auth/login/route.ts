import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get('email')

  if (!email || typeof email !== 'string') {
    return NextResponse.redirect(new URL('/login?error=invalid_email', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.redirect(new URL('/login?error=send_failed', request.url))
  }

  return NextResponse.redirect(new URL('/login?sent=true', request.url))
}
