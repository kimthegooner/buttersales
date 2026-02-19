'use client'

import { Deal, PLAN_OPTIONS, getPlanLabel } from '@/lib/types'

interface PipelineSummaryProps {
  deals: Deal[]
}

export default function PipelineSummary({ deals }: PipelineSummaryProps) {
  const planCounts = PLAN_OPTIONS.map((p) => ({
    ...p,
    count: deals.filter((d) => d.plan === p.id).length,
  }))

  const now = new Date()
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const closingThisMonth = deals.filter((d) => {
    const closeDate = new Date(d.expectedCloseDate)
    return closeDate <= thisMonthEnd && closeDate >= now
  })

  const stats = [
    { label: '전체 딜', value: `${deals.length}건`, sub: '현재 파이프라인', icon: '📊' },
    { label: '이번달 마감', value: `${closingThisMonth.length}건`, sub: '마감 예정 딜', icon: '📅' },
    ...planCounts.map((p) => ({
      label: getPlanLabel(p.id),
      value: `${p.count}건`,
      sub: `${p.label} 플랜`,
      icon: p.id === 'starter' ? '🌱' : p.id === 'basic' ? '📦' : p.id === 'pro' ? '🚀' : '🏢',
    })),
  ]

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-3"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-base">{stat.icon}</span>
            <span className="text-[11px] text-[#a78bbc]">{stat.label}</span>
          </div>
          <p className="text-lg font-bold text-white">{stat.value}</p>
          <p className="text-[10px] text-[#a78bbc] mt-0.5">{stat.sub}</p>
        </div>
      ))}
    </div>
  )
}
