import { NextRequest, NextResponse } from 'next/server'
import { createImapClient } from '@/lib/imap-client'
import { simpleParser } from 'mailparser'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const uid = parseInt(id, 10)

  if (isNaN(uid)) {
    return NextResponse.json({ error: '유효하지 않은 이메일 ID입니다.' }, { status: 400 })
  }

  const client = await createImapClient()

  try {
    await client.connect()

    const lock = await client.getMailboxLock('INBOX')

    try {
      // Fetch full message by UID
      const message = await client.fetchOne(String(uid), {
        uid: true,
        flags: true,
        envelope: true,
        source: true,
      }, { uid: true })

      if (!message) {
        return NextResponse.json({ error: '이메일을 찾을 수 없습니다.' }, { status: 404 })
      }

      // Parse the full message
      if (!message.source) {
        return NextResponse.json({ error: '이메일 본문을 가져올 수 없습니다.' }, { status: 404 })
      }
      const parsed = await simpleParser(message.source)

      const fromAddr = message.envelope?.from?.[0]
      const toAddrs = message.envelope?.to || []

      // Mark as seen
      await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true })

      const envelope = message.envelope
      return NextResponse.json({
        uid: message.uid,
        subject: envelope?.subject || '(제목 없음)',
        from: fromAddr ? (fromAddr.name || fromAddr.address || '') : '',
        fromEmail: fromAddr?.address || '',
        to: toAddrs.map((a) => a.address).join(', '),
        date: envelope?.date?.toISOString() || '',
        body: parsed.text || '',
        html: parsed.html || '',
        seen: message.flags?.has('\\Seen') ?? false,
        attachments: (parsed.attachments || []).map((att) => ({
          filename: att.filename || 'attachment',
          size: att.size,
          contentType: att.contentType,
        })),
      })
    } finally {
      lock.release()
    }
  } catch (err) {
    console.error('IMAP email detail error:', err)
    return NextResponse.json(
      { error: `이메일 조회 중 오류가 발생했습니다: ${String(err)}` },
      { status: 500 }
    )
  } finally {
    try {
      await client.logout()
    } catch {
      // ignore logout errors
    }
  }
}
