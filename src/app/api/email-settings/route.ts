import { supabase } from '@/lib/supabase'
import { dbToEmailSettings } from '@/lib/supabase-mappers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('email_settings')
    .select('*')
    .eq('user_id', 'default')
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(dbToEmailSettings(data))
}

export async function PUT(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabase
    .from('email_settings')
    .upsert({
      user_id: 'default',
      sender_email: body.senderEmail || '',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(dbToEmailSettings(data))
}
