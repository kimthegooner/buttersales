import { supabase } from '@/lib/supabase'
import { dbToPipeline, pipelineToDb } from '@/lib/supabase-mappers'
import { DEFAULT_STAGES } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('pipelines')
    .select('*')
    .eq('user_id', 'default')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-seed: create default pipeline if empty
  if (!data || data.length === 0) {
    const defaultPipeline = {
      id: crypto.randomUUID(),
      name: '영업 파이프라인',
      stages: DEFAULT_STAGES,
      user_id: 'default',
    }
    const { data: created, error: insertErr } = await supabase
      .from('pipelines')
      .insert(defaultPipeline)
      .select()
      .single()
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
    return NextResponse.json([dbToPipeline(created)])
  }

  return NextResponse.json(data.map(dbToPipeline))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const row = pipelineToDb(body)
  row.user_id = 'default'

  const { data, error } = await supabase
    .from('pipelines')
    .insert(row)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(dbToPipeline(data))
}
