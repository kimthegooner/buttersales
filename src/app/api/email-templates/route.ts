import { supabase } from '@/lib/supabase'
import { dbToEmailTemplate, emailTemplateToDb } from '@/lib/supabase-mappers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', 'default')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data || []).map(dbToEmailTemplate))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const row = emailTemplateToDb(body)
  row.user_id = 'default'

  const { data, error } = await supabase
    .from('email_templates')
    .insert(row)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(dbToEmailTemplate(data))
}
