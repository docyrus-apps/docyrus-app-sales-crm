import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Plus,
  UserRound
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ReuseTarget = 'company' | 'contact'
type EntityCandidate = Record<string, any> & { id?: string; name?: string }

interface LeadConvertReuseBannerProps {
  target: ReuseTarget;
  candidates: Array<EntityCandidate>;
  selectedId: string | null;
  exactId: string | null;
  isWorking: boolean;
  onSelect: (id: string | null) => void;
}

export function LeadConvertReuseBanner({
  target,
  candidates,
  selectedId,
  exactId,
  isWorking,
  onSelect
}: LeadConvertReuseBannerProps) {
  const { t } = useTranslation()

  if (candidates.length === 0) return null

  const isReuse = selectedId !== null
  const entity =
    target === 'company'
      ? t('leads.convert.reuse.entityCompany', { defaultValue: 'company' })
      : t('leads.convert.reuse.entityContact', { defaultValue: 'contact' })
  const targetIcon =
    target === 'company' ? (
      <Building2 className="size-3.5 text-sky-600" />
    ) : (
      <UserRound className="size-3.5 text-emerald-600" />
    )

  return (
    <div className="space-y-3 rounded-lg border-2 border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-amber-600" />
        <p className="text-sm font-medium">
          {t('leads.convert.reuse.headline', {
            count: candidates.length,
            entity,
            defaultValue: '{{count}} existing {{entity}} found'
          })}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isWorking}
          aria-pressed={!isReuse}
          onClick={() => onSelect(null)}
          className={cn(
            'flex flex-col items-start gap-1 rounded-md border bg-background p-2.5 text-left transition-colors',
            !isReuse
              ? 'border-primary ring-1 ring-primary'
              : 'border-border hover:border-primary/40'
          )}>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Plus className="size-3.5" />
            <span>
              {t('leads.convert.reuse.createOption', {
                entity,
                defaultValue: 'Create new {{entity}}'
              })}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t('leads.convert.reuse.createHelp', {
              defaultValue: 'A new record will be created from the lead data'
            })}
          </p>
        </button>
        <button
          type="button"
          disabled={isWorking}
          aria-pressed={isReuse}
          onClick={() => {
            const fallback = exactId ?? candidates[0]?.id ?? null

            onSelect(fallback)
          }}
          className={cn(
            'flex flex-col items-start gap-1 rounded-md border bg-background p-2.5 text-left transition-colors',
            isReuse
              ? 'border-primary ring-1 ring-primary'
              : 'border-border hover:border-primary/40'
          )}>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {targetIcon}
            <span>
              {t('leads.convert.reuse.reuseOption', {
                entity,
                defaultValue: 'Use existing {{entity}}'
              })}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t('leads.convert.reuse.reuseHelp', {
              defaultValue:
                'No new record is created — the existing one will be linked'
            })}
          </p>
        </button>
      </div>
      {isReuse ? (
        <div className="space-y-1.5 border-t border-amber-200 pt-2 dark:border-amber-900/40">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
              {t('leads.convert.reuse.pickOne', {
                defaultValue: 'Which one to use?'
              })}
            </p>
            {candidates.length > 4 ? (
              <span className="text-[10.5px] text-muted-foreground">
                {t('leads.convert.reuse.candidateCount', {
                  count: candidates.length,
                  defaultValue: '{{count}} options'
                })}
              </span>
            ) : null}
          </div>
          <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {candidates.map(candidate => (
              <button
                key={candidate.id}
                type="button"
                disabled={isWorking}
                onClick={() => onSelect(candidate.id ?? null)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-left text-xs transition-colors',
                  selectedId === candidate.id &&
                  'border-primary ring-1 ring-primary'
                )}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">
                      {candidate.name}
                    </span>
                    {exactId === candidate.id ? (
                      <Badge variant="secondary" className="h-4 text-[10px]">
                        {t('leads.convert.reuse.exactMatchBadge', {
                          defaultValue: 'Exact match'
                        })}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-muted-foreground">
                    {target === 'company'
                      ? candidate.website || candidate.email || candidate.phone
                      : candidate.email || candidate.mobile}
                  </p>
                </div>
                {selectedId === candidate.id ? (
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
