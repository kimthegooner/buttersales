import { ImapFlow } from 'imapflow'

// Zoho IMAP 서버 설정 — Vercel serverless에서 DNS EBUSY 우회를 위해 IP 직접 사용
const ZOHO_IMAP_IP = '136.143.182.29'  // imap.zoho.com resolved IP
const ZOHO_IMAP_SERVERNAME = 'imap.zoho.com'  // TLS 인증서 검증용

export async function createImapClient() {
  return new ImapFlow({
    host: ZOHO_IMAP_IP,
    port: 993,
    secure: true,
    auth: {
      user: process.env.ZOHO_EMAIL || '',
      pass: process.env.ZOHO_APP_PASSWORD || '',
    },
    logger: false,
    tls: {
      servername: ZOHO_IMAP_SERVERNAME,
      rejectUnauthorized: true,
    },
  })
}
