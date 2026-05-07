export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function getCurrencySymbol(code: string): string {
  try {
    return (
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol',
      })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? code
    )
  } catch {
    return code
  }
}

export function formatMoney(
  amount: number | null | undefined,
  currency: string = 'USD',
): string {
  if (amount == null || Number.isNaN(amount)) return ''
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function getCompanionFieldSlug(
  fieldSlug: string,
  suffix: string,
): string {
  return `__${fieldSlug}_${suffix}`
}

export function getCompanionValue(
  record: Record<string, unknown> | undefined,
  fieldSlug: string,
  suffix: string,
): unknown {
  if (!record) return undefined

  return record[getCompanionFieldSlug(fieldSlug, suffix)]
}

export function parseDateRange(
  value: string | null | undefined,
): { start: Date; end: Date } | null {
  if (!value) return null
  const match = value.match(/[[(](.*?),(.*?)[\])]/)

  if (!match) return null
  const start = new Date(match[1]?.trim() ?? '')
  const end = new Date(match[2]?.trim() ?? '')

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

  return { start, end }
}

export function formatDateRange(
  start: Date,
  end: Date,
  formatDate?: (value: unknown) => string,
): string {
  const fmt =
    formatDate ??
    ((value: unknown) => {
      if (value instanceof Date) return value.toISOString()

      return value == null ? '' : String(value)
    })

  return `${fmt(start)} – ${fmt(end)}`
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return ''
  try {
    const [h, m] = value.split(':')
    const date = new Date()

    date.setHours(Number(h), Number(m), 0)

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch {
    return value
  }
}

export function formatPhoneDisplay(
  phone: string | null | undefined,
  countryCode: string | null | undefined,
): string {
  if (!phone) return ''
  if (countryCode) return `${countryCode} ${phone}`

  return phone
}

/**
 * Normalize a value to a primitive identifier suitable for `enumOptions` lookup.
 *
 * The Docyrus items endpoint expands enum-backed fields (status, enum,
 * select, ...) to `{ id, name, ... }` objects. Renderers that key options
 * off `option.id === value` need just the id back. Pass-through for
 * primitives.
 */
export function extractEnumId(value: unknown): string | number | null {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'object' && 'id' in value) {
    const { id } = value as { id?: unknown }

    if (typeof id === 'string' || typeof id === 'number') return id
  }

  return null
}

/**
 * Best-effort label extraction from an expanded enum/relation object:
 * `name` → `label` → `title` → `display_name` / `displayName`.
 * Used as a final fallback when no matching option is found in `enumOptions`.
 */
export function extractEnumLabel(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const candidates = [
    record.name,
    record.label,
    record.title,
    record.display_name,
    record.displayName,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) return candidate
  }

  return null
}
