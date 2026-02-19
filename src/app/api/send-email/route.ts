import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_your_api_key_here') {
    return NextResponse.json(
      { success: false, error: 'Resend API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.' },
      { status: 500 }
    )
  }

  const resend = new Resend(apiKey)

  try {
    const { to, subject, body, from } = await req.json()

    if (!to || !subject || !body) {
      return NextResponse.json(
        { success: false, error: '수신자, 제목, 본문은 필수입니다.' },
        { status: 400 }
      )
    }

    // 도메인 인증 전에는 onboarding@resend.dev만 발신자로 사용 가능
    // 인증된 도메인 이메일이면 그대로 사용, 아니면 onboarding@resend.dev 사용 + reply-to 설정
    const verifiedDomain = process.env.RESEND_VERIFIED_DOMAIN || ''
    const isVerifiedFrom = verifiedDomain && from && from.endsWith(`@${verifiedDomain}`)
    const senderEmail = isVerifiedFrom ? from : '코드앤버터 CRM <onboarding@resend.dev>'

    const emailPayload: Record<string, unknown> = {
      from: senderEmail,
      to: [to],
      subject,
      text: body,
    }
    if (!isVerifiedFrom && from) {
      emailPayload.reply_to = from
    }

    const { data, error } = await resend.emails.send(emailPayload as Parameters<typeof resend.emails.send>[0])

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: '이메일 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
