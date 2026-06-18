import { useQuery } from '@tanstack/react-query'
import {
  useBaseCallcenterCallCollection,
  useBaseCallcenterCallScreenNoteCollection,
} from '@/collections'

// Relation-first call history with a phone fallback so calls still surface when
// the relation was never linked (kit Risk 1). Always queried with explicit
// `columns`; relation/enum fields are expanded to `(name)` for display.
// @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]

const CALL_HISTORY_COLUMNS = [
  'id',
  'call_id',
  'contact(name)',
  'lead(name)',
  'customer_phone_e164',
  'direction(name)',
  'agent_profile(name)',
  'state(name)',
  'outcome(name)',
  'started_at',
  'answered_at',
  'ended_at',
  'duration_seconds',
  'is_missed',
  'recording_url',
] as Array<string>

const NOTE_COLUMNS = [
  'id',
  'note_text',
  'created_on',
  'created_by(firstname,lastname,email)',
  'source_call',
] as Array<string>

export interface CallHistoryRow {
  id?: string
  call_id?: string | null
  contact?: { name?: string } | null
  lead?: { name?: string } | null
  direction?: { name?: string } | string | null
  state?: { name?: string } | string | null
  outcome?: { name?: string } | string | null
  customer_phone_e164?: string | null
  agent_profile?: { name?: string } | null
  started_at?: string | null
  answered_at?: string | null
  ended_at?: string | null
  duration_seconds?: number | null
  is_missed?: boolean | null
  recording_url?: string | null
  created_on?: string | null
}

export interface PinnedNoteRow {
  id?: string
  note_text?: string | null
  created_on?: string | null
  created_by?: { firstname?: string; lastname?: string; email?: string } | null
}

function startedDescending(a: CallHistoryRow, b: CallHistoryRow): number {
  return (
    Date.parse(b.started_at ?? b.created_on ?? '') -
    Date.parse(a.started_at ?? a.created_on ?? '')
  )
}

export function useCustomerCallHistory(args: {
  contactId?: string
  leadId?: string
  phone?: string
  enabled?: boolean
}) {
  const calls = useBaseCallcenterCallCollection()

  return useQuery({
    queryKey: [
      'callcenter',
      'customer-call-history',
      args.contactId ?? args.leadId ?? args.phone ?? 'none',
    ],
    enabled:
      args.enabled !== false && !!(args.contactId || args.leadId || args.phone),
    queryFn: async () => {
      const rows = new Map<string, CallHistoryRow>()

      if (args.contactId || args.leadId) {
        const field = args.contactId ? 'contact' : 'lead'
        const value = args.contactId ?? args.leadId
        const relationRows = (await calls.list({
          columns: CALL_HISTORY_COLUMNS,
          filters: {
            combinator: 'and',
            rules: [{ field, operator: 'eq', value }],
          },
          orderBy: 'created_on desc',
          limit: 120,
        })) as unknown as Array<CallHistoryRow>
        for (const row of relationRows) if (row.id) rows.set(row.id, row)
      }

      if (args.phone) {
        const normalized = args.phone.replace(/\D/g, '')
        if (normalized.length >= 7) {
          const phoneRows = (await calls.list({
            columns: CALL_HISTORY_COLUMNS,
            filters: {
              combinator: 'or',
              rules: [
                {
                  field: 'customer_phone_e164',
                  operator: 'eq',
                  value: `+${normalized}`,
                },
                {
                  field: 'customer_phone_e164',
                  operator: 'like',
                  value: normalized.slice(-10),
                },
              ],
            },
            orderBy: 'created_on desc',
            limit: 120,
          })) as unknown as Array<CallHistoryRow>
          for (const row of phoneRows) if (row.id) rows.set(row.id, row)
        }
      }

      return [...rows.values()].sort(startedDescending)
    },
  })
}

/**
 * Tenant-wide call log for the dedicated Calls page — every inbound/outbound
 * call regardless of CRM linkage. Direction filtering is done client-side to
 * avoid resolving enum ids here.
 */
export function useTenantCalls(args?: { limit?: number }) {
  const calls = useBaseCallcenterCallCollection()
  const limit = args?.limit ?? 200

  return useQuery({
    queryKey: ['callcenter', 'calls', 'tenant', limit],
    queryFn: async () =>
      (await calls.list({
        columns: CALL_HISTORY_COLUMNS,
        orderBy: 'created_on desc',
        limit,
      })) as unknown as Array<CallHistoryRow>,
  })
}

export function useCustomerPinnedNotes(args: {
  contactId?: string
  leadId?: string
  enabled?: boolean
}) {
  const notes = useBaseCallcenterCallScreenNoteCollection()

  return useQuery({
    queryKey: [
      'callcenter',
      'pinned-notes',
      args.contactId ?? args.leadId ?? 'none',
    ],
    enabled: args.enabled !== false && !!(args.contactId || args.leadId),
    queryFn: async () => {
      const field = args.contactId ? 'contact' : 'lead'
      const value = args.contactId ?? args.leadId
      return (await notes.list({
        columns: NOTE_COLUMNS,
        filters: {
          combinator: 'and',
          rules: [{ field, operator: 'eq', value }],
        },
        orderBy: 'created_on desc',
        limit: 50,
      })) as unknown as Array<PinnedNoteRow>
    },
  })
}
