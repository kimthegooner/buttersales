import { supabase } from '@/lib/supabase'
import { dbToSiteAnalysis, siteAnalysisToDb } from '@/lib/supabase-mappers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('site_analyses')
    .select('*')
    .eq('user_id', 'default')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data || []).map(dbToSiteAnalysis))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const row = siteAnalysisToDb(body)
  row.user_id = 'default'

  const { data, error } = await supabase
    .from('site_analyses')
    .insert(row)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(dbToSiteAnalysis(data))
}
