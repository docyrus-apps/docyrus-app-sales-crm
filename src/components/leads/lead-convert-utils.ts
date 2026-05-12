import type { LeadConvertEntityCandidate } from '@/components/leads/lead-convert-tabs'

export type LeadConvertStepState =
  | 'pending'
  | 'running'
  | 'done'
  | 'warn'
  | 'failed'
  | 'skipped'
export type LeadConvertDetailTone =
  | 'success'
  | 'info'
  | 'warn'
  | 'error'
  | 'neutral'
export type LeadConvertStepDetail = {
  tone: LeadConvertDetailTone
  label: string
}
export type LeadConvertPrecheckTargetSummary = {
  status: 'unchecked' | 'clean' | 'matches' | 'exact'
  count: number
  exactName?: string
}

export function makeStepDetail(
  tone: LeadConvertDetailTone,
  label: string,
): LeadConvertStepDetail {
  return { tone, label }
}

export function normalize(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

export function sanitizeKeyword(value?: string | null) {
  if (!value) return ''
  return value
    .replace(/https?:\/\//gi, '')
    .replace(/[:&|!*()<>'"\\\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizePhone(value?: string | null) {
  return value?.replace(/\D/g, '') ?? ''
}

export function normalizeDomain(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
    )
    return url.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return (
      trimmed
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        ?.toLowerCase() ?? ''
    )
  }
}

export function getErrorMessage(error: unknown, t: (key: string) => string) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message)
  }

  return t('leads.convert.alert.errorTitle')
}

export function isAbortLikeError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const maybeAbort = error as { name?: string; code?: string }
  return maybeAbort.name === 'AbortError' || maybeAbort.code === 'ABORT_ERROR'
}

export function logLeadConvertEvent(
  level: 'info' | 'warn' | 'error',
  event: string,
  payload: Record<string, unknown>,
) {
  const entry = {
    event,
    ...payload,
  }

  if (level === 'error') {
    console.error('[LeadConvert]', entry)
  } else if (level === 'warn') {
    console.warn('[LeadConvert]', entry)
  } else {
    console.info('[LeadConvert]', entry)
  }
}

export function unwrapItems(
  response: unknown,
): Array<LeadConvertEntityCandidate> {
  if (Array.isArray(response))
    return response as Array<LeadConvertEntityCandidate>
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: unknown }).data
    return Array.isArray(data)
      ? (data as Array<LeadConvertEntityCandidate>)
      : []
  }

  return []
}

export function firstItem(
  response: unknown,
): LeadConvertEntityCandidate | undefined {
  return unwrapItems(response)[0]
}
