'use client'

import { useState } from 'react'

interface QuoteItem {
  id: string
  name: string
  description: string
  quantity: number
  unitPrice: number
}

interface Quote {
  id: string
  title: string
  clientName: string
  clientEmail: string
  clientCompany: string
  items: QuoteItem[]
  discount: number
  tax: number
  notes: string
  validUntil: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  createdAt: string
}

const STATUS_MAP: Record<Quote['status'], { label: string; color: string }> = {
  draft: { label: '초안', color: 'bg-gray-500' },
  sent: { label: '발송됨', color: 'bg-blue-500' },
  accepted: { label: '수락됨', color: 'bg-green-500' },
  rejected: { label: '거절됨', color: 'bg-red-500' },
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [items, setItems] = useState<QuoteItem[]>([
    { id: `item-${Date.now()}`, name: '', description: '', quantity: 1, unitPrice: 0 },
  ])
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(10)
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')

  const resetForm = () => {
    setTitle('')
    setClientName('')
    setClientEmail('')
    setClientCompany('')
    setItems([{ id: `item-${Date.now()}`, name: '', description: '', quantity: 1, unitPrice: 0 }])
    setDiscount(0)
    setTax(10)
    setNotes('')
    setValidUntil('')
    setEditingQuote(null)
  }

  const handleNewQuote = () => {
    resetForm()
    setShowEditor(true)
  }

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote)
    setTitle(quote.title)
    setClientName(quote.clientName)
    setClientEmail(quote.clientEmail)
    setClientCompany(quote.clientCompany)
    setItems(quote.items)
    setDiscount(quote.discount)
    setTax(quote.tax)
    setNotes(quote.notes)
    setValidUntil(quote.validUntil)
    setShowEditor(true)
  }

  const handleAddItem = () => {
    setItems([...items, { id: `item-${Date.now()}`, name: '', description: '', quantity: 1, unitPrice: 0 }])
  }

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return
    setItems(items.filter((i) => i.id !== id))
  }

  const handleUpdateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const discountAmount = subtotal * (discount / 100)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * (tax / 100)
  const total = taxableAmount + taxAmount

  const handleSave = (status: Quote['status'] = 'draft') => {
    const quote: Quote = {
      id: editingQuote?.id || `quote-${Date.now()}`,
      title: title || '제목 없음',
      clientName,
      clientEmail,
      clientCompany,
      items: items.filter((i) => i.name.trim()),
      discount,
      tax,
      notes,
      validUntil,
      status,
      createdAt: editingQuote?.createdAt || new Date().toISOString(),
    }

    if (editingQuote) {
      setQuotes(quotes.map((q) => (q.id === editingQuote.id ? quote : q)))
    } else {
      setQuotes([quote, ...quotes])
    }
    setShowEditor(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('이 견적서를 삭제하시겠습니까?')) return
    setQuotes(quotes.filter((q) => q.id !== id))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
  }

  // Quote preview/detail view
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null)

  if (previewQuote) {
    const pSubtotal = previewQuote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const pDiscount = pSubtotal * (previewQuote.discount / 100)
    const pTaxable = pSubtotal - pDiscount
    const pTax = pTaxable * (previewQuote.tax / 100)
    const pTotal = pTaxable + pTax

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setPreviewQuote(null)}
            className="text-[#a78bbc] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-white">견적서 미리보기</h2>
          <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full text-white ${STATUS_MAP[previewQuote.status].color}`}>
            {STATUS_MAP[previewQuote.status].label}
          </span>
        </div>

        <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-8 max-w-3xl">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b border-[#2d1f42]">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{previewQuote.title}</h3>
              <p className="text-xs text-[#a78bbc]">
                작성일: {new Date(previewQuote.createdAt).toLocaleDateString('ko-KR')}
              </p>
              {previewQuote.validUntil && (
                <p className="text-xs text-[#a78bbc]">유효기간: {previewQuote.validUntil}</p>
              )}
            </div>
            <div className="text-right">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-2 ml-auto">
                CB
              </div>
              <p className="text-xs text-[#a78bbc]">코드앤버터</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-6">
            <p className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-2">수신</p>
            <p className="text-white font-medium">{previewQuote.clientName || '-'}</p>
            <p className="text-sm text-[#a78bbc]">{previewQuote.clientCompany}</p>
            <p className="text-sm text-[#a78bbc]">{previewQuote.clientEmail}</p>
          </div>

          {/* Items Table */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b border-[#2d1f42]">
                <th className="text-left text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold py-2">항목</th>
                <th className="text-right text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold py-2 w-20">수량</th>
                <th className="text-right text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold py-2 w-28">단가</th>
                <th className="text-right text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold py-2 w-28">금액</th>
              </tr>
            </thead>
            <tbody>
              {previewQuote.items.map((item) => (
                <tr key={item.id} className="border-b border-[#2d1f42]/50">
                  <td className="py-3">
                    <p className="text-sm text-white">{item.name}</p>
                    {item.description && <p className="text-xs text-[#a78bbc]/60 mt-0.5">{item.description}</p>}
                  </td>
                  <td className="text-right text-sm text-[#a78bbc] py-3">{item.quantity}</td>
                  <td className="text-right text-sm text-[#a78bbc] py-3">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right text-sm text-white py-3">{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#a78bbc]">소계</span>
                <span className="text-white">{formatCurrency(pSubtotal)}</span>
              </div>
              {previewQuote.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#a78bbc]">할인 ({previewQuote.discount}%)</span>
                  <span className="text-red-400">-{formatCurrency(pDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#a78bbc]">부가세 ({previewQuote.tax}%)</span>
                <span className="text-white">{formatCurrency(pTax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-[#2d1f42]">
                <span className="text-white">합계</span>
                <span className="text-purple-300">{formatCurrency(pTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {previewQuote.notes && (
            <div className="mt-8 pt-6 border-t border-[#2d1f42]">
              <p className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-2">비고</p>
              <p className="text-sm text-[#a78bbc] whitespace-pre-wrap">{previewQuote.notes}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (showEditor) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowEditor(false); resetForm() }}
              className="text-[#a78bbc] hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-white">
              {editingQuote ? '견적서 수정' : '새 견적서'}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave('draft')}
              className="px-4 py-2 bg-[#2d1f42] hover:bg-[#3d2f52] text-[#a78bbc] hover:text-white rounded-lg transition-colors text-sm"
            >
              초안 저장
            </button>
            <button
              onClick={() => handleSave('sent')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              발송 완료로 저장
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5">
              <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold">견적서 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 코드앤버터 Pro 플랜 1년 계약"
                className="w-full mt-2 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Items */}
            <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold">항목</label>
                <button
                  onClick={handleAddItem}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  + 항목 추가
                </button>
              </div>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-[#0f0a1a] rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#a78bbc]/40 w-5 shrink-0">{idx + 1}</span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        placeholder="항목명"
                        className="flex-1 bg-transparent border border-[#2d1f42] rounded px-3 py-1.5 text-sm text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none"
                      />
                      {items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-[#a78bbc]/30 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="pl-7">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        placeholder="설명 (선택)"
                        className="w-full bg-transparent border border-[#2d1f42] rounded px-3 py-1.5 text-xs text-[#a78bbc] placeholder-[#a78bbc]/30 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div className="pl-7 flex gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-[#a78bbc]/40 mb-0.5 block">수량</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          min={1}
                          className="w-full bg-transparent border border-[#2d1f42] rounded px-3 py-1.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-[#a78bbc]/40 mb-0.5 block">단가 (원)</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                          min={0}
                          className="w-full bg-transparent border border-[#2d1f42] rounded px-3 py-1.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-[#a78bbc]/40 mb-0.5 block">소계</label>
                        <div className="px-3 py-1.5 text-sm text-purple-300 font-medium">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5">
              <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold">비고</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="결제 조건, 특이사항 등..."
                rows={3}
                className="w-full mt-2 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Client Info */}
            <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5 space-y-3">
              <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold">고객 정보</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="고객명"
                className="w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 text-sm text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="text"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="회사명"
                className="w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 text-sm text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none"
              />
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="이메일"
                className="w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 text-sm text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Pricing */}
            <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5 space-y-3">
              <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold">가격 설정</label>
              <div>
                <label className="text-xs text-[#a78bbc] mb-1 block">할인율 (%)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#a78bbc] mb-1 block">부가세 (%)</label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  min={0}
                  className="w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#a78bbc] mb-1 block">유효기간</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5">
              <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-3 block">합계</label>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#a78bbc]">소계</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a78bbc]">할인 ({discount}%)</span>
                    <span className="text-red-400">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#a78bbc]">부가세 ({tax}%)</span>
                  <span className="text-white">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-[#2d1f42]">
                  <span className="text-white">합계</span>
                  <span className="text-purple-300 text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">견적서 제작</h2>
          <p className="text-sm text-[#a78bbc] mt-1">견적서를 작성하고 고객에게 발송하세요</p>
        </div>
        <button
          onClick={handleNewQuote}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 견적서
        </button>
      </div>

      {quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-16 h-16 bg-[#1a1128] border border-[#2d1f42] rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#a78bbc]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-1">아직 견적서가 없습니다</h3>
          <p className="text-sm text-[#a78bbc] mb-4">새 견적서를 작성하여 영업 프로세스를 시작하세요</p>
          <button
            onClick={handleNewQuote}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            첫 견적서 작성하기
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {quotes.map((quote) => {
            const qSubtotal = quote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
            const qDiscount = qSubtotal * (quote.discount / 100)
            const qTaxable = qSubtotal - qDiscount
            const qTax = qTaxable * (quote.tax / 100)
            const qTotal = qTaxable + qTax

            return (
              <div
                key={quote.id}
                className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold truncate">{quote.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full text-white shrink-0 ${STATUS_MAP[quote.status].color}`}>
                        {STATUS_MAP[quote.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-[#a78bbc]">
                      {quote.clientCompany ? `${quote.clientCompany} / ` : ''}{quote.clientName || '고객 미지정'}
                    </p>
                    <p className="text-xs text-[#a78bbc]/50 mt-1">
                      {quote.items.length}개 항목 | 작성: {new Date(quote.createdAt).toLocaleDateString('ko-KR')}
                      {quote.validUntil && ` | 유효: ${quote.validUntil}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold text-purple-300">{formatCurrency(qTotal)}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPreviewQuote(quote)}
                        className="w-8 h-8 rounded-lg bg-[#2d1f42] hover:bg-purple-600/30 text-[#a78bbc] hover:text-purple-300 flex items-center justify-center transition-colors"
                        title="미리보기"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditQuote(quote)}
                        className="w-8 h-8 rounded-lg bg-[#2d1f42] hover:bg-purple-600/30 text-[#a78bbc] hover:text-purple-300 flex items-center justify-center transition-colors"
                        title="수정"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(quote.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-500/20 text-[#a78bbc]/40 hover:text-red-400 flex items-center justify-center transition-colors"
                        title="삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
