'use client'

import { useState, useEffect } from 'react'
import { Activity, ActivityType, Deal, EmailTemplate, ACTIVITY_TYPE_OPTIONS, getActivityLabel } from '@/lib/types'
import { substituteVariables } from '@/lib/emailUtils'
import { loadEmailSettings } from '@/lib/storage'

interface ActivityModalProps {
  activity?: Activity | null
  allDeals: Deal[]
  defaultDealId?: string
  emailTemplates?: EmailTemplate[]
  onSave: (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdate?: (id: string, updates: Partial<Activity>) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

function getNextBusinessDay(): string {
  const d = new Date()
  const day = d.getDay()
  if (day === 5) d.setDate(d.getDate() + 3) // Fri -> Mon
  else if (day === 6) d.setDate(d.getDate() + 2) // Sat -> Mon
  else d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d.toISOString().slice(0, 16)
}

function getTodayNow(): string {
  return new Date().toISOString().slice(0, 16)
}

export default function ActivityModal({ activity, allDeals, defaultDealId, emailTemplates = [], onSave, onUpdate, onDelete, onClose }: ActivityModalProps) {
  const isEdit = !!activity
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [titleTouched, setTitleTouched] = useState(false)

  // Email fields
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [senderEmail, setSenderEmail] = useState('')

  useEffect(() => {
    const settings = loadEmailSettings()
    setSenderEmail(settings.senderEmail)
  }, [])

  // Deal search
  const [dealSearch, setDealSearch] = useState('')
  const [showDealDropdown, setShowDealDropdown] = useState(false)

  const filteredDeals = allDeals.filter((d) => {
    if (!dealSearch) return true
    const q = dealSearch.toLowerCase()
    return d.companyName.toLowerCase().includes(q) || d.title.toLowerCase().includes(q) || d.contactPerson.toLowerCase().includes(q)
  })

  const selectedDealName = (dealId: string) => {
    const deal = allDeals.find((d) => d.id === dealId)
    return deal ? `${deal.companyName} - ${deal.title}` : ''
  }

  const [form, setForm] = useState({
    type: 'call' as ActivityType,
    customType: '',
    title: '',
    description: '',
    dealId: defaultDealId || '',
    date: getTodayNow(),
    duration: '',
    completed: false,
  })

  // Auto-fill title when type changes (only if user hasn't manually edited it)
  useEffect(() => {
    if (!isEdit && !titleTouched) {
      const label = form.type === 'custom' && form.customType
        ? form.customType
        : ACTIVITY_TYPE_OPTIONS.find((o) => o.id === form.type)?.label || ''
      setForm((prev) => ({ ...prev, title: label }))
    }
  }, [form.type, form.customType, isEdit, titleTouched])

  useEffect(() => {
    if (activity) {
      setForm({
        type: activity.type,
        customType: activity.customType || '',
        title: activity.title,
        description: activity.description || '',
        dealId: activity.dealId,
        date: activity.date.slice(0, 16),
        duration: activity.duration?.toString() || '',
        completed: activity.completed,
      })
      setTitleTouched(true)
    }
  }, [activity])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let description = form.description || undefined
    if (form.type === 'email' && (emailSubject || emailBody)) {
      description = `[제목: ${emailSubject}]\n\n${emailBody}`
    }
    const data = {
      type: form.type,
      customType: form.type === 'custom' && form.customType ? form.customType : undefined,
      title: form.title,
      description,
      dealId: form.dealId,
      date: new Date(form.date).toISOString(),
      duration: form.duration ? parseInt(form.duration) : undefined,
      completed: form.completed,
    }
    if (isEdit && onUpdate && activity) {
      onUpdate(activity.id, data)
    } else {
      onSave(data)
    }
    onClose()
  }

  const handleDelete = () => {
    if (activity && onDelete) {
      onDelete(activity.id)
      onClose()
    }
  }

  const handleDealSelect = (deal: Deal) => {
    setForm((prev) => ({ ...prev, dealId: deal.id }))
    setDealSearch('')
    setShowDealDropdown(false)
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (!templateId) {
      setEmailSubject('')
      setEmailBody('')
      return
    }
    const tpl = emailTemplates.find((t) => t.id === templateId)
    if (!tpl) return
    const deal = allDeals.find((d) => d.id === form.dealId)
    if (deal) {
      setEmailSubject(substituteVariables(tpl.subject, deal))
      setEmailBody(substituteVariables(tpl.body, deal))
    } else {
      setEmailSubject(tpl.subject)
      setEmailBody(tpl.body)
    }
    if (!titleTouched) {
      setForm((prev) => ({ ...prev, title: tpl.name }))
    }
  }

  const handleSendEmail = async () => {
    const deal = allDeals.find((d) => d.id === form.dealId)
    if (!deal?.contactEmail || !senderEmail) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: deal.contactEmail,
          subject: emailSubject,
          body: emailBody,
          from: senderEmail,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSendResult({ ok: true, message: '이메일이 발송되었습니다!' })
      } else {
        setSendResult({ ok: false, message: data.error || '발송 실패' })
      }
    } catch {
      setSendResult({ ok: false, message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setSending(false)
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
            {isEdit ? '활동 수정' : '새 활동 추가'}
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
          {/* Activity Type Selection */}
          <div>
            <label className="block text-xs text-[#a78bbc] mb-2">활동 유형 *</label>
            <div className="grid grid-cols-3 gap-1.5">
              {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm({ ...form, type: opt.id })}
                  className={`text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    form.type === opt.id
                      ? `${opt.color}/20 text-white border border-current`
                      : 'bg-[#2d1f42] text-[#a78bbc] hover:text-white'
                  }`}
                >
                  <ActivityTypeIcon type={opt.id} size={14} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Type Name */}
          {form.type === 'custom' && (
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">활동 유형 이름 *</label>
              <input
                type="text"
                required
                value={form.customType}
                onChange={(e) => setForm({ ...form, customType: e.target.value })}
                placeholder="예: SNS 리서치, 경쟁사 분석..."
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-[#a78bbc] mb-1">제목 *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setTitleTouched(true) }}
              placeholder="활동 제목"
              className={inputClass}
            />
          </div>

          {/* Deal Search */}
          <div>
            <label className="block text-xs text-[#a78bbc] mb-1">연결 딜 *</label>
            <div className="relative">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a78bbc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={dealSearch}
                  onChange={(e) => { setDealSearch(e.target.value); setShowDealDropdown(true) }}
                  onFocus={() => setShowDealDropdown(true)}
                  placeholder={form.dealId ? selectedDealName(form.dealId) : '딜 검색 (회사명, 제목, 담당자)...'}
                  className={inputClass + ' pl-9'}
                />
              </div>
              {form.dealId && !dealSearch && (
                <p className="text-[10px] text-purple-400 mt-1">
                  선택됨: {selectedDealName(form.dealId)}
                </p>
              )}
              {showDealDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg max-h-40 overflow-y-auto shadow-xl">
                  {filteredDeals.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-[#a78bbc]/50">검색 결과 없음</div>
                  ) : (
                    filteredDeals.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleDealSelect(d)}
                        className={`w-full text-left px-3 py-2 hover:bg-[#1a1128] transition-colors ${
                          d.id === form.dealId ? 'bg-purple-600/10' : ''
                        }`}
                      >
                        <p className="text-xs text-white">{d.companyName} <span className="text-[#a78bbc]">- {d.title}</span></p>
                        <p className="text-[10px] text-[#a78bbc]/60">{d.contactPerson}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
              {/* Hidden required input for form validation */}
              <input type="hidden" required value={form.dealId} />
            </div>
          </div>

          {/* Email Template Section */}
          {form.type === 'email' && (
            <div className="space-y-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <div>
                <label className="block text-xs text-[#a78bbc] mb-1">이메일 템플릿</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className={inputClass}
                >
                  <option value="">직접 작성</option>
                  {emailTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                  ))}
                </select>
                {!form.dealId && emailTemplates.length > 0 && (
                  <p className="text-[10px] text-yellow-400/70 mt-1">딜을 먼저 선택하면 변수가 자동 치환됩니다</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-[#a78bbc] mb-1">이메일 제목</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="이메일 제목"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-[#a78bbc] mb-1">이메일 본문</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="이메일 본문..."
                  rows={5}
                  className={inputClass + ' resize-none'}
                />
              </div>
              {form.dealId && (
                <div className="space-y-2">
                  {!senderEmail && (
                    <p className="text-[10px] text-yellow-400/70">이메일 메뉴에서 발신자 이메일을 먼저 설정하세요</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={sending || !senderEmail || !allDeals.find((d) => d.id === form.dealId)?.contactEmail || !emailSubject || !emailBody}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        발송 중...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        이메일 발송
                      </>
                    )}
                  </button>
                  {sendResult && (
                    <p className={`text-xs text-center ${sendResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                      {sendResult.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Date with quick buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#a78bbc]">날짜/시간 *</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, date: getTodayNow() })}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#2d1f42] text-[#a78bbc] hover:text-white transition-colors"
                >
                  오늘
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, date: getNextBusinessDay() })}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#2d1f42] text-[#a78bbc] hover:text-white transition-colors"
                >
                  다음 영업일
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
              <div>
                <input
                  type="number"
                  min="0"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="소요시간 (분)"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {form.type !== 'email' && (
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">설명</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="활동 상세 내용..."
                rows={3}
                className={inputClass + ' resize-none'}
              />
            </div>
          )}

          {/* Completed Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.completed}
              onChange={(e) => setForm({ ...form, completed: e.target.checked })}
              className="rounded border-[#2d1f42] bg-[#0f0a1a] text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-[#a78bbc]">완료됨</span>
          </label>

          <div className="flex items-center justify-between pt-2 border-t border-[#2d1f42]">
            <div>
              {isEdit && onDelete && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">정말 삭제?</span>
                    <button type="button" onClick={handleDelete} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors">삭제</button>
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-xs px-2 py-1 bg-[#2d1f42] text-[#a78bbc] rounded hover:bg-[#3d2f52] transition-colors">취소</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">활동 삭제</button>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-[#2d1f42] text-[#a78bbc] rounded-lg hover:bg-[#3d2f52] hover:text-white transition-colors">취소</button>
              <button type="submit" className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">{isEdit ? '수정' : '추가'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Activity Type Icons
export function ActivityTypeIcon({ type, size = 16 }: { type: ActivityType; size?: number }) {
  const s = size
  switch (type) {
    case 'call':
      return (
        <svg width={s} height={s} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    case 'email':
      return (
        <svg width={s} height={s} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    case 'meeting':
      return (
        <svg width={s} height={s} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    case 'proposal':
      return (
        <svg width={s} height={s} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    case 'note':
      return (
        <svg width={s} height={s} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    case 'custom':
      return (
        <svg width={s} height={s} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      )
  }
}
