import { NextRequest, NextResponse } from 'next/server'
import { createImapClient } from '@/lib/imap-client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const client = await createImapClient()

  try {
    await client.connect()

    const lock = await client.getMailboxLock('INBOX')

    try {
      const mailbox = client.mailbox
      if (!mailbox || !mailbox.exists) {
        return NextResponse.json([])
      }

      const totalMessages = mailbox.exists
      const endSeq = Math.max(1, totalMessages - offset)
      const startSeq = Math.max(1, endSeq - limit + 1)

      if (endSeq < 1) {
        return NextResponse.json([])
      }

      const emails: Array<{
        uid: number
        subject: string
        from: string
        fromEmail: string
        to: string
        date: string
        preview: string
        seen: boolean
      }> = []

      // envelope만 가져옴 — source(본문) 생략으로 속도 대폭 개선
      for await (const message of client.fetch(`${startSeq}:${endSeq}`, {
        uid: true,
        flags: true,
        envelope: true,
      })) {
        const envelope = message.envelope
        const fromAddr = envelope?.from?.[0]
        const toAddr = envelope?.to?.[0]

        emails.push({
          uid: message.uid,
          subject: envelope?.subject || '(제목 없음)',
          from: fromAddr ? (fromAddr.name || fromAddr.address || '') : '',
          fromEmail: fromAddr?.address || '',
          to: toAddr?.address || '',
          date: envelope?.date?.toISOString() || '',
          preview: '', // 상세 보기에서 로드
          seen: message.flags?.has('\\Seen') ?? false,
        })
      }

      // Sort newest first
      emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return NextResponse.json(emails)
    } finally {
      lock.release()
    }
  } catch (err) {
    console.error('IMAP inbox error:', err)
    return NextResponse.json(
      { error: `받은편지함 조회 중 오류가 발생했습니다: ${String(err)}` },
      { status: 500 }
    )
  } finally {
    try {
      await client.logout()
    } catch {
      // ignore
    }
  }
}
