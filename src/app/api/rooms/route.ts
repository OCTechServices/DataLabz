import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      profiles!rooms_creator_id_fkey ( display_name, avatar_url ),
      room_members ( user_id )
    `)
    .neq('status', 'closed')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten member count from the joined array
  const rooms = (data ?? []).map(r => ({
    ...r,
    member_count: Array.isArray(r.room_members) ? r.room_members.length : 0,
  }))

  return NextResponse.json(rooms)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Enforce one active room per user
  const { data: existing } = await supabase
    .from('rooms')
    .select('id')
    .eq('creator_id', user.id)
    .in('status', ['active', 'paused'])
    .single()

  if (existing) {
    return NextResponse.json({ error: 'You already have an open room. Close it before opening a new one.' }, { status: 409 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const stack_tags = Array.isArray(body.stack_tags) ? body.stack_tags.slice(0, 5) : []
  const milestones = Array.isArray(body.milestones) ? body.milestones : []
  const links = Array.isArray(body.links) ? body.links : []
  const venue_id = typeof body.venue_id === 'string' ? body.venue_id : null
  const session = typeof body.session === 'number' && body.session > 1 ? body.session : 1

  if (!name || name.length < 3) {
    return NextResponse.json({ error: 'Room name must be at least 3 characters.' }, { status: 400 })
  }

  // Enforce: must have at least one milestone to go active
  if (milestones.length === 0) {
    return NextResponse.json({ error: 'Add at least one goal before locking in.' }, { status: 400 })
  }

  // closes_at = end of today UTC
  const closes_at = new Date()
  closes_at.setUTCHours(23, 59, 59, 999)

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ name, creator_id: user.id, stack_tags, milestones, links, venue_id, session, closes_at: closes_at.toISOString() })
    .select()
    .single()

  if (roomError) return NextResponse.json({ error: roomError.message }, { status: 500 })

  // Add creator as member
  await supabase
    .from('room_members')
    .insert({ room_id: room.id, user_id: user.id, role: 'creator' })

  return NextResponse.json(room, { status: 201 })
}
