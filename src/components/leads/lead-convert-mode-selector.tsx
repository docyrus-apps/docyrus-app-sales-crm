import { type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Info,
  UserRound,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type ConversionMode = 'company_contact_deal' | 'contact_deal'

interface LeadConvertModeSelectorProps {
  mode: ConversionMode
  disabled?: boolean
  skippedTargets: Array<string>
  onModeChange: (mode: ConversionMode) => void
}

export function LeadConvertModeSelector({
  mode,
  disabled,
  skippedTargets,
  onModeChange,
}: LeadConvertModeSelectorProps) {
  const { t } = useTranslation()

  const recordRow = (icon: ReactNode, label: string) => (
    <span className="flex items-center gap-1.5 text-[11px] text-foreground/85">
      {icon}
      <span>{label}</span>
    </span>
  )

  const companyChip = recordRow(
    <Building2 className="size-3.5 text-sky-600" />,
    t('leads.convert.target.company'),
  )
  const contactChip = recordRow(
    <UserRound className="size-3.5 text-emerald-600" />,
    t('leads.convert.target.contact'),
  )
  const dealChip = recordRow(
    <CheckCircle2 className="size-3.5 text-violet-600" />,
    t('leads.convert.target.deal'),
  )

  const options: Array<{
    value: ConversionMode
    title: string
    records: ReactNode
  }> = [
    {
      value: 'company_contact_deal',
      title: t('leads.convert.modeName.company_contact_deal', {
        defaultValue: 'Corporate account',
      }),
      records: (
        <>
          {companyChip}
          {contactChip}
          {dealChip}
        </>
      ),
    },
    {
      value: 'contact_deal',
      title: t('leads.convert.modeName.contact_deal', {
        defaultValue: 'Individual deal',
      }),
      records: (
        <>
          {contactChip}
          {dealChip}
        </>
      ),
    },
  ]

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    value: ConversionMode,
  ) => {
    if (disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onModeChange(value)
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-2 rounded-lg border border-slate-200 bg-linear-to-br from-card via-card to-muted/20 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-slate-700/80">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {t('leads.convert.modeLabel')}
        </p>
        <div
          className="grid gap-2 md:grid-cols-2"
          role="radiogroup"
          aria-label={t('leads.convert.modeLabel')}
        >
          {options.map((option) => {
            const selected = mode === option.value
            return (
              <div
                key={option.value}
                role="radio"
                aria-checked={selected}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : 0}
                onClick={() => !disabled && onModeChange(option.value)}
                onKeyDown={(event) => handleKeyDown(event, option.value)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  disabled && 'cursor-not-allowed opacity-60',
                  selected
                    ? 'border-primary/55 bg-primary/[0.06] shadow-sm ring-1 ring-primary/20'
                    : 'border-slate-200 bg-background/80 hover:border-primary/35 hover:bg-muted/30 dark:border-slate-700/80',
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                      selected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/40',
                    )}
                  >
                    {selected ? (
                      <span className="size-1.5 rounded-full bg-primary-foreground" />
                    ) : null}
                  </span>
                  <span className="truncate font-medium text-foreground">
                    {option.title}
                  </span>
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      role="img"
                      aria-label={t('leads.convert.modeRecordsTitle', {
                        defaultValue: 'Will create',
                      })}
                      onClick={(event) => event.stopPropagation()}
                      className="shrink-0 rounded-full p-0.5 text-muted-foreground/70 transition-colors hover:text-foreground"
                    >
                      <Info className="size-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={6}
                    className="border border-border bg-popover p-2.5 text-popover-foreground shadow-lg [&_svg]:shrink-0"
                  >
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('leads.convert.modeRecordsTitle', {
                        defaultValue: 'Will create',
                      })}
                    </p>
                    <div className="flex flex-col gap-1">{option.records}</div>
                  </TooltipContent>
                </Tooltip>
              </div>
            )
          })}
        </div>
        {skippedTargets.length > 0 ? (
          <p className="flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            <span>
              {t('leads.convert.modeSkipWarning', {
                targets: skippedTargets.join(', '),
                defaultValue:
                  'This mode skips {{targets}}. Hidden values are kept if you switch back.',
              })}
            </span>
          </p>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
