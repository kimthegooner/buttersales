'use client'

import { Droppable } from '@hello-pangea/dnd'
import { Deal, StageConfig } from '@/lib/types'
import DealCard from './DealCard'

interface KanbanColumnProps {
  stage: StageConfig
  deals: Deal[]
  onDealClick: (deal: Deal) => void
  onAddDeal: (stage: StageConfig) => void
  onRemoveStage?: (stageId: string) => void
}

export default function KanbanColumn({ stage, deals, onDealClick, onAddDeal, onRemoveStage }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] w-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
          <h3 className="text-sm font-semibold text-white">{stage.label}</h3>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#2d1f42] text-[#a78bbc]">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddDeal(stage)}
            className="w-6 h-6 rounded-md bg-[#2d1f42] hover:bg-purple-600/30 text-[#a78bbc] hover:text-purple-300 flex items-center justify-center transition-colors text-sm"
          >
            +
          </button>
          {onRemoveStage && (
            <button
              onClick={() => onRemoveStage(stage.id)}
              className="w-6 h-6 rounded-md hover:bg-red-500/20 text-[#a78bbc]/40 hover:text-red-400 flex items-center justify-center transition-colors text-xs"
              title="단계 삭제"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2 p-2 rounded-lg min-h-[120px] transition-colors ${
              snapshot.isDraggingOver
                ? 'bg-purple-500/10 border border-dashed border-purple-500/30'
                : 'bg-[#1a1128]/30 border border-transparent'
            }`}
          >
            {deals.map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                onClick={onDealClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
