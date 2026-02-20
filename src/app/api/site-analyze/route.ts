import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ── 경쟁사 서비스 디텍터 fingerprints ──

interface Fingerprint {
  pattern: string
  score: number
}

const IFDO_FPS: Fingerprint[] = [
  { pattern: 'wlog\\.ifdo\\.co\\.kr', score: 35 },
  { pattern: '(?:script|scr)\\.ifdo\\.co\\.kr', score: 30 },
  { pattern: 'jfullscript\\.js', score: 25 },
  { pattern: '_NB_gs', score: 20 },
  { pattern: '_NB_MKTCD', score: 15 },
  { pattern: 'Start Script for IFDO', score: 10 },
  { pattern: 'ifdo\\.co\\.kr', score: 10 },
]

const DATARIZE_FPS: Fingerprint[] = [
  { pattern: '(?:cdn\\.datarize\\.io|assets\\.datarize\\.ai)', score: 40 },
  { pattern: 'genesis\\.common\\.min\\.js', score: 25 },
  { pattern: 'autoembed\\.min\\.js', score: 25 },
  { pattern: '_dtrConfig', score: 20 },
  { pattern: '["\']pType["\']', score: 10 },
  { pattern: 'datarize\\.(?:io|ai)', score: 15 },
]

const ALPHAPUSH_FPS: Fingerprint[] = [
  { pattern: 'static\\.alphwidget\\.com', score: 35 },
  { pattern: 'alphapush_funnel\\.js', score: 25 },
  { pattern: 'alphapush_main\\.js', score: 25 },
  { pattern: 'alphapush_onsite\\.js', score: 20 },
  { pattern: '/script/Push-Script/', score: 15 },
  { pattern: 'alphacore_alpha_data\\.js', score: 10 },
  { pattern: 'alphapush', score: 10 },
]

const CODENBUTTER_FPS: Fingerprint[] = [
  { pattern: 'buttr\\.dev', score: 40 },
  { pattern: 'butter\\.js', score: 25 },
  { pattern: 'CodenButter', score: 30 },
  { pattern: 'CodenButter\\s*\\(\\s*["\']boot["\']', score: 20 },
  { pattern: 'siteId\\s*:\\s*["\'][a-z]{10}["\']', score: 15 },
]

const KEEPGROW_FPS: Fingerprint[] = [
  { pattern: 'storage\\.keepgrow\\.com', score: 40 },
  { pattern: 'kg-service-init', score: 30 },
  { pattern: 'keepgrow-service', score: 25 },
  { pattern: 'data-hosting="(?:imweb|cafe24)"', score: 10 },
  { pattern: 'keepgrow\\.com', score: 15 },
]

// ── 웹빌더 디텍터 ──

interface WebBuilderFingerprint {
  pattern: string
  score: number
}

interface WebBuilderDef {
  name: string
  fingerprints: WebBuilderFingerprint[]
  threshold: number
}

const WEB_BUILDERS: WebBuilderDef[] = [
  {
    name: 'cafe24',
    threshold: 40,
    fingerprints: [
      { pattern: 'cafe24\\.com', score: 30 },
      { pattern: 'cafe24cdn\\.com', score: 30 },
      { pattern: 'ec-img\\.cafe24img\\.com', score: 40 },
      { pattern: 'cafe24\\.ssl', score: 25 },
      { pattern: 'supertongue\\.cafe24', score: 20 },
      { pattern: 'echosting', score: 15 },
      { pattern: 'EC_FRONT', score: 20 },
    ],
  },
  {
    name: 'imweb',
    threshold: 40,
    fingerprints: [
      { pattern: 'imweb\\.me', score: 40 },
      { pattern: 'cdn\\.imweb\\.me', score: 35 },
      { pattern: 'imwebme', score: 30 },
      { pattern: 'iamweb', score: 25 },
      { pattern: '__im_data', score: 20 },
      { pattern: 'imweb-font', score: 15 },
    ],
  },
  {
    name: 'shopify',
    threshold: 40,
    fingerprints: [
      { pattern: 'cdn\\.shopify\\.com', score: 40 },
      { pattern: 'Shopify\\.theme', score: 35 },
      { pattern: 'shopify-section', score: 25 },
      { pattern: 'myshopify\\.com', score: 30 },
      { pattern: 'shopify_analytics', score: 20 },
    ],
  },
  {
    name: 'WordPress',
    threshold: 40,
    fingerprints: [
      { pattern: 'wp-content', score: 35 },
      { pattern: 'wp-includes', score: 30 },
      { pattern: 'wp-json', score: 25 },
      { pattern: 'wordpress', score: 20 },
      { pattern: 'woocommerce', score: 15 },
      { pattern: 'wp-emoji', score: 10 },
    ],
  },
  {
    name: 'sixshop',
    threshold: 40,
    fingerprints: [
      { pattern: 'sixshop\\.com', score: 40 },
      { pattern: 'sixshop-cdn', score: 35 },
      { pattern: 'six-shop', score: 25 },
    ],
  },
  {
    name: 'godomall',
    threshold: 40,
    fingerprints: [
      { pattern: 'godo\\.co\\.kr', score: 40 },
      { pattern: 'godomall', score: 35 },
      { pattern: 'goodsno', score: 15 },
      { pattern: 'gd_goods', score: 15 },
    ],
  },
  {
    name: 'makeshop',
    threshold: 40,
    fingerprints: [
      { pattern: 'makeshop\\.co\\.kr', score: 40 },
      { pattern: 'makeshop', score: 30 },
      { pattern: 'shop_img\\.makeshop', score: 25 },
    ],
  },
  {
    name: 'wix',
    threshold: 40,
    fingerprints: [
      { pattern: 'static\\.wixstatic\\.com', score: 40 },
      { pattern: 'wix\\.com', score: 30 },
      { pattern: '_wix_browser_sess', score: 25 },
      { pattern: 'wixpress', score: 20 },
    ],
  },
  {
    name: 'Naver SmartStore',
    threshold: 40,
    fingerprints: [
      { pattern: 'smartstore\\.naver\\.com', score: 50 },
      { pattern: 'shop\\.naver\\.com', score: 40 },
      { pattern: 'shopping\\.naver', score: 30 },
    ],
  },
]

// ── 서비스 판정 기준 ──

const THRESHOLDS: Record<string, [number, number]> = {
  ifdo: [60, 30],
  datarize: [55, 30],
  alphapush: [60, 30],
  codenbutter: [60, 30],
  keepgrow: [55, 25],
}

const DETECTORS: Record<string, Fingerprint[]> = {
  ifdo: IFDO_FPS,
  datarize: DATARIZE_FPS,
  alphapush: ALPHAPUSH_FPS,
  codenbutter: CODENBUTTER_FPS,
  keepgrow: KEEPGROW_FPS,
}

const SERVICE_LABELS: Record<string, string> = {
  ifdo: 'IFDO (이프두)',
  datarize: 'Datarize (데이터라이즈)',
  alphapush: 'AlphaPush (알파푸시)',
  codenbutter: 'CodeNButter (코드앤버터)',
  keepgrow: 'KeepGrow (킵그로우)',
}

// ── 헬퍼 함수 ──

function detectScore(html: string, fingerprints: Fingerprint[]): { score: number; matched: string[] } {
  let score = 0
  const matched: string[] = []
  for (const fp of fingerprints) {
    try {
      if (new RegExp(fp.pattern).test(html)) {
        score += fp.score
        matched.push(fp.pattern)
      }
    } catch {
      // invalid regex, skip
    }
  }
  return { score, matched }
}

function judge(score: number, serviceName: string): 'confirmed' | 'likely' | 'none' {
  const [high, mid] = THRESHOLDS[serviceName]
  if (score >= high) return 'confirmed'
  if (score >= mid) return 'likely'
  return 'none'
}

// ── API Handler ──

export async function POST(req: NextRequest) {
  try {
    const { url: rawUrl } = await req.json()
    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let targetUrl = rawUrl.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`
    }

    // 1. HTML 가져오기
    const startTime = Date.now()
    const resp = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })

    if (!resp.ok) {
      return NextResponse.json({ error: `HTTP ${resp.status}: ${resp.statusText}` }, { status: 502 })
    }

    const html = await resp.text()
    const loadTimeMs = Date.now() - startTime
    const pageSize = new Blob([html]).size

    // 2. 경쟁사 서비스 디텍팅
    const services: {
      name: string
      label: string
      score: number
      verdict: 'confirmed' | 'likely' | 'none'
      matchedPatterns: string[]
    }[] = []

    for (const [svcName, fps] of Object.entries(DETECTORS)) {
      const { score, matched } = detectScore(html, fps)
      const verdict = judge(score, svcName)
      services.push({
        name: svcName,
        label: SERVICE_LABELS[svcName] || svcName,
        score,
        verdict,
        matchedPatterns: matched,
      })
    }

    // 3. 웹빌더 디텍팅
    const webBuilders: { name: string; score: number; detected: boolean }[] = []
    for (const builder of WEB_BUILDERS) {
      const { score } = detectScore(html, builder.fingerprints)
      webBuilders.push({
        name: builder.name,
        score,
        detected: score >= builder.threshold,
      })
    }
    const detectedBuilders = webBuilders.filter((b) => b.detected)

    // 4. 기본 페이지 정보 추출
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i)
    const hasOgTags = /property=["']og:/.test(html)
    const viewportMeta = /name=["']viewport["']/.test(html)

    // 5. 영업 점수 계산
    let salesScore = 30 // 기본 점수

    // 아임웹/카페24 사용 시 가점 (코드앤버터 설치 용이)
    const usesImweb = detectedBuilders.some((b) => b.name === 'imweb')
    const usesCafe24 = detectedBuilders.some((b) => b.name === 'cafe24')
    const usesShopify = detectedBuilders.some((b) => b.name === 'shopify')

    if (usesImweb) salesScore += 20
    if (usesCafe24) salesScore += 20
    if (usesShopify) salesScore += 10

    // 경쟁사 서비스 미사용 시 가점
    const competitorServices = services.filter((s) => s.name !== 'codenbutter')
    const hasAnyCompetitor = competitorServices.some((s) => s.verdict === 'confirmed' || s.verdict === 'likely')
    if (!hasAnyCompetitor) {
      salesScore += 20 // 경쟁사 없으면 큰 가점
    } else {
      // 경쟁사가 있으면 감점
      const confirmedCompetitors = competitorServices.filter((s) => s.verdict === 'confirmed').length
      salesScore -= confirmedCompetitors * 10
    }

    // 이미 코드앤버터 사용 중이면 감점
    const usesCodeNButter = services.find((s) => s.name === 'codenbutter')
    if (usesCodeNButter && (usesCodeNButter.verdict === 'confirmed' || usesCodeNButter.verdict === 'likely')) {
      salesScore -= 30 // 이미 사용 중
    }

    // 뷰포트 메타 있으면 소폭 가점 (모바일 대응 = 팝업 가능)
    if (viewportMeta) salesScore += 5

    salesScore = Math.max(0, Math.min(100, salesScore))

    // 6. 영업 기회 도출
    const opportunities: string[] = []

    if (usesImweb) opportunities.push('아임웹 사용 중 - 코드앤버터 설치 용이 (앱스토어 제공)')
    if (usesCafe24) opportunities.push('카페24 사용 중 - 코드앤버터 앱 설치로 간편 도입 가능')
    if (usesShopify) opportunities.push('Shopify 사용 중 - 스크립트 삽입으로 연동 가능')

    if (!hasAnyCompetitor) {
      opportunities.push('경쟁사 온사이트 마케팅 솔루션 미사용 - 신규 도입 제안 적기')
    } else {
      const confirmedNames = competitorServices
        .filter((s) => s.verdict === 'confirmed')
        .map((s) => s.label)
      if (confirmedNames.length > 0) {
        opportunities.push(`경쟁사 서비스 사용 중: ${confirmedNames.join(', ')} - 비교 제안 필요`)
      }
      const likelyNames = competitorServices
        .filter((s) => s.verdict === 'likely')
        .map((s) => s.label)
      if (likelyNames.length > 0) {
        opportunities.push(`사용 가능성: ${likelyNames.join(', ')} - 확인 후 전환 제안`)
      }
    }

    if (usesCodeNButter && (usesCodeNButter.verdict === 'confirmed' || usesCodeNButter.verdict === 'likely')) {
      opportunities.push('코드앤버터 이미 사용 중 - 업셀링/컨설팅 제안')
    }

    if (!viewportMeta) {
      opportunities.push('모바일 뷰포트 미설정 - 반응형 팝업 솔루션 제안')
    }

    return NextResponse.json({
      url: targetUrl,
      title: titleMatch?.[1]?.trim() || null,
      description: descMatch?.[1]?.trim() || null,
      ogImage: ogImageMatch?.[1]?.trim() || null,
      hasOgTags,
      mobileOptimized: viewportMeta,
      loadTimeMs,
      pageSize,
      services,
      webBuilders: detectedBuilders.map((b) => b.name),
      allWebBuilders: webBuilders,
      salesScore,
      opportunities,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
