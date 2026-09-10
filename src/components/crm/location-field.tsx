import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { Loader2, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { useBaseCountryCollection } from '@/collections'
import { useDebounce } from '@/hooks/use-debounce'

interface LocationFieldProps {
  record: Record<string, unknown>;
  onSave: (patch: Record<string, string | null>) => void | Promise<void>;
  /** Record field that stores the country relation id (default "country") */
  countryField?: string;
  /** Render display-only (e.g. converted/locked records) */
  readOnly?: boolean;
}

interface CountryRef {
  id: string;
  name: string;
}

function countryRef(value: unknown): CountryRef | null {
  if (!value) return null
  if (typeof value === 'object' && 'id' in value) {
    const obj = value as { id?: string; name?: string }

    return obj.id ? { id: obj.id, name: obj.name ?? obj.id } : null
  }

  if (typeof value === 'string') return { id: value, name: value }

  return null
}

/**
 * Single "Location" attribute: a country picked from the Docyrus `base/country`
 * datasource (250 seeded countries) + a free-text city. The picker searches
 * server-side via `filterKeyword` (cmdk-style, no client filtering); `country`
 * is saved as the `base/country` relation id, `city` as plain text.
 */
export function LocationField({
  record,
  onSave,
  countryField = 'country',
  readOnly
}: LocationFieldProps) {
  const { t } = useTranslation()
  const collection = useBaseCountryCollection()

  const initialCountry = countryRef(record[countryField])
  const initialCity = typeof record.city === 'string' ? record.city : ''

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<CountryRef | null>(initialCountry)
  const [city, setCity] = useState(initialCity)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  /*
   * Server-side keyword search across all 250 countries. `columns` is required
   * — without it the API returns only `id` and the names come back empty.
   */
  const { data, isFetching } = useQuery({
    queryKey: ['location-country-search', debouncedQuery],
    queryFn: () => collection.list({
        columns: ['id', 'name'],
        filterKeyword: debouncedQuery || undefined,
        limit: 50,
        orderBy: { field: 'name', direction: 'asc' }
      }),
    enabled: open && !selected,
    staleTime: 5 * 60 * 1000
  })

  const results = useMemo<Array<CountryRef>>(
    () => ((data ?? []) as Array<{ id?: unknown; name?: unknown }>).map(item => ({
        id: String(item?.id ?? ''),
        name: String(item?.name ?? '')
      })),
    [data]
  )

  const display = [initialCity, initialCountry?.name].filter(Boolean).join(', ')

  if (readOnly) {
    return display ? (
      <span className="truncate text-[13px]">{display}</span>
    ) : (
      <span className="text-muted-foreground">—</span>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        [countryField]: selected?.id ?? null,
        city: city.trim() || null
      })
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setSelected(initialCountry)
          setCity(initialCity)
          setQuery('')
        }
      }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-1.5 truncate rounded-md px-1 py-0.5 text-left text-[13px] transition-colors hover:bg-muted/50">
          {display ? (
            <span className="truncate">{display}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-2.5 p-2.5">
        {/* Country */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            {t('companies.country', { defaultValue: 'Country' })}
          </div>
          {selected ? (
            <div className="flex items-center justify-between gap-2 rounded-md border px-2 py-1">
              <span className="truncate text-[13px]">{selected.name}</span>
              <button
                type="button"
                aria-label={t('common.clear', { defaultValue: 'Clear' })}
                onClick={() => setSelected(null)}
                className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder={t('leads.form.countryPlaceholder', {
                    defaultValue: 'Search country…'
                  })}
                  className="h-8 pl-8 text-[13px]"
                  autoFocus />
              </div>
              <div className="max-h-44 overflow-auto rounded-md border">
                {isFetching ? (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                  </div>
                ) : results.length === 0 ? (
                  <p className="py-3 text-center text-[13px] text-muted-foreground">
                    {t('common.noResults', { defaultValue: 'No results' })}
                  </p>
                ) : (
                  results.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelected(option)}
                      className="flex w-full items-center px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-muted/60">
                      <span className="truncate">{option.name}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            {t('companies.city', { defaultValue: 'City' })}
          </div>
          <Input
            value={city}
            onChange={event => setCity(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleSave()
              }
            }}
            placeholder={t('companies.city', { defaultValue: 'City' })}
            className="h-8 text-[13px]" />
        </div>

        <div className="flex justify-end gap-1.5 pt-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={() => setOpen(false)}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 gap-1.5"
            disabled={saving}
            onClick={() => void handleSave()}>
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {t('common.save', { defaultValue: 'Save' })}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
