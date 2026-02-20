import nodemailer from 'nodemailer'
import { NextRequest, NextResponse } from 'next/server'

// Zoho SMTP 서버 설정 — Vercel serverless에서 DNS EBUSY 우회를 위해 IP 직접 사용
const ZOHO_SMTP_IP = '136.143.182.56'  // smtp.zoho.com resolved IP
const ZOHO_SMTP_SERVERNAME = 'smtp.zoho.com'  // TLS 인증서 검증용

export async function POST(req: NextRequest) {
  const zohoEmail = process.env.ZOHO_EMAIL
  const zohoPassword = process.env.ZOHO_APP_PASSWORD

  if (!zohoEmail || !zohoPassword) {
    return NextResponse.json(
      { success: false, error: 'Zoho 이메일 설정이 되어있지 않습니다. .env.local 파일을 확인하세요.' },
      { status: 500 }
    )
  }

  try {
    const { to, subject, body } = await req.json()

    if (!to || !subject || !body) {
      return NextResponse.json(
        { success: false, error: '수신자, 제목, 본문은 필수입니다.' },
        { status: 400 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: ZOHO_SMTP_IP,
      port: 465,
      secure: true,
      auth: {
        user: zohoEmail,
        pass: zohoPassword,
      },
      tls: {
        servername: ZOHO_SMTP_SERVERNAME,
        rejectUnauthorized: true,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    const info = await transporter.sendMail({
      from: `코드앤버터 CRM <${zohoEmail}>`,
      to,
      subject,
      text: body,
    })

    return NextResponse.json({ success: true, id: info.messageId })
  } catch (err) {
    console.error('Email send error:', err)
    return NextResponse.json(
      { success: false, error: `이메일 발송 중 오류가 발생했습니다: ${String(err)}` },
      { status: 500 }
    )
  }
}
