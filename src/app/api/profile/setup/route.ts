import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const formData = await request.formData()
  const display_name = formData.get('display_name')

  if (!display_name || typeof display_name !== 'string' || display_name.trim().length < 2) {
    return NextResponse.redirect(new URL('/profile/setup?error=invalid_name', request.url))
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, display_name: display_name.trim() })

  if (error) {
    return NextResponse.redirect(new URL('/profile/setup?error=save_failed', request.url))
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
