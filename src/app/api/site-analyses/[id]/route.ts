import { supabase } from '@/lib/supabase'
import { dbToSiteAnalysis } from '@/lib/supabase-mappers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // Only allow updating notes
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.notes !== undefined) updates.notes = body.notes

  const { data, error } = await supabase
    .from('site_analyses')
    .update(updates)
    .eq('id', id)
    .eq('user_id', 'default')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(dbToSiteAnalysis(data))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabase
    .from('site_analyses')
    .delete()
    .eq('id', id)
    .eq('user_id', 'default')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
