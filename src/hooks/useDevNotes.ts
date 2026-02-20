'use client'

import { useState, useEffect } from 'react'
import { DevNote } from '@/lib/types'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'

export function useDevNotes() {
  const [notes, setNotes] = useState<DevNote[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiGet<DevNote[]>('/api/dev-notes')
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoaded(true))
  }, [])

  const addNote = (note: Omit<DevNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newNote: DevNote = { ...note, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    setNotes((prev) => [newNote, ...prev])
    apiPost('/api/dev-notes', newNote).catch(console.error)
    return newNote
  }

  const updateNote = (id: string, updates: Partial<DevNote>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
    )
    apiPatch(`/api/dev-notes/${id}`, updates).catch(console.error)
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    apiDelete(`/api/dev-notes/${id}`).catch(console.error)
  }

  return { notes, loaded, addNote, updateNote, deleteNote }
}
