'use client'

import { useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { Deal, StageConfig, StageAutomation, AUTOMATION_ACTION_OPTIONS, AutomationActionType } from '@/lib/types'
import DealCard from './DealCard'

interface KanbanColumnProps {
  stage: StageConfig
  deals: Deal[]
  onDealClick: (deal: Deal) => void
  onAddDeal: (stage: StageConfig) => void
  onRemoveStage?: (stageId: string) => void
  onUpdateStage?: (stageId: string, updates: Partial<StageConfig>) => void
}

export default function KanbanColumn({ stage, deals, onDealClick, onAddDeal, onRemoveStage, onUpdateStage }: KanbanColumnProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(stage.label)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editDesc, setEditDesc] = useState(stage.description || '')
  const [showSettings, setShowSettings] = useState(false)
  const [showAddAutomation, setShowAddAutomation] = useState(false)
  const [newAutoType, setNewAutoType] = useState<AutomationActionType>('send_email')
  const [newAutoLabel, setNewAutoLabel] = useState('')
  const [newAutoDesc, setNewAutoDesc] = useState('')

  const handleSaveName = () => {
    if (editName.trim() && editName !== stage.label && onUpdateStage) {
      onUpdateStage(stage.id, { label: editName.trim() })
    }
    setIsEditingName(false)
  }

  const handleSaveDesc = () => {
    if (onUpdateStage) {
      onUpdateStage(stage.id, { description: editDesc.trim() || undefined })
    }
    setIsEditingDesc(false)
  }

  const handleAddAutomation = () => {
    if (!newAutoLabel.trim() || !onUpdateStage) return
    const newAuto: StageAutomation = {
      id: `auto-${Date.now()}`,
      actionType: newAutoType,
      label: newAutoLabel.trim(),
      description: newAutoDesc.trim() || undefined,
      enabled: true,
    }
    const existing = stage.automations || []
    onUpdateStage(stage.id, { automations: [...existing, newAuto] })
    setNewAutoLabel('')
    setNewAutoDesc('')
    setShowAddAutomation(false)
  }

  const handleToggleAutomation = (autoId: string) => {
    if (!onUpdateStage) return
    const updated = (stage.automations || []).map((a) =>
      a.id === autoId ? { ...a, enabled: !a.enabled } : a
    )
    onUpdateStage(stage.id, { automations: updated })
  }

  const handleDeleteAutomation = (autoId: string) => {
    if (!onUpdateStage) return
    const updated = (stage.automations || []).filter((a) => a.id !== autoId)
    onUpdateStage(stage.id, { automations: updated })
  }

  const automations = stage.automations || []
  const activeAutomations = automations.filter((a) => a.enabled)

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] w-full">
      {/* Column Header */}
      <div className="mb-3 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.color}`} />
            {isEditingName ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') { setEditName(stage.label); setIsEditingName(false) }
                }}
                autoFocus
                className="bg-[#0f0a1a] border border-purple-500 rounded px-1.5 py-0.5 text-sm text-white focus:outline-none w-full"
              />
            ) : (
              <h3
                className="text-sm font-semibold text-white cursor-pointer hover:text-purple-300 transition-colors truncate"
                onDoubleClick={() => { setEditName(stage.label); setIsEditingName(true) }}
                title="더블클릭으로 이름 변경"
              >
                {stage.label}
              </h3>
            )}
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#2d1f42] text-[#a78bbc] shrink-0">
              {deals.length}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`w-6 h-6 rounded-md hover:bg-purple-600/30 flex items-center justify-center transition-colors text-xs ${
                showSettings ? 'bg-purple-600/30 text-purple-300' : 'text-[#a78bbc]/40 hover:text-purple-300'
              }`}
              title="단계 설정"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
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

        {/* Description */}
        {isEditingDesc ? (
          <div className="mt-1.5">
            <input
              type="text"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onBlur={handleSaveDesc}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveDesc()
                if (e.key === 'Escape') { setEditDesc(stage.description || ''); setIsEditingDesc(false) }
              }}
              placeholder="단계 설명 입력..."
              autoFocus
              className="w-full bg-[#0f0a1a] border border-purple-500 rounded px-2 py-1 text-xs text-[#a78bbc] placeholder-[#a78bbc]/40 focus:outline-none"
            />
          </div>
        ) : stage.description ? (
          <p
            className="mt-1 text-[11px] text-[#a78bbc]/70 cursor-pointer hover:text-[#a78bbc] transition-colors truncate"
            onDoubleClick={() => { setEditDesc(stage.description || ''); setIsEditingDesc(true) }}
            title="더블클릭으로 설명 편집"
          >
            {stage.description}
          </p>
        ) : null}

        {/* Active automations badge */}
        {activeAutomations.length > 0 && !showSettings && (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {activeAutomations.length}개 자동화
            </span>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-3 mx-1 p-3 bg-[#1a1128] border border-[#2d1f42] rounded-lg space-y-3">
          <div>
            <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold">이름</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="w-full mt-1 bg-[#0f0a1a] border border-[#2d1f42] rounded px-2 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold">설명</label>
            <input
              type="text"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onBlur={handleSaveDesc}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveDesc()}
              placeholder="이 단계에 대한 설명..."
              className="w-full mt-1 bg-[#0f0a1a] border border-[#2d1f42] rounded px-2 py-1.5 text-xs text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold">자동화 액션</label>
              <button
                onClick={() => setShowAddAutomation(!showAddAutomation)}
                className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
              >
                + 추가
              </button>
            </div>
            {automations.length > 0 ? (
              <div className="space-y-1.5">
                {automations.map((auto) => {
                  const actionOption = AUTOMATION_ACTION_OPTIONS.find((a) => a.id === auto.actionType)
                  return (
                    <div key={auto.id} className="flex items-center gap-2 p-1.5 bg-[#0f0a1a] rounded">
                      <button
                        onClick={() => handleToggleAutomation(auto.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          auto.enabled ? 'bg-purple-600 border-purple-600 text-white' : 'border-[#2d1f42] text-transparent'
                        }`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-medium truncate ${auto.enabled ? 'text-white' : 'text-[#a78bbc]/50 line-through'}`}>
                          {actionOption?.icon} {auto.label}
                        </p>
                        {auto.description && (
                          <p className="text-[10px] text-[#a78bbc]/50 truncate">{auto.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAutomation(auto.id)}
                        className="text-[#a78bbc]/30 hover:text-red-400 transition-colors shrink-0"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : !showAddAutomation ? (
              <p className="text-[11px] text-[#a78bbc]/40 italic">등록된 자동화가 없습니다</p>
            ) : null}
            {showAddAutomation && (
              <div className="mt-2 p-2 bg-[#0f0a1a] rounded border border-[#2d1f42] space-y-2">
                <select
                  value={newAutoType}
                  onChange={(e) => setNewAutoType(e.target.value as AutomationActionType)}
                  className="w-full bg-[#1a1128] border border-[#2d1f42] rounded px-2 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  {AUTOMATION_ACTION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newAutoLabel}
                  onChange={(e) => setNewAutoLabel(e.target.value)}
                  placeholder="액션 이름 (예: 환영 이메일 발송)"
                  autoFocus
                  className="w-full bg-[#1a1128] border border-[#2d1f42] rounded px-2 py-1.5 text-xs text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={newAutoDesc}
                  onChange={(e) => setNewAutoDesc(e.target.value)}
                  placeholder="설명 (선택)"
                  className="w-full bg-[#1a1128] border border-[#2d1f42] rounded px-2 py-1.5 text-xs text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={handleAddAutomation}
                    className="flex-1 px-2 py-1 text-[11px] bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    추가
                  </button>
                  <button
                    onClick={() => { setShowAddAutomation(false); setNewAutoLabel(''); setNewAutoDesc('') }}
                    className="px-2 py-1 text-[11px] bg-[#2d1f42] text-[#a78bbc] rounded hover:bg-[#3d2f52] transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
