import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Called by Vercel Cron every hour.
// Closes all active/paused rooms whose closes_at has passed.
export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret')

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('rooms')
    .update({ status: 'closed' })
    .in('status', ['active', 'paused'])
    .lt('closes_at', new Date().toISOString())
    .select('id, name')

  if (error) {
    console.error('[cron/close-rooms] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = data?.length ?? 0
  console.log(`[cron/close-rooms] closed ${count} room(s)`)

  return NextResponse.json({ closed: count, rooms: data })
}
