'use client'

// @ts-nocheck
/* eslint-disable */
import { type IFieldType } from '../types'

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function parseDuration(display: string): number {
  const parts = display.split(':').map(Number)

  if (parts.length === 3)
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)

  return parts[0] ?? 0
}

const symbolFormatters = new Map<string, Intl.NumberFormat>()
const moneyFormatters = new Map<string, Intl.NumberFormat>()

function getSymbolFormatter(code: string): Intl.NumberFormat {
  let fmt = symbolFormatters.get(code)

  if (!fmt) {
    fmt = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    })
    symbolFormatters.set(code, fmt)
  }

  return fmt
}

function getMoneyFormatter(code: string): Intl.NumberFormat {
  let fmt = moneyFormatters.get(code)

  if (!fmt) {
    fmt = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
    })
    moneyFormatters.set(code, fmt)
  }

  return fmt
}

export function getCurrencySymbol(code: string): string {
  try {
    return (
      getSymbolFormatter(code)
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
    return getMoneyFormatter(currency).format(amount)
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

const SINGLE_SELECT_TYPES: Array<IFieldType> = [
  'field-list',
  'field-radioGroup',
  'field-relation',
  'field-select',
  'field-status',
  'field-userSelect',
]

const MULTI_SELECT_TYPES: Array<IFieldType> = [
  'field-multiSelect',
  'field-userMultiSelect',
  'field-tagSelect',
]

const VIRTUAL_TYPES: Array<IFieldType> = [
  'field-list',
  'field-display',
  'field-formula',
  'field-taskList',
  'field-button',
]

const COMPOSITE_TYPES: Array<IFieldType> = [
  'field-phone',
  'field-money',
  'field-status',
  'field-htmlEditor',
  'field-emailEditor',
]

const READ_ONLY_TYPES: Array<IFieldType> = [
  'field-display',
  'field-formula',
  'field-relatedField',
  'field-identity',
  'field-autonumber',
]

export function isSelectField(type: IFieldType): boolean {
  return SINGLE_SELECT_TYPES.includes(type) || MULTI_SELECT_TYPES.includes(type)
}

export function isMultiSelectField(type: IFieldType): boolean {
  return MULTI_SELECT_TYPES.includes(type)
}

export function isVirtualField(type: IFieldType): boolean {
  return VIRTUAL_TYPES.includes(type)
}

export function isCompositeField(type: IFieldType): boolean {
  return COMPOSITE_TYPES.includes(type)
}

export function isReadOnlyField(type: IFieldType): boolean {
  return READ_ONLY_TYPES.includes(type)
}

export const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'ILS', name: 'Israeli Shekel' },
  { code: 'THB', name: 'Thai Baht' },
] as const
