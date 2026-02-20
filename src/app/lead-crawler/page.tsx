'use client'

import { useState } from 'react'

interface CrawlSource {
  id: string
  type: 'keyword' | 'directory' | 'social' | 'competitor'
  label: string
  icon: string
}

const CRAWL_SOURCES: CrawlSource[] = [
  { id: 'keyword', type: 'keyword', label: '키워드 검색', icon: '🔍' },
  { id: 'directory', type: 'directory', label: '비즈니스 디렉토리', icon: '📁' },
  { id: 'social', type: 'social', label: '소셜 미디어', icon: '📱' },
  { id: 'competitor', type: 'competitor', label: '경쟁사 고객', icon: '🏢' },
]

interface Lead {
  id: string
  companyName: string
  website: string
  industry: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  employeeCount?: string
  source: string
  score: number
  status: 'new' | 'contacted' | 'qualified' | 'unqualified'
  foundAt: string
  notes: string
}

const STATUS_MAP: Record<Lead['status'], { label: string; color: string }> = {
  new: { label: '신규', color: 'bg-blue-500' },
  contacted: { label: '연락완료', color: 'bg-yellow-500' },
  qualified: { label: '적격', color: 'bg-green-500' },
  unqualified: { label: '부적격', color: 'bg-gray-500' },
}

const SAMPLE_COMPANIES = [
  { name: '스마트스토어', industry: '이커머스', employees: '10-50' },
  { name: '핏미디어', industry: '미디어/콘텐츠', employees: '5-10' },
  { name: '디지털노마드', industry: '교육', employees: '10-50' },
  { name: '클라우드킹', industry: 'SaaS', employees: '50-200' },
  { name: '그린마켓', industry: '식품유통', employees: '10-50' },
  { name: '코드팩토리', industry: '소프트웨어', employees: '10-50' },
  { name: '빌드업스튜디오', industry: '디자인', employees: '5-10' },
  { name: '플라이트랩', industry: '여행', employees: '50-200' },
  { name: '메디픽', industry: '헬스케어', employees: '10-50' },
  { name: '어반스토리', industry: '부동산', employees: '5-10' },
  { name: '데이터브릿지', industry: '데이터분석', employees: '10-50' },
  { name: '리틀가든', industry: '라이프스타일', employees: '1-5' },
  { name: '테크놀로지아', industry: 'IT서비스', employees: '50-200' },
  { name: '브랜드메이커', industry: '마케팅', employees: '10-50' },
  { name: '넥스트커머스', industry: '이커머스', employees: '10-50' },
]

export default function LeadCrawlerPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedSource, setSelectedSource] = useState<string>('keyword')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isCrawling, setIsCrawling] = useState(false)
  const [crawlProgress, setCrawlProgress] = useState(0)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score')

  const handleStartCrawl = () => {
    if (!searchKeyword.trim()) return
    setIsCrawling(true)
    setCrawlProgress(0)

    const totalSteps = 5
    let step = 0

    const interval = setInterval(() => {
      step++
      setCrawlProgress((step / totalSteps) * 100)

      if (step >= totalSteps) {
        clearInterval(interval)

        // Generate random leads
        const count = Math.floor(Math.random() * 6) + 3
        const shuffled = SAMPLE_COMPANIES.sort(() => Math.random() - 0.5)
        const newLeads: Lead[] = shuffled.slice(0, count).map((company, idx) => ({
          id: `lead-${Date.now()}-${idx}`,
          companyName: company.name,
          website: `https://${company.name.toLowerCase().replace(/\s/g, '')}.co.kr`,
          industry: company.industry,
          contactName: Math.random() > 0.3 ? `${['김', '이', '박', '최', '정'][Math.floor(Math.random() * 5)]}${'영수철미지현호민준'.charAt(Math.floor(Math.random() * 8))}${'호미현수영지준석'.charAt(Math.floor(Math.random() * 8))}` : undefined,
          contactEmail: Math.random() > 0.4 ? `contact@${company.name.toLowerCase().replace(/\s/g, '')}.co.kr` : undefined,
          contactPhone: Math.random() > 0.5 ? `02-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}` : undefined,
          employeeCount: company.employees,
          source: `${CRAWL_SOURCES.find((s) => s.id === selectedSource)?.label} - "${searchKeyword}"`,
          score: Math.floor(Math.random() * 60) + 40,
          status: 'new',
          foundAt: new Date().toISOString(),
          notes: '',
        }))

        setLeads((prev) => [...newLeads, ...prev])
        setIsCrawling(false)
        setCrawlProgress(0)
        setSearchKeyword('')
      }
    }, 600)
  }

  const handleUpdateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)))
    if (selectedLead?.id === id) {
      setSelectedLead({ ...selectedLead, ...updates })
    }
  }

  const handleDeleteLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    if (selectedLead?.id === id) setSelectedLead(null)
  }

  const filteredLeads = leads
    .filter((l) => filterStatus === 'all' || l.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score
      return new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime()
    })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-orange-400'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">잠재고객 크롤러</h2>
          <p className="text-sm text-[#a78bbc] mt-1">다양한 소스에서 잠재고객을 자동으로 수집하세요</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#a78bbc]">
          <span className="px-2 py-1 bg-[#1a1128] border border-[#2d1f42] rounded-lg">
            전체: <span className="text-white font-medium">{leads.length}</span>건
          </span>
          <span className="px-2 py-1 bg-[#1a1128] border border-[#2d1f42] rounded-lg">
            적격: <span className="text-green-400 font-medium">{leads.filter((l) => l.status === 'qualified').length}</span>건
          </span>
        </div>
      </div>

      {/* Crawl Controls */}
      <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5 mb-6">
        <div className="flex gap-3 mb-4">
          {CRAWL_SOURCES.map((source) => (
            <button
              key={source.id}
              onClick={() => setSelectedSource(source.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                selectedSource === source.id
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'bg-[#0f0a1a] text-[#a78bbc] border border-[#2d1f42] hover:border-purple-500/20'
              }`}
            >
              <span>{source.icon}</span>
              <span>{source.label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isCrawling && handleStartCrawl()}
            placeholder={
              selectedSource === 'keyword' ? '검색 키워드 입력 (예: 이커머스, SaaS, 교육 플랫폼)' :
              selectedSource === 'directory' ? '업종 또는 카테고리 입력' :
              selectedSource === 'social' ? '해시태그 또는 프로필 키워드' :
              '경쟁사 이름 또는 URL'
            }
            className="flex-1 bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={handleStartCrawl}
            disabled={isCrawling || !searchKeyword.trim()}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-[#2d1f42] disabled:text-[#a78bbc]/40 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            {isCrawling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                수집 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                크롤링 시작
              </>
            )}
          </button>
        </div>
        {isCrawling && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-[#a78bbc] mb-1">
              <span>잠재고객 수집 중...</span>
              <span>{Math.round(crawlProgress)}%</span>
            </div>
            <div className="w-full bg-[#0f0a1a] rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-purple-500 transition-all duration-300"
                style={{ width: `${crawlProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {leads.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead List */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                {[
                  { id: 'all', label: '전체' },
                  { id: 'new', label: '신규' },
                  { id: 'contacted', label: '연락완료' },
                  { id: 'qualified', label: '적격' },
                  { id: 'unqualified', label: '부적격' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterStatus(f.id)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                      filterStatus === f.id
                        ? 'bg-purple-600/20 text-purple-300'
                        : 'text-[#a78bbc]/60 hover:text-[#a78bbc]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'date')}
                className="bg-[#1a1128] border border-[#2d1f42] rounded-lg px-2 py-1 text-xs text-[#a78bbc] focus:outline-none"
              >
                <option value="score">점수순</option>
                <option value="date">최신순</option>
              </select>
            </div>

            {/* Lead Cards */}
            <div className="space-y-2">
              {filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedLead?.id === lead.id
                      ? 'bg-purple-600/10 border-purple-500/30'
                      : 'bg-[#1a1128] border-[#2d1f42] hover:border-purple-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white truncate">{lead.companyName}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white shrink-0 ${STATUS_MAP[lead.status].color}`}>
                          {STATUS_MAP[lead.status].label}
                        </span>
                      </div>
                      <p className="text-xs text-[#a78bbc]">
                        {lead.industry} {lead.employeeCount && `| ${lead.employeeCount}명`}
                      </p>
                      {lead.contactName && (
                        <p className="text-xs text-[#a78bbc]/60 mt-0.5">
                          {lead.contactName} {lead.contactEmail && `| ${lead.contactEmail}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className={`text-lg font-bold ${getScoreColor(lead.score)}`}>{lead.score}</span>
                      <p className="text-[10px] text-[#a78bbc]/40">점</p>
                    </div>
                  </div>
                </button>
              ))}
              {filteredLeads.length === 0 && (
                <div className="text-center py-8 text-sm text-[#a78bbc]/50">
                  해당 조건의 리드가 없습니다
                </div>
              )}
            </div>
          </div>

          {/* Lead Detail */}
          <div>
            {selectedLead ? (
              <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5 space-y-4 sticky top-24">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-bold">{selectedLead.companyName}</h3>
                    <a
                      href={selectedLead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      {selectedLead.website}
                    </a>
                  </div>
                  <button
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="text-[#a78bbc]/30 hover:text-red-400 transition-colors"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Status */}
                <div>
                  <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-1.5 block">상태</label>
                  <div className="flex gap-1.5">
                    {Object.entries(STATUS_MAP).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => handleUpdateLead(selectedLead.id, { status: key as Lead['status'] })}
                        className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                          selectedLead.status === key
                            ? `${val.color} text-white`
                            : 'bg-[#0f0a1a] text-[#a78bbc]/60 hover:text-[#a78bbc]'
                        }`}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold">정보</label>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#a78bbc]">업종</span>
                      <span className="text-white">{selectedLead.industry}</span>
                    </div>
                    {selectedLead.employeeCount && (
                      <div className="flex justify-between">
                        <span className="text-[#a78bbc]">규모</span>
                        <span className="text-white">{selectedLead.employeeCount}명</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#a78bbc]">수집 소스</span>
                      <span className="text-white text-xs">{selectedLead.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#a78bbc]">수집일</span>
                      <span className="text-white">{new Date(selectedLead.foundAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold">연락처</label>
                  {selectedLead.contactName || selectedLead.contactEmail || selectedLead.contactPhone ? (
                    <div className="space-y-1.5 text-sm">
                      {selectedLead.contactName && (
                        <div className="flex justify-between">
                          <span className="text-[#a78bbc]">담당자</span>
                          <span className="text-white">{selectedLead.contactName}</span>
                        </div>
                      )}
                      {selectedLead.contactEmail && (
                        <div className="flex justify-between">
                          <span className="text-[#a78bbc]">이메일</span>
                          <span className="text-purple-400 text-xs">{selectedLead.contactEmail}</span>
                        </div>
                      )}
                      {selectedLead.contactPhone && (
                        <div className="flex justify-between">
                          <span className="text-[#a78bbc]">전화</span>
                          <span className="text-white">{selectedLead.contactPhone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#a78bbc]/40 italic">연락처 정보 없음</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-1.5 block">메모</label>
                  <textarea
                    value={selectedLead.notes}
                    onChange={(e) => handleUpdateLead(selectedLead.id, { notes: e.target.value })}
                    placeholder="이 리드에 대한 메모..."
                    rows={3}
                    className="w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 text-sm text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Score */}
                <div>
                  <label className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-1.5 block">적합도 점수</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-[#0f0a1a] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${selectedLead.score >= 80 ? 'bg-green-500' : selectedLead.score >= 60 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                        style={{ width: `${selectedLead.score}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(selectedLead.score)}`}>{selectedLead.score}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-8 text-center">
                <svg className="w-8 h-8 text-[#a78bbc]/20 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-xs text-[#a78bbc]/50">리드를 선택하여 상세 정보를 확인하세요</p>
              </div>
            )}
          </div>
        </div>
      )}

      {leads.length === 0 && !isCrawling && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-16 h-16 bg-[#1a1128] border border-[#2d1f42] rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#a78bbc]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-1">잠재고객 발굴을 시작하세요</h3>
          <p className="text-sm text-[#a78bbc] mb-1">키워드, 비즈니스 디렉토리, 소셜 미디어 등에서</p>
          <p className="text-sm text-[#a78bbc]">잠재고객을 자동으로 수집합니다</p>
        </div>
      )}
    </div>
  )
}
