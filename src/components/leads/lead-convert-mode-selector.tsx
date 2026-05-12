import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Building2, CheckCircle2, UserRound } from 'lucide-react'
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
  const modeLabels: Record<ConversionMode, string> = {
    company_contact_deal: t('leads.convert.mode.company_contact_deal'),
    contact_deal: t('leads.convert.mode.contact_deal'),
  }
  const options: Array<{
    value: ConversionMode
    icons: ReactNode
  }> = [
    {
      value: 'company_contact_deal',
      icons: (
        <>
          <Building2 className="size-3.5 text-sky-600" />
          <UserRound className="size-3.5 text-emerald-600" />
          <CheckCircle2 className="size-3.5 text-violet-600" />
        </>
      ),
    },
    {
      value: 'contact_deal',
      icons: (
        <>
          <UserRound className="size-3.5 text-emerald-600" />
          <CheckCircle2 className="size-3.5 text-violet-600" />
        </>
      ),
    },
  ]

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-linear-to-br from-card via-card to-muted/20 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-slate-700/80">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {t('leads.convert.modeLabel')}
      </p>
      <div
        className="grid gap-2 md:grid-cols-2"
        role="group"
        aria-label={t('leads.convert.modeLabel')}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={mode === option.value}
            onClick={() => onModeChange(option.value)}
            className={cn(
              'flex min-h-14 items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              mode === option.value
                ? 'border-primary/55 bg-primary/[0.06] shadow-sm ring-1 ring-primary/20'
                : 'border-slate-200 bg-background/80 hover:border-primary/35 hover:bg-muted/30 dark:border-slate-700/80',
            )}
          >
            <span className="min-w-0 truncate font-medium text-foreground">
              {modeLabels[option.value]}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2 py-1">
              {option.icons}
            </span>
          </button>
        ))}
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
  )
}
