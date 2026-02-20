import { Deal, Contact, Activity, Pipeline, EmailTemplate, EmailSettings, DevNote, SiteAnalysis } from './types'

// ─── Pipeline ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbToPipeline(row: any): Pipeline {
  return {
    id: row.id,
    name: row.name,
    stages: row.stages || [],
    createdAt: row.created_at,
  }
}

export function pipelineToDb(p: Partial<Pipeline> & { id?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = {}
  if (p.id !== undefined) row.id = p.id
  if (p.name !== undefined) row.name = p.name
  if (p.stages !== undefined) row.stages = p.stages
  if (p.createdAt !== undefined) row.created_at = p.createdAt
  return row
}

// ─── Deal ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbToDeal(row: any): Deal {
  return {
    id: row.id,
    pipelineId: row.pipeline_id,
    title: row.title,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    contactEmail: row.contact_email || undefined,
    contactPhone: row.contact_phone || undefined,
    plan: row.plan,
    stage: row.stage,
    expectedCloseDate: row.expected_close_date,
    notes: row.notes || undefined,
    tags: row.tags || [],
    source: row.source || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function dealToDb(d: Partial<Deal> & { id?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = {}
  if (d.id !== undefined) row.id = d.id
  if (d.pipelineId !== undefined) row.pipeline_id = d.pipelineId
  if (d.title !== undefined) row.title = d.title
  if (d.companyName !== undefined) row.company_name = d.companyName
  if (d.contactPerson !== undefined) row.contact_person = d.contactPerson
  if (d.contactEmail !== undefined) row.contact_email = d.contactEmail
  if (d.contactPhone !== undefined) row.contact_phone = d.contactPhone
  if (d.plan !== undefined) row.plan = d.plan
  if (d.stage !== undefined) row.stage = d.stage
  if (d.expectedCloseDate !== undefined) row.expected_close_date = d.expectedCloseDate
  if (d.notes !== undefined) row.notes = d.notes
  if (d.tags !== undefined) row.tags = d.tags
  if (d.source !== undefined) row.source = d.source
  if (d.createdAt !== undefined) row.created_at = d.createdAt
  if (d.updatedAt !== undefined) row.updated_at = d.updatedAt
  return row
}

// ─── Contact ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbToContact(row: any): Contact {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email || undefined,
    phone: row.phone || undefined,
    position: row.position || undefined,
    tags: row.tags || [],
    notes: row.notes || undefined,
    dealIds: row.deal_ids || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function contactToDb(c: Partial<Contact> & { id?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = {}
  if (c.id !== undefined) row.id = c.id
  if (c.name !== undefined) row.name = c.name
  if (c.company !== undefined) row.company = c.company
  if (c.email !== undefined) row.email = c.email
  if (c.phone !== undefined) row.phone = c.phone
  if (c.position !== undefined) row.position = c.position
  if (c.tags !== undefined) row.tags = c.tags
  if (c.notes !== undefined) row.notes = c.notes
  if (c.dealIds !== undefined) row.deal_ids = c.dealIds
  if (c.createdAt !== undefined) row.created_at = c.createdAt
  if (c.updatedAt !== undefined) row.updated_at = c.updatedAt
  return row
}

// ─── Activity ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbToActivity(row: any): Activity {
  return {
    id: row.id,
    type: row.type,
    customType: row.custom_type || undefined,
    title: row.title,
    description: row.description || undefined,
    dealId: row.deal_id,
    date: row.date,
    duration: row.duration || undefined,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function activityToDb(a: Partial<Activity> & { id?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = {}
  if (a.id !== undefined) row.id = a.id
  if (a.type !== undefined) row.type = a.type
  if (a.customType !== undefined) row.custom_type = a.customType
  if (a.title !== undefined) row.title = a.title
  if (a.description !== undefined) row.description = a.description
  if (a.dealId !== undefined) row.deal_id = a.dealId
  if (a.date !== undefined) row.date = a.date
  if (a.duration !== undefined) row.duration = a.duration
  if (a.completed !== undefined) row.completed = a.completed
  if (a.createdAt !== undefined) row.created_at = a.createdAt
  if (a.updatedAt !== undefined) row.updated_at = a.updatedAt
  return row
}

// ─── EmailTemplate ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbToEmailTemplate(row: any): EmailTemplate {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    body: row.body,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function emailTemplateToDb(t: Partial<EmailTemplate> & { id?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = {}
  if (t.id !== undefined) row.id = t.id
  if (t.name !== undefined) row.name = t.name
  if (t.subject !== undefined) row.subject = t.subject
  if (t.body !== undefined) row.body = t.body
  if (t.category !== undefined) row.category = t.category
  if (t.createdAt !== undefined) row.created_at = t.createdAt
  if (t.updatedAt !== undefined) row.updated_at = t.updatedAt
  return row
}

// ─── EmailSettings ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbToEmailSettings(row: any): EmailSettings {
  return {
    senderEmail: row?.sender_email || '',
  }
}

// ─── DevNote ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbToDevNote(row: any): DevNote {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    content: row.content || '',
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function devNoteToDb(n: Partial<DevNote> & { id?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = {}
  if (n.id !== undefined) row.id = n.id
  if (n.title !== undefined) row.title = n.title
  if (n.date !== undefined) row.date = n.date
  if (n.content !== undefined) row.content = n.content
  if (n.tags !== undefined) row.tags = n.tags
  if (n.createdAt !== undefined) row.created_at = n.createdAt
  if (n.updatedAt !== undefined) row.updated_at = n.updatedAt
  return row
}

// ─── SiteAnalysis ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbToSiteAnalysis(row: any): SiteAnalysis {
  return {
    id: row.id,
    url: row.url,
    title: row.title || null,
    description: row.description || null,
    ogImage: row.og_image || null,
    hasOgTags: row.has_og_tags || false,
    mobileOptimized: row.mobile_optimized || false,
    loadTimeMs: row.load_time_ms || undefined,
    pageSize: row.page_size || undefined,
    services: row.services || [],
    webBuilders: row.web_builders || [],
    salesScore: row.sales_score || 0,
    opportunities: row.opportunities || [],
    notes: row.notes || '',
    status: row.status || 'done',
    errorMessage: row.error_message || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function siteAnalysisToDb(a: Partial<SiteAnalysis> & { id?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = {}
  if (a.id !== undefined) row.id = a.id
  if (a.url !== undefined) row.url = a.url
  if (a.title !== undefined) row.title = a.title
  if (a.description !== undefined) row.description = a.description
  if (a.ogImage !== undefined) row.og_image = a.ogImage
  if (a.hasOgTags !== undefined) row.has_og_tags = a.hasOgTags
  if (a.mobileOptimized !== undefined) row.mobile_optimized = a.mobileOptimized
  if (a.loadTimeMs !== undefined) row.load_time_ms = a.loadTimeMs
  if (a.pageSize !== undefined) row.page_size = a.pageSize
  if (a.services !== undefined) row.services = a.services
  if (a.webBuilders !== undefined) row.web_builders = a.webBuilders
  if (a.salesScore !== undefined) row.sales_score = a.salesScore
  if (a.opportunities !== undefined) row.opportunities = a.opportunities
  if (a.notes !== undefined) row.notes = a.notes
  if (a.status !== undefined) row.status = a.status
  if (a.errorMessage !== undefined) row.error_message = a.errorMessage
  if (a.createdAt !== undefined) row.created_at = a.createdAt
  if (a.updatedAt !== undefined) row.updated_at = a.updatedAt
  return row
}
