import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

import { cn } from '@/lib/utils'

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

interface LeadConvertPrecheckTooltipProps {
  summary: PrecheckSummary;
}

export function LeadConvertPrecheckTooltip({
  summary
}: LeadConvertPrecheckTooltipProps) {
  const { t } = useTranslation()
  const targets = [
    {
      key: 'company' as const,
      label: t('leads.convert.target.company', { defaultValue: 'Company' })
    },
    {
      key: 'contact' as const,
      label: t('leads.convert.target.contact', { defaultValue: 'Contact' })
    },
    {
      key: 'deal' as const,
      label: t('leads.convert.target.deal', { defaultValue: 'Deal' })
    }
  ]

  /*
   * Only surface targets that were actually checked; collapse the all-clean
   * case to a single line and call out only the ones that need attention.
   */
  const checked = targets.filter(tm => summary[tm.key].status !== 'unchecked')
  const issues = checked.filter(
    tm => summary[tm.key].status === 'matches' ||
      summary[tm.key].status === 'exact'
  )
  const cleanLabels = checked
    .filter(tm => summary[tm.key].status === 'clean')
    .map(tm => tm.label)

  return (
    <div className="space-y-1 text-[11px]">
      <div className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="size-3.5 shrink-0" />
        <span>
          {t('leads.convert.precheckStatus.requiredFilled', {
            defaultValue: 'Required fields filled'
          })}
        </span>
      </div>

      {issues.length === 0 ? (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
          <span>
            {t('leads.convert.precheckStatus.noDuplicates', {
              defaultValue: 'No duplicate records found'
            })}
          </span>
        </div>
      ) : (
        <div className="space-y-0.5">
          {issues.map((tm) => {
            const summaryForTarget = summary[tm.key]
            const isExact = summaryForTarget.status === 'exact'

            return (
              <div key={tm.key} className="flex min-w-0 items-center gap-1.5">
                {isExact ? (
                  <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
                ) : (
                  <Info className="size-3.5 shrink-0 text-sky-600" />
                )}
                <span
                  className={cn(
                    'shrink-0 font-medium',
                    isExact
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-sky-700 dark:text-sky-300'
                  )}>
                  {tm.label}:
                </span>
                <span className="shrink-0 text-foreground/90">
                  {isExact
                    ? t('leads.convert.precheckStatus.exact', {
                        count: summaryForTarget.count,
                        defaultValue: '{{count}} match(es)'
                      })
                    : t('leads.convert.precheckStatus.matches', {
                        count: summaryForTarget.count,
                        defaultValue: '{{count}} suggestion(s)'
                      })}
                </span>
                {summaryForTarget.exactName ? (
                  <span className="truncate text-muted-foreground">
                    · {summaryForTarget.exactName}
                  </span>
                ) : null}
              </div>
            )
          })}
          {cleanLabels.length > 0 ? (
            <div className="text-muted-foreground">
              {t('leads.convert.precheckStatus.othersClean', {
                targets: cleanLabels.join(', '),
                defaultValue: '{{targets}} clean'
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
