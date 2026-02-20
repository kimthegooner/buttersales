'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { EmailTemplate, EMAIL_CATEGORIES } from '@/lib/types'
import { useEmailTemplates } from '@/hooks/useEmailTemplates'
import EmailTemplateModal from '@/components/EmailTemplateModal'

// Inbox email type
interface InboxEmail {
  uid: number
  subject: string
  from: string
  fromEmail: string
  to: string
  date: string
  seen: boolean
}

interface EmailDetail {
  uid: number
  subject: string
  from: string
  fromEmail: string
  to: string
  date: string
  body: string
  html: string
  seen: boolean
  attachments: { filename: string; size: number; contentType: string }[]
}

export default function EmailsPage() {
  const { templates, settings, loaded, addTemplate, updateTemplate, deleteTemplate, updateSettings } = useEmailTemplates()

  // Tab state
  const [activeTab, setActiveTab] = useState<'inbox' | 'templates'>('inbox')

  // Template states
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

  // Inbox states
  const [inboxEmails, setInboxEmails] = useState<InboxEmail[]>([])
  const [inboxLoading, setInboxLoading] = useState(false)
  const [inboxError, setInboxError] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Reply states
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replyResult, setReplyResult] = useState<{ ok: boolean; message: string } | null>(null)

  // Load inbox
  const loadInbox = useCallback(async () => {
    setInboxLoading(true)
    setInboxError('')
    try {
      const res = await fetch('/api/emails/inbox?limit=50')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '받은편지함 조회 실패')
      }
      const data = await res.json()
      setInboxEmails(data)
    } catch (err) {
      setInboxError(String(err))
    } finally {
      setInboxLoading(false)
    }
  }, [])

  // Load inbox when tab switches to inbox
  useEffect(() => {
    if (activeTab === 'inbox' && inboxEmails.length === 0 && !inboxLoading) {
      loadInbox()
    }
  }, [activeTab, inboxEmails.length, inboxLoading, loadInbox])

  // Load email detail
  const loadEmailDetail = async (uid: number) => {
    setDetailLoading(true)
    setSelectedEmail(null)
    setReplyOpen(false)
    setReplyResult(null)
    try {
      const res = await fetch(`/api/emails/${uid}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '이메일 조회 실패')
      }
      const data = await res.json()
      setSelectedEmail(data)
      // Mark as seen in list
      setInboxEmails((prev) => prev.map((e) => (e.uid === uid ? { ...e, seen: true } : e)))
    } catch (err) {
      console.error('Email detail error:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  // Send reply
  const handleReply = async () => {
    if (!selectedEmail || !replyBody.trim()) return
    setReplySending(true)
    setReplyResult(null)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedEmail.fromEmail,
          subject: selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
          body: replyBody,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setReplyResult({ ok: true, message: '답장이 발송되었습니다!' })
        setReplyBody('')
        setReplyOpen(false)
      } else {
        setReplyResult({ ok: false, message: data.error || '발송 실패' })
      }
    } catch {
      setReplyResult({ ok: false, message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setReplySending(false)
    }
  }

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
          body: '이 메일은 Zoho SMTP 연동 테스트입니다. 정상적으로 수신되었다면 이메일 발송 설정이 완료된 것입니다.',
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
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
            {activeTab === 'inbox'
              ? `${inboxEmails.length}개의 이메일`
              : `${templates.length}개의 템플릿${filtered.length !== templates.length ? ` · ${filtered.length}개 표시 중` : ''}`
            }
          </p>
        </div>
        {activeTab === 'templates' && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            템플릿 추가
          </button>
        )}
        {activeTab === 'inbox' && (
          <button
            onClick={loadInbox}
            disabled={inboxLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${inboxLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            새로고침
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#2d1f42]">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'inbox'
              ? 'text-purple-300 border-purple-500'
              : 'text-[#a78bbc] border-transparent hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            수신함
            {inboxEmails.filter((e) => !e.seen).length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-600 text-white">
                {inboxEmails.filter((e) => !e.seen).length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'templates'
              ? 'text-purple-300 border-purple-500'
              : 'text-[#a78bbc] border-transparent hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
            </svg>
            템플릿
          </span>
        </button>
      </div>

      {/* ===== INBOX TAB ===== */}
      {activeTab === 'inbox' && (
        <div>
          {/* Sender Settings (compact) */}
          <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl px-4 py-3 mb-4">
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
                    placeholder="support@codenbutter.com"
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
              <p className={`text-xs mt-2 ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.message}
              </p>
            )}
          </div>

          {replyResult && !replyOpen && (
            <div className={`text-xs mb-3 px-3 py-2 rounded-lg ${replyResult.ok ? 'bg-green-600/10 text-green-400' : 'bg-red-600/10 text-red-400'}`}>
              {replyResult.message}
            </div>
          )}

          {inboxError && (
            <div className="text-xs mb-3 px-3 py-2 rounded-lg bg-red-600/10 text-red-400">
              {inboxError}
            </div>
          )}

          {inboxLoading && inboxEmails.length === 0 ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-[#a78bbc] text-sm">받은편지함 로딩 중...</div>
            </div>
          ) : inboxEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <div className="w-14 h-14 bg-[#1a1128] border border-[#2d1f42] rounded-2xl flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-[#a78bbc]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-[#a78bbc] text-sm">받은편지함이 비어있습니다</p>
            </div>
          ) : (
            <div className="flex gap-4 min-h-[60vh]">
              {/* Email List */}
              <div className="w-[380px] shrink-0 border border-[#2d1f42] rounded-xl overflow-hidden">
                <div className="max-h-[70vh] overflow-y-auto">
                  {inboxEmails.map((email) => (
                    <button
                      key={email.uid}
                      onClick={() => loadEmailDetail(email.uid)}
                      className={`w-full text-left px-4 py-3 border-b border-[#2d1f42] hover:bg-[#1a1128] transition-colors ${
                        selectedEmail?.uid === email.uid ? 'bg-[#1a1128] border-l-2 border-l-purple-500' : ''
                      } ${!email.seen ? 'bg-[#1a1128]/50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs truncate max-w-[200px] ${!email.seen ? 'font-semibold text-white' : 'text-[#a78bbc]'}`}>
                          {email.from || email.fromEmail}
                        </span>
                        <span className="text-[10px] text-[#a78bbc]/60 shrink-0 ml-2">{formatDate(email.date)}</span>
                      </div>
                      <p className={`text-xs truncate ${!email.seen ? 'font-medium text-white' : 'text-white/80'}`}>
                        {email.subject}
                      </p>
                      <p className="text-[11px] text-[#a78bbc]/50 truncate mt-0.5">{email.fromEmail}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Detail */}
              <div className="flex-1 border border-[#2d1f42] rounded-xl overflow-hidden">
                {detailLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-[#a78bbc] text-sm">로딩 중...</div>
                  </div>
                ) : selectedEmail ? (
                  <div className="h-full flex flex-col">
                    {/* Email header */}
                    <div className="px-5 py-4 border-b border-[#2d1f42]">
                      <h3 className="text-base font-semibold text-white mb-3">{selectedEmail.subject}</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white">
                            {selectedEmail.from}
                            <span className="text-[#a78bbc] ml-1">&lt;{selectedEmail.fromEmail}&gt;</span>
                          </p>
                          <p className="text-[11px] text-[#a78bbc]/60 mt-0.5">받는사람: {selectedEmail.to}</p>
                        </div>
                        <span className="text-[11px] text-[#a78bbc]/60">{formatFullDate(selectedEmail.date)}</span>
                      </div>
                    </div>

                    {/* Email body */}
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                      <div className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                        {selectedEmail.body}
                      </div>

                      {selectedEmail.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#2d1f42]">
                          <p className="text-xs text-[#a78bbc] mb-2">첨부파일 ({selectedEmail.attachments.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedEmail.attachments.map((att, i) => (
                              <div key={i} className="flex items-center gap-1.5 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-1.5">
                                <svg className="w-3.5 h-3.5 text-[#a78bbc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="text-xs text-white">{att.filename}</span>
                                <span className="text-[10px] text-[#a78bbc]/50">
                                  {att.size > 1024 * 1024
                                    ? `${(att.size / 1024 / 1024).toFixed(1)}MB`
                                    : `${Math.round(att.size / 1024)}KB`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reply area */}
                    <div className="border-t border-[#2d1f42] px-5 py-3">
                      {replyOpen ? (
                        <div className="space-y-3">
                          <textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="답장을 작성하세요..."
                            rows={4}
                            autoFocus
                            className="w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 text-sm text-white placeholder-[#a78bbc]/50 focus:border-purple-500 focus:outline-none resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleReply}
                              disabled={replySending || !replyBody.trim()}
                              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                            >
                              {replySending ? '발송 중...' : '답장 보내기'}
                            </button>
                            <button
                              onClick={() => { setReplyOpen(false); setReplyBody('') }}
                              className="px-3 py-1.5 text-xs text-[#a78bbc] hover:text-white transition-colors"
                            >
                              취소
                            </button>
                          </div>
                          {replyResult && (
                            <p className={`text-xs ${replyResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                              {replyResult.message}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg text-xs text-[#a78bbc] hover:text-white hover:border-purple-500/30 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          답장
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg className="w-10 h-10 text-[#a78bbc]/20 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-[#a78bbc]/40">이메일을 선택하세요</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TEMPLATES TAB ===== */}
      {activeTab === 'templates' && (
        <div>
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
                    placeholder="support@codenbutter.com"
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
              Zoho SMTP를 통해 support@codenbutter.com에서 이메일을 발송합니다.
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
