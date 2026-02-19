export type PlanType = 'starter' | 'basic' | 'pro' | 'business'

export const PLAN_OPTIONS: { id: PlanType; label: string; color: string }[] = [
  { id: 'starter', label: '스타터', color: 'bg-gray-500' },
  { id: 'basic', label: '베이직', color: 'bg-blue-500' },
  { id: 'pro', label: '프로', color: 'bg-purple-500' },
  { id: 'business', label: '비지니스', color: 'bg-yellow-500' },
]

export interface StageConfig {
  id: string
  label: string
  color: string
}

export const STAGE_COLORS = [
  'bg-blue-500',
  'bg-cyan-500',
  'bg-purple-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
]

export const DEFAULT_STAGES: StageConfig[] = [
  { id: 'lead', label: '리드', color: 'bg-blue-500' },
  { id: 'contact', label: '컨택', color: 'bg-cyan-500' },
  { id: 'demo', label: '데모', color: 'bg-purple-500' },
  { id: 'proposal', label: '제안', color: 'bg-yellow-500' },
  { id: 'closed_won', label: '성사', color: 'bg-green-500' },
  { id: 'closed_lost', label: '실패', color: 'bg-red-500' },
]

export interface Pipeline {
  id: string
  name: string
  stages: StageConfig[]
  createdAt: string
}

export interface Deal {
  id: string
  pipelineId: string
  title: string
  companyName: string
  contactPerson: string
  contactEmail?: string
  contactPhone?: string
  plan: PlanType
  stage: string
  expectedCloseDate: string
  notes?: string
  tags?: string[]
  source?: string
  createdAt: string
  updatedAt: string
}

export function getPlanLabel(plan: PlanType): string {
  return PLAN_OPTIONS.find((p) => p.id === plan)?.label || plan
}

export function getPlanColor(plan: PlanType): string {
  return PLAN_OPTIONS.find((p) => p.id === plan)?.color || 'bg-gray-500'
}

export interface Contact {
  id: string
  name: string
  company: string
  email?: string
  phone?: string
  position?: string
  tags?: string[]
  notes?: string
  dealIds?: string[]
  createdAt: string
  updatedAt: string
}

// Activity
export type ActivityType = 'call' | 'email' | 'meeting' | 'proposal' | 'note' | 'custom'

export const ACTIVITY_TYPE_OPTIONS: { id: ActivityType; label: string; color: string }[] = [
  { id: 'call', label: '전화', color: 'bg-green-500' },
  { id: 'email', label: '이메일', color: 'bg-blue-500' },
  { id: 'meeting', label: '미팅', color: 'bg-purple-500' },
  { id: 'proposal', label: '맞춤제안', color: 'bg-yellow-500' },
  { id: 'note', label: '메모', color: 'bg-gray-500' },
  { id: 'custom', label: '직접 입력', color: 'bg-cyan-500' },
]

export interface Activity {
  id: string
  type: ActivityType
  customType?: string
  title: string
  description?: string
  dealId: string
  date: string
  duration?: number
  completed: boolean
  createdAt: string
  updatedAt: string
}

export function getActivityLabel(type: ActivityType, customType?: string): string {
  if (type === 'custom' && customType) return customType
  return ACTIVITY_TYPE_OPTIONS.find((a) => a.id === type)?.label || type
}

export function getActivityColor(type: ActivityType): string {
  return ACTIVITY_TYPE_OPTIONS.find((a) => a.id === type)?.color || 'bg-gray-500'
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// Email Template
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: string
  createdAt: string
  updatedAt: string
}

export interface EmailSettings {
  senderEmail: string
}

export const EMAIL_CATEGORIES = ['소개', '팔로업', '제안', '감사', '기타']

export const EMAIL_TEMPLATE_VARIABLES: { variable: string; label: string }[] = [
  { variable: '{{회사명}}', label: '회사명' },
  { variable: '{{담당자}}', label: '담당자' },
  { variable: '{{이메일}}', label: '이메일' },
  { variable: '{{전화번호}}', label: '전화번호' },
  { variable: '{{플랜}}', label: '플랜' },
  { variable: '{{딜제목}}', label: '딜 제목' },
]
