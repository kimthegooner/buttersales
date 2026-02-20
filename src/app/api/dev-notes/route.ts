import { supabase } from '@/lib/supabase'
import { dbToDevNote, devNoteToDb } from '@/lib/supabase-mappers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('dev_notes')
    .select('*')
    .eq('user_id', 'default')
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data || []).map(dbToDevNote))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const row = devNoteToDb(body)
  row.user_id = 'default'

  const { data, error } = await supabase
    .from('dev_notes')
    .insert(row)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(dbToDevNote(data))
}
