import { useState } from 'react'

import { type CallHistoryRow } from '@/hooks/use-webphone-call-history'

import { format, parseISO } from 'date-fns'
import {
  ExternalLink,
  Loader2,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useWebphone } from './webphone-context'

import {
  useCustomerCallHistory,
  useCustomerPinnedNotes
} from '@/hooks/use-webphone-call-history'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

function enumName(
  value: { name?: string } | string | null | undefined
): string {
  if (!value) return ''
  if (typeof value === 'string') return value

  return value.name ?? ''
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'd MMM yyyy, HH:mm')
  } catch {
    return ''
  }
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return ''
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60

  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function CallRow({ row }: { row: CallHistoryRow }) {
  const direction = enumName(row.direction).toLowerCase()
  const isInbound = direction === 'inbound'
  const isMissed = !!row.is_missed
  const Icon = isMissed
    ? PhoneMissed
    : isInbound
      ? PhoneIncoming
      : PhoneOutgoing
  const title = enumName(row.outcome) || enumName(row.state) || '—'
  const duration = formatDuration(row.duration_seconds)

  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <Icon
        className={
          isMissed
            ? 'size-4 shrink-0 text-red-500'
            : isInbound
              ? 'size-4 shrink-0 text-emerald-500'
              : 'size-4 shrink-0 text-blue-500'
        } />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {formatDateTime(row.started_at)}
          {duration ? ` · ${duration}` : ''}
          {enumName(row.agent_profile)
            ? ` · ${enumName(row.agent_profile)}`
            : ''}
        </div>
      </div>
      {row.recording_url && (
        <a
          href={row.recording_url}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground">
          <ExternalLink className="size-4" />
        </a>
      )}
    </div>
  )
}

interface WebphoneCustomerCallsProps {
  contactId?: string;
  leadId?: string;
  phone?: string;
}

/**
 * Customer-card panel: call history (relation-first, phone fallback) plus
 * pinned customer notes (`call_screen_note`). Rendered inside the webphone
 * provider; gate the surrounding tab by `useWebphone().enabled`.
 */
export function WebphoneCustomerCalls({
  contactId,
  leadId,
  phone
}: WebphoneCustomerCallsProps) {
  const { t } = useTranslation()
  const { createPinnedNote } = useWebphone()
  const history = useCustomerCallHistory({ contactId, leadId, phone })
  const notesQuery = useCustomerPinnedNotes({ contactId, leadId })

  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)

  const addNote = async () => {
    if (!noteText.trim() || saving) return
    setSaving(true)
    try {
      await createPinnedNote({ noteText, contactId, leadId })
      setNoteText('')
    } catch {
      toast.error(t('webphone.notes.error'))
    } finally {
      setSaving(false)
    }
  }

  const calls = history.data ?? []
  const notes = notesQuery.data ?? []

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('webphone.history.title')}</h3>
        {history.isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : calls.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            {t('webphone.history.empty')}
          </p>
        ) : (
          <div className="space-y-1.5">
            {calls.map(row => (
              <CallRow key={row.id} row={row} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t('webphone.notes.title')}</h3>
        <div className="space-y-2">
          <Textarea
            value={noteText}
            onChange={event => setNoteText(event.target.value)}
            placeholder={t('webphone.notes.placeholder')}
            className="min-h-16 text-sm" />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!noteText.trim() || saving}
              onClick={addNote}>
              {saving ? t('common.saving') : t('webphone.notes.add')}
            </Button>
          </div>
        </div>

        {notesQuery.isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            {t('webphone.notes.empty')}
          </p>
        ) : (
          <div className="space-y-1.5">
            {notes.map(note => (
              <div key={note.id} className="rounded-lg border px-3 py-2">
                <div className="whitespace-pre-wrap text-sm">
                  {note.note_text}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(note.created_on)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
