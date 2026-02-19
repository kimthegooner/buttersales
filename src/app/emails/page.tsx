'use client'

import { useState, useMemo } from 'react'
import { EmailTemplate, EMAIL_CATEGORIES } from '@/lib/types'
import { useEmailTemplates } from '@/hooks/useEmailTemplates'
import EmailTemplateModal from '@/components/EmailTemplateModal'

export default function EmailsPage() {
  const { templates, settings, loaded, addTemplate, updateTemplate, deleteTemplate, updateSettings } = useEmailTemplates()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('전체')

  // Sender email inline edit
  const [senderInput, setSenderInput] = useState('')
  const [senderEditing, setSenderEditing] = useState(false)

  // Test send
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleTestSend = async () => {
    if (!settings.senderEmail) return
    setTestSending(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.senderEmail,
          subject: '[코드앤버터 CRM] 테스트 이메일',
          body: '이 메일은 Resend API 연동 테스트입니다. 정상적으로 수신되었다면 이메일 발송 설정이 완료된 것입니다.',
          from: settings.senderEmail,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setTestResult({ ok: true, message: `테스트 메일이 ${settings.senderEmail}으로 발송되었습니다!` })
      } else {
        setTestResult({ ok: false, message: data.error || '발송 실패' })
      }
    } catch {
      setTestResult({ ok: false, message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setTestSending(false)
    }
  }

  const startEditSender = () => {
    setSenderInput(settings.senderEmail)
    setSenderEditing(true)
  }

  const saveSender = () => {
    updateSettings({ senderEmail: senderInput.trim() })
    setSenderEditing(false)
  }

  const filtered = useMemo(() => {
    let result = templates
    if (categoryFilter !== '전체') {
      result = result.filter((t) => t.category === categoryFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((t) =>
        t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.body.toLowerCase().includes(q)
      )
    }
    return result
  }, [templates, categoryFilter, search])

  const handleTemplateClick = (template: EmailTemplate) => {
    setEditTemplate(template)
    setModalOpen(true)
  }

  const handleAddNew = () => {
    setEditTemplate(null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditTemplate(null)
  }

  if (!loaded) {
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
          <h2 className="text-2xl font-bold text-white">이메일</h2>
          <p className="text-sm text-[#a78bbc] mt-1">
            {templates.length}개의 템플릿{filtered.length !== templates.length && ` · ${filtered.length}개 표시 중`}
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          템플릿 추가
        </button>
      </div>

      {/* Sender Settings */}
      <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl px-4 py-3 mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#a78bbc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs text-[#a78bbc]">발신 이메일</span>
          </div>
          {senderEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={senderInput}
                onChange={(e) => setSenderInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveSender(); if (e.key === 'Escape') setSenderEditing(false) }}
                placeholder="sales@codenbutter.com"
                autoFocus
                className="bg-[#0f0a1a] border border-[#2d1f42] rounded px-2 py-1 text-xs text-white placeholder-[#a78bbc]/50 focus:border-purple-500 focus:outline-none w-56"
              />
              <button onClick={saveSender} className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded hover:bg-purple-600/30 transition-colors">저장</button>
              <button onClick={() => setSenderEditing(false)} className="text-xs px-2 py-1 text-[#a78bbc] hover:text-white transition-colors">취소</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={startEditSender} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                {settings.senderEmail ? (
                  <span className="text-white">{settings.senderEmail}</span>
                ) : (
                  <span className="text-[#a78bbc]/50">설정 안 됨</span>
                )}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              {settings.senderEmail && (
                <button
                  onClick={handleTestSend}
                  disabled={testSending}
                  className="text-[10px] px-2 py-1 bg-blue-600/20 text-blue-300 rounded hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                >
                  {testSending ? '발송 중...' : '테스트 발송'}
                </button>
              )}
            </div>
          )}
        </div>
        {testResult && (
          <p className={`text-xs ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>
            {testResult.message}
          </p>
        )}
        <p className="text-[10px] text-[#a78bbc]/40">
          Resend API로 이메일을 발송합니다. .env.local에 API 키를 설정하세요. 테스트 시 onboarding@resend.dev가 발신자로 사용됩니다.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a78bbc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="템플릿 검색..."
            className="w-full bg-[#1a1128] border border-[#2d1f42] rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-[#a78bbc]/50 focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {['전체', ...EMAIL_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'bg-[#1a1128] text-[#a78bbc] hover:text-white border border-[#2d1f42]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-14 h-14 bg-[#1a1128] border border-[#2d1f42] rounded-2xl flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-[#a78bbc]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-[#a78bbc] text-sm mb-1">
            {search || categoryFilter !== '전체' ? '검색 결과가 없습니다' : '아직 템플릿이 없습니다'}
          </p>
          {!search && categoryFilter === '전체' && (
            <button onClick={handleAddNew} className="text-xs text-purple-400 hover:text-purple-300 transition-colors mt-1">
              첫 템플릿을 추가해보세요
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleTemplateClick(tpl)}
              className="text-left bg-[#1a1128] border border-[#2d1f42] rounded-xl p-4 hover:border-purple-500/30 hover:bg-[#1a1128]/80 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">{tpl.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600/20 text-purple-300 shrink-0 ml-2">
                  {tpl.category}
                </span>
              </div>
              <p className="text-xs text-[#a78bbc] truncate mb-1">{tpl.subject}</p>
              <p className="text-xs text-[#a78bbc]/50 line-clamp-2">{tpl.body}</p>
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <EmailTemplateModal
          template={editTemplate}
          onSave={addTemplate}
          onUpdate={updateTemplate}
          onDelete={deleteTemplate}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
