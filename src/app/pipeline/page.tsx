'use client'

import { useState, useEffect } from 'react'
import { Deal, Contact, EmailTemplate, StageConfig } from '@/lib/types'
import { useDeals } from '@/hooks/useDeals'
import { useActivities } from '@/hooks/useActivities'
import { loadContacts, loadEmailTemplates } from '@/lib/storage'
import PipelineSummary from '@/components/PipelineSummary'
import KanbanBoard from '@/components/KanbanBoard'
import DealModal from '@/components/DealModal'
import ActivityModal from '@/components/ActivityModal'

export default function PipelinePage() {
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
  } = useDeals()

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
    const stored = loadContacts()
    if (stored.length > 0) {
      setAllContacts(stored)
    } else {
      fetch('/data/contacts.json')
        .then((r) => r.json())
        .then((data) => setAllContacts(data.contacts || []))
        .catch(() => {})
    }
    const storedTpl = loadEmailTemplates()
    if (storedTpl.length > 0) {
      setEmailTemplates(storedTpl)
    } else {
      fetch('/data/email-templates.json')
        .then((r) => r.json())
        .then((data) => setEmailTemplates(data.templates || []))
        .catch(() => {})
    }
  }, [])

  // Pipeline tab management
  const [showNewPipeline, setShowNewPipeline] = useState(false)
  const [newPipelineName, setNewPipelineName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [showDeletePipeline, setShowDeletePipeline] = useState<string | null>(null)

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

  const handleCreatePipeline = () => {
    if (!newPipelineName.trim()) return
    addPipeline(newPipelineName.trim())
    setNewPipelineName('')
    setShowNewPipeline(false)
  }

  const handleRename = (id: string) => {
    if (!renameValue.trim()) return
    renamePipeline(id, renameValue.trim())
    setRenamingId(null)
    setRenameValue('')
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
      {/* Pipeline Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-[#2d1f42] overflow-x-auto">
        {pipelines.map((pipeline) => (
          <div key={pipeline.id} className="relative group shrink-0">
            {renamingId === pipeline.id ? (
              <div className="flex items-center gap-1 px-2 py-2">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(pipeline.id)
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  autoFocus
                  className="bg-[#0f0a1a] border border-purple-500 rounded px-2 py-1 text-sm text-white focus:outline-none w-32"
                />
                <button
                  onClick={() => handleRename(pipeline.id)}
                  className="text-xs text-purple-400 hover:text-purple-300 px-1"
                >
                  확인
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActivePipelineId(pipeline.id)}
                onDoubleClick={() => {
                  setRenamingId(pipeline.id)
                  setRenameValue(pipeline.name)
                }}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  activePipelineId === pipeline.id
                    ? 'text-purple-300 border-purple-500'
                    : 'text-[#a78bbc] border-transparent hover:text-white hover:border-[#a78bbc]/30'
                }`}
              >
                {pipeline.name}
              </button>
            )}

            {/* Delete pipeline button (visible on hover, if more than 1) */}
            {pipelines.length > 1 && activePipelineId === pipeline.id && renamingId !== pipeline.id && (
              <button
                onClick={() => setShowDeletePipeline(pipeline.id)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2d1f42] text-[#a78bbc]/60 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                x
              </button>
            )}
          </div>
        ))}

        {/* Add pipeline tab */}
        {showNewPipeline ? (
          <div className="flex items-center gap-1 px-2 py-2 shrink-0">
            <input
              type="text"
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreatePipeline()
                if (e.key === 'Escape') { setShowNewPipeline(false); setNewPipelineName('') }
              }}
              placeholder="파이프라인 이름"
              autoFocus
              className="bg-[#0f0a1a] border border-[#2d1f42] rounded px-2 py-1 text-sm text-white placeholder-[#a78bbc]/50 focus:border-purple-500 focus:outline-none w-36"
            />
            <button
              onClick={handleCreatePipeline}
              className="text-xs text-purple-400 hover:text-purple-300 px-1"
            >
              생성
            </button>
            <button
              onClick={() => { setShowNewPipeline(false); setNewPipelineName('') }}
              className="text-xs text-[#a78bbc] hover:text-white px-1"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewPipeline(true)}
            className="shrink-0 px-3 py-2.5 text-[#a78bbc]/60 hover:text-purple-300 transition-colors border-b-2 border-transparent"
            title="새 파이프라인"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Delete Pipeline Confirmation */}
      {showDeletePipeline && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-300">
            이 파이프라인과 포함된 모든 딜을 삭제하시겠습니까?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { deletePipeline(showDeletePipeline); setShowDeletePipeline(null) }}
              className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
            >
              삭제
            </button>
            <button
              onClick={() => setShowDeletePipeline(null)}
              className="text-xs px-3 py-1.5 bg-[#2d1f42] text-[#a78bbc] rounded hover:bg-[#3d2f52] transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{activePipeline.name}</h2>
          <p className="text-sm text-[#a78bbc] mt-1">
            딜을 드래그하여 스테이지를 변경하세요 · 탭을 더블클릭하여 이름 변경
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
