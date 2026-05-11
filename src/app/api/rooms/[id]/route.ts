import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { RoomStatus, Milestone } from '@/types/database'

const VALID_STATUSES: RoomStatus[] = ['active', 'paused', 'closed']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Confirm requester is the creator
  const { data: room } = await supabase
    .from('rooms')
    .select('creator_id, status, milestones')
    .eq('id', id)
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  if (room.creator_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (room.status === 'closed') return NextResponse.json({ error: 'Room is already closed' }, { status: 409 })

  const body = await request.json()
  const update: Record<string, unknown> = {}

  if ('status' in body) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    // Enforce: cannot resume to active without at least one milestone
    if (body.status === 'active') {
      const milestones: Milestone[] = Array.isArray(body.milestones)
        ? body.milestones
        : (room.milestones ?? [])
      if (milestones.length === 0) {
        return NextResponse.json({ error: 'Add at least one goal before going active.' }, { status: 400 })
      }
    }
    update.status = body.status
  }

  if ('name' in body) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (name.length < 3) {
      return NextResponse.json({ error: 'Room name must be at least 3 characters.' }, { status: 400 })
    }
    update.name = name
  }

  if ('milestones' in body) {
    if (!Array.isArray(body.milestones)) {
      return NextResponse.json({ error: 'Milestones must be an array.' }, { status: 400 })
    }
    update.milestones = body.milestones
  }

  if ('links' in body) {
    if (!Array.isArray(body.links)) {
      return NextResponse.json({ error: 'Links must be an array.' }, { status: 400 })
    }
    update.links = body.links
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('rooms')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
