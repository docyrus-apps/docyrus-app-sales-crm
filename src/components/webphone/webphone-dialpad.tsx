import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Delete, Loader2, Phone, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useWebphone } from './webphone-context'
import { useWebphoneCustomerAdapter } from '@/hooks/use-webphone-customer-adapter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']
const SEARCH_MIN_DIGITS = 7

/**
 * Header dialpad for outbound calls. Hidden when the module is off; the call
 * button is disabled until WebRTC is registered and no call is active. Once
 * enough digits are typed it searches contacts so a known customer can be
 * dialled (and linked) with one click.
 */
export function WebphoneDialpad() {
  const { t } = useTranslation()
  const { enabled, ready, registrationStatus, activeSession, dial } =
    useWebphone()
  const adapter = useWebphoneCustomerAdapter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  const trimmed = value.trim()
  const normalized = value.replace(/\D/g, '')
  const canDial = ready && registrationStatus === 'registered' && !activeSession

  const search = useQuery({
    queryKey: ['webphone', 'dialpad-search', normalized],
    enabled: open && normalized.length >= SEARCH_MIN_DIGITS,
    staleTime: 30_000,
    queryFn: () => adapter.findByPhone(value),
  })
  const matches = search.data ?? []
  const showSearch = normalized.length >= SEARCH_MIN_DIGITS

  if (!enabled) return null

  const placeCall = async (phone?: string, contactId?: string) => {
    const target = (phone ?? trimmed).trim()
    if (!target || !canDial) return
    await dial(target, contactId ? { contactId } : undefined)
    setOpen(false)
    setValue('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label={t('webphone.dialpad.title')}
        >
          <Phone className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3 p-3">
        <div className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void placeCall()
            }}
            placeholder={t('webphone.dialpad.placeholder')}
            inputMode="tel"
            autoFocus
            className="text-base tabular-nums"
          />
          <Button
            size="icon"
            variant="ghost"
            className="size-9 shrink-0"
            onClick={() => setValue((current) => current.slice(0, -1))}
            disabled={!value}
            aria-label={t('webphone.dialpad.backspace')}
          >
            <Delete className="size-4" />
          </Button>
        </div>

        {showSearch && (
          <div className="space-y-1 border-t pt-2">
            {search.isLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : matches.length > 0 ? (
              <>
                <div className="px-1 text-[11px] font-medium text-muted-foreground">
                  {t('webphone.dialpad.matches')}
                </div>
                <div className="max-h-32 space-y-0.5 overflow-y-auto">
                  {matches.map((match) => (
                    <button
                      key={match.id}
                      type="button"
                      disabled={!canDial}
                      onClick={() => void placeCall(match.phone, match.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="size-3 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {match.label}
                        </span>
                        {match.phone && (
                          <span className="block truncate text-xs tabular-nums text-muted-foreground">
                            {match.phone}
                          </span>
                        )}
                      </span>
                      <Phone className="size-3.5 shrink-0 text-emerald-500" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="px-1 py-1 text-xs text-muted-foreground">
                {t('webphone.dialpad.noMatch')}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5">
          {KEYS.map((key) => (
            <Button
              key={key}
              variant="outline"
              className="tabular-nums"
              onClick={() => setValue((current) => current + key)}
            >
              {key}
            </Button>
          ))}
        </div>

        <Button
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
          disabled={!trimmed || !canDial}
          onClick={() => void placeCall()}
        >
          <Phone className="size-4" />
          {t('webphone.dialpad.call')}
        </Button>
        {!canDial && (
          <p className="text-center text-xs text-muted-foreground">
            {activeSession
              ? t('webphone.dialpad.busy')
              : t('webphone.status.offline')}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
