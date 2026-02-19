import { Deal, EmailTemplate, EMAIL_TEMPLATE_VARIABLES, getPlanLabel } from './types'

export function substituteVariables(text: string, deal: Deal): string {
  let result = text
  EMAIL_TEMPLATE_VARIABLES.forEach(({ variable }) => {
    let value = ''
    switch (variable) {
      case '{{회사명}}': value = deal.companyName; break
      case '{{담당자}}': value = deal.contactPerson; break
      case '{{이메일}}': value = deal.contactEmail || ''; break
      case '{{전화번호}}': value = deal.contactPhone || ''; break
      case '{{플랜}}': value = getPlanLabel(deal.plan); break
      case '{{딜제목}}': value = deal.title; break
    }
    result = result.replaceAll(variable, value)
  })
  return result
}

export function buildMailtoLink(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
