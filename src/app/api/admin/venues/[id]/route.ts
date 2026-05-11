import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function isAdmin(userId: string) {
  return process.env.ADMIN_USER_ID && userId === process.env.ADMIN_USER_ID
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const patch: Record<string, unknown> = {}
  if (typeof body.name === 'string') patch.name = body.name.trim()
  if (typeof body.code === 'string') patch.code = body.code.trim().toLowerCase()
  if ('address' in body) patch.address = typeof body.address === 'string' ? body.address.trim() || null : null
  if (typeof body.active === 'boolean') patch.active = body.active

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('venues')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const service = createServiceClient()

  const { error } = await service.from('venues').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: true })
}
