'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Pipeline } from '@/lib/types'
import { apiGet } from '@/lib/api-client'

interface MenuItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
  disabled?: boolean
}

const pipelineIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
  </svg>
)

const salesSupportMenuItems: MenuItem[] = [
  {
    label: '견적서 제작',
    href: '/quotes',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    badge: '도구',
  },
  {
    label: '사이트 분석기',
    href: '/site-analyzer',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    ),
    badge: '분석',
  },
  {
    label: '잠재고객 크롤러',
    href: '/lead-crawler',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    badge: '수집',
  },
]

const bottomMenuItems: MenuItem[] = [
  {
    label: '연락처',
    href: '/contacts',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    badge: '관리',
  },
  {
    label: '활동',
    href: '/activities',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    badge: '추적',
  },
  {
    label: '이메일',
    href: '/emails',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    badge: '관리',
  },
  {
    label: '개발노트',
    href: '/dev-notes',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    badge: '기록',
  },
  {
    label: '리포트',
    href: '/reports',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    badge: '예정',
    disabled: true,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPipelineId = searchParams.get('id')

  const [pipelines, setPipelines] = useState<Pipeline[]>([])

  useEffect(() => {
    apiGet<Pipeline[]>('/api/pipelines').then(setPipelines).catch(console.error)
  }, [])

  return (
    <aside className="w-56 border-r border-[#2d1f42] bg-[#1a1128]/50 min-h-[calc(100vh-65px)] flex flex-col shrink-0">
      <nav className="flex-1 px-3 py-4">
        {/* 파이프라인 섹션 */}
        <p className="px-3 mb-2 text-[10px] font-semibold text-[#a78bbc]/60 uppercase tracking-wider">
          파이프라인
        </p>
        <ul className="space-y-1 mb-4">
          {pipelines.map((pipeline) => {
            const isActive = pathname === '/pipeline' && currentPipelineId === pipeline.id
            const isFirstAndNoId = pathname === '/pipeline' && !currentPipelineId && pipelines[0]?.id === pipeline.id
            const active = isActive || isFirstAndNoId
            return (
              <li key={pipeline.id}>
                <Link
                  href={`/pipeline?id=${pipeline.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    active
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-[#a78bbc] hover:bg-[#231738] hover:text-white'
                  }`}
                >
                  {pipelineIcon}
                  <span className="text-sm font-medium truncate">{pipeline.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* 영업 지원 섹션 */}
        <p className="px-3 mb-2 text-[10px] font-semibold text-[#a78bbc]/60 uppercase tracking-wider">
          영업 지원
        </p>
        <ul className="space-y-1 mb-4">
          {salesSupportMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-[#a78bbc] hover:bg-[#231738] hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-[#2d1f42] text-[#a78bbc]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* 관리 섹션 */}
        <p className="px-3 mb-2 text-[10px] font-semibold text-[#a78bbc]/60 uppercase tracking-wider">
          관리
        </p>
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                {item.disabled ? (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#a78bbc]/40 cursor-not-allowed">
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#2d1f42]/50 text-[#a78bbc]/40">
                        {item.badge}
                      </span>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-[#a78bbc] hover:bg-[#231738] hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-[#2d1f42] text-[#a78bbc]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-3 py-4 border-t border-[#2d1f42]">
        <div className="px-3 py-2 rounded-lg bg-purple-900/20 border border-purple-500/20">
          <p className="text-[11px] font-medium text-purple-300 mb-1">코드앤버터</p>
          <p className="text-[10px] text-[#a78bbc]">세일즈 CRM</p>
        </div>
      </div>
    </aside>
  )
}
