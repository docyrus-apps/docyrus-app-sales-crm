import { useCallback, useRef } from 'react'

import type {
  WebphoneCallDirection,
  WebphoneLifecycleEvent
} from '@/lib/webphone/types'

import { type CallRecordContext } from '@/lib/webphone/call-lifecycle'

import { useQueryClient } from '@tanstack/react-query'

import { useBaseCallcenterCallCollection } from '@/collections'
import { useWebphoneEnumResolver } from '@/hooks/use-webphone-enums'
import { useMyAgentTelephonyProfile } from '@/hooks/use-webphone-profile'
import { buildCallRecordPayload } from '@/lib/webphone/call-lifecycle'

interface CallLogState {
  recordId?: string;
  startedAt: string;
  answeredAt?: string;
  endedAt?: string;
  contactId?: string;
  leadId?: string;
  direction: WebphoneCallDirection;
  phone: string;
  wasAnswered: boolean;
  creating?: Promise<string | undefined>;
}

export interface WebphoneCallLog {
  /** Wire into `useWebphoneSip({ onCallEvent })`. */
  onCallEvent: (event: WebphoneLifecycleEvent) => void;
  /** Patch the call's customer relation once screen-pop resolves (empty-only). */
  patchCallRelation: (
    callId: string,
    ids: { contactId?: string; leadId?: string }
  ) => Promise<void>;
  getCallRecordId: (callId: string) => string | undefined;
}

/**
 * Persists controller lifecycle events into `base_callcenter.call` as a single
 * canonical record per `call_id`. A failed create/update never blocks the live
 * call — the UI keeps working and the error is logged for admins (kit Risk 6).
 *
 * @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]
 */
export function useWebphoneCallLog(): WebphoneCallLog {
  const calls = useBaseCallcenterCallCollection()
  const { resolveEnum } = useWebphoneEnumResolver()
  const { data: profile } = useMyAgentTelephonyProfile()
  const queryClient = useQueryClient()

  const stateRef = useRef<Map<string, CallLogState>>(new Map())
  const profileIdRef = useRef<string | undefined>(undefined)

  profileIdRef.current = profile?.id
  const resolveEnumRef = useRef(resolveEnum)

  resolveEnumRef.current = resolveEnum

  const resolveCallEnum = useCallback(
    (field: string, token: unknown) => resolveEnumRef.current('call', field, token),
    []
  )

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['callcenter', 'calls'] })
    queryClient.invalidateQueries({
      queryKey: ['callcenter', 'customer-call-history']
    })
  }, [queryClient])

  const buildContext = useCallback(
    (state: CallLogState, callId: string): CallRecordContext => ({
      callId,
      direction: state.direction,
      phone: state.phone,
      startedAt: state.startedAt,
      answeredAt: state.answeredAt,
      endedAt: state.endedAt,
      agentProfileId: profileIdRef.current,
      contactId: state.contactId,
      leadId: state.leadId,
      wasAnswered: state.wasAnswered
    }),
    []
  )

  const onCallEvent = useCallback(
    async (event: WebphoneLifecycleEvent) => {
      const map = stateRef.current

      if (event.event === 'ringing') {
        if (map.has(event.callId)) return
        const state: CallLogState = {
          startedAt: event.at,
          direction: event.direction,
          phone: event.phone,
          wasAnswered: false
        }

        map.set(event.callId, state)

        const payload = buildCallRecordPayload({
          ctx: buildContext(state, event.callId),
          event: 'ringing',
          includeStaticFields: true,
          resolveCallEnum
        })

        // Required enums must resolve; otherwise skip persistence (don't guess).
        if (!payload.state || !payload.direction) {
          console.warn(
            '[Webphone] Skipping call record: unresolved enum (state/direction).'
          )

          return
        }

        const promise = calls
          .create(payload)
          .then((row) => {
            state.recordId = row.id

            return row.id
          })
          .catch((error) => {
            console.warn('[Webphone] Call record create failed', error)

            return undefined
          })

        state.creating = promise
        await promise
        invalidate()

        return
      }

      const state = map.get(event.callId)

      if (!state) return
      if (state.creating) await state.creating
      if (!state.recordId) return

      if (event.event === 'answered') {
        state.wasAnswered = true
        state.answeredAt = event.at
      }
      if (
        event.event === 'ended' ||
        event.event === 'missed' ||
        event.event === 'rejected'
      ) {
        state.endedAt = event.at
      }

      const payload = buildCallRecordPayload({
        ctx: buildContext(state, event.callId),
        event: event.event,
        includeStaticFields: false,
        resolveCallEnum
      })

      await calls
        .update(state.recordId, payload)
        .catch(error => console.warn('[Webphone] Call record update failed', error))
      invalidate()

      if (state.endedAt) map.delete(event.callId)
    },
    [
calls,
resolveCallEnum,
invalidate,
buildContext
]
  )

  const patchCallRelation = useCallback(
    async (callId: string, ids: { contactId?: string; leadId?: string }) => {
      const state = stateRef.current.get(callId)

      if (!state) return
      if (state.creating) await state.creating
      if (!state.recordId) return
      // Never overwrite an existing relation (Risk 8).
      if (state.contactId || state.leadId) return

      const payload: Record<string, unknown> = {}

      if (ids.contactId) {
        state.contactId = ids.contactId
        payload.contact = ids.contactId
      } else if (ids.leadId) {
        state.leadId = ids.leadId
        payload.lead = ids.leadId
      }
      if (!Object.keys(payload).length) return

      await calls
        .update(state.recordId, payload)
        .catch(error => console.warn('[Webphone] Call relation patch failed', error))
      invalidate()
    },
    [calls, invalidate]
  )

  const getCallRecordId = useCallback(
    (callId: string) => stateRef.current.get(callId)?.recordId,
    []
  )

  return { onCallEvent, patchCallRelation, getCallRecordId }
}
