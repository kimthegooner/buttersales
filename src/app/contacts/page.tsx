'use client'

import { useState, useMemo, useEffect } from 'react'
import { Contact, Deal, PlanType } from '@/lib/types'
import { useContacts } from '@/hooks/useContacts'
import { useDeals } from '@/hooks/useDeals'
import ContactModal from '@/components/ContactModal'

type SortKey = 'name' | 'company' | 'createdAt' | 'updatedAt'

export default function ContactsPage() {
  const { contacts, loaded, addContact, updateContact, deleteContact, linkDeal } = useContacts()

  const [searchText, setSearchText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [modalOpen, setModalOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)

  const { allDeals, addDeal, pipelines } = useDeals()

  const handleAddDeal = (contact: Contact) => {
    const firstPipeline = pipelines[0]
    if (!firstPipeline) return
    const leadStage = firstPipeline.stages[0]
    if (!leadStage) return

    const newDeal = addDeal({
      pipelineId: firstPipeline.id,
      title: `${contact.company} - ${contact.name}`,
      companyName: contact.company,
      contactPerson: contact.name,
      contactEmail: contact.email,
      contactPhone: contact.phone,
      plan: 'starter' as PlanType,
      stage: leadStage.id,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })

    if (newDeal) {
      linkDeal(contact.id, newDeal.id)
    }
  }

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    contacts.forEach((c) => c.tags?.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [contacts])

  const filtered = useMemo(() => {
    let result = contacts

    if (searchText) {
      const q = searchText.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.position && c.position.toLowerCase().includes(q))
      )
    }

    if (selectedTags.length > 0) {
      result = result.filter((c) => selectedTags.some((t) => c.tags?.includes(t)))
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'company') cmp = a.company.localeCompare(b.company)
      else if (sortKey === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt)
      else cmp = a.updatedAt.localeCompare(b.updatedAt)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [contacts, searchText, selectedTags, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const getDealInfo = (dealIds?: string[]) => {
    if (!dealIds || dealIds.length === 0) return null
    return allDeals.filter((d) => dealIds.includes(d.id))
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <span className="text-[#a78bbc]/30 ml-1">↕</span>
    return <span className="text-purple-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
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
          <h2 className="text-2xl font-bold text-white">연락처</h2>
          <p className="text-sm text-[#a78bbc] mt-1">
            {contacts.length}명의 연락처 · {filtered.length}명 표시 중
          </p>
        </div>
        <button
          onClick={() => { setEditContact(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          연락처 추가
        </button>
      </div>

      {/* Search + Tag Filters */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a78bbc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="이름, 회사, 이메일, 직책으로 검색..."
            className="w-full bg-[#1a1128] border border-[#2d1f42] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#a78bbc]/50 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'bg-[#2d1f42] text-[#a78bbc] hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-[11px] px-2.5 py-1 rounded-full text-red-400 hover:bg-red-500/10 transition-colors"
              >
                초기화
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d1f42]">
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('name')} className="text-[#a78bbc] hover:text-white text-xs font-semibold flex items-center">
                    이름 <SortIcon column="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('company')} className="text-[#a78bbc] hover:text-white text-xs font-semibold flex items-center">
                    회사 <SortIcon column="company" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <span className="text-[#a78bbc] text-xs font-semibold">직책</span>
                </th>
                <th className="text-left px-4 py-3">
                  <span className="text-[#a78bbc] text-xs font-semibold">연락처</span>
                </th>
                <th className="text-left px-4 py-3">
                  <span className="text-[#a78bbc] text-xs font-semibold">태그</span>
                </th>
                <th className="text-left px-4 py-3">
                  <span className="text-[#a78bbc] text-xs font-semibold">연결 딜</span>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => handleSort('updatedAt')} className="text-[#a78bbc] hover:text-white text-xs font-semibold flex items-center">
                    최근 수정 <SortIcon column="updatedAt" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#a78bbc] text-sm">
                    {searchText || selectedTags.length > 0 ? '검색 결과가 없습니다.' : '연락처가 없습니다. 추가해보세요!'}
                  </td>
                </tr>
              ) : (
                filtered.map((contact) => {
                  const linkedDeals = getDealInfo(contact.dealIds)
                  return (
                    <tr
                      key={contact.id}
                      onClick={() => { setEditContact(contact); setModalOpen(true) }}
                      className="border-b border-[#2d1f42]/50 hover:bg-[#231738] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-300 text-xs font-bold shrink-0">
                            {contact.name.charAt(0)}
                          </div>
                          <span className="text-white font-medium">{contact.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">{contact.company}</td>
                      <td className="px-4 py-3 text-[#a78bbc]">{contact.position || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {contact.email && <p className="text-xs text-[#a78bbc]">{contact.email}</p>}
                          {contact.phone && <p className="text-xs text-[#a78bbc]">{contact.phone}</p>}
                          {!contact.email && !contact.phone && <span className="text-xs text-[#a78bbc]/50">-</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags?.map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {linkedDeals && linkedDeals.length > 0 ? (
                          <div className="space-y-0.5">
                            {linkedDeals.map((d) => (
                              <p key={d.id} className="text-[11px] text-cyan-400 truncate max-w-[140px]">
                                {d.companyName} - {d.title}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[#a78bbc]/50">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#a78bbc]">
                        {new Date(contact.updatedAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <ContactModal
          contact={editContact}
          allDeals={allDeals}
          onSave={addContact}
          onUpdate={updateContact}
          onDelete={deleteContact}
          onAddDeal={handleAddDeal}
          onClose={() => { setModalOpen(false); setEditContact(null) }}
        />
      )}
    </div>
  )
}
