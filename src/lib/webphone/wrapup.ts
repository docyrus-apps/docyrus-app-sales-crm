import { type ResolveWebphoneEnum } from './enum-resolver'
import { type WebphoneCallDirection } from './types'

/*
 * Wrap-up = the call result persisted to base_callcenter.call_activity, plus a
 * matching patch to base_callcenter.call. Disposition is mapped from a UI token
 * to the tenant's enum *name*, then resolved to an id (never hardcoded).
 * @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]
 */

export interface WrapupSubmitInput {
  disposition: string;
  notes?: string;
  followupRequired?: boolean;
  contactId?: string;
  leadId?: string;
}

export const WRAPUP_DISPOSITIONS = [
  'completed',
  'interested',
  'callback_requested',
  'not_interested',
  'wrong_number',
  'no_answer',
  'voicemail'
] as const

export type WrapupDisposition = (typeof WRAPUP_DISPOSITIONS)[number]

const WRAPUP_TO_ACTIVITY_DISPOSITION: Record<string, string> = {
  completed: 'Reached - Success',
  interested: 'Reached - Success',
  callback_requested: 'Callback Scheduled',
  not_interested: 'Reached - No Interest',
  wrong_number: 'Wrong Number',
  no_answer: 'No Answer',
  voicemail: 'Voicemail'
}

const WRAPUP_TO_OUTCOME: Record<string, string> = {
  completed: 'Answered',
  interested: 'Answered',
  callback_requested: 'Answered',
  not_interested: 'Answered',
  wrong_number: 'Wrong Number',
  no_answer: 'No Answer',
  voicemail: 'Voicemail'
}

export function normalizeWrapupToken(value: string | undefined): string {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_') ?? ''
  )
}

export function wrapupDispositionLabel(
  value: string | undefined
): string | undefined {
  return WRAPUP_TO_ACTIVITY_DISPOSITION[normalizeWrapupToken(value)]
}

export function wrapupOutcomeLabel(
  value: string | undefined
): string | undefined {
  return WRAPUP_TO_OUTCOME[normalizeWrapupToken(value)]
}

/** Live notes prefill wrap-up notes, but never overwrite text already typed. */
export function importLiveNotesIntoWrapup(args: {
  liveNotes: string;
  currentWrapupNotes: string;
}): string {
  if (args.currentWrapupNotes.trim()) return args.currentWrapupNotes

  return args.liveNotes.trim()
}

function clean(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  )
}

export function buildCallActivityPayload(args: {
  input: WrapupSubmitInput;
  callRecordId: string;
  phone?: string;
  direction?: WebphoneCallDirection;
  resolveActivityEnum: (field: string, token: unknown) => string | undefined;
}): Record<string, unknown> {
  const { input, resolveActivityEnum } = args
  const disposition = resolveActivityEnum(
    'disposition',
    wrapupDispositionLabel(input.disposition) ?? input.disposition
  )
  const outcome = resolveActivityEnum(
    'outcome',
    wrapupOutcomeLabel(input.disposition)
  )
  const direction = resolveActivityEnum('direction', args.direction)

  const payload: Record<string, unknown> = {
    call: args.callRecordId,
    phone_number: args.phone,
    disposition_notes: input.notes,
    followup_required: !!input.followupRequired
  }

  if (direction) payload.direction = direction
  if (outcome) payload.outcome = outcome
  if (disposition) payload.disposition = disposition
  if (input.contactId) payload.contact = input.contactId
  else if (input.leadId) payload.lead = input.leadId

  return clean(payload)
}

export function buildCallWrapupPatch(args: {
  input: WrapupSubmitInput;
  resolveCallEnum: (field: string, token: unknown) => string | undefined;
}): Record<string, unknown> {
  const { input, resolveCallEnum } = args
  const payload: Record<string, unknown> = {
    state: resolveCallEnum('state', 'ended'),
    outcome: resolveCallEnum('outcome', wrapupOutcomeLabel(input.disposition))
  }

  if (input.contactId) payload.contact = input.contactId
  else if (input.leadId) payload.lead = input.leadId

  return clean(payload)
}

export type { ResolveWebphoneEnum }
