'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Deal, getPlanLabel, getPlanColor, getDaysUntil } from '@/lib/types'

interface DealCardProps {
  deal: Deal
  index: number
  onClick: (deal: Deal) => void
}

export default function DealCard({ deal, index, onClick }: DealCardProps) {
  const daysLeft = getDaysUntil(deal.expectedCloseDate)

  const getBadge = () => {
    if (daysLeft < 0) return { text: '초과', cls: 'bg-gray-500/20 text-gray-400' }
    if (daysLeft <= 2) return { text: `D-${daysLeft}`, cls: 'bg-red-500/20 text-red-400 animate-pulse' }
    if (daysLeft <= 5) return { text: `D-${daysLeft}`, cls: 'bg-yellow-500/20 text-yellow-400' }
    return { text: `D-${daysLeft}`, cls: 'bg-blue-500/20 text-blue-400' }
  }

  const badge = getBadge()
  const planColor = getPlanColor(deal.plan)

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(deal)}
          className={`bg-[#0f0a1a] border border-[#2d1f42] rounded-lg p-3 cursor-pointer transition-all ${
            snapshot.isDragging
              ? 'shadow-lg shadow-purple-500/20 border-purple-500/50 rotate-2'
              : 'hover:border-purple-500/30 hover:bg-[#130e20]'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-medium text-white leading-tight flex-1 mr-2">
              {deal.companyName}
            </h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${badge.cls}`}>
              {badge.text}
            </span>
          </div>

          <p className="text-xs text-[#a78bbc] mb-2 truncate">{deal.title}</p>

          <div className="flex items-center justify-between">
            <span className={`text-[11px] px-2 py-0.5 rounded-full text-white font-medium ${planColor}`}>
              {getPlanLabel(deal.plan)}
            </span>
            <span className="text-[11px] text-[#a78bbc]">
              {deal.contactPerson}
            </span>
          </div>

          {deal.tags && deal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {deal.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
