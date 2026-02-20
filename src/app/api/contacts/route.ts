import { supabase } from '@/lib/supabase'
import { dbToContact, contactToDb } from '@/lib/supabase-mappers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', 'default')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data || []).map(dbToContact))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const row = contactToDb(body)
  row.user_id = 'default'

  const { data, error } = await supabase
    .from('contacts')
    .insert(row)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(dbToContact(data))
}
