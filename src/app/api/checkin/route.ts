import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET — return the user's current active check-in (if any)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('check_ins')
    .select('*, venues ( id, name, code )')
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json(data ?? null)
}

// POST — check in to a venue by code
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const code = typeof body.code === 'string' ? body.code.toLowerCase().trim() : ''

  if (!code) return NextResponse.json({ error: 'Venue code required' }, { status: 400 })

  // Look up venue
  const { data: venue } = await supabase
    .from('venues')
    .select('id, name')
    .eq('code', code)
    .eq('active', true)
    .single()

  if (!venue) return NextResponse.json({ error: 'Invalid or inactive venue code' }, { status: 404 })

  // Expire any existing check-ins for this user
  await supabase
    .from('check_ins')
    .delete()
    .eq('user_id', user.id)

  // Create new check-in — expires in 8 hours
  const expires_at = new Date()
  expires_at.setHours(expires_at.getHours() + 8)

  const { data: checkIn, error } = await supabase
    .from('check_ins')
    .insert({ user_id: user.id, venue_id: venue.id, expires_at: expires_at.toISOString() })
    .select('*, venues ( id, name, code )')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(checkIn, { status: 201 })
}

// DELETE — manual checkout
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('check_ins').delete().eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
