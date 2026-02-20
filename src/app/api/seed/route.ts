import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { DEFAULT_STAGES } from '@/lib/types'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    // Check if already seeded
    const { data: existingDeals } = await supabase.from('deals').select('id').limit(1)
    if (existingDeals && existingDeals.length > 0) {
      return NextResponse.json({ seeded: false, reason: 'already seeded' })
    }

    // Ensure default pipeline exists
    let pipelineId: string
    const { data: pipelines } = await supabase.from('pipelines').select('id').eq('user_id', 'default').limit(1)
    if (pipelines && pipelines.length > 0) {
      pipelineId = pipelines[0].id
    } else {
      pipelineId = crypto.randomUUID()
      await supabase.from('pipelines').insert({
        id: pipelineId,
        name: '영업 파이프라인',
        stages: DEFAULT_STAGES,
        user_id: 'default',
      })
    }

    // Read seed data
    const dataDir = path.join(process.cwd(), 'public', 'data')

    // Seed deals
    const dealsFile = JSON.parse(fs.readFileSync(path.join(dataDir, 'deals.json'), 'utf-8'))
    const dealsJson = dealsFile.deals || dealsFile
    const dealRows = dealsJson.map((d: Record<string, unknown>) => ({
      id: d.id,
      pipeline_id: pipelineId,
      title: d.title,
      company_name: d.companyName,
      contact_person: d.contactPerson,
      contact_email: d.contactEmail || null,
      contact_phone: d.contactPhone || null,
      plan: d.plan,
      stage: d.stage,
      expected_close_date: d.expectedCloseDate,
      notes: d.notes || null,
      tags: d.tags || [],
      source: d.source || null,
      user_id: 'default',
      created_at: d.createdAt,
      updated_at: d.updatedAt,
    }))
    await supabase.from('deals').insert(dealRows)

    // Seed contacts
    const contactsFile = JSON.parse(fs.readFileSync(path.join(dataDir, 'contacts.json'), 'utf-8'))
    const contactsJson = contactsFile.contacts || contactsFile
    const contactRows = contactsJson.map((c: Record<string, unknown>) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      email: c.email || null,
      phone: c.phone || null,
      position: c.position || null,
      tags: (c.tags as string[]) || [],
      notes: c.notes || null,
      deal_ids: (c.dealIds as string[]) || [],
      user_id: 'default',
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    }))
    await supabase.from('contacts').insert(contactRows)

    // Seed activities
    const activitiesFile = JSON.parse(fs.readFileSync(path.join(dataDir, 'activities.json'), 'utf-8'))
    const activitiesJson = activitiesFile.activities || activitiesFile
    const activityRows = activitiesJson.map((a: Record<string, unknown>) => ({
      id: a.id,
      type: a.type,
      custom_type: a.customType || null,
      title: a.title,
      description: a.description || null,
      deal_id: a.dealId,
      date: a.date,
      duration: a.duration || null,
      completed: a.completed ?? false,
      user_id: 'default',
      created_at: a.createdAt,
      updated_at: a.updatedAt,
    }))
    await supabase.from('activities').insert(activityRows)

    // Seed email templates
    const templatesFile = JSON.parse(fs.readFileSync(path.join(dataDir, 'email-templates.json'), 'utf-8'))
    const templatesJson = templatesFile.templates || templatesFile
    const templateRows = templatesJson.map((t: Record<string, unknown>) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      body: t.body,
      category: t.category,
      user_id: 'default',
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    }))
    await supabase.from('email_templates').insert(templateRows)

    return NextResponse.json({ seeded: true })
  } catch (err) {
    return NextResponse.json({ seeded: false, error: String(err) }, { status: 500 })
  }
}
