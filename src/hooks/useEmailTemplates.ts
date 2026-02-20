'use client'

import { useState, useEffect } from 'react'
import { EmailTemplate, EmailSettings } from '@/lib/types'
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from '@/lib/api-client'

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [settings, setSettings] = useState<EmailSettings>({ senderEmail: '' })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      apiGet<EmailTemplate[]>('/api/email-templates'),
      apiGet<EmailSettings>('/api/email-settings'),
    ])
      .then(([tpls, sets]) => {
        setTemplates(tpls)
        setSettings(sets)
      })
      .catch(console.error)
      .finally(() => setLoaded(true))
  }, [])

  const addTemplate = (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newTemplate: EmailTemplate = { ...template, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    setTemplates((prev) => [...prev, newTemplate])
    apiPost('/api/email-templates', newTemplate).catch(console.error)
    return newTemplate
  }

  const updateTemplate = (id: string, updates: Partial<EmailTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    )
    apiPatch(`/api/email-templates/${id}`, updates).catch(console.error)
  }

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    apiDelete(`/api/email-templates/${id}`).catch(console.error)
  }

  const updateSettings = (newSettings: EmailSettings) => {
    setSettings(newSettings)
    apiPut('/api/email-settings', newSettings).catch(console.error)
  }

  return { templates, settings, loaded, addTemplate, updateTemplate, deleteTemplate, updateSettings }
}
