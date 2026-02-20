import { supabase } from '@/lib/supabase'
import { dbToDevNote, devNoteToDb } from '@/lib/supabase-mappers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const updates = devNoteToDb(body)
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('dev_notes')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(dbToDevNote(data))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('dev_notes').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
