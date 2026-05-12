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
import { Progress } from '@/components/ui/progress'
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
  progress: number
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
  progress,
  steps,
  stepDetails,
  stepLabels,
  currentStepKey,
  duplicatesChecked,
  precheckSummary,
}: LeadConvertProgressProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('leads.convert.progress')}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress
        value={progress}
        className="bg-muted/60 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-sky-400 [&_[data-slot=progress-indicator]]:via-teal-400 [&_[data-slot=progress-indicator]]:to-emerald-500"
      />
      <TooltipProvider delayDuration={200}>
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6"
          role="list"
          aria-label={t('leads.convert.progress')}
        >
          {Object.entries(stepLabels).map(([key, label]) => {
            const state = steps[key] ?? 'pending'
            const details = stepDetails[key] ?? []
            const hasDetails = details.length > 0

            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div
                    role="listitem"
                    tabIndex={0}
                    aria-current={currentStepKey === key ? 'step' : undefined}
                    aria-label={`${label}: ${t(`leads.convert.stepState.${state}`, { defaultValue: state })}`}
                    className={cn(
                      'flex min-w-0 items-center gap-2 rounded-md border px-2 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      hasDetails && 'cursor-help',
                      currentStepKey === key && 'border-primary/60',
                    )}
                  >
                    {getStepIcon(state)}
                    <span className="truncate">{label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={6}
                  className="min-w-[260px] max-w-md border border-border bg-popover p-3 text-popover-foreground shadow-lg [&_svg]:shrink-0"
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
