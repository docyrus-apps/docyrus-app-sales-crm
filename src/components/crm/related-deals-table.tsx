import { useMemo, useState } from 'react'

import { CalendarClock, Search, Target } from 'lucide-react'

import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export interface RelatedDeal {
  id?: string;
  name?: string;
  stage?: { name?: string } | string;
  deal_value?: number;
  expected_closing_date?: string;
}

export interface RelatedDealsTableProps {
  deals: Array<RelatedDeal>;
  isLoading?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  onOpenDeal: (id: string) => void;
}

const GRID_COLS =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]'

function stageName(stage: RelatedDeal['stage']): string | undefined {
  if (typeof stage === 'string') return stage || undefined

  return stage?.name
}

export function RelatedDealsTable({
  deals,
  isLoading,
  searchPlaceholder,
  emptyLabel,
  onOpenDeal
}: RelatedDealsTableProps) {
  const { t } = useTranslation()
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? t('relatedTables.deals.search')
  const resolvedEmptyLabel = emptyLabel ?? t('relatedTables.deals.empty')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return deals

    return deals.filter((deal) => {
      const haystack = [deal.name, stageName(deal.stage)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [deals, query])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="px-4 py-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={resolvedSearchPlaceholder}
            className="h-8 border-none bg-muted/50 pl-8 text-[13px] shadow-none focus-visible:ring-1" />
        </div>
      </div>

      {/* Header */}
      <div
        className={cn(
          GRID_COLS,
          'px-4 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70'
        )}>
        <span>{t('relatedTables.deals.deal')}</span>
        <span>{t('relatedTables.deals.stage')}</span>
        <span>{t('relatedTables.deals.value')}</span>
        <span className="max-sm:hidden">
          {t('relatedTables.deals.closeDate')}
        </span>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
        {isLoading ? (
          <div className="space-y-1 px-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-11 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Target className="size-5" />
            </div>
            <p className="text-[13px] text-muted-foreground">
              {query ? t('relatedTables.deals.noMatch') : resolvedEmptyLabel}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((deal) => {
              const value =
                typeof deal.deal_value === 'number'
                  ? deal.deal_value.toLocaleString()
                  : '—'
              const close = deal.expected_closing_date
                ? new Date(deal.expected_closing_date).toLocaleDateString()
                : '—'

              return (
                <div
                  key={deal.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => deal.id && onOpenDeal(deal.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && deal.id) onOpenDeal(deal.id)
                  }}
                  className={cn(
                    GRID_COLS,
                    'group cursor-pointer rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60'
                  )}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Target className="size-3.5" />
                    </span>
                    <span className="truncate font-medium">
                      {deal.name ?? '—'}
                    </span>
                  </div>
                  <span className="truncate">
                    {stageName(deal.stage) ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {stageName(deal.stage)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                  <span className="truncate tabular-nums text-muted-foreground">
                    {value}
                  </span>
                  <span className="flex items-center gap-1 truncate text-muted-foreground max-sm:hidden">
                    {close !== '—' && (
                      <CalendarClock className="size-3.5 shrink-0" />
                    )}
                    {close}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
