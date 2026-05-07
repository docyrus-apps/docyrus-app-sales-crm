'use client'

import { useMemo } from 'react'

import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { type ImportResultPayload } from './types'

interface ProgressStepProps {
  isImporting: boolean
  importError: Error | null
  result: ImportResultPayload | null
  /** Sub-status string surfaced while importing (e.g. "Resolving relations…"). */
  subStatus?: string | null
}

function extractErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const candidate = (error as { message?: unknown }).message

  return typeof candidate === 'string' && candidate.length > 0
    ? candidate
    : null
}

interface ResultStat {
  key: string
  label: string
  value: number
  variant: 'success' | 'warning' | 'destructive' | 'info'
  icon: typeof CheckCircle2
}

export function ProgressStep({
  isImporting,
  importError,
  result,
  subStatus,
}: ProgressStepProps) {
  const { t } = useUiTranslation()

  const stats = useMemo<ReadonlyArray<ResultStat>>(() => {
    if (!result) return []

    const duplicateCount = Object.values(result.duplicates ?? {}).reduce(
      (sum, list) => sum + list.length,
      0,
    )

    return [
      {
        key: 'success',
        label: t('ui.dataImportWizard.result.success', 'Successful records'),
        value: result.totalSuccessfulRecords ?? 0,
        variant: 'success',
        icon: CheckCircle2,
      },
      {
        key: 'warnings',
        label: t('ui.dataImportWizard.result.warnings', 'Warnings'),
        value: result.totalWarningRecords ?? 0,
        variant: 'warning',
        icon: AlertTriangle,
      },
      {
        key: 'duplicates',
        label: t('ui.dataImportWizard.result.duplicates', 'Duplicates'),
        value: duplicateCount,
        variant: 'info',
        icon: Copy,
      },
      {
        key: 'errors',
        label: t('ui.dataImportWizard.result.errors', 'Errors'),
        value: result.error?.length ?? 0,
        variant: 'destructive',
        icon: AlertOctagon,
      },
    ]
  }, [result, t])

  if (isImporting || (!result && !importError)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">
            {t('ui.dataImportWizard.progress.importing', 'Importing records…')}
          </p>
          <p className="text-sm text-muted-foreground">
            {subStatus ??
              t(
                'ui.dataImportWizard.progress.dontClose',
                'This usually takes a few seconds. Keep this dialog open while we finish.',
              )}
          </p>
        </div>
      </div>
    )
  }

  if (importError && !result) {
    return (
      <div className="flex flex-col gap-4">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertOctagon className="mt-0.5 size-5 shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {t('ui.dataImportWizard.result.failed', 'Import failed')}
            </span>
            <span className="text-destructive/90">{importError.message}</span>
          </div>
        </div>
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3',
              stat.variant === 'success' &&
                'border-emerald-500/40 bg-emerald-500/5',
              stat.variant === 'warning' &&
                'border-amber-500/40 bg-amber-500/5',
              stat.variant === 'destructive' &&
                stat.value > 0 &&
                'border-destructive/40 bg-destructive/10',
              stat.variant === 'info' && 'bg-card',
            )}
          >
            <stat.icon
              className={cn(
                'size-5',
                stat.variant === 'success' &&
                  'text-emerald-600 dark:text-emerald-400',
                stat.variant === 'warning' &&
                  'text-amber-600 dark:text-amber-400',
                stat.variant === 'destructive' &&
                  stat.value > 0 &&
                  'text-destructive',
                stat.variant === 'info' && 'text-muted-foreground',
              )}
            />
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </span>
              <span className="text-2xl font-semibold text-foreground">
                {stat.value.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {result.duplicates && Object.keys(result.duplicates).length > 0 && (
        <div className="rounded-lg border bg-card p-3">
          <p className="text-sm font-medium text-foreground">
            {t(
              'ui.dataImportWizard.result.duplicateValuesHeading',
              'Duplicate values in the source file',
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(
              'ui.dataImportWizard.result.duplicateValuesHint',
              'Same value appeared more than once for a unique field. Records still imported.',
            )}
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {Object.entries(result.duplicates).map(([slug, values]) => (
              <div key={slug} className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {slug}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {values.slice(0, 8).join(', ')}
                  {values.length > 8 && ` (+${values.length - 8})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.error && result.error.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm font-medium text-destructive">
            {t(
              'ui.dataImportWizard.result.errorsHeading',
              'Errors during insert',
            )}
          </p>
          <ScrollArea className="mt-2 max-h-48">
            <ul className="space-y-1 pr-3 text-xs text-destructive/90">
              {result.error.map((entry, idx) => {
                const detail = extractErrorMessage(entry.error)

                return (
                  <li
                    key={`err-${idx}`}
                    className="rounded border border-destructive/30 bg-destructive/10 px-2 py-1"
                  >
                    <span className="font-medium">{entry.label}</span>
                    {detail && (
                      <span className="ml-2 text-destructive">{detail}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
