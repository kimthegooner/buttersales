'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Deal, Contact, EmailTemplate, StageConfig } from '@/lib/types'
import { useDeals } from '@/hooks/useDeals'
import { useActivities } from '@/hooks/useActivities'
import { apiGet } from '@/lib/api-client'
import PipelineSummary from '@/components/PipelineSummary'
import KanbanBoard from '@/components/KanbanBoard'
import DealModal from '@/components/DealModal'
import ActivityModal from '@/components/ActivityModal'

function PipelineContent() {
  const searchParams = useSearchParams()
  const pipelineIdFromUrl = searchParams.get('id')

  const {
    deals,
    allDeals,
    loaded,
    addDeal,
    updateDeal,
    deleteDeal,
    moveDeal,
    pipelines,
    activePipeline,
    activePipelineId,
    setActivePipelineId,
    addPipeline,
    renamePipeline,
    deletePipeline,
    addStage,
    removeStage,
    updateStage,
  } = useDeals()

  // URL의 id 파라미터로 파이프라인 선택
  useEffect(() => {
    if (pipelineIdFromUrl && pipelines.length > 0) {
      const found = pipelines.find((p) => p.id === pipelineIdFromUrl)
      if (found && activePipelineId !== pipelineIdFromUrl) {
        setActivePipelineId(pipelineIdFromUrl)
      }
    }
  }, [pipelineIdFromUrl, pipelines, activePipelineId, setActivePipelineId])

  const { activities, addActivity } = useActivities()

  const [modalOpen, setModalOpen] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [defaultStage, setDefaultStage] = useState<string>('')

  // Activity modal state
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [activityDefaultDealId, setActivityDefaultDealId] = useState<string>('')

  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  useEffect(() => {
    apiGet<Contact[]>('/api/contacts').then(setAllContacts).catch(console.error)
    apiGet<EmailTemplate[]>('/api/email-templates').then(setEmailTemplates).catch(console.error)
  }, [])

  const handleDealClick = (deal: Deal) => {
    setEditDeal(deal)
    setDefaultStage('')
    setModalOpen(true)
  }

  const handleAddDeal = (stage: StageConfig) => {
    setEditDeal(null)
    setDefaultStage(stage.id)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditDeal(null)
    setDefaultStage('')
  }

  const handleAddActivityFromDeal = (dealId: string) => {
    setActivityDefaultDealId(dealId)
    setActivityModalOpen(true)
  }

  const handleRemoveStage = (stageId: string) => {
    if (!activePipeline) return
    const stageDeals = deals.filter((d) => d.stage === stageId)
    if (stageDeals.length > 0) {
      if (!window.confirm(`이 단계에 ${stageDeals.length}건의 딜이 있습니다. 삭제하면 해당 딜도 함께 삭제됩니다. 계속하시겠습니까?`)) {
        return
      }
    }
    removeStage(activePipelineId, stageId)
  }

  if (!loaded || !activePipeline) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[#a78bbc] text-sm">로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{activePipeline.name}</h2>
          <p className="text-sm text-[#a78bbc] mt-1">
            딜을 드래그하여 스테이지를 변경하세요
          </p>
        </div>
        <button
          onClick={() => handleAddDeal(activePipeline.stages[0])}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 딜 추가
        </button>
      </div>

      {/* Summary Stats */}
      <PipelineSummary deals={deals} />

      {/* Kanban Board */}
      <KanbanBoard
        stages={activePipeline.stages}
        deals={deals}
        onMoveDeal={moveDeal}
        onDealClick={handleDealClick}
        onAddDeal={handleAddDeal}
        onAddStage={(stage) => addStage(activePipelineId, stage)}
        onRemoveStage={handleRemoveStage}
        onUpdateStage={(stageId, updates) => updateStage(activePipelineId, stageId, updates)}
      />

      {/* Deal Modal */}
      {modalOpen && (
        <DealModal
          deal={editDeal}
          defaultStage={defaultStage}
          pipelineId={activePipelineId}
          stages={activePipeline.stages}
          contacts={allContacts}
          onSave={addDeal}
          onUpdate={updateDeal}
          onDelete={deleteDeal}
          onAddActivity={handleAddActivityFromDeal}
          onClose={handleCloseModal}
        />
      )}

      {/* Activity Modal (from deal) */}
      {activityModalOpen && (
        <ActivityModal
          allDeals={allDeals}
          defaultDealId={activityDefaultDealId}
          emailTemplates={emailTemplates}
          onSave={addActivity}
          onClose={() => { setActivityModalOpen(false); setActivityDefaultDealId('') }}
        />
      )}
    </div>
  )
}

export default function PipelinePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[#a78bbc] text-sm">로딩 중...</div>
      </div>
    }>
      <PipelineContent />
    </Suspense>
  )
}
