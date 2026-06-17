'use client'

import { useCallback, useMemo, type ReactNode } from 'react'

import { type RestApiClient } from '@docyrus/api-client'
import { getTenantPreferences } from '@docyrus/app-utils'
import { useQuery } from '@tanstack/react-query'

import { DateFormatProvider, type DateFormatFn } from './use-date-format'

/*
 * Tenant-aware date formatting bridge.
 *
 * Without a `<DateFormatProvider>` mounted, `useDateFormat()` falls back to a
 * raw-string formatter — which renders ISO timestamps verbatim, "T" and all
 * (e.g. `2026-06-17T08:30:00Z`). Mounting this once at the app root wires clean,
 * locale-aware date/time formatting into every Docyrus UI surface that reads
 * `useDateFormat()`: data-grid cells, value renderers, form fields, filter
 * chips, etc.
 *
 * Formatting goes through `Intl.DateTimeFormat` keyed to the account locale
 * (from `getTenantPreferences`). We deliberately do NOT feed the tenant's
 * `date_format` token string into a formatter: locale-driven `Intl` output is
 * both regional (DD/MM vs MM/DD) and immune to token-dialect mismatches, and it
 * always drops the "T".
 */

function parseDateValue(value: unknown): Date | null {
  if (value == null || value === '') return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'number') {
    const fromNumber = new Date(value)

    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber
  }

  if (typeof value !== 'string') return null

  const trimmed = value.trim()

  if (!trimmed) return null

  /*
   * Date-only strings ("YYYY-MM-DD") are constructed in LOCAL time. Passing
   * them straight to `new Date()` parses as UTC midnight, which renders as the
   * previous day for users in negative-offset zones — the classic "off by one
   * day" bug.
   */
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)

  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    )
  }

  const parsed = new Date(trimmed)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function rawFallback(value: unknown): string {
  if (value == null) return ''

  return typeof value === 'string' ? value : String(value)
}

function createIntlFormatter(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat(locale, options)
  } catch {
    return new Intl.DateTimeFormat(undefined, options)
  }
}

export interface DocyrusDateFormatProviderProps {
  client: RestApiClient
  children: ReactNode
}

export function DocyrusDateFormatProvider({
  client,
  children,
}: DocyrusDateFormatProviderProps) {
  /*
   * Tenant preferences rarely change within a session, so cache them
   * aggressively. Only `locale` is consumed here; everything still renders
   * cleanly (browser locale, no "T") while the request is in flight or if it
   * fails.
   */
  const { data: preferences } = useQuery({
    queryKey: ['docyrus', 'tenantPreferences'],
    queryFn: () => getTenantPreferences(client),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })

  const locale =
    typeof preferences?.locale === 'string' && preferences.locale.length > 0
      ? preferences.locale
      : undefined

  const dateFormatter = useMemo(
    () =>
      createIntlFormatter(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    [locale],
  )

  const dateTimeFormatter = useMemo(
    () =>
      createIntlFormatter(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [locale],
  )

  const timeFormatter = useMemo(
    () =>
      createIntlFormatter(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [locale],
  )

  const formatDate = useCallback<DateFormatFn>(
    (value) => {
      const date = parseDateValue(value)

      return date ? dateFormatter.format(date) : rawFallback(value)
    },
    [dateFormatter],
  )

  const formatDateTime = useCallback<DateFormatFn>(
    (value) => {
      const date = parseDateValue(value)

      return date ? dateTimeFormatter.format(date) : rawFallback(value)
    },
    [dateTimeFormatter],
  )

  const formatTime = useCallback<DateFormatFn>(
    (value) => {
      const date = parseDateValue(value)

      return date ? timeFormatter.format(date) : rawFallback(value)
    },
    [timeFormatter],
  )

  return (
    <DateFormatProvider
      formatDate={formatDate}
      formatDateTime={formatDateTime}
      formatTime={formatTime}
    >
      {children}
    </DateFormatProvider>
  )
}
