import { normalizePhoneForStorage } from './phone'
import type { WebphoneCallDirection, WebphoneLifecycleEventType } from './types'

// Maps a controller lifecycle event onto a base_callcenter.call payload.
// One canonical record per call_id: the first (ringing) event creates with
// static fields, later events update. Enum tokens are resolved by the caller;
// when a required enum cannot resolve the field is omitted (kit Risk 3/6).
// @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]

export interface CallRecordContext {
  callId: string
  direction: WebphoneCallDirection
  phone: string
  providerType?: string
  startedAt: string
  answeredAt?: string
  endedAt?: string
  agentProfileId?: string
  contactId?: string
  leadId?: string
  wasAnswered: boolean
}

export type ResolveCallEnum = (
  fieldSlug: string,
  token: unknown,
) => string | undefined

export function callStateToken(event: WebphoneLifecycleEventType): string {
  if (event === 'answered') return 'answered'
  if (event === 'missed') return 'missed'
  if (event === 'ringing') return 'ringing'
  return 'ended'
}

// The tenant `call.outcome` has no `completed`; `answered` is the success value.
export function callOutcomeToken(
  event: WebphoneLifecycleEventType,
  wasAnswered: boolean,
): string | undefined {
  if (event === 'missed') return 'no_answer'
  if (event === 'ended') return wasAnswered ? 'answered' : 'no_answer'
  return undefined
}

function durationSeconds(start?: string, end?: string): number | undefined {
  if (!start || !end) return undefined
  const startMs = Date.parse(start)
  const endMs = Date.parse(end)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return undefined
  }
  return Math.round((endMs - startMs) / 1000)
}

export function buildCallRecordPayload(args: {
  ctx: CallRecordContext
  event: WebphoneLifecycleEventType
  includeStaticFields: boolean
  resolveCallEnum: ResolveCallEnum
}): Record<string, unknown> {
  const { ctx, event, includeStaticFields, resolveCallEnum } = args
  const payload: Record<string, unknown> = {}
  const phone = normalizePhoneForStorage(ctx.phone)

  if (includeStaticFields) {
    payload.call_id = ctx.callId
    payload.provider_type = ctx.providerType ?? 'verimor-webrtc'
    payload.direction = resolveCallEnum('direction', ctx.direction)
    payload.call_type = resolveCallEnum('call_type', 'manual')
    payload.device_type = resolveCallEnum('device_type', 'webrtc')
    payload.started_at = ctx.startedAt
    payload.ringing_at = ctx.startedAt
    if (ctx.agentProfileId) payload.agent_profile = ctx.agentProfileId
  }

  payload.state = resolveCallEnum('state', callStateToken(event))

  const outcomeToken = callOutcomeToken(event, ctx.wasAnswered)
  if (outcomeToken) payload.outcome = resolveCallEnum('outcome', outcomeToken)

  if (phone) payload.customer_phone_e164 = phone

  // Relation only when known; the caller guards against overwriting (Risk 8).
  if (ctx.contactId) payload.contact = ctx.contactId
  else if (ctx.leadId) payload.lead = ctx.leadId

  if (event === 'answered') {
    payload.answered_at = ctx.answeredAt ?? ctx.startedAt
    payload.is_missed = false
  }
  if (event === 'missed') payload.is_missed = true

  if (event === 'ended' || event === 'missed' || event === 'rejected') {
    payload.ended_at = ctx.endedAt
    const total = durationSeconds(ctx.startedAt, ctx.endedAt)
    if (total !== undefined) payload.duration_seconds = total
    const talk = durationSeconds(ctx.answeredAt, ctx.endedAt)
    if (talk !== undefined) payload.talk_duration_seconds = talk
  }

  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  )
}
