import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isAdmin(userId: string) {
  return process.env.ADMIN_USER_ID && userId === process.env.ADMIN_USER_ID
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  const now = new Date().toISOString()

  const [{ data: venues, error }, { data: checkIns }] = await Promise.all([
    service.from('venues').select('*').order('created_at', { ascending: false }),
    service.from('check_ins').select('venue_id').gt('expires_at', now),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Count active check-ins per venue
  const countMap: Record<string, number> = {}
  for (const ci of checkIns ?? []) {
    countMap[ci.venue_id] = (countMap[ci.venue_id] ?? 0) + 1
  }

  const result = (venues ?? []).map(v => ({
    ...v,
    active_checkins: countMap[v.id] ?? 0,
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const code = typeof body.code === 'string' ? body.code.trim().toLowerCase() : ''
  const address = typeof body.address === 'string' ? body.address.trim() || null : null

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Venue name must be at least 2 characters.' }, { status: 400 })
  }
  if (!code || !/^[a-z0-9-]+$/.test(code)) {
    return NextResponse.json({ error: 'Code must be lowercase letters, numbers, or hyphens.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('venues')
    .insert({ name, code, address })
    .select()
    .single()

  if (error) {
    const msg = error.code === '23505' ? 'That code is already taken.' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
