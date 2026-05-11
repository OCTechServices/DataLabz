import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Milestone } from '@/types/database'

export async function POST(request: Request) {
  const secret = request.headers.get('x-milestone-secret')

  if (!process.env.MILESTONE_SECRET || secret !== process.env.MILESTONE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: 'ADMIN_USER_ID not configured' }, { status: 500 })
  }

  const body = await request.json()
  const gitContext = typeof body.git_context === 'string' ? body.git_context.slice(0, 4000) : ''

  if (!gitContext.trim()) {
    return NextResponse.json({ synced: 0, message: 'No git context provided' })
  }

  const service = createServiceClient()

  // Get the operator's active room
  const { data: room } = await service
    .from('rooms')
    .select('id, name, milestones')
    .eq('creator_id', process.env.ADMIN_USER_ID)
    .in('status', ['active', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!room) {
    return NextResponse.json({ synced: 0, message: 'No active room found' })
  }

  const milestones = room.milestones as Milestone[]
  const pending = milestones.filter(m => !m.done)

  if (pending.length === 0) {
    return NextResponse.json({ synced: 0, message: 'All milestones already complete' })
  }

  const completedIds = await matchMilestones(pending, gitContext)

  if (completedIds.length === 0) {
    return NextResponse.json({ synced: 0, message: 'No milestones matched' })
  }

  const updated = milestones.map(m =>
    completedIds.includes(m.id) ? { ...m, done: true } : m
  )

  const { error: updateError } = await service
    .from('rooms')
    .update({ milestones: updated })
    .eq('id', room.id)

  if (updateError) {
    console.error('[milestone-sync] update error:', updateError.message)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const completed = milestones
    .filter(m => completedIds.includes(m.id))
    .map(m => m.text)

  console.log(`[milestone-sync] "${room.name}" — checked off ${completedIds.length}:`, completed)

  return NextResponse.json({ synced: completedIds.length, completed })
}

async function matchMilestones(pending: Milestone[], gitContext: string): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[milestone-sync] ANTHROPIC_API_KEY not set — skipping AI matching')
    return []
  }

  const milestoneList = pending
    .map(m => `  { "id": "${m.id}", "text": "${m.text}" }`)
    .join('\n')

  const prompt = `You are a milestone completion detector for a developer co-working app.

Pending milestones (JSON):
[
${milestoneList}
]

Git activity from this session:
${gitContext}

Which milestones have clearly been completed based on the git activity? Be conservative — only mark done if there is direct evidence. When in doubt, leave it pending.

Respond with ONLY a valid JSON array of completed milestone IDs. Example: ["abc123", "def456"]
If none are complete, respond with: []`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      console.error('[milestone-sync] Anthropic API error:', res.status, await res.text())
      return []
    }

    const data = await res.json()
    const text: string = data.content?.[0]?.text ?? '[]'

    // Extract JSON array — Claude may wrap it in prose
    const match = text.match(/\[[\s\S]*?\]/)
    if (!match) return []

    const ids: unknown[] = JSON.parse(match[0])
    if (!Array.isArray(ids)) return []

    // Guard: only return IDs that actually exist in pending milestones
    const validIds = new Set(pending.map(m => m.id))
    return ids.filter((id): id is string => typeof id === 'string' && validIds.has(id))
  } catch (e) {
    console.error('[milestone-sync] matching error:', e)
    return []
  }
}
