'use client'

import { useState, useEffect } from 'react'
import { Contact, Deal } from '@/lib/types'

interface ContactModalProps {
  contact?: Contact | null
  allDeals: Deal[]
  onSave: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdate?: (id: string, updates: Partial<Contact>) => void
  onDelete?: (id: string) => void
  onAddDeal?: (contact: Contact) => void
  onClose: () => void
}

export default function ContactModal({ contact, allDeals, onSave, onUpdate, onDelete, onAddDeal, onClose }: ContactModalProps) {
  const isEdit = !!contact
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [dealAdded, setDealAdded] = useState(false)

  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    position: '',
    tags: '',
    notes: '',
    dealIds: [] as string[],
  })

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name,
        company: contact.company,
        email: contact.email || '',
        phone: contact.phone || '',
        position: contact.position || '',
        tags: contact.tags?.join(', ') || '',
        notes: contact.notes || '',
        dealIds: contact.dealIds || [],
      })
    }
  }, [contact])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedTags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    const data = {
      name: form.name,
      company: form.company,
      email: form.email || undefined,
      phone: form.phone || undefined,
      position: form.position || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      notes: form.notes || undefined,
      dealIds: form.dealIds.length > 0 ? form.dealIds : undefined,
    }
    if (isEdit && onUpdate && contact) {
      onUpdate(contact.id, data)
    } else {
      onSave(data)
    }
    onClose()
  }

  const handleDelete = () => {
    if (contact && onDelete) {
      onDelete(contact.id)
      onClose()
    }
  }

  const toggleDeal = (dealId: string) => {
    setForm((prev) => ({
      ...prev,
      dealIds: prev.dealIds.includes(dealId)
        ? prev.dealIds.filter((id) => id !== dealId)
        : [...prev.dealIds, dealId],
    }))
  }

  const inputClass =
    'w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 text-sm text-white placeholder-[#a78bbc]/50 focus:border-purple-500 focus:outline-none transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1128] border border-[#2d1f42] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d1f42]">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? '연락처 수정' : '새 연락처 추가'}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">이름 *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="홍길동"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">회사 *</label>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="ABC 커머스"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@company.kr"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">전화번호</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="010-0000-0000"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">직책</label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="마케팅 팀장"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[#a78bbc] mb-1">태그 (쉼표 구분)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="의사결정자, 이커머스"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#a78bbc] mb-1">메모</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="연락처 관련 메모..."
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Deal Linking */}
          {allDeals.length > 0 && (
            <div>
              <label className="block text-xs text-[#a78bbc] mb-2">연결된 딜</label>
              <div className="max-h-32 overflow-y-auto space-y-1 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg p-2">
                {allDeals.map((deal) => (
                  <label
                    key={deal.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1a1128] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={form.dealIds.includes(deal.id)}
                      onChange={() => toggleDeal(deal.id)}
                      className="rounded border-[#2d1f42] bg-[#0f0a1a] text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-xs text-white">{deal.companyName}</span>
                    <span className="text-[10px] text-[#a78bbc]">- {deal.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#2d1f42]">
            <div className="flex items-center gap-2">
              {isEdit && onDelete && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">정말 삭제?</span>
                    <button type="button" onClick={handleDelete} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors">삭제</button>
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="text-xs px-2 py-1 bg-[#2d1f42] text-[#a78bbc] rounded hover:bg-[#3d2f52] transition-colors">취소</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">연락처 삭제</button>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEdit && onAddDeal && contact && (
                dealAdded ? (
                  <span className="text-xs text-green-400 px-3 py-2">딜 추가됨</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => { onAddDeal(contact); setDealAdded(true) }}
                    className="px-3 py-2 text-sm bg-cyan-600/20 text-cyan-400 rounded-lg hover:bg-cyan-600/30 border border-cyan-500/30 transition-colors font-medium"
                  >
                    딜로 추가
                  </button>
                )
              )}
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-[#2d1f42] text-[#a78bbc] rounded-lg hover:bg-[#3d2f52] hover:text-white transition-colors">취소</button>
              <button type="submit" className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">{isEdit ? '수정' : '추가'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
