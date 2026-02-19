'use client'

import { useState, useEffect, useCallback } from 'react'
import { Deal, Pipeline, StageConfig, DEFAULT_STAGES } from '@/lib/types'
import { loadDeals, saveDeals, loadPipelines, savePipelines, createDefaultPipeline } from '@/lib/storage'

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [activePipelineId, setActivePipelineId] = useState<string>('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let storedPipelines = loadPipelines()
    if (storedPipelines.length === 0) {
      const defaultPipeline = createDefaultPipeline()
      storedPipelines = [defaultPipeline]
      savePipelines(storedPipelines)
    }
    setPipelines(storedPipelines)
    setActivePipelineId(storedPipelines[0].id)

    const storedDeals = loadDeals()
    if (storedDeals.length > 0) {
      setDeals(storedDeals)
    } else {
      fetch('/data/deals.json')
        .then((r) => r.json())
        .then((data) => {
          const seedDeals = (data.deals || []).map((d: Deal) => ({
            ...d,
            pipelineId: storedPipelines[0].id,
          }))
          setDeals(seedDeals)
          saveDeals(seedDeals)
        })
        .catch(() => {})
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveDeals(deals)
  }, [deals, loaded])

  useEffect(() => {
    if (loaded) savePipelines(pipelines)
  }, [pipelines, loaded])

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0]
  const pipelineDeals = deals.filter((d) => d.pipelineId === activePipelineId)

  // Deal CRUD
  const addDeal = (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newDeal: Deal = { ...deal, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    setDeals((prev) => [...prev, newDeal])
    return newDeal
  }

  const updateDeal = (id: string, updates: Partial<Deal>) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d))
    )
  }

  const deleteDeal = (id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id))
  }

  const moveDeal = (id: string, newStage: string) => {
    updateDeal(id, { stage: newStage })
  }

  // Pipeline CRUD
  const addPipeline = useCallback((name: string) => {
    const newPipeline: Pipeline = {
      id: crypto.randomUUID(),
      name,
      stages: [...DEFAULT_STAGES],
      createdAt: new Date().toISOString(),
    }
    setPipelines((prev) => [...prev, newPipeline])
    setActivePipelineId(newPipeline.id)
    return newPipeline
  }, [])

  const renamePipeline = useCallback((id: string, name: string) => {
    setPipelines((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
  }, [])

  const deletePipeline = useCallback((id: string) => {
    setPipelines((prev) => {
      const next = prev.filter((p) => p.id !== id)
      if (next.length === 0) {
        const fallback = createDefaultPipeline()
        setActivePipelineId(fallback.id)
        return [fallback]
      }
      if (activePipelineId === id) {
        setActivePipelineId(next[0].id)
      }
      return next
    })
    setDeals((prev) => prev.filter((d) => d.pipelineId !== id))
  }, [activePipelineId])

  // Stage CRUD
  const addStage = useCallback((pipelineId: string, stage: StageConfig) => {
    setPipelines((prev) =>
      prev.map((p) => (p.id === pipelineId ? { ...p, stages: [...p.stages, stage] } : p))
    )
  }, [])

  const removeStage = useCallback((pipelineId: string, stageId: string) => {
    setPipelines((prev) =>
      prev.map((p) =>
        p.id === pipelineId ? { ...p, stages: p.stages.filter((s) => s.id !== stageId) } : p
      )
    )
    setDeals((prev) => prev.filter((d) => !(d.pipelineId === pipelineId && d.stage === stageId)))
  }, [])

  const updateStage = useCallback((pipelineId: string, stageId: string, updates: Partial<StageConfig>) => {
    setPipelines((prev) =>
      prev.map((p) =>
        p.id === pipelineId
          ? { ...p, stages: p.stages.map((s) => (s.id === stageId ? { ...s, ...updates } : s)) }
          : p
      )
    )
  }, [])

  return {
    deals: pipelineDeals,
    allDeals: deals,
    loaded,
    addDeal,
    updateDeal,
    deleteDeal,
    moveDeal,
    // Pipelines
    pipelines,
    activePipeline,
    activePipelineId,
    setActivePipelineId,
    addPipeline,
    renamePipeline,
    deletePipeline,
    // Stages
    addStage,
    removeStage,
    updateStage,
  }
}
