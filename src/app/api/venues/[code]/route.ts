import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Public-ish: authenticated users can look up a venue by its short code.
// Called when a user scans a QR code and lands on /checkin?v=<code>.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await params

  const { data: venue, error } = await supabase
    .from('venues')
    .select('id, name, code, address')
    .eq('code', code.toLowerCase())
    .eq('active', true)
    .single()

  if (error || !venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
  }

  return NextResponse.json(venue)
}
