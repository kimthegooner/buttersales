'use client'

import { useState, useEffect } from 'react'
import { Contact } from '@/lib/types'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiGet<Contact[]>('/api/contacts')
      .then(setContacts)
      .catch(console.error)
      .finally(() => setLoaded(true))
  }, [])

  const addContact = (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newContact: Contact = { ...contact, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    setContacts((prev) => [...prev, newContact])
    apiPost('/api/contacts', newContact).catch(console.error)
    return newContact
  }

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    )
    apiPatch(`/api/contacts/${id}`, updates).catch(console.error)
  }

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
    apiDelete(`/api/contacts/${id}`).catch(console.error)
  }

  const linkDeal = (contactId: string, dealId: string) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== contactId) return c
        const dealIds = c.dealIds || []
        if (dealIds.includes(dealId)) return c
        const updated = { ...c, dealIds: [...dealIds, dealId], updatedAt: new Date().toISOString() }
        apiPatch(`/api/contacts/${contactId}`, { dealIds: updated.dealIds }).catch(console.error)
        return updated
      })
    )
  }

  const unlinkDeal = (contactId: string, dealId: string) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== contactId) return c
        const newDealIds = (c.dealIds || []).filter((id) => id !== dealId)
        apiPatch(`/api/contacts/${contactId}`, { dealIds: newDealIds }).catch(console.error)
        return { ...c, dealIds: newDealIds, updatedAt: new Date().toISOString() }
      })
    )
  }

  return { contacts, loaded, addContact, updateContact, deleteContact, linkDeal, unlinkDeal }
}
