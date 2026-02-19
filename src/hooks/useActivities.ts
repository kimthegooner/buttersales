'use client'

import { useState, useEffect } from 'react'
import { Activity } from '@/lib/types'
import { loadActivities, saveActivities } from '@/lib/storage'

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = loadActivities()
    if (stored.length > 0) {
      setActivities(stored)
      setLoaded(true)
    } else {
      fetch('/data/activities.json')
        .then((r) => r.json())
        .then((data) => {
          const seed = data.activities || []
          setActivities(seed)
          saveActivities(seed)
        })
        .catch(() => {})
        .finally(() => setLoaded(true))
    }
  }, [])

  useEffect(() => {
    if (loaded) saveActivities(activities)
  }, [activities, loaded])

  const addActivity = (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newActivity: Activity = { ...activity, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    setActivities((prev) => [...prev, newActivity])
    return newActivity
  }

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
    )
  }

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  const toggleComplete = (id: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed, updatedAt: new Date().toISOString() } : a))
    )
  }

  return { activities, loaded, addActivity, updateActivity, deleteActivity, toggleComplete }
}
