'use client'

import { useState, useEffect } from 'react'
import { Activity } from '@/lib/types'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiGet<Activity[]>('/api/activities')
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoaded(true))
  }, [])

  const addActivity = (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newActivity: Activity = { ...activity, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    setActivities((prev) => [...prev, newActivity])
    apiPost('/api/activities', newActivity).catch(console.error)
    return newActivity
  }

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
    )
    apiPatch(`/api/activities/${id}`, updates).catch(console.error)
  }

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id))
    apiDelete(`/api/activities/${id}`).catch(console.error)
  }

  const toggleComplete = (id: string) => {
    const activity = activities.find((a) => a.id === id)
    if (activity) {
      const newCompleted = !activity.completed
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, completed: newCompleted, updatedAt: new Date().toISOString() } : a))
      )
      apiPatch(`/api/activities/${id}`, { completed: newCompleted }).catch(console.error)
    }
  }

  return { activities, loaded, addActivity, updateActivity, deleteActivity, toggleComplete }
}
