import { supabase } from '@/lib/supabase'
import { dbToActivity, activityToDb } from '@/lib/supabase-mappers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', 'default')
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data || []).map(dbToActivity))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const row = activityToDb(body)
  row.user_id = 'default'

  const { data, error } = await supabase
    .from('activities')
    .insert(row)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(dbToActivity(data))
}
