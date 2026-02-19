'use client'

import { useState, useEffect } from 'react'
import { EmailTemplate, EmailSettings } from '@/lib/types'
import { loadEmailTemplates, saveEmailTemplates, loadEmailSettings, saveEmailSettings } from '@/lib/storage'

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [settings, setSettings] = useState<EmailSettings>({ senderEmail: '' })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = loadEmailTemplates()
    if (stored.length > 0) {
      setTemplates(stored)
      setSettings(loadEmailSettings())
      setLoaded(true)
    } else {
      fetch('/data/email-templates.json')
        .then((r) => r.json())
        .then((data) => {
          const seed = data.templates || []
          setTemplates(seed)
          saveEmailTemplates(seed)
        })
        .catch(() => {})
        .finally(() => {
          setSettings(loadEmailSettings())
          setLoaded(true)
        })
    }
  }, [])

  useEffect(() => {
    if (loaded) saveEmailTemplates(templates)
  }, [templates, loaded])

  const addTemplate = (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newTemplate: EmailTemplate = { ...template, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    setTemplates((prev) => [...prev, newTemplate])
    return newTemplate
  }

  const updateTemplate = (id: string, updates: Partial<EmailTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    )
  }

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const updateSettings = (newSettings: EmailSettings) => {
    setSettings(newSettings)
    saveEmailSettings(newSettings)
  }

  return { templates, settings, loaded, addTemplate, updateTemplate, deleteTemplate, updateSettings }
}
