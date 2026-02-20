'use client'

import { useState } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { Deal, StageConfig, STAGE_COLORS } from '@/lib/types'
import KanbanColumn from './KanbanColumn'

interface KanbanBoardProps {
  stages: StageConfig[]
  deals: Deal[]
  onMoveDeal: (id: string, newStage: string) => void
  onDealClick: (deal: Deal) => void
  onAddDeal: (stage: StageConfig) => void
  onAddStage: (stage: StageConfig) => void
  onRemoveStage: (stageId: string) => void
  onUpdateStage?: (stageId: string, updates: Partial<StageConfig>) => void
}

export default function KanbanBoard({
  stages,
  deals,
  onMoveDeal,
  onDealClick,
  onAddDeal,
  onAddStage,
  onRemoveStage,
  onUpdateStage,
}: KanbanBoardProps) {
  const [showAddStage, setShowAddStage] = useState(false)
  const [newStageName, setNewStageName] = useState('')

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result
    if (!destination) return
    onMoveDeal(draggableId, destination.droppableId)
  }

  const handleAddStage = () => {
    if (!newStageName.trim()) return
    const colorIndex = stages.length % STAGE_COLORS.length
    onAddStage({
      id: `stage-${Date.now()}`,
      label: newStageName.trim(),
      color: STAGE_COLORS[colorIndex],
    })
    setNewStageName('')
    setShowAddStage(false)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id)
          return (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={stageDeals}
              onDealClick={onDealClick}
              onAddDeal={onAddDeal}
              onRemoveStage={stages.length > 1 ? onRemoveStage : undefined}
              onUpdateStage={onUpdateStage}
            />
          )
        })}

        {/* Add Stage Column */}
        <div className="flex flex-col min-w-[200px] shrink-0">
          {showAddStage ? (
            <div className="bg-[#1a1128] border border-[#2d1f42] rounded-lg p-3 space-y-2">
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                placeholder="단계 이름"
                autoFocus
                className="w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 text-sm text-white placeholder-[#a78bbc]/50 focus:border-purple-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddStage}
                  className="flex-1 px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => { setShowAddStage(false); setNewStageName('') }}
                  className="px-3 py-1.5 text-xs bg-[#2d1f42] text-[#a78bbc] rounded-lg hover:bg-[#3d2f52] transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddStage(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-[#2d1f42] text-[#a78bbc] hover:border-purple-500/40 hover:text-purple-300 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              단계 추가
            </button>
          )}
        </div>
      </div>
    </DragDropContext>
  )
}
