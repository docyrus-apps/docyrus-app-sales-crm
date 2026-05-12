import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleDashed,
  Info,
  UserRound,
} from 'lucide-react'

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

interface LeadConvertPrecheckTooltipProps {
  summary: PrecheckSummary
}

export function LeadConvertPrecheckTooltip({
  summary,
}: LeadConvertPrecheckTooltipProps) {
  const { t } = useTranslation()
  const targets = [
    {
      key: 'company' as const,
      icon: <Building2 className="size-3.5 text-sky-600" />,
      label: t('leads.convert.target.company', { defaultValue: 'Company' }),
    },
    {
      key: 'contact' as const,
      icon: <UserRound className="size-3.5 text-emerald-600" />,
      label: t('leads.convert.target.contact', { defaultValue: 'Contact' }),
    },
    {
      key: 'deal' as const,
      icon: <CheckCircle2 className="size-3.5 text-violet-600" />,
      label: t('leads.convert.target.deal', { defaultValue: 'Deal' }),
    },
  ]

  const renderTargetCell = (target: PrecheckTargetSummary) => {
    if (target.status === 'unchecked') {
      return (
        <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
          <CircleDashed className="size-3" />
          <span>
            {t('leads.convert.precheckStatus.unchecked', {
              defaultValue: 'Skipped',
            })}
          </span>
        </div>
      )
    }

    if (target.status === 'clean') {
      return (
        <div className="flex items-center gap-1 text-[10.5px] text-emerald-700">
          <CheckCircle2 className="size-3" />
          <span>
            {t('leads.convert.precheckStatus.clean', {
              defaultValue: 'Clean',
            })}
          </span>
        </div>
      )
    }

    if (target.status === 'exact') {
      return (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[10.5px] text-amber-700">
            <AlertTriangle className="size-3" />
            <span>
              {t('leads.convert.precheckStatus.exact', {
                count: target.count,
                defaultValue: '{{count}} match(es)',
              })}
            </span>
          </div>
          {target.exactName ? (
            <p className="truncate text-[10.5px] font-medium text-foreground">
              {target.exactName}
            </p>
          ) : null}
        </div>
      )
    }

    return (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1 text-[10.5px] text-sky-700">
          <Info className="size-3" />
          <span>
            {t('leads.convert.precheckStatus.matches', {
              count: target.count,
              defaultValue: '{{count}} suggestion(s)',
            })}
          </span>
        </div>
        {target.exactName ? (
          <p className="truncate text-[10.5px] text-muted-foreground">
            {t('leads.convert.precheckStatus.exampleMatch', {
              name: target.exactName,
              defaultValue: 'e.g. {{name}}',
            })}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2" role="group">
      <ul className="space-y-1">
        <li className="flex items-start gap-1.5 text-xs leading-snug">
          <CheckCircle2 className="mt-0.5 size-3.5 text-emerald-600" />
          <span className="text-foreground/90">
            {t('leads.convert.precheckStatus.requiredFilled', {
              defaultValue: 'Required fields filled',
            })}
          </span>
        </li>
      </ul>
      <div
        className="grid grid-cols-1 gap-1.5 border-t pt-2 sm:grid-cols-3"
        role="list"
      >
        {targets.map((targetMeta) => {
          const targetSummary = summary[targetMeta.key]
          return (
            <div
              key={targetMeta.key}
              role="listitem"
              className="rounded-md border bg-background/50 p-2"
            >
              <div className="mb-1 flex items-center gap-1 text-[11px] font-medium">
                {targetMeta.icon}
                <span>{targetMeta.label}</span>
              </div>
              {renderTargetCell(targetSummary)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
