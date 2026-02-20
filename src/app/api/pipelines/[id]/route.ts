import { supabase } from '@/lib/supabase'
import { dbToPipeline } from '@/lib/supabase-mappers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.stages !== undefined) updates.stages = body.stages

  const { data, error } = await supabase
    .from('pipelines')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(dbToPipeline(data))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('pipelines').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
