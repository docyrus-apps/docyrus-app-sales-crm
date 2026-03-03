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

export function formatDateRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

  return `${fmt.format(start)} – ${fmt.format(end)}`
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return ''
  try {
    const [h, m] = value.split(':')
    const date = new Date()

    date.setHours(Number(h), Number(m), 0)

    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
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
