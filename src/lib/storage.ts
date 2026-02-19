import { Deal, Pipeline, Contact, Activity, EmailTemplate, EmailSettings, DEFAULT_STAGES } from './types'

const DEALS_KEY = 'cb-crm-deals'
const PIPELINES_KEY = 'cb-crm-pipelines'
const CONTACTS_KEY = 'cb-crm-contacts'
const ACTIVITIES_KEY = 'cb-crm-activities'

export function loadDeals(): Deal[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DEALS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveDeals(deals: Deal[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEALS_KEY, JSON.stringify(deals))
}

export function loadPipelines(): Pipeline[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PIPELINES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export function savePipelines(pipelines: Pipeline[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PIPELINES_KEY, JSON.stringify(pipelines))
}

export function loadContacts(): Contact[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CONTACTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveContacts(contacts: Contact[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts))
}

export function loadActivities(): Activity[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveActivities(activities: Activity[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities))
}

const EMAIL_TEMPLATES_KEY = 'cb-crm-email-templates'
const EMAIL_SETTINGS_KEY = 'cb-crm-email-settings'

export function loadEmailTemplates(): EmailTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(EMAIL_TEMPLATES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveEmailTemplates(templates: EmailTemplate[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(EMAIL_TEMPLATES_KEY, JSON.stringify(templates))
}

export function loadEmailSettings(): EmailSettings {
  if (typeof window === 'undefined') return { senderEmail: '' }
  try {
    const raw = localStorage.getItem(EMAIL_SETTINGS_KEY)
    return raw ? JSON.parse(raw) : { senderEmail: '' }
  } catch {
    return { senderEmail: '' }
  }
}

export function saveEmailSettings(settings: EmailSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(settings))
}

export function createDefaultPipeline(): Pipeline {
  return {
    id: crypto.randomUUID(),
    name: '세일즈 파이프라인',
    stages: [...DEFAULT_STAGES],
    createdAt: new Date().toISOString(),
  }
}
