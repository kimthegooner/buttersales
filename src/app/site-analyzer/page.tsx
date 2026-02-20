'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SiteAnalysis, SiteAnalysisService, Pipeline } from '@/lib/types'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'

const VERDICT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: '확인됨', color: 'text-green-400', bg: 'bg-green-500' },
  likely: { label: '가능성', color: 'text-yellow-400', bg: 'bg-yellow-500' },
  none: { label: '미탐지', color: 'text-[#a78bbc]/40', bg: 'bg-[#2d1f42]' },
}

const BUILDER_LABELS: Record<string, string> = {
  cafe24: '카페24',
  imweb: '아임웹',
  shopify: 'Shopify',
  WordPress: 'WordPress',
  sixshop: '식스샵',
  godomall: '고도몰',
  makeshop: '메이크샵',
  wix: 'Wix',
  'Naver SmartStore': '네이버 스마트스토어',
}

export default function SiteAnalyzerPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [analyses, setAnalyses] = useState<SiteAnalysis[]>([])
  const [activeAnalysis, setActiveAnalysis] = useState<SiteAnalysis | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [showDealModal, setShowDealModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load saved analyses on mount
  useEffect(() => {
    apiGet<SiteAnalysis[]>('/api/site-analyses')
      .then((data) => {
        setAnalyses(data)
        setLoaded(true)
      })
      .catch((err) => {
        console.error('Failed to load analyses:', err)
        setLoaded(true)
      })
    apiGet<Pipeline[]>('/api/pipelines').then(setPipelines).catch(console.error)
  }, [])

  const runAnalysis = async (targetUrl: string) => {
    const tempId = `temp-${Date.now()}`
    const newAnalysis: SiteAnalysis = {
      id: tempId,
      url: targetUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'analyzing',
      hasOgTags: false,
      mobileOptimized: false,
      services: [],
      webBuilders: [],
      salesScore: 0,
      opportunities: [],
      notes: '',
    }

    setAnalyses((prev) => [newAnalysis, ...prev])
    setActiveAnalysis(newAnalysis)

    try {
      const resp = await fetch('/api/site-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      })

      const data = await resp.json()

      if (!resp.ok) {
        const errorResult: SiteAnalysis = {
          ...newAnalysis,
          status: 'error',
          errorMessage: data.error || `HTTP ${resp.status}`,
        }
        // Save error result to DB too (omit temp id)
        try {
          const { id: _tempId, ...toSave } = errorResult
          const saved = await apiPost<SiteAnalysis>('/api/site-analyses', toSave)
          setAnalyses((prev) => prev.map((a) => (a.id === tempId ? saved : a)))
          setActiveAnalysis(saved)
        } catch {
          setAnalyses((prev) => prev.map((a) => (a.id === tempId ? errorResult : a)))
          setActiveAnalysis(errorResult)
        }
        return
      }

      const result: SiteAnalysis = {
        ...newAnalysis,
        status: 'done',
        title: data.title,
        description: data.description,
        ogImage: data.ogImage,
        hasOgTags: data.hasOgTags,
        mobileOptimized: data.mobileOptimized,
        loadTimeMs: data.loadTimeMs,
        pageSize: data.pageSize,
        services: data.services,
        webBuilders: data.webBuilders,
        salesScore: data.salesScore,
        opportunities: data.opportunities,
      }

      // Save to DB (omit temp id so Supabase generates a UUID)
      try {
        const { id: _tempId, ...toSave } = result
        const saved = await apiPost<SiteAnalysis>('/api/site-analyses', toSave)
        setAnalyses((prev) => prev.map((a) => (a.id === tempId ? saved : a)))
        setActiveAnalysis(saved)
      } catch {
        setAnalyses((prev) => prev.map((a) => (a.id === tempId ? result : a)))
        setActiveAnalysis(result)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error'
      const errorResult: SiteAnalysis = {
        ...newAnalysis,
        status: 'error',
        errorMessage: message,
      }
      setAnalyses((prev) => prev.map((a) => (a.id === tempId ? errorResult : a)))
      setActiveAnalysis(errorResult)
    }
  }

  const handleAnalyze = () => {
    if (!url.trim()) return
    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`
    runAnalysis(targetUrl)
    setUrl('')
  }

  const handleUpdateNotes = useCallback(
    async (id: string, notes: string) => {
      setAnalyses((prev) => prev.map((a) => (a.id === id ? { ...a, notes } : a)))
      if (activeAnalysis?.id === id) {
        setActiveAnalysis((prev) => (prev ? { ...prev, notes } : prev))
      }
      // Persist to DB (debounced via the component)
      if (!id.startsWith('temp-')) {
        try {
          await apiPatch(`/api/site-analyses/${id}`, { notes })
        } catch (err) {
          console.error('Failed to save notes:', err)
        }
      }
    },
    [activeAnalysis?.id]
  )

  const handleDelete = async (id: string) => {
    if (!confirm('이 분석 기록을 삭제하시겠습니까?')) return
    try {
      if (!id.startsWith('temp-')) {
        await apiDelete(`/api/site-analyses/${id}`)
      }
      setAnalyses((prev) => prev.filter((a) => a.id !== id))
      if (activeAnalysis?.id === id) setActiveAnalysis(null)
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleCreateContact = async (analysis: SiteAnalysis) => {
    setSaving(true)
    try {
      const domain = analysis.url.replace(/https?:\/\//, '').replace(/\/.*$/, '')
      const now = new Date().toISOString()
      const contact = await apiPost('/api/contacts', {
        id: crypto.randomUUID(),
        name: domain,
        company: analysis.title || domain,
        notes: `사이트 분석기에서 생성\nURL: ${analysis.url}\n영업점수: ${analysis.salesScore}\n웹빌더: ${analysis.webBuilders.map((b) => BUILDER_LABELS[b] || b).join(', ') || '미탐지'}\n${analysis.notes || ''}`.trim(),
        tags: ['사이트분석', ...analysis.webBuilders.map((b) => BUILDER_LABELS[b] || b)],
        createdAt: now,
        updatedAt: now,
      })
      setShowContactModal(false)
      alert('연락처가 생성되었습니다!')
      router.push(`/contacts`)
      return contact
    } catch (err) {
      console.error('Failed to create contact:', err)
      alert('연락처 생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateDeal = async (analysis: SiteAnalysis, pipelineId: string) => {
    setSaving(true)
    try {
      const domain = analysis.url.replace(/https?:\/\//, '').replace(/\/.*$/, '')
      const pipeline = pipelines.find((p) => p.id === pipelineId)
      const firstStage = pipeline?.stages?.[0]?.id || 'lead'
      const now = new Date().toISOString()

      await apiPost('/api/deals', {
        id: crypto.randomUUID(),
        pipelineId,
        title: `${analysis.title || domain} - 영업 기회`,
        companyName: analysis.title || domain,
        contactPerson: '',
        plan: 'starter',
        stage: firstStage,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `사이트 분석기에서 생성\nURL: ${analysis.url}\n영업점수: ${analysis.salesScore}\n웹빌더: ${analysis.webBuilders.map((b) => BUILDER_LABELS[b] || b).join(', ') || '미탐지'}\n기회: ${analysis.opportunities.join(', ')}\n${analysis.notes || ''}`.trim(),
        tags: ['사이트분석', ...analysis.webBuilders.map((b) => BUILDER_LABELS[b] || b)],
        source: '사이트 분석기',
        createdAt: now,
        updatedAt: now,
      })
      setShowDealModal(false)
      alert('딜이 생성되었습니다!')
      router.push(`/pipeline?id=${pipelineId}`)
    } catch (err) {
      console.error('Failed to create deal:', err)
      alert('딜 생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    if (score >= 25) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    if (score >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">사이트 분석기</h2>
          <p className="text-sm text-[#a78bbc] mt-1">잠재 고객의 웹사이트를 분석하여 경쟁사 서비스 사용 여부와 영업 기회를 발굴하세요</p>
        </div>
      </div>

      {/* URL Input */}
      <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a78bbc]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="분석할 웹사이트 URL 입력 (예: example.com)"
              className="w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!url.trim()}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-[#2d1f42] disabled:text-[#a78bbc]/40 text-white rounded-lg transition-colors text-sm font-medium"
          >
            분석 시작
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis List */}
        <div className="space-y-3">
          <p className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold px-1">
            분석 기록 {loaded && analyses.length > 0 && `(${analyses.length})`}
          </p>
          {!loaded ? (
            <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-6 text-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#a78bbc]/50">기록 불러오는 중...</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-6 text-center">
              <svg className="w-8 h-8 text-[#a78bbc]/30 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-xs text-[#a78bbc]/50">URL을 입력하여 분석을 시작하세요</p>
            </div>
          ) : (
            analyses.map((analysis) => (
              <div key={analysis.id} className="group relative">
                <button
                  onClick={() => setActiveAnalysis(analysis)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeAnalysis?.id === analysis.id
                      ? 'bg-purple-600/10 border-purple-500/30'
                      : 'bg-[#1a1128] border-[#2d1f42] hover:border-purple-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {analysis.status === 'analyzing' ? (
                      <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shrink-0" />
                    ) : analysis.status === 'error' ? (
                      <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    ) : (
                      <div className={`w-2 h-2 rounded-full shrink-0 ${getScoreBg(analysis.salesScore)}`} />
                    )}
                    <p className="text-sm text-white truncate font-medium">
                      {analysis.url.replace(/https?:\/\//, '').replace(/\/$/, '')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {analysis.status === 'analyzing' ? (
                      <span className="text-[10px] text-yellow-400">분석 중...</span>
                    ) : analysis.status === 'error' ? (
                      <span className="text-[10px] text-red-400">오류 발생</span>
                    ) : (
                      <>
                        <span className={`text-[10px] font-semibold ${getScoreColor(analysis.salesScore)}`}>
                          영업점수 {analysis.salesScore}
                        </span>
                        {analysis.webBuilders.length > 0 && (
                          <span className="text-[10px] text-[#a78bbc]/40">
                            | {analysis.webBuilders.map((b) => BUILDER_LABELS[b] || b).join(', ')}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-[9px] text-[#a78bbc]/30 mt-1">
                    {new Date(analysis.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </button>
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(analysis.id)
                  }}
                  className="absolute top-2 right-2 p-1 rounded text-[#a78bbc]/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Analysis Detail */}
        <div className="lg:col-span-2">
          {activeAnalysis ? (
            activeAnalysis.status === 'analyzing' ? (
              <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-12 text-center">
                <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-medium mb-1">사이트 분석 중...</p>
                <p className="text-sm text-[#a78bbc]">{activeAnalysis.url}</p>
                <p className="text-xs text-[#a78bbc]/50 mt-2">HTML 다운로드 및 디텍터 실행 중</p>
              </div>
            ) : activeAnalysis.status === 'error' ? (
              <div className="bg-[#1a1128] border border-red-500/30 rounded-xl p-8 text-center">
                <svg className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-white font-medium mb-1">분석 실패</p>
                <p className="text-sm text-red-400">{activeAnalysis.errorMessage}</p>
                <p className="text-xs text-[#a78bbc]/50 mt-2">URL이 올바른지, 사이트가 접속 가능한지 확인해주세요</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score Header */}
                <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">
                        {activeAnalysis.title || activeAnalysis.url.replace(/https?:\/\//, '').replace(/\/$/, '')}
                      </h3>
                      <p className="text-xs text-[#a78bbc] truncate mt-0.5">{activeAnalysis.url}</p>
                      <p className="text-xs text-[#a78bbc]/50 mt-0.5">
                        분석: {new Date(activeAnalysis.createdAt).toLocaleString('ko-KR')}
                        {activeAnalysis.loadTimeMs && ` | 응답: ${activeAnalysis.loadTimeMs}ms`}
                        {activeAnalysis.pageSize && ` | 크기: ${formatBytes(activeAnalysis.pageSize)}`}
                      </p>
                    </div>
                    <div className="text-center ml-4 shrink-0">
                      <div className={`text-3xl font-bold ${getScoreColor(activeAnalysis.salesScore)}`}>
                        {activeAnalysis.salesScore}
                      </div>
                      <p className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider">영업 점수</p>
                    </div>
                  </div>
                  <div className="w-full bg-[#0f0a1a] rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full transition-all ${getScoreBg(activeAnalysis.salesScore)}`}
                      style={{ width: `${activeAnalysis.salesScore}%` }}
                    />
                  </div>
                  {/* Action Buttons: 연락처 + 딜 생성 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      연락처 추가
                    </button>
                    <button
                      onClick={() => setShowDealModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      딜 생성
                    </button>
                  </div>
                </div>

                {/* Web Builder */}
                {activeAnalysis.webBuilders.length > 0 && (
                  <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5">
                    <p className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-3">웹빌더 / 플랫폼</p>
                    <div className="flex flex-wrap gap-2">
                      {activeAnalysis.webBuilders.map((builder) => {
                        const isTarget = builder === 'imweb' || builder === 'cafe24'
                        return (
                          <span
                            key={builder}
                            className={`text-sm px-3 py-1.5 rounded-lg font-medium ${
                              isTarget
                                ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                                : 'bg-[#2d1f42] text-[#a78bbc]'
                            }`}
                          >
                            {BUILDER_LABELS[builder] || builder}
                            {isTarget && ' *'}
                          </span>
                        )
                      })}
                    </div>
                    {activeAnalysis.webBuilders.some((b) => b === 'imweb' || b === 'cafe24') && (
                      <p className="text-[11px] text-green-400/70 mt-2">* 코드앤버터 앱 설치로 간편 도입 가능한 플랫폼</p>
                    )}
                  </div>
                )}

                {/* Services Detection */}
                <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5">
                  <p className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-3">서비스 탐지 결과</p>
                  <div className="space-y-2">
                    {activeAnalysis.services.map((svc: SiteAnalysisService) => {
                      const v = VERDICT_LABELS[svc.verdict]
                      const isUs = svc.name === 'codenbutter'
                      return (
                        <div
                          key={svc.name}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            svc.verdict === 'confirmed'
                              ? isUs ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-red-500/5 border border-red-500/15'
                              : svc.verdict === 'likely'
                              ? 'bg-yellow-500/5 border border-yellow-500/15'
                              : 'bg-[#0f0a1a] border border-transparent'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full shrink-0 ${v.bg}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${
                                svc.verdict !== 'none' ? 'text-white' : 'text-[#a78bbc]/50'
                              }`}>
                                {svc.label}
                              </span>
                              {isUs && svc.verdict !== 'none' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                                  우리 서비스
                                </span>
                              )}
                            </div>
                            {svc.verdict !== 'none' && svc.matchedPatterns.length > 0 && (
                              <p className="text-[10px] text-[#a78bbc]/40 mt-0.5 truncate">
                                매칭: {svc.matchedPatterns.slice(0, 3).join(', ')}
                                {svc.matchedPatterns.length > 3 && ` 외 ${svc.matchedPatterns.length - 3}건`}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-[#a78bbc]/40">
                              {svc.score}점
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${v.color} ${
                              svc.verdict === 'confirmed' ? (isUs ? 'bg-purple-500/20' : 'bg-red-500/15') :
                              svc.verdict === 'likely' ? 'bg-yellow-500/15' : 'bg-[#2d1f42]'
                            }`}>
                              {v.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Opportunities */}
                {activeAnalysis.opportunities.length > 0 && (
                  <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5">
                    <p className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-3">영업 기회</p>
                    <div className="space-y-2">
                      {activeAnalysis.opportunities.map((opp, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2.5 bg-purple-500/5 rounded-lg">
                          <svg className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <p className="text-sm text-[#a78bbc]">{opp}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Page Info */}
                  <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5">
                    <p className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-3">페이지 정보</p>
                    <div className="space-y-1.5">
                      {[
                        { label: 'OG 태그', value: activeAnalysis.hasOgTags },
                        { label: '모바일 대응', value: activeAnalysis.mobileOptimized },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between text-sm">
                          <span className="text-[#a78bbc]">{item.label}</span>
                          <span className={item.value ? 'text-green-400' : 'text-red-400'}>
                            {item.value ? 'O' : 'X'}
                          </span>
                        </div>
                      ))}
                      {activeAnalysis.description && (
                        <div className="mt-2 pt-2 border-t border-[#2d1f42]">
                          <p className="text-[10px] text-[#a78bbc]/40 mb-0.5">메타 설명</p>
                          <p className="text-xs text-[#a78bbc] line-clamp-2">{activeAnalysis.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5">
                    <p className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-3">점수 산정 요약</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#a78bbc]">기본 점수</span>
                        <span className="text-white">30</span>
                      </div>
                      {activeAnalysis.webBuilders.some((b) => b === 'imweb') && (
                        <div className="flex justify-between">
                          <span className="text-[#a78bbc]">아임웹 가점</span>
                          <span className="text-green-400">+20</span>
                        </div>
                      )}
                      {activeAnalysis.webBuilders.some((b) => b === 'cafe24') && (
                        <div className="flex justify-between">
                          <span className="text-[#a78bbc]">카페24 가점</span>
                          <span className="text-green-400">+20</span>
                        </div>
                      )}
                      {activeAnalysis.webBuilders.some((b) => b === 'shopify') && (
                        <div className="flex justify-between">
                          <span className="text-[#a78bbc]">Shopify 가점</span>
                          <span className="text-green-400">+10</span>
                        </div>
                      )}
                      {!activeAnalysis.services.filter((s: SiteAnalysisService) => s.name !== 'codenbutter').some((s: SiteAnalysisService) => s.verdict === 'confirmed' || s.verdict === 'likely') ? (
                        <div className="flex justify-between">
                          <span className="text-[#a78bbc]">경쟁사 미사용</span>
                          <span className="text-green-400">+20</span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-[#a78bbc]">경쟁사 사용</span>
                          <span className="text-red-400">
                            -{activeAnalysis.services.filter((s: SiteAnalysisService) => s.name !== 'codenbutter' && s.verdict === 'confirmed').length * 10}
                          </span>
                        </div>
                      )}
                      {activeAnalysis.services.find((s: SiteAnalysisService) => s.name === 'codenbutter' && (s.verdict === 'confirmed' || s.verdict === 'likely')) && (
                        <div className="flex justify-between">
                          <span className="text-[#a78bbc]">이미 사용 중</span>
                          <span className="text-red-400">-30</span>
                        </div>
                      )}
                      {activeAnalysis.mobileOptimized && (
                        <div className="flex justify-between">
                          <span className="text-[#a78bbc]">모바일 대응</span>
                          <span className="text-green-400">+5</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-1.5 mt-1.5 border-t border-[#2d1f42]">
                        <span className="text-white">합계</span>
                        <span className={getScoreColor(activeAnalysis.salesScore)}>{activeAnalysis.salesScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-5">
                  <p className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-2">메모</p>
                  <textarea
                    value={activeAnalysis.notes}
                    onChange={(e) => handleUpdateNotes(activeAnalysis.id, e.target.value)}
                    placeholder="이 사이트에 대한 영업 메모를 남기세요..."
                    rows={3}
                    className="w-full bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#a78bbc]/40 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )
          ) : (
            <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-12 text-center">
              <svg className="w-12 h-12 text-[#a78bbc]/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <h3 className="text-white font-semibold mb-1">사이트 분석 시작</h3>
              <p className="text-sm text-[#a78bbc]">URL을 입력하고 분석 버튼을 눌러주세요</p>
              <div className="mt-4 p-3 bg-[#0f0a1a] rounded-lg text-left max-w-md mx-auto">
                <p className="text-[10px] text-[#a78bbc]/60 uppercase tracking-wider font-semibold mb-2">분석 항목</p>
                <ul className="space-y-1 text-xs text-[#a78bbc]">
                  <li>- 경쟁사 서비스 탐지 (IFDO, Datarize, AlphaPush, KeepGrow)</li>
                  <li>- 코드앤버터 사용 여부 확인</li>
                  <li>- 웹빌더/플랫폼 탐지 (카페24, 아임웹, Shopify 등)</li>
                  <li>- 영업 점수 자동 산정 (플랫폼 가점, 경쟁사 유무)</li>
                  <li>- 분석 결과에서 바로 연락처/딜 생성</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Creation Modal */}
      {showContactModal && activeAnalysis && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowContactModal(false)}>
          <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">연락처 추가</h3>
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs text-[#a78bbc]/60 mb-1">회사명</p>
                <p className="text-sm text-white bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2">
                  {activeAnalysis.title || activeAnalysis.url.replace(/https?:\/\//, '').replace(/\/.*$/, '')}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#a78bbc]/60 mb-1">URL</p>
                <p className="text-sm text-[#a78bbc] bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2 truncate">
                  {activeAnalysis.url}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#a78bbc]/60 mb-1">태그</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">사이트분석</span>
                  {activeAnalysis.webBuilders.map((b) => (
                    <span key={b} className="text-[10px] px-2 py-0.5 rounded bg-[#2d1f42] text-[#a78bbc]">
                      {BUILDER_LABELS[b] || b}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-[#a78bbc]/60 mb-1">영업 점수</p>
                <span className={`text-sm font-bold ${getScoreColor(activeAnalysis.salesScore)}`}>
                  {activeAnalysis.salesScore}점
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 py-2 px-4 bg-[#2d1f42] hover:bg-[#3d2f52] text-[#a78bbc] rounded-lg text-sm transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleCreateContact(activeAnalysis)}
                disabled={saving}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? '생성 중...' : '연락처 생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Creation Modal */}
      {showDealModal && activeAnalysis && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowDealModal(false)}>
          <div className="bg-[#1a1128] border border-[#2d1f42] rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">딜 생성</h3>
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs text-[#a78bbc]/60 mb-1">딜 제목</p>
                <p className="text-sm text-white bg-[#0f0a1a] border border-[#2d1f42] rounded-lg px-3 py-2">
                  {activeAnalysis.title || activeAnalysis.url.replace(/https?:\/\//, '').replace(/\/.*$/, '')} - 영업 기회
                </p>
              </div>
              <div>
                <p className="text-xs text-[#a78bbc]/60 mb-1">영업 점수</p>
                <span className={`text-sm font-bold ${getScoreColor(activeAnalysis.salesScore)}`}>
                  {activeAnalysis.salesScore}점
                </span>
              </div>
              {activeAnalysis.opportunities.length > 0 && (
                <div>
                  <p className="text-xs text-[#a78bbc]/60 mb-1">주요 기회</p>
                  <ul className="text-xs text-[#a78bbc] space-y-0.5">
                    {activeAnalysis.opportunities.slice(0, 3).map((opp, i) => (
                      <li key={i}>• {opp}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-xs text-[#a78bbc]/60 mb-2">파이프라인 선택</p>
                <div className="space-y-2">
                  {pipelines.map((pipeline) => (
                    <button
                      key={pipeline.id}
                      onClick={() => handleCreateDeal(activeAnalysis, pipeline.id)}
                      disabled={saving}
                      className="w-full text-left p-3 bg-[#0f0a1a] hover:bg-purple-600/10 border border-[#2d1f42] hover:border-purple-500/30 rounded-lg transition-all"
                    >
                      <p className="text-sm text-white font-medium">{pipeline.name}</p>
                      <p className="text-[10px] text-[#a78bbc]/50 mt-0.5">
                        {pipeline.stages.length}단계 · 첫 단계: {pipeline.stages[0]?.label || '-'}
                      </p>
                    </button>
                  ))}
                  {pipelines.length === 0 && (
                    <p className="text-xs text-[#a78bbc]/50 text-center py-2">파이프라인이 없습니다</p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDealModal(false)}
              className="w-full py-2 px-4 bg-[#2d1f42] hover:bg-[#3d2f52] text-[#a78bbc] rounded-lg text-sm transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
