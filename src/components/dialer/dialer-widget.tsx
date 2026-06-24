import {
  type ReactNode,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import { PanelRightClose, Phone, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useWebphone } from '@/components/webphone/webphone-context'

// ─── Types ──────────────────────────────────────────────────────────────────
/**
 * A single call target offered in the composer. Carries the relation ids so the
 * placed call is linked back to the right contact / lead for call-logging and
 * screen-pop, exactly like the call buttons elsewhere.
 */
export interface DialTarget {
  /** Display name (contact / person / company line) */
  label: string;
  /** Optional secondary line (job title, "Main line", relation) */
  sublabel?: string;
  /** Number to dial — targets without one are shown disabled. */
  number?: string | null;
  contactId?: string;
  leadId?: string;
}

export interface DialerPayload {
  /** Title shown at the top of the composer (the record's name). */
  recordLabel?: string;
  avatarUrl?: string;
  /** One or more numbers the user can place the call to. */
  targets: Array<DialTarget>;
}

interface DialerContextValue {
  isOpen: boolean;
  payload: DialerPayload | null;
  /** Open the side composer pre-filled with the record's call target(s). */
  open: (payload: DialerPayload) => void;
  close: () => void;
}

const DialerContext = createContext<DialerContextValue | null>(null)

export function useDialer(): DialerContextValue {
  const ctx = use(DialerContext)

  if (!ctx) {
    throw new Error('useDialer must be used within <DialerProvider>')
  }

  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function DialerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [payload, setPayload] = useState<DialerPayload | null>(null)

  const open = useCallback((next: DialerPayload) => {
    setPayload(next)
    setIsOpen(true)
  }, [])

  /*
   * Keep the payload after closing so the slide-out exit animation still has
   * content to render; it's replaced on the next open().
   */
  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo<DialerContextValue>(
    () => ({
      isOpen,
      payload,
      open,
      close
    }),
    [
isOpen,
payload,
open,
close
]
  )

  return <DialerContext value={value}>{children}</DialerContext>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name?: string): string {
  if (!name) return '#'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

function hasNumber(target: DialTarget): boolean {
  return (target.number ?? '').trim().length > 0
}

// ─── Composer panel ─────────────────────────────────────────────────────────
/**
 * Pre-call composer rendered in the record-detail slide-out. It lets the agent
 * confirm / pick which of the record's numbers to call, then places a real
 * WebPhone call and closes — the live call is then owned by the global
 * bottom-right webphone widget, so there is no duplicate in-call UI here.
 * Surfaces a small inline warning when the agent is offline or has no number.
 *
 * @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]
 */
export function DialerPanel() {
  const { t } = useTranslation()
  const { payload, close } = useDialer()
  const { registrationStatus, activeSession, dial } = useWebphone()

  const targets = payload?.targets ?? []
  const dialable = useMemo(() => targets.filter(hasNumber), [targets])

  const [selected, setSelected] = useState(0)

  // Reset the selection whenever a new record is loaded into the composer.
  useEffect(() => {
    setSelected(0)
  }, [payload])

  const isOnline = registrationStatus === 'registered'
  const busy = !!activeSession
  const current = dialable[selected] ?? dialable[0]
  const canStart = !!current && isOnline && !busy

  const recordLabel = payload?.recordLabel ?? current?.label
  const isMulti = dialable.length > 1

  const startCall = () => {
    const number = current?.number?.trim()

    if (!canStart || !number) return
    void dial(number, {
      contactId: current?.contactId,
      leadId: current?.leadId
    })
    close()
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
      <button
        type="button"
        onClick={close}
        aria-label={t('common.close', { defaultValue: 'Close' })}
        className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <PanelRightClose className="size-4" />
      </button>

      {/* Record header */}
      <div className="flex flex-col items-center px-6 pb-4 pt-7 text-center">
        {payload?.avatarUrl ? (
          <img
            src={payload.avatarUrl}
            alt={recordLabel ?? ''}
            className="size-16 rounded-full object-cover" />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-foreground/70">
            {getInitials(recordLabel)}
          </div>
        )}
        <h3 className="mt-3 max-w-full truncate text-lg font-semibold leading-tight">
          {recordLabel ?? t('webphone.dialer.title', { defaultValue: 'Call' })}
        </h3>
        {!isMulti && (
          <p className="max-w-full truncate text-sm text-muted-foreground">
            {current?.number ?? t('webphone.dialer.noNumberShort')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t p-4">
        {/* No number on this record */}
        {dialable.length === 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            <span>{t('webphone.dialer.noNumber')}</span>
          </div>
        )}

        {/* Number picker when the record has more than one number */}
        {isMulti && (
          <div className="space-y-1.5">
            <div className="px-0.5 text-xs font-medium text-muted-foreground">
              {t('webphone.dialer.selectNumber')}
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {dialable.map((target, index) => (
                <button
                  key={`${target.contactId ?? target.label}-${index}`}
                  type="button"
                  onClick={() => setSelected(index)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/60',
                    index === selected
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-border'
                  )}>
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border',
                      index === selected
                        ? 'border-emerald-500'
                        : 'border-muted-foreground/40'
                    )}>
                    {index === selected && (
                      <span className="size-2 rounded-full bg-emerald-500" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {target.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {target.sublabel
                        ? `${target.sublabel} · ${target.number}`
                        : target.number}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Offline / busy warnings */}
        {dialable.length > 0 && !isOnline && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            <span>{t('webphone.dialer.offline')}</span>
          </div>
        )}
        {dialable.length > 0 && isOnline && busy && (
          <div className="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span>{t('webphone.dialer.inProgress')}</span>
          </div>
        )}

        <Button
          type="button"
          onClick={startCall}
          disabled={!canStart}
          className="h-12 w-full bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700 disabled:bg-muted disabled:text-muted-foreground">
          <Phone className="size-5" />
          {t('webphone.dialer.startCall', { defaultValue: 'Start Call' })}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={close}
          className="h-11 w-full">
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </Button>
      </div>
    </div>
  )
}
