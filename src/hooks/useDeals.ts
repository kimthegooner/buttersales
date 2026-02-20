'use client'

import { useState, useEffect, useCallback } from 'react'
import { Deal, Pipeline, StageConfig, DEFAULT_STAGES } from '@/lib/types'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [activePipelineId, setActivePipelineId] = useState<string>('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      apiGet<Pipeline[]>('/api/pipelines'),
      apiGet<Deal[]>('/api/deals'),
    ])
      .then(([pips, dls]) => {
        setPipelines(pips)
        if (pips.length > 0) setActivePipelineId(pips[0].id)
        setDeals(dls)
      })
      .catch(console.error)
      .finally(() => setLoaded(true))
  }, [])

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0]
  const pipelineDeals = deals.filter((d) => d.pipelineId === activePipelineId)

  // Deal CRUD
  const addDeal = (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newDeal: Deal = { ...deal, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    setDeals((prev) => [...prev, newDeal])
    apiPost('/api/deals', newDeal).catch(console.error)
    return newDeal
  }

  const updateDeal = (id: string, updates: Partial<Deal>) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d))
    )
    apiPatch(`/api/deals/${id}`, updates).catch(console.error)
  }

  const deleteDeal = (id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id))
    apiDelete(`/api/deals/${id}`).catch(console.error)
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
    apiPost('/api/pipelines', newPipeline).catch(console.error)
    return newPipeline
  }, [])

  const renamePipeline = useCallback((id: string, name: string) => {
    setPipelines((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
    apiPatch(`/api/pipelines/${id}`, { name }).catch(console.error)
  }, [])

  const deletePipeline = useCallback((id: string) => {
    setPipelines((prev) => {
      const next = prev.filter((p) => p.id !== id)
      if (next.length === 0) {
        const fallback: Pipeline = {
          id: crypto.randomUUID(),
          name: '영업 파이프라인',
          stages: [...DEFAULT_STAGES],
          createdAt: new Date().toISOString(),
        }
        setActivePipelineId(fallback.id)
        apiPost('/api/pipelines', fallback).catch(console.error)
        return [fallback]
      }
      if (activePipelineId === id) {
        setActivePipelineId(next[0].id)
      }
      return next
    })
    setDeals((prev) => prev.filter((d) => d.pipelineId !== id))
    apiDelete(`/api/pipelines/${id}`).catch(console.error)
  }, [activePipelineId])

  // Stage CRUD
  const addStage = useCallback((pipelineId: string, stage: StageConfig) => {
    setPipelines((prev) => {
      const updated = prev.map((p) => (p.id === pipelineId ? { ...p, stages: [...p.stages, stage] } : p))
      const pipeline = updated.find((p) => p.id === pipelineId)
      if (pipeline) apiPatch(`/api/pipelines/${pipelineId}`, { stages: pipeline.stages }).catch(console.error)
      return updated
    })
  }, [])

  const removeStage = useCallback((pipelineId: string, stageId: string) => {
    setPipelines((prev) => {
      const updated = prev.map((p) =>
        p.id === pipelineId ? { ...p, stages: p.stages.filter((s) => s.id !== stageId) } : p
      )
      const pipeline = updated.find((p) => p.id === pipelineId)
      if (pipeline) apiPatch(`/api/pipelines/${pipelineId}`, { stages: pipeline.stages }).catch(console.error)
      return updated
    })
    // Delete deals in that stage
    setDeals((prev) => {
      const toDelete = prev.filter((d) => d.pipelineId === pipelineId && d.stage === stageId)
      toDelete.forEach((d) => apiDelete(`/api/deals/${d.id}`).catch(console.error))
      return prev.filter((d) => !(d.pipelineId === pipelineId && d.stage === stageId))
    })
  }, [])

  const updateStage = useCallback((pipelineId: string, stageId: string, updates: Partial<StageConfig>) => {
    setPipelines((prev) => {
      const updated = prev.map((p) =>
        p.id === pipelineId
          ? { ...p, stages: p.stages.map((s) => (s.id === stageId ? { ...s, ...updates } : s)) }
          : p
      )
      const pipeline = updated.find((p) => p.id === pipelineId)
      if (pipeline) apiPatch(`/api/pipelines/${pipelineId}`, { stages: pipeline.stages }).catch(console.error)
      return updated
    })
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
