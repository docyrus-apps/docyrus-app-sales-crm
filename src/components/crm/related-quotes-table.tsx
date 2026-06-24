import { useMemo, useState } from 'react'

import { CalendarClock, FileText, Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDateFormat } from '@/lib/use-date-format'

export interface RelatedQuote {
  id?: string;
  status?: { name?: string } | string;
  grand_total?: number;
  created_on?: string;
}

export interface RelatedQuotesTableProps {
  quotes: Array<RelatedQuote>;
  isLoading?: boolean;
  emptyLabel?: string;
  onOpenQuote: (id: string) => void;
  onNewQuote?: () => void;
}

const GRID_COLS =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]'

function statusName(status: RelatedQuote['status']): string | undefined {
  if (typeof status === 'string') return status || undefined

  return status?.name
}

export function RelatedQuotesTable({
  quotes,
  isLoading,
  emptyLabel,
  onOpenQuote,
  onNewQuote
}: RelatedQuotesTableProps) {
  const { t } = useTranslation()
  const { formatDate } = useDateFormat()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return quotes

    return quotes.filter((quote) => {
      const haystack = [quote.id, statusName(quote.status)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [quotes, query])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('common.search', 'Search…')}
            className="h-8 border-none bg-muted/50 pl-8 text-[13px] shadow-none focus-visible:ring-1" />
        </div>
        {onNewQuote && (
          <Button size="sm" className="h-8 gap-1.5" onClick={onNewQuote}>
            <Plus className="size-3.5" />
            {t('quotes.newQuote', 'New quote')}
          </Button>
        )}
      </div>

      {/* Header */}
      <div
        className={cn(
          GRID_COLS,
          'px-4 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70'
        )}>
        <span>{t('quotes.columnQuote', 'Quote')}</span>
        <span>{t('quotes.status', 'Status')}</span>
        <span>{t('quotes.total', 'Total')}</span>
        <span className="max-sm:hidden">{t('quotes.date', 'Date')}</span>
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
              <FileText className="size-5" />
            </div>
            <p className="text-[13px] text-muted-foreground">
              {query
                ? t('common.noResults', 'No results')
                : (emptyLabel ?? t('quotes.relatedEmpty', 'No quotes yet'))}
            </p>
            {!query && onNewQuote && (
              <Button size="sm" variant="outline" onClick={onNewQuote}>
                <Plus className="mr-1.5 size-3.5" />
                {t('quotes.newQuote', 'New quote')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((quote) => {
              const total =
                typeof quote.grand_total === 'number'
                  ? quote.grand_total.toLocaleString()
                  : '—'
              const created = quote.created_on
                ? formatDate(quote.created_on)
                : '—'

              return (
                <div
                  key={quote.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => quote.id && onOpenQuote(quote.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && quote.id) onOpenQuote(quote.id)
                  }}
                  className={cn(
                    GRID_COLS,
                    'group cursor-pointer rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60'
                  )}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <FileText className="size-3.5" />
                    </span>
                    <span className="truncate font-medium">
                      {quote.id ?? '—'}
                    </span>
                  </div>
                  <span className="truncate">
                    {statusName(quote.status) ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {statusName(quote.status)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                  <span className="truncate tabular-nums text-muted-foreground">
                    {total}
                  </span>
                  <span className="flex items-center gap-1 truncate text-muted-foreground max-sm:hidden">
                    {created !== '—' && (
                      <CalendarClock className="size-3.5 shrink-0" />
                    )}
                    {created}
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
