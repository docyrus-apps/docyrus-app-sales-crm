import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardCheck,
  Grid3x3,
  Mic,
  MicOff,
  Pause,
  Phone,
  PhoneIncoming,
  PhoneOff,
  Play,
  User,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useWebphone } from './webphone-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  WRAPUP_DISPOSITIONS,
  importLiveNotesIntoWrapup,
} from '@/lib/webphone/wrapup'
import { cn } from '@/lib/utils'

const DTMF_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

function useElapsedSeconds(startIso?: string): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!startIso) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [startIso])
  if (!startIso) return 0
  const started = Date.parse(startIso)
  if (!Number.isFinite(started)) return 0
  return Math.max(0, Math.floor((now - started) / 1000))
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function IncomingCall() {
  const { t } = useTranslation()
  const { incomingSession, screenPop, answer, reject, selectScreenPopMatch } =
    useWebphone()

  if (!incomingSession) return null

  const single = screenPop?.mode === 'single' ? screenPop.matches[0] : null
  const callerName =
    single?.label || incomingSession.remoteDisplayName || undefined
  const phone = incomingSession.remotePhone
  const isMulti = screenPop?.mode === 'multi'

  return (
    <div className="w-80 rounded-xl border bg-card p-4 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <PhoneIncoming className="size-4 text-emerald-500" />
        {t('webphone.incoming.title')}
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="truncate text-lg font-semibold">
          {callerName ?? t('webphone.incoming.unknown')}
        </div>
        <div className="text-sm text-muted-foreground">{phone || '—'}</div>
      </div>

      {isMulti && (
        <div className="mt-3 space-y-1">
          <div className="text-xs text-muted-foreground">
            {t('webphone.incoming.matches')}
          </div>
          <div className="max-h-28 space-y-1 overflow-y-auto">
            {screenPop?.matches.map((match) => (
              <button
                key={match.id}
                type="button"
                onClick={() => selectScreenPopMatch(match)}
                className="flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <User className="size-3.5 text-muted-foreground" />
                <span className="truncate">{match.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
          onClick={answer}
        >
          <Phone className="size-4" />
          {t('webphone.incoming.answer')}
        </Button>
        <Button variant="destructive" className="flex-1 gap-2" onClick={reject}>
          <PhoneOff className="size-4" />
          {t('webphone.incoming.reject')}
        </Button>
      </div>
    </div>
  )
}

function ActiveCall() {
  const { t } = useTranslation()
  const {
    activeSession,
    hangup,
    mute,
    unmute,
    hold,
    unhold,
    sendDtmf,
    liveNotes,
    setLiveNotes,
  } = useWebphone()
  const [showKeypad, setShowKeypad] = useState(false)

  const elapsed = useElapsedSeconds(
    activeSession?.answeredAt ?? activeSession?.startedAt,
  )

  if (!activeSession) return null

  const dialing = activeSession.state === 'dialing'
  const statusLabel = dialing
    ? t('webphone.dialing')
    : activeSession.state === 'active'
      ? formatElapsed(elapsed)
      : t('webphone.ringing')

  return (
    <div className="w-80 rounded-xl border bg-card p-4 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Phone className="size-4 text-emerald-500" />
        {activeSession.direction === 'incoming'
          ? t('webphone.incoming.title')
          : t('webphone.active.title')}
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="truncate text-lg font-semibold">
          {activeSession.remoteDisplayName || activeSession.remotePhone || '—'}
        </div>
        <div className="text-sm tabular-nums text-muted-foreground">
          {statusLabel}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button
          variant={activeSession.isMuted ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => (activeSession.isMuted ? unmute() : mute())}
        >
          {activeSession.isMuted ? (
            <MicOff className="size-4" />
          ) : (
            <Mic className="size-4" />
          )}
          {activeSession.isMuted
            ? t('webphone.active.unmute')
            : t('webphone.active.mute')}
        </Button>
        <Button
          variant={activeSession.isOnHold ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => (activeSession.isOnHold ? unhold() : hold())}
        >
          {activeSession.isOnHold ? (
            <Play className="size-4" />
          ) : (
            <Pause className="size-4" />
          )}
          {activeSession.isOnHold
            ? t('webphone.active.resume')
            : t('webphone.active.hold')}
        </Button>
        <Button
          variant={showKeypad ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => setShowKeypad((open) => !open)}
        >
          <Grid3x3 className="size-4" />
          {t('webphone.active.keypad')}
        </Button>
      </div>

      {showKeypad && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {DTMF_KEYS.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="tabular-nums"
              onClick={() => sendDtmf(key)}
            >
              {key}
            </Button>
          ))}
        </div>
      )}

      <Textarea
        value={liveNotes}
        onChange={(event) => setLiveNotes(event.target.value)}
        placeholder={t('webphone.wrapup.liveNotesPlaceholder')}
        className="mt-3 min-h-16 text-sm"
      />

      <Button
        variant="destructive"
        className="mt-3 w-full gap-2"
        onClick={hangup}
      >
        <PhoneOff className="size-4" />
        {t('webphone.active.hangup')}
      </Button>
    </div>
  )
}

function WrapupPanel() {
  const { t } = useTranslation()
  const { pendingWrapup, liveNotes, submitWrapup, dismissWrapup } =
    useWebphone()

  const initialNotes = useMemo(
    () => importLiveNotesIntoWrapup({ liveNotes, currentWrapupNotes: '' }),
    [liveNotes],
  )
  const [disposition, setDisposition] = useState('')
  const [notes, setNotes] = useState(initialNotes)
  const [followup, setFollowup] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Prefill notes from the live notes captured during the call.
  useEffect(() => {
    setNotes((current) => (current.trim() ? current : initialNotes))
  }, [initialNotes])

  if (!pendingWrapup) return null

  const submit = async () => {
    if (!disposition || submitting) return
    setSubmitting(true)
    try {
      await submitWrapup({
        disposition,
        notes: notes.trim() || undefined,
        followupRequired: followup,
      })
    } catch {
      toast.error(t('webphone.wrapup.error'))
      setSubmitting(false)
    }
  }

  return (
    <div className="w-80 rounded-xl border bg-card p-4 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <ClipboardCheck className="size-4 text-cyan-500" />
        {t('webphone.wrapup.title')}
      </div>
      <div className="mt-1 truncate text-sm text-muted-foreground">
        {pendingWrapup.phone || '—'}
      </div>

      <div className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t('webphone.wrapup.disposition')}</Label>
          <Select value={disposition} onValueChange={setDisposition}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={t('webphone.wrapup.dispositionPlaceholder')}
              />
            </SelectTrigger>
            <SelectContent>
              {WRAPUP_DISPOSITIONS.map((token) => (
                <SelectItem key={token} value={token}>
                  {t(`webphone.wrapup.dispositions.${token}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t('webphone.wrapup.notesPlaceholder')}
          className="min-h-16 text-sm"
        />

        <div className="flex items-center justify-between">
          <Label htmlFor="webphone-followup" className="text-sm font-normal">
            {t('webphone.wrapup.followup')}
          </Label>
          <Switch
            id="webphone-followup"
            checked={followup}
            onCheckedChange={setFollowup}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={dismissWrapup}
          disabled={submitting}
        >
          {t('webphone.wrapup.skip')}
        </Button>
        <Button
          className="flex-1"
          onClick={submit}
          disabled={!disposition || submitting}
        >
          {submitting ? t('common.saving') : t('webphone.wrapup.submit')}
        </Button>
      </div>
    </div>
  )
}

/**
 * Global floating webphone surface: incoming screen-pop takes priority, then
 * the active-call panel. Mounted once under the provider; renders nothing when
 * idle or when the module is off.
 */
export function WebphoneWidget() {
  const { enabled, incomingSession, activeSession, pendingWrapup } =
    useWebphone()

  if (!enabled) return null
  if (!incomingSession && !activeSession && !pendingWrapup) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'animate-in fade-in slide-in-from-bottom-2',
      )}
    >
      {incomingSession ? (
        <IncomingCall />
      ) : activeSession ? (
        <ActiveCall />
      ) : (
        <WrapupPanel />
      )}
    </div>
  )
}
