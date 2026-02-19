'use client'

import { useState, useEffect } from 'react'
import { Contact } from '@/lib/types'
import { loadContacts, saveContacts } from '@/lib/storage'

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = loadContacts()
    if (stored.length > 0) {
      setContacts(stored)
      setLoaded(true)
    } else {
      fetch('/data/contacts.json')
        .then((r) => r.json())
        .then((data) => {
          const seed = data.contacts || []
          setContacts(seed)
          saveContacts(seed)
        })
        .catch(() => {})
        .finally(() => setLoaded(true))
    }
  }, [])

  useEffect(() => {
    if (loaded) saveContacts(contacts)
  }, [contacts, loaded])

  const addContact = (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newContact: Contact = { ...contact, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    setContacts((prev) => [...prev, newContact])
    return newContact
  }

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    )
  }

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  const linkDeal = (contactId: string, dealId: string) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== contactId) return c
        const dealIds = c.dealIds || []
        if (dealIds.includes(dealId)) return c
        return { ...c, dealIds: [...dealIds, dealId], updatedAt: new Date().toISOString() }
      })
    )
  }

  const unlinkDeal = (contactId: string, dealId: string) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== contactId) return c
        return { ...c, dealIds: (c.dealIds || []).filter((id) => id !== dealId), updatedAt: new Date().toISOString() }
      })
    )
  }

  return { contacts, loaded, addContact, updateContact, deleteContact, linkDeal, unlinkDeal }
}
