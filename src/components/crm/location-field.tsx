import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Check, Loader2, Search, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useEnumEntities } from '@/hooks/use-enums'

interface LocationFieldProps {
  record: Record<string, unknown>
  onSave: (patch: {
    country: string | null
    city: string | null
  }) => void | Promise<void>
}

interface CountryOption {
  id: string
  name: string
}

function refId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'object' && 'id' in value) {
    return (value as { id?: string }).id ?? null
  }

  return typeof value === 'string' ? value : null
}

/** Diacritic- + case-insensitive so "Turkiye" matches "Türkiye". */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * Single "Location" attribute: a searchable country picker + a free-text city.
 * Countries come from the tenant's `country` reference enum (`useEnumEntities`)
 * — the same populated source the create dialogs and Deal detail use — so the
 * saved value (the option id) stays consistent with existing records. Saves
 * `{ country: id|null, city: text|null }`.
 */
export function LocationField({ record, onSave }: LocationFieldProps) {
  const { t } = useTranslation()
  const { data: countryEntities = [], isLoading } = useEnumEntities('country')

  const options = useMemo<Array<CountryOption>>(
    () =>
      countryEntities.map((entity) => ({ id: entity.id, name: entity.name })),
    [countryEntities],
  )

  const currentId = refId(record.country)
  const currentName =
    options.find((option) => option.id === currentId)?.name ??
    (record.country && typeof record.country === 'object'
      ? (record.country as { name?: string }).name
      : undefined) ??
    currentId ??
    undefined
  const initialCity = typeof record.city === 'string' ? record.city : ''

  const [open, setOpen] = useState(false)
  const [countryId, setCountryId] = useState<string | null>(currentId)
  const [city, setCity] = useState(initialCity)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = normalize(query.trim())

    if (!q) return options

    return options.filter((option) => normalize(option.name).includes(q))
  }, [options, query])

  const selectedName =
    options.find((option) => option.id === countryId)?.name ??
    currentName ??
    countryId ??
    ''
  const display = [initialCity, currentName].filter(Boolean).join(', ')

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ country: countryId, city: city.trim() || null })
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
          setCountryId(currentId)
          setCity(initialCity)
          setQuery('')
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-1.5 truncate rounded-md px-1 py-0.5 text-left text-[13px] transition-colors hover:bg-muted/50"
        >
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
          {countryId ? (
            <div className="flex items-center justify-between gap-2 rounded-md border px-2 py-1">
              <span className="truncate text-[13px]">{selectedName}</span>
              <button
                type="button"
                aria-label={t('common.clear', { defaultValue: 'Clear' })}
                onClick={() => setCountryId(null)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('leads.form.countryPlaceholder', {
                    defaultValue: 'Search country…',
                  })}
                  className="h-8 pl-8 text-[13px]"
                  autoFocus
                />
              </div>
              <div className="max-h-44 overflow-auto rounded-md border">
                {filtered.length > 0 ? (
                  filtered.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCountryId(option.id)}
                      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-muted/60"
                    >
                      <Check
                        className={cn(
                          'size-3.5 shrink-0',
                          countryId === option.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="truncate">{option.name}</span>
                    </button>
                  ))
                ) : isLoading ? (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                  </div>
                ) : (
                  <p className="py-3 text-center text-[13px] text-muted-foreground">
                    {t('common.noResults', { defaultValue: 'No results' })}
                  </p>
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
            onChange={(event) => setCity(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleSave()
              }
            }}
            placeholder={t('companies.city', { defaultValue: 'City' })}
            className="h-8 text-[13px]"
          />
        </div>

        <div className="flex justify-end gap-1.5 pt-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={() => setOpen(false)}
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 gap-1.5"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {t('common.save', { defaultValue: 'Save' })}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
