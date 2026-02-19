'use client'

import { useState, useEffect } from 'react'
import { Deal, Contact, PlanType, StageConfig, PLAN_OPTIONS } from '@/lib/types'

interface DealModalProps {
  deal?: Deal | null
  defaultStage?: string
  pipelineId: string
  stages: StageConfig[]
  contacts?: Contact[]
  onSave: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdate?: (id: string, updates: Partial<Deal>) => void
  onDelete?: (id: string) => void
  onAddActivity?: (dealId: string) => void
  onClose: () => void
}

export default function DealModal({ deal, defaultStage, pipelineId, stages, contacts = [], onSave, onUpdate, onDelete, onAddActivity, onClose }: DealModalProps) {
  const isEdit = !!deal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [contactMode, setContactMode] = useState<'manual' | 'search'>('manual')
  const [contactSearch, setContactSearch] = useState('')
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const [selectedContactName, setSelectedContactName] = useState('')

  const filteredContacts = contacts.filter((c) => {
    if (!contactSearch) return true
    const q = contactSearch.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q))
  })

  const handleContactSelect = (contact: Contact) => {
    setForm((prev) => ({
      ...prev,
      companyName: contact.company,
      contactPerson: contact.name,
      contactEmail: contact.email || '',
      contactPhone: contact.phone || '',
    }))
    setSelectedContactName(`${contact.name} - ${contact.company}`)
    setContactSearch('')
    setShowContactDropdown(false)
  }

  const [form, setForm] = useState({
    title: '',
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'starter' as PlanType,
    stage: defaultStage || (stages[0]?.id ?? ''),
    expectedCloseDate: '',
    notes: '',
    tags: '',
    source: '',
  })

  useEffect(() => {
    if (deal) {
      setForm({
        title: deal.title,
        companyName: deal.companyName,
        contactPerson: deal.contactPerson,
        contactEmail: deal.contactEmail || '',
        contactPhone: deal.contactPhone || '',
        plan: deal.plan,
        stage: deal.stage,
        expectedCloseDate: deal.expectedCloseDate,
        notes: deal.notes || '',
        tags: deal.tags?.join(', ') || '',
        source: deal.source || '',
      })
    }
  }, [deal])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedTags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)

    const dealData = {
      title: form.title,
      companyName: form.companyName,
      contactPerson: form.contactPerson,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      plan: form.plan,
      stage: form.stage,
      expectedCloseDate: form.expectedCloseDate,
      notes: form.notes || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      source: form.source || undefined,
    }

    if (isEdit && onUpdate && deal) {
      onUpdate(deal.id, dealData)
    } else {
      onSave({ ...dealData, pipelineId })
    }
    onClose()
  }

  const handleDelete = () => {
    if (deal && onDelete) {
      onDelete(deal.id)
      onClose()
    }
  }

  const inputClass =
    'w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 text-sm text-white placeholder-[#a78bbc]/50 focus:border-purple-500 focus:outline-none transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1128] border border-[#2d1f42] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d1f42]">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? '딜 수정' : '새 딜 추가'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#2d1f42] flex items-center justify-center text-[#a78bbc] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Contact Mode Tabs - only show when creating new deal */}
          {!isEdit && contacts.length > 0 && (
            <div>
              <div className="flex gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => setContactMode('manual')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    contactMode === 'manual'
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'bg-[#2d1f42] text-[#a78bbc] hover:text-white'
                  }`}
                >
                  직접 입력
                </button>
                <button
                  type="button"
                  onClick={() => { setContactMode('search'); setShowContactDropdown(true) }}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    contactMode === 'search'
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'bg-[#2d1f42] text-[#a78bbc] hover:text-white'
                  }`}
                >
                  연락처 검색
                </button>
              </div>

              {contactMode === 'search' && (
                <div className="relative">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a78bbc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => { setContactSearch(e.target.value); setShowContactDropdown(true) }}
                      onFocus={() => setShowContactDropdown(true)}
                      placeholder="이름, 회사, 이메일로 검색..."
                      className={inputClass + ' pl-9'}
                    />
                  </div>
                  {selectedContactName && !contactSearch && (
                    <p className="text-[10px] text-purple-400 mt-1">
                      선택됨: {selectedContactName}
                    </p>
                  )}
                  {showContactDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg max-h-40 overflow-y-auto shadow-xl">
                      {filteredContacts.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-[#a78bbc]/50">검색 결과 없음</div>
                      ) : (
                        filteredContacts.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleContactSelect(c)}
                            className="w-full text-left px-3 py-2 hover:bg-[#1a1128] transition-colors flex items-center gap-2"
                          >
                            <div className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-300 text-[10px] font-bold shrink-0">
                              {c.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-white truncate">{c.name} <span className="text-[#a78bbc]">- {c.company}</span></p>
                              {c.position && <p className="text-[10px] text-[#a78bbc]/60">{c.position}</p>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs text-[#a78bbc] mb-1">회사명 *</label>
            <input
              type="text"
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="예: ABC 커머스"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-[#a78bbc] mb-1">딜 제목 *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="예: 코드앤버터 팝업 빌더 도입"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">담당자 *</label>
              <input
                type="text"
                required
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="홍길동"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">이메일</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="email@company.kr"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">전화번호</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="010-0000-0000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">플랜 *</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value as PlanType })}
                className={inputClass}
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">스테이지 *</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className={inputClass}
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">마감 예정일 *</label>
              <input
                type="date"
                required
                value={form.expectedCloseDate}
                onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">리드 소스</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="인바운드, 소개, 콜드메일..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">태그 (쉼표 구분)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="SMB, 이커머스"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#a78bbc] mb-1">메모</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="딜 관련 메모..."
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#2d1f42]">
            <div className="flex items-center gap-2">
              {isEdit && onDelete && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">정말 삭제?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      삭제
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-xs px-2 py-1 bg-[#2d1f42] text-[#a78bbc] rounded hover:bg-[#3d2f52] transition-colors"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    딜 삭제
                  </button>
                )
              )}
              {isEdit && deal && onAddActivity && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => { onAddActivity(deal.id); onClose() }}
                  className="text-xs px-3 py-1.5 bg-cyan-600/20 text-cyan-300 rounded-lg hover:bg-cyan-600/30 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  활동 추가
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm bg-[#2d1f42] text-[#a78bbc] rounded-lg hover:bg-[#3d2f52] hover:text-white transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                {isEdit ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
