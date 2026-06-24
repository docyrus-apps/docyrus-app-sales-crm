import { type CSSProperties } from 'react'

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
  XCircle
} from 'lucide-react'

import { LeadConvertPrecheckTooltip } from '@/components/leads/lead-convert-precheck-tooltip'
import { cn } from '@/lib/utils'

type StepState = 'pending' | 'running' | 'done' | 'warn' | 'failed' | 'skipped'
type DetailTone = 'success' | 'info' | 'warn' | 'error' | 'neutral'
type StepDetail = { tone: DetailTone; label: string }
type PrecheckTargetSummary = {
  status: 'unchecked' | 'clean' | 'matches' | 'exact';
  count: number;
  exactName?: string;
}
type PrecheckSummary = {
  company: PrecheckTargetSummary;
  contact: PrecheckTargetSummary;
  deal: PrecheckTargetSummary;
}

interface LeadConvertProgressProps {
  steps: Record<string, StepState>;
  stepDetails: Record<string, Array<StepDetail>>;
  stepLabels: Record<string, string>;
  currentStepKey?: string;
  duplicatesChecked: boolean;
  precheckSummary: PrecheckSummary;
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
  precheckSummary
}: LeadConvertProgressProps) {
  const { t } = useTranslation()
  const stepEntries = Object.entries(stepLabels)
  const completedCount = stepEntries.filter(([key]) => ['done', 'warn', 'skipped'].includes(steps[key] ?? 'pending')).length
  const connectorProgress =
    stepEntries.length <= 1
      ? 0
      : Math.min(100, (completedCount / (stepEntries.length - 1)) * 100)

  /*
   * The detail strip below the stepper follows whichever step is "active":
   * the one running / needing attention, else the last settled step, else the
   * first step. This replaces the old hover popover with always-visible status.
   */
  const settledKeys = stepEntries
    .map(([key]) => key)
    .filter(key => ['done', 'warn', 'failed'].includes(steps[key] ?? 'pending'))
  const lastSettledKey = settledKeys[settledKeys.length - 1]
  const activeKey =
    currentStepKey ?? lastSettledKey ?? stepEntries[0]?.[0] ?? ''
  const activeIndex = Math.max(
    0,
    stepEntries.findIndex(([key]) => key === activeKey)
  )
  const activeLabel = stepLabels[activeKey] ?? activeKey
  const activeState = steps[activeKey] ?? 'pending'
  const activeDetails = stepDetails[activeKey] ?? []
  const showPrecheckSummary =
    activeKey === 'precheck' &&
    duplicatesChecked &&
    (activeState === 'warn' || activeState === 'done')

  const stepperStyle = {
    '--step-count': stepEntries.length,
    '--connector-progress': `${connectorProgress}%`,
    '--active-index': activeIndex
  } as CSSProperties

  return (
    <div className="rounded-lg border border-slate-200 bg-linear-to-br from-card via-card to-muted/20 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-slate-700/80">
      <div style={stepperStyle}>
        <div
          className="relative grid grid-cols-1 gap-2 md:grid-cols-[repeat(var(--step-count),minmax(7rem,1fr))] md:gap-0"
          role="list"
          aria-label={t('leads.convert.progress')}>
          <div
            aria-hidden
            className="pointer-events-none absolute left-[calc(100%/(var(--step-count)*2))] right-[calc(100%/(var(--step-count)*2))] top-4 z-0 hidden h-1 rounded-full bg-border/80 shadow-inner md:block">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-500 via-teal-500 to-sky-500 transition-[width] duration-500 ease-out"
              style={{ width: 'var(--connector-progress)' }} />
          </div>
          {stepEntries.map(([key, label]) => {
            const state = steps[key] ?? 'pending'
            const isActive = activeKey === key

            return (
              <div
                key={key}
                role="listitem"
                aria-current={currentStepKey === key ? 'step' : undefined}
                aria-label={`${label}: ${t(`leads.convert.stepState.${state}`, { defaultValue: state })}`}
                className={cn(
                  'relative z-10 flex min-w-0 items-center gap-3 rounded-md border border-border/60 bg-background/80 px-3 py-2 text-xs md:min-h-14 md:flex-col md:gap-1.5 md:rounded-none md:border-0 md:bg-transparent md:px-2 md:py-0 md:text-center',
                  isActive &&
                  'border-primary/60 bg-primary/[0.05] md:bg-transparent'
                )}>
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm ring-4 ring-card transition-transform',
                    isActive && 'md:scale-110',
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
                    'border-border bg-muted text-muted-foreground'
                  )}>
                  {getStepIcon(state)}
                </div>
                <div className="min-w-0 md:w-full">
                  <span
                    className={cn(
                      'block truncate font-medium',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                    {label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Inline status strip — always visible, pointed at the active step. */}
        <div className="relative mt-2.5">
          <div
            aria-hidden
            className="absolute -top-1 hidden size-2.5 -translate-x-1/2 rotate-45 bg-muted/60 md:block"
            style={{
              left: 'calc((var(--active-index) + 0.5) * (100% / var(--step-count)))'
            }} />
          <div
            className="rounded-md bg-muted/50 px-3 py-2"
            role="status"
            aria-live="polite"
            aria-label={activeLabel}>
            {showPrecheckSummary ? (
              <LeadConvertPrecheckTooltip summary={precheckSummary} />
            ) : activeDetails.length > 0 ? (
              <ul className="space-y-1.5">
                {activeDetails.map((detail, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-1.5 text-xs leading-snug">
                    {renderDetailIcon(detail.tone)}
                    <span className="text-foreground/90">{detail.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {activeState === 'pending' ? (
                  <>
                    <Circle className="size-3" />
                    <span>{t('leads.convert.state.notStarted')}</span>
                  </>
                ) : activeState === 'running' ? (
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
          </div>
        </div>
      </div>
    </div>
  )
}
