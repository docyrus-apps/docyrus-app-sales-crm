import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  Delete,
  Grid3x3,
  Mic,
  MicOff,
  PanelRightClose,
  Pause,
  Phone,
  PhoneCall,
  PhoneOff,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ─── Types ──────────────────────────────────────────────────────────────────
export interface DialerContact {
  name?: string
  number?: string
  /** Optional avatar image url (falls back to initials) */
  avatarUrl?: string
}

type CallState = 'ready' | 'connecting' | 'active' | 'ended'

interface DialerContextValue {
  isOpen: boolean
  contact: DialerContact | null
  open: (contact?: DialerContact) => void
  close: () => void
}

// Placeholder used until a real contact is wired in.
const DEMO_CONTACT: DialerContact = {
  name: 'Finley Bryan',
  number: '+90 542 156 70 85',
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
  const [contact, setContact] = useState<DialerContact | null>(null)

  const open = useCallback((next?: DialerContact) => {
    setContact(next ?? DEMO_CONTACT)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo<DialerContextValue>(
    () => ({
      isOpen,
      contact,
      open,
      close,
    }),
    [isOpen, contact, open, close],
  )

  return <DialerContext value={value}>{children}</DialerContext>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')

  return `${minutes}:${seconds}`
}

function getInitials(name?: string): string {
  if (!name) return '#'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const STATUS_LABEL: Record<CallState, string> = {
  ready: 'Ready to call',
  connecting: 'Connecting…',
  active: 'In call',
  ended: 'Call ended',
}

// ─── Panel ────────────────────────────────────────────────────────────────────
export function DialerPanel({
  contact,
  onClose,
}: {
  contact: DialerContact | null
  onClose: () => void
}) {
  const [state, setState] = useState<CallState>('ready')
  const [seconds, setSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [onHold, setOnHold] = useState(false)
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  // Tick the call duration while the call is active.
  useEffect(() => {
    if (state !== 'active') return

    const interval = setInterval(() => setSeconds((value) => value + 1), 1000)

    return () => clearInterval(interval)
  }, [state])

  useEffect(() => clearTimers, [clearTimers])

  /*
   * Mock call flow (no telephony yet) — demonstrates how the action buttons
   * change with the call state. Real signalling will be wired in later.
   */
  const startCall = useCallback(() => {
    setState('connecting')
    const timer = setTimeout(() => setState('active'), 1400)

    timersRef.current.push(timer)
  }, [])

  const endCall = useCallback(() => {
    clearTimers()
    setState('ended')
    const timer = setTimeout(() => {
      setState('ready')
      setSeconds(0)
      setMuted(false)
      setOnHold(false)
    }, 1600)

    timersRef.current.push(timer)
  }, [clearTimers])

  const name = contact?.name ?? 'Unknown'
  const number = contact?.number ?? 'No number'
  const isLive = state === 'active' || state === 'connecting'

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
      {/* Minimal close control */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close dialer"
        className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <PanelRightClose className="size-4" />
      </button>

      {/* Contact + timer */}
      <div className="flex flex-col items-center px-6 pb-4 pt-7 text-center">
        <div className="relative">
          {contact?.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={name}
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-foreground/70">
              {getInitials(contact?.name)}
            </div>
          )}
          {state === 'active' && (
            <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-emerald-500/40" />
          )}
        </div>

        <h3 className="mt-3 truncate text-lg font-semibold leading-tight">
          {name}
        </h3>
        <p className="truncate text-sm text-muted-foreground">{number}</p>

        <div className="mt-3 font-mono text-4xl font-semibold tabular-nums tracking-tight">
          {formatDuration(seconds)}
        </div>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {STATUS_LABEL[state]}
        </p>
      </div>

      {/* In-call secondary controls */}
      {state === 'active' && (
        <div className="grid grid-cols-3 gap-2 px-4 pb-1">
          <SecondaryControl
            icon={
              muted ? <MicOff className="size-5" /> : <Mic className="size-5" />
            }
            label={muted ? 'Unmute' : 'Mute'}
            active={muted}
            onClick={() => setMuted((value) => !value)}
          />
          <SecondaryControl
            icon={<Pause className="size-5" />}
            label={onHold ? 'Resume' : 'Hold'}
            active={onHold}
            onClick={() => setOnHold((value) => !value)}
          />
          <SecondaryControl
            icon={<Grid3x3 className="size-5" />}
            label="Keypad"
          />
        </div>
      )}

      {/* Primary actions — change with call state */}
      <div className="flex flex-col gap-2 border-t p-4">
        {state === 'ready' && (
          <>
            <Button
              type="button"
              onClick={startCall}
              className="h-12 w-full bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
            >
              <Phone className="size-5" />
              Start Call
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 w-full"
            >
              Cancel
            </Button>
          </>
        )}

        {isLive && (
          <Button
            type="button"
            onClick={endCall}
            className="h-12 w-full bg-red-600 text-base font-semibold text-white hover:bg-red-700"
          >
            {state === 'connecting' ? (
              <PhoneCall className="size-5 animate-pulse" />
            ) : (
              <PhoneOff className="size-5" />
            )}
            {state === 'connecting' ? 'Cancel' : 'End Call'}
          </Button>
        )}

        {state === 'ended' && (
          <Button
            type="button"
            variant="outline"
            disabled
            className="h-12 w-full text-base font-medium"
          >
            <Delete className="size-5" />
            Call ended
          </Button>
        )}
      </div>
    </div>
  )
}

function SecondaryControl({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted',
        active && 'border-foreground/20 bg-muted text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
