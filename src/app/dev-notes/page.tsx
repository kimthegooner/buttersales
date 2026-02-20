'use client'

import { useState } from 'react'
import { useDevNotes } from '@/hooks/useDevNotes'
import { DevNote } from '@/lib/types'

export default function DevNotesPage() {
  const { notes, loaded, addNote, updateNote, deleteNote } = useDevNotes()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingNote, setEditingNote] = useState<DevNote | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)

  // Form states
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formContent, setFormContent] = useState('')
  const [formTags, setFormTags] = useState('')

  const selectedNote = notes.find((n) => n.id === selectedId)

  // 모든 태그 수집
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || []))).sort()

  // 필터링
  const filteredNotes = notes.filter((n) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !n.title.toLowerCase().includes(q) &&
        !n.content.toLowerCase().includes(q)
      )
        return false
    }
    if (filterTag && !(n.tags || []).includes(filterTag)) return false
    return true
  })

  // 날짜별 그룹핑
  const groupedNotes = filteredNotes.reduce(
    (groups, note) => {
      const date = note.date
      if (!groups[date]) groups[date] = []
      groups[date].push(note)
      return groups
    },
    {} as Record<string, DevNote[]>
  )

  const sortedDates = Object.keys(groupedNotes).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const openCreateModal = () => {
    setEditingNote(null)
    setFormTitle('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormContent('')
    setFormTags('')
    setShowModal(true)
  }

  const openEditModal = (note: DevNote) => {
    setEditingNote(note)
    setFormTitle(note.title)
    setFormDate(note.date)
    setFormContent(note.content)
    setFormTags((note.tags || []).join(', '))
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!formTitle.trim()) return

    const tags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    if (editingNote) {
      updateNote(editingNote.id, {
        title: formTitle,
        date: formDate,
        content: formContent,
        tags,
      })
    } else {
      const newNote = addNote({
        title: formTitle,
        date: formDate,
        content: formContent,
        tags,
      })
      setSelectedId(newNote.id)
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('이 개발노트를 삭제하시겠습니까?')) {
      deleteNote(id)
      if (selectedId === id) setSelectedId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-[#a78bbc]">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            개발노트
          </h1>
          <p className="text-sm text-[#a78bbc] mt-0.5">
            총 {notes.length}개의 노트
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 노트 작성
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a78bbc]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="노트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1a1128] border border-[#2d1f42] rounded-lg text-sm text-white placeholder-[#a78bbc]/50 focus:outline-none focus:border-purple-500"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterTag(null)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                !filterTag
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                  : 'bg-[#1a1128] text-[#a78bbc] border border-[#2d1f42] hover:bg-[#231738]'
              }`}
            >
              전체
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filterTag === tag
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                    : 'bg-[#1a1128] text-[#a78bbc] border border-[#2d1f42] hover:bg-[#231738]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 240px)' }}>
        {/* Note List */}
        <div className="w-80 shrink-0 overflow-y-auto space-y-4 pr-1">
          {sortedDates.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-[#a78bbc]/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-[#a78bbc]/50 text-sm">아직 작성된 노트가 없습니다</p>
              <button
                onClick={openCreateModal}
                className="mt-3 text-purple-400 text-sm hover:text-purple-300"
              >
                첫 번째 노트 작성하기
              </button>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-xs font-semibold text-[#a78bbc]">
                    {formatDate(date)}
                  </span>
                </div>
                <div className="space-y-1.5 ml-1">
                  {groupedNotes[date].map((note) => (
                    <button
                      key={note.id}
                      onClick={() => setSelectedId(note.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                        selectedId === note.id
                          ? 'bg-[#1a1128] border-l-2 border-l-purple-500 border border-purple-500/20'
                          : 'bg-[#1a1128]/50 border border-transparent hover:bg-[#231738] hover:border-[#2d1f42]'
                      }`}
                    >
                      <p className={`text-sm font-medium truncate ${
                        selectedId === note.id ? 'text-purple-300' : 'text-white'
                      }`}>
                        {note.title}
                      </p>
                      <p className="text-xs text-[#a78bbc]/60 mt-0.5 truncate">
                        {note.content.split('\n')[0] || '내용 없음'}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {note.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[#2d1f42] text-[#a78bbc]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Note Detail */}
        <div className="flex-1 bg-[#1a1128] border border-[#2d1f42] rounded-xl overflow-y-auto">
          {selectedNote ? (
            <div className="p-6">
              {/* Detail Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedNote.title}</h2>
                  <p className="text-sm text-[#a78bbc] mt-1">
                    {formatDate(selectedNote.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(selectedNote)}
                    className="p-2 rounded-lg bg-[#231738] hover:bg-purple-600/20 text-[#a78bbc] hover:text-purple-300 transition-colors"
                    title="수정"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedNote.id)}
                    className="p-2 rounded-lg bg-[#231738] hover:bg-red-600/20 text-[#a78bbc] hover:text-red-400 transition-colors"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tags */}
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {selectedNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-xs bg-purple-600/20 text-purple-300 border border-purple-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="border-t border-[#2d1f42] pt-4">
                <div className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                  {selectedNote.content.split('\n').map((line, i) => {
                    // bullet point 형태로 렌더링
                    if (line.startsWith('* ') || line.startsWith('- ')) {
                      return (
                        <div key={i} className="flex items-start gap-2 mb-1.5">
                          <span className="text-purple-400 mt-0.5 shrink-0">&#8226;</span>
                          <span>{line.slice(2)}</span>
                        </div>
                      )
                    }
                    if (line.trim() === '') {
                      return <div key={i} className="h-2" />
                    }
                    return <p key={i} className="mb-1.5">{line}</p>
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-[#a78bbc]/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-[#a78bbc]/40 text-sm">노트를 선택하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-[#2d1f42] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingNote ? '노트 수정' : '새 노트 작성'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded hover:bg-[#231738] text-[#a78bbc]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#a78bbc] mb-1.5">제목 *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="오늘의 개발 내용"
                  className="w-full px-3 py-2 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg text-sm text-white placeholder-[#a78bbc]/50 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a78bbc] mb-1.5">날짜</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a78bbc] mb-1.5">
                  내용 <span className="font-normal text-[#a78bbc]/50">(줄마다 * 또는 -로 시작하면 bullet point로 표시)</span>
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={"* 이메일 시스템을 Resend에서 Zoho SMTP로 전환\n* IMAP 수신함 기능 구현\n* Vercel DNS 오류 해결"}
                  rows={10}
                  className="w-full px-3 py-2 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg text-sm text-white placeholder-[#a78bbc]/50 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a78bbc] mb-1.5">
                  태그 <span className="font-normal text-[#a78bbc]/50">(쉼표로 구분)</span>
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="이메일, Zoho, 버그수정"
                  className="w-full px-3 py-2 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg text-sm text-white placeholder-[#a78bbc]/50 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#2d1f42] flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-[#a78bbc] hover:text-white transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formTitle.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/30 disabled:text-purple-300/50 text-white text-sm rounded-lg transition-colors"
              >
                {editingNote ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
