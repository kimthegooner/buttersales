'use client'

import { useState, useEffect, useRef } from 'react'
import { EmailTemplate, EMAIL_CATEGORIES, EMAIL_TEMPLATE_VARIABLES } from '@/lib/types'

interface EmailTemplateModalProps {
  template?: EmailTemplate | null
  onSave: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdate?: (id: string, updates: Partial<EmailTemplate>) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

export default function EmailTemplateModal({ template, onSave, onUpdate, onDelete, onClose }: EmailTemplateModalProps) {
  const isEdit = !!template
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const [insertTarget, setInsertTarget] = useState<'subject' | 'body'>('body')

  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    category: '소개',
  })

  useEffect(() => {
    if (template) {
      setForm({
        name: template.name,
        subject: template.subject,
        body: template.body,
        category: template.category,
      })
    }
  }, [template])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit && onUpdate && template) {
      onUpdate(template.id, form)
    } else {
      onSave(form)
    }
    onClose()
  }

  const handleDelete = () => {
    if (template && onDelete) {
      onDelete(template.id)
      onClose()
    }
  }

  const insertVariable = (variable: string) => {
    if (insertTarget === 'subject') {
      const el = subjectRef.current
      if (el) {
        const start = el.selectionStart ?? form.subject.length
        const end = el.selectionEnd ?? form.subject.length
        const newVal = form.subject.slice(0, start) + variable + form.subject.slice(end)
        setForm({ ...form, subject: newVal })
        setTimeout(() => {
          el.focus()
          el.setSelectionRange(start + variable.length, start + variable.length)
        }, 0)
      }
    } else {
      const el = bodyRef.current
      if (el) {
        const start = el.selectionStart ?? form.body.length
        const end = el.selectionEnd ?? form.body.length
        const newVal = form.body.slice(0, start) + variable + form.body.slice(end)
        setForm({ ...form, body: newVal })
        setTimeout(() => {
          el.focus()
          el.setSelectionRange(start + variable.length, start + variable.length)
        }, 0)
      }
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
            {isEdit ? '템플릿 수정' : '새 템플릿 추가'}
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
          <div>
            <label className="block text-xs text-[#a78bbc] mb-1">템플릿 이름 *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예: 소개 이메일"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-[#a78bbc] mb-2">카테고리 *</label>
            <div className="flex flex-wrap gap-1.5">
              {EMAIL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    form.category === cat
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'bg-[#2d1f42] text-[#a78bbc] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#a78bbc] mb-1">제목 *</label>
            <input
              ref={subjectRef}
              type="text"
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              onFocus={() => setInsertTarget('subject')}
              placeholder="이메일 제목 (변수 사용 가능)"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs text-[#a78bbc] mb-1">본문 *</label>
            <textarea
              ref={bodyRef}
              required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              onFocus={() => setInsertTarget('body')}
              placeholder="이메일 본문 (변수 사용 가능)"
              rows={8}
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Variable Insert Buttons */}
          <div>
            <p className="text-[10px] text-[#a78bbc]/60 mb-1.5">
              변수 삽입 ({insertTarget === 'subject' ? '제목' : '본문'}에 삽입)
            </p>
            <div className="flex flex-wrap gap-1">
              {EMAIL_TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.variable}
                  type="button"
                  onClick={() => insertVariable(v.variable)}
                  className="text-[10px] px-2 py-1 rounded bg-[#2d1f42] text-[#a78bbc] hover:text-white hover:bg-[#3d2f52] transition-colors"
                >
                  {v.variable}
                </button>
              ))}
            </div>
          </div>

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
                  <button type="button" onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">템플릿 삭제</button>
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
