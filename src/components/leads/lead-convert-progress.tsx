import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleDashed,
  Info,
  Loader2,
  Sparkles,
  XCircle,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { LeadConvertPrecheckTooltip } from '@/components/leads/lead-convert-precheck-tooltip'
import { cn } from '@/lib/utils'

type StepState = 'pending' | 'running' | 'done' | 'warn' | 'failed' | 'skipped'
type DetailTone = 'success' | 'info' | 'warn' | 'error' | 'neutral'
type StepDetail = { tone: DetailTone; label: string }
type PrecheckTargetSummary = {
  status: 'unchecked' | 'clean' | 'matches' | 'exact'
  count: number
  exactName?: string
}
type PrecheckSummary = {
  company: PrecheckTargetSummary
  contact: PrecheckTargetSummary
  deal: PrecheckTargetSummary
}

interface LeadConvertProgressProps {
  steps: Record<string, StepState>
  stepDetails: Record<string, Array<StepDetail>>
  stepLabels: Record<string, string>
  currentStepKey?: string
  duplicatesChecked: boolean
  precheckSummary: PrecheckSummary
}

function renderDetailIcon(tone: DetailTone) {
  if (tone === 'success')
    return <CheckCircle2 className="mt-0.5 size-3.5 text-emerald-600" />
  if (tone === 'warn')
    return <Sparkles className="mt-0.5 size-3.5 text-amber-600" />
  if (tone === 'error')
    return <XCircle className="mt-0.5 size-3.5 text-destructive" />
  if (tone === 'info') return <Info className="mt-0.5 size-3.5 text-sky-600" />
  return <CircleDashed className="mt-0.5 size-3.5 text-muted-foreground" />
}

function getStepIcon(state: StepState) {
  if (state === 'done')
    return <CheckCircle2 className="size-4 text-emerald-600" />
  if (state === 'warn')
    return <AlertTriangle className="size-4 text-amber-500" />
  if (state === 'running')
    return <Loader2 className="size-4 animate-spin text-sky-600" />
  if (state === 'failed')
    return <AlertCircle className="size-4 text-destructive" />
  if (state === 'skipped')
    return <CircleDashed className="size-4 text-muted-foreground" />

  return <Circle className="size-4 text-muted-foreground" />
}

export function LeadConvertProgress({
  steps,
  stepDetails,
  stepLabels,
  currentStepKey,
  duplicatesChecked,
  precheckSummary,
}: LeadConvertProgressProps) {
  const { t } = useTranslation()
  const stepEntries = Object.entries(stepLabels)
  const completedCount = stepEntries.filter(([key]) =>
    ['done', 'warn', 'skipped'].includes(steps[key] ?? 'pending'),
  ).length
  const connectorProgress =
    stepEntries.length <= 1
      ? 0
      : Math.min(100, (completedCount / (stepEntries.length - 1)) * 100)
  const stepperStyle = {
    '--step-count': stepEntries.length,
    '--connector-progress': `${connectorProgress}%`,
  } as CSSProperties

  return (
    <div className="rounded-lg border border-slate-200 bg-linear-to-br from-card via-card to-muted/20 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-slate-700/80">
      <TooltipProvider delayDuration={200}>
        <div
          className="relative grid grid-cols-1 gap-2 md:grid-cols-[repeat(var(--step-count),minmax(0,1fr))] md:gap-0"
          role="list"
          aria-label={t('leads.convert.progress')}
          style={stepperStyle}
        >
          <div
            aria-hidden
            className="absolute left-[calc(100%/(var(--step-count)*2))] right-[calc(100%/(var(--step-count)*2))] top-4 hidden h-1 rounded-full bg-border/80 shadow-inner md:block"
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-500 via-teal-500 to-sky-500 transition-[width] duration-500 ease-out"
              style={{ width: 'var(--connector-progress)' }}
            />
          </div>
          {stepEntries.map(([key, label]) => {
            const state = steps[key] ?? 'pending'
            const details = stepDetails[key] ?? []
            const hasDetails = details.length > 0
            const isActive = currentStepKey === key

            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div
                    role="listitem"
                    tabIndex={0}
                    aria-current={currentStepKey === key ? 'step' : undefined}
                    aria-label={`${label}: ${t(`leads.convert.stepState.${state}`, { defaultValue: state })}`}
                    className={cn(
                      'relative z-10 flex min-w-0 items-center gap-3 rounded-md border border-border/60 bg-background/80 px-3 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:flex-col md:gap-2 md:rounded-none md:border-0 md:bg-transparent md:px-2 md:py-0 md:text-center',
                      hasDetails && 'cursor-help',
                      isActive &&
                        'border-primary/60 bg-primary/[0.05] md:bg-transparent',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm ring-4 ring-card',
                        state === 'done' &&
                          'border-emerald-400 bg-emerald-50 text-emerald-700',
                        state === 'warn' &&
                          'border-amber-300 bg-amber-50 text-amber-700',
                        state === 'running' &&
                          'border-sky-400 bg-sky-50 text-sky-700',
                        state === 'failed' &&
                          'border-destructive/50 bg-destructive/10',
                        state === 'pending' &&
                          'border-slate-300 bg-background text-muted-foreground',
                        state === 'skipped' &&
                          'border-border bg-muted text-muted-foreground',
                      )}
                    >
                      {getStepIcon(state)}
                    </div>
                    <div className="min-w-0 md:w-full">
                      <span className="block truncate font-medium text-foreground">
                        {label}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={6}
                  className={cn(
                    'border border-border bg-popover p-3 text-popover-foreground shadow-lg [&_svg]:shrink-0',
                    key === 'precheck'
                      ? 'w-[30rem] max-w-[calc(100vw-2rem)]'
                      : 'min-w-[260px] max-w-md',
                  )}
                >
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  {key === 'precheck' &&
                  duplicatesChecked &&
                  (state === 'warn' || state === 'done') ? (
                    <LeadConvertPrecheckTooltip summary={precheckSummary} />
                  ) : hasDetails ? (
                    <ul className="space-y-1.5">
                      {details.map((d, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-1.5 text-xs leading-snug"
                        >
                          {renderDetailIcon(d.tone)}
                          <span className="text-foreground/90">{d.label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {state === 'pending' ? (
                        <>
                          <Circle className="size-3" />
                          <span>{t('leads.convert.state.notStarted')}</span>
                        </>
                      ) : state === 'running' ? (
                        <>
                          <Loader2 className="size-3 animate-spin text-sky-600" />
                          <span>{t('leads.convert.state.processing')}</span>
                        </>
                      ) : (
                        <>
                          <Info className="size-3" />
                          <span>{t('leads.convert.state.noDetails')}</span>
                        </>
                      )}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}
