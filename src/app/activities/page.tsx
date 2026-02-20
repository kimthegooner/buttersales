'use client'

import { useState, useMemo, useEffect } from 'react'
import { Activity, ActivityType, Deal, ACTIVITY_TYPE_OPTIONS, getActivityLabel, getActivityColor } from '@/lib/types'
import { useActivities } from '@/hooks/useActivities'
import { apiGet } from '@/lib/api-client'
import { EmailTemplate } from '@/lib/types'
import ActivityModal, { ActivityTypeIcon } from '@/components/ActivityModal'

type FilterStatus = 'all' | 'completed' | 'pending'

export default function ActivitiesPage() {
  const { activities, loaded, addActivity, updateActivity, deleteActivity, toggleComplete } = useActivities()

  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)

  const [allDeals, setAllDeals] = useState<Deal[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  useEffect(() => {
    apiGet<Deal[]>('/api/deals').then(setAllDeals).catch(console.error)
    apiGet<EmailTemplate[]>('/api/email-templates').then(setEmailTemplates).catch(console.error)
  }, [])

  const getDealName = (dealId: string) => {
    const deal = allDeals.find((d) => d.id === dealId)
    return deal ? `${deal.companyName} - ${deal.title}` : dealId
  }

  const filtered = useMemo(() => {
    let result = activities

    if (filterType !== 'all') {
      result = result.filter((a) => a.type === filterType)
    }

    if (filterStatus === 'completed') {
      result = result.filter((a) => a.completed)
    } else if (filterStatus === 'pending') {
      result = result.filter((a) => !a.completed)
    }

    if (searchText) {
      const q = searchText.toLowerCase()
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)) ||
          getDealName(a.dealId).toLowerCase().includes(q) ||
          (a.customType && a.customType.toLowerCase().includes(q))
      )
    }

    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [activities, filterType, filterStatus, searchText, allDeals])

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; date: string; items: Activity[] }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    filtered.forEach((activity) => {
      const actDate = new Date(activity.date)
      actDate.setHours(0, 0, 0, 0)

      let label: string
      const dateStr = actDate.toISOString().split('T')[0]

      if (actDate.getTime() === today.getTime()) {
        label = '오늘'
      } else if (actDate.getTime() === yesterday.getTime()) {
        label = '어제'
      } else if (actDate > today) {
        label = `예정 · ${actDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}`
      } else {
        label = actDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
      }

      const existing = groups.find((g) => g.date === dateStr)
      if (existing) {
        existing.items.push(activity)
      } else {
        groups.push({ label, date: dateStr, items: [activity] })
      }
    })

    return groups
  }, [filtered])

  const totalCount = activities.length
  const completedCount = activities.filter((a) => a.completed).length
  const pendingCount = totalCount - completedCount

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
          <h2 className="text-2xl font-bold text-white">활동</h2>
          <p className="text-sm text-[#a78bbc] mt-1">
            {totalCount}건의 활동 · 완료 {completedCount} · 미완료 {pendingCount} · {filtered.length}건 표시 중
          </p>
        </div>
        <button
          onClick={() => { setEditActivity(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          활동 추가
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        {/* Type Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
              filterType === 'all'
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                : 'bg-[#2d1f42] text-[#a78bbc] hover:text-white'
            }`}
          >
            전체
          </button>
          {ACTIVITY_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilterType(opt.id)}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
                filterType === opt.id
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                  : 'bg-[#2d1f42] text-[#a78bbc] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a78bbc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="제목, 딜명, 설명으로 검색..."
              className="w-full bg-[#1a1128] border border-[#2d1f42] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#a78bbc]/50 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex bg-[#1a1128] border border-[#2d1f42] rounded-lg overflow-hidden">
            {([
              { value: 'all', label: '전체' },
              { value: 'pending', label: '미완료' },
              { value: 'completed', label: '완료' },
            ] as { value: FilterStatus; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`px-3 py-2.5 text-xs transition-colors ${
                  filterStatus === opt.value
                    ? 'bg-purple-600/20 text-purple-300'
                    : 'text-[#a78bbc] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl py-12 text-center">
            <p className="text-[#a78bbc] text-sm">
              {searchText || filterType !== 'all' || filterStatus !== 'all'
                ? '검색 결과가 없습니다.'
                : '활동이 없습니다. 추가해보세요!'}
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xs font-semibold text-[#a78bbc]">{group.label}</h3>
                <div className="flex-1 h-px bg-[#2d1f42]" />
                <span className="text-[10px] text-[#a78bbc]/50">{group.items.length}건</span>
              </div>
              <div className="space-y-1.5">
                {group.items.map((activity) => {
                  const typeColor = getActivityColor(activity.type)
                  const typeLabel = getActivityLabel(activity.type, activity.customType)
                  const time = new Date(activity.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

                  return (
                    <div
                      key={activity.id}
                      onClick={() => { setEditActivity(activity); setModalOpen(true) }}
                      className={`bg-[#1a1128] border border-[#2d1f42] rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[#231738] transition-colors ${
                        activity.completed ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Complete Checkbox */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleComplete(activity.id) }}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          activity.completed
                            ? 'bg-green-500/20 border-green-500 text-green-400'
                            : 'border-[#a78bbc]/30 hover:border-purple-400'
                        }`}
                      >
                        {activity.completed && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Type Icon */}
                      <div className={`w-8 h-8 rounded-lg ${typeColor}/20 flex items-center justify-center shrink-0`}>
                        <span className={`${typeColor.replace('bg-', 'text-').replace('-500', '-400')}`}>
                          <ActivityTypeIcon type={activity.type} size={16} />
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${activity.completed ? 'text-[#a78bbc] line-through' : 'text-white'}`}>
                            {activity.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2d1f42] text-[#a78bbc]">
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-[#a78bbc]/70 truncate mt-0.5">
                          {getDealName(activity.dealId)}
                          {activity.duration && ` · ${activity.duration}분`}
                        </p>
                      </div>

                      {/* Time */}
                      <span className="text-xs text-[#a78bbc] shrink-0">{time}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <ActivityModal
          activity={editActivity}
          allDeals={allDeals}
          emailTemplates={emailTemplates}
          onSave={addActivity}
          onUpdate={updateActivity}
          onDelete={deleteActivity}
          onClose={() => { setModalOpen(false); setEditActivity(null) }}
        />
      )}
    </div>
  )
}
