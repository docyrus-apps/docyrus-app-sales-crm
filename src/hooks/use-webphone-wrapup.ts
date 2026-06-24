import { useCallback } from 'react'

import { type WebphoneCallDirection } from '@/lib/webphone/types'

import type { WrapupSubmitInput } from '@/lib/webphone/wrapup'

import { useQueryClient } from '@tanstack/react-query'

import {
  useBaseCallcenterCallActivityCollection,
  useBaseCallcenterCallCollection,
  useBaseCallcenterCallScreenNoteCollection
} from '@/collections'
import { useWebphoneEnumResolver } from '@/hooks/use-webphone-enums'
import {
  buildCallActivityPayload,
  buildCallWrapupPatch
} from '@/lib/webphone/wrapup'

export interface SubmitWrapupArgs {
  callRecordId: string;
  phone?: string;
  direction?: WebphoneCallDirection;
  input: WrapupSubmitInput;
}

export interface CreatePinnedNoteArgs {
  noteText: string;
  contactId?: string;
  leadId?: string;
  sourceCallRecordId?: string;
}

/**
 * Persists wrap-up (`call_activity` upsert + `call` patch) and pinned customer
 * notes (`call_screen_note`). The activity upsert throws on failure so the
 * pending wrap-up is never silently closed; the call patch is best-effort.
 *
 * @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]
 */
export function useWebphoneWrapup() {
  const activities = useBaseCallcenterCallActivityCollection()
  const notes = useBaseCallcenterCallScreenNoteCollection()
  const calls = useBaseCallcenterCallCollection()
  const { resolveEnum } = useWebphoneEnumResolver()
  const queryClient = useQueryClient()

  const invalidateCalls = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['callcenter', 'calls'] })
    queryClient.invalidateQueries({
      queryKey: ['callcenter', 'customer-call-history']
    })
    queryClient.invalidateQueries({ queryKey: ['callcenter', 'call-activity'] })
  }, [queryClient])

  const submitWrapup = useCallback(
    async ({ callRecordId, phone, direction, input }: SubmitWrapupArgs) => {
      const activityPayload = buildCallActivityPayload({
        input,
        callRecordId,
        phone,
        direction,
        resolveActivityEnum: (field, token) => resolveEnum('call_activity', field, token)
      })

      /*
       * Upsert one activity per call. A failure here is surfaced (throws) so the
       * pending wrap-up stays open for retry.
       */
      const existing = await activities.list({
        columns: ['id'],
        filters: {
          combinator: 'and',
          rules: [{ field: 'call', operator: 'eq', value: callRecordId }]
        },
        limit: 1
      })

      if (existing[0]?.id) {
        await activities.update(existing[0].id, activityPayload)
      } else {
        await activities.create(activityPayload)
      }

      // Patch the call record (best-effort — never block wrap-up completion).
      const callPatch = buildCallWrapupPatch({
        input,
        resolveCallEnum: (field, token) => resolveEnum('call', field, token)
      })

      await calls
        .update(callRecordId, callPatch)
        .catch(error => console.warn('[Webphone] Call wrap-up patch failed', error))

      invalidateCalls()
    },
    [
activities,
calls,
resolveEnum,
invalidateCalls
]
  )

  const createPinnedNote = useCallback(
    async ({
      noteText,
      contactId,
      leadId,
      sourceCallRecordId
    }: CreatePinnedNoteArgs) => {
      const note = noteText.trim()

      if (!note) return
      if (!contactId && !leadId) {
        throw new Error('Link a customer before saving a note.')
      }

      await notes.create({
        note_text: note,
        contact: contactId,
        lead: contactId ? undefined : leadId,
        source_call: sourceCallRecordId
      })

      queryClient.invalidateQueries({
        queryKey: ['callcenter', 'pinned-notes']
      })
    },
    [notes, queryClient]
  )

  return { submitWrapup, createPinnedNote }
}
