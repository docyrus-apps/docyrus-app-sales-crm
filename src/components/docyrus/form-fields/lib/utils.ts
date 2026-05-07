'use client'

import { type CSSProperties } from 'react'

import { type IFieldType, type EnumOption } from '../types'

/** Flatten nested options into an ordered list with depth info for tree rendering. */
export function flattenNestedOptions(
  options: EnumOption[],
  nestedByProp: string,
): Array<{ option: EnumOption; depth: number }> {
  const optionIds = new Set(options.map((o) => o.id))
  const childrenMap = new Map<string, EnumOption[]>()
  const roots: EnumOption[] = []

  for (const option of options) {
    const parentId = (option as unknown as Record<string, unknown>)[
      nestedByProp
    ] as string | undefined

    if (parentId && optionIds.has(parentId)) {
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, [])
      }
      childrenMap.get(parentId)?.push(option)
    } else {
      roots.push(option)
    }
  }

  const result: Array<{ option: EnumOption; depth: number }> = []

  function traverse(items: EnumOption[], depth: number) {
    for (const item of items) {
      result.push({ option: item, depth })
      const children = childrenMap.get(item.id)

      if (children) {
        traverse(children, depth + 1)
      }
    }
  }

  traverse(roots, 0)

  return result
}

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

/** Convert a Date to a timezone-safe date-only string (YYYY-MM-DD). */
export function toLocalDateString(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}`
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

const TAILWIND_COLORS = new Set([
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
])

export interface EnumColorResult {
  className?: string
  style?: CSSProperties
}

/**
 * Parse a color string (hex, rgb, oklch) into [r, g, b] (0–255).
 * Returns null if the format is not recognized.
 */
function parseColorToRgb(color: string): [number, number, number] | null {
  const trimmed = color.trim()

  const hexMatch = trimmed.match(/^#([0-9a-f]{3,8})$/i)

  if (hexMatch?.[1]) {
    let hex: string = hexMatch[1]

    if (hex.length === 3)
      hex =
        (hex[0] ?? '') +
        (hex[0] ?? '') +
        (hex[1] ?? '') +
        (hex[1] ?? '') +
        (hex[2] ?? '') +
        (hex[2] ?? '')
    if (hex.length >= 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ]
    }
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})/,
  )

  if (rgbMatch?.[1] && rgbMatch[2] && rgbMatch[3]) {
    return [
      Math.min(255, Number(rgbMatch[1])),
      Math.min(255, Number(rgbMatch[2])),
      Math.min(255, Number(rgbMatch[3])),
    ]
  }

  const oklchMatch = trimmed.match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/,
  )

  if (oklchMatch?.[1] && oklchMatch[2] && oklchMatch[3]) {
    const l = oklchMatch[1].endsWith('%')
      ? parseFloat(oklchMatch[1]) / 100
      : parseFloat(oklchMatch[1])
    const c = parseFloat(oklchMatch[2])
    const h = parseFloat(oklchMatch[3]) * (Math.PI / 180)

    const a = c * Math.cos(h)
    const b = c * Math.sin(h)

    const l_ = l + 0.3963377774 * a + 0.2158037573 * b
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b
    const s_ = l - 0.0894841775 * a - 1.291485548 * b

    const lr = l_ * l_ * l_
    const mr = m_ * m_ * m_
    const sr = s_ * s_ * s_

    const gammaCorrect = (v: number) => {
      const clamped = Math.max(0, Math.min(1, v))

      return Math.round(
        (clamped <= 0.0031308
          ? 12.92 * clamped
          : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255,
      )
    }

    const rLinear = 4.0767416621 * lr - 3.3077115913 * mr + 0.2309699292 * sr
    const gLinear = -1.2684380046 * lr + 2.6097574011 * mr - 0.3413193965 * sr
    const bLinear = -0.0041960863 * lr - 0.7034186147 * mr + 1.707614701 * sr

    return [gammaCorrect(rLinear), gammaCorrect(gLinear), gammaCorrect(bLinear)]
  }

  return null
}

/**
 * Compute relative luminance from [r, g, b] (0–255).
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const mapped = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  )

  return (
    0.2126 * (mapped[0] ?? 0) +
    0.7152 * (mapped[1] ?? 0) +
    0.0722 * (mapped[2] ?? 0)
  )
}

/**
 * Returns true if the given [r, g, b] color is perceived as "dark",
 * meaning white text should be placed on it.
 */
function isDarkColor(r: number, g: number, b: number): boolean {
  return relativeLuminance(r, g, b) < 0.4
}

/**
 * Build badge-style colors from an enum option color string.
 *
 * Supports:
 * - Tailwind color names: `"blue"`, `"red-500"`, `"emerald-300"`
 * - Hex: `"#3b82f6"`, `"#f00"`
 * - RGB: `"rgb(59, 130, 246)"`, `"rgba(59, 130, 246, 1)"`
 * - OKLCH: `"oklch(0.7 0.15 250)"`
 *
 * For Tailwind colors, returns `className` with Tailwind utility classes.
 * For other formats, returns `style` with computed bg (12% opacity) and
 * contrasting text color.
 */
export function getEnumBadgeColors(color: string | undefined): EnumColorResult {
  if (!color) return {}
  const normalized = color.trim().toLowerCase()

  const withTone = normalized.match(/^([a-z]+)-(\d+)$/)

  if (withTone) {
    const [, name, toneStr] = withTone

    if (name && TAILWIND_COLORS.has(name)) {
      const tone = parseInt(toneStr ?? '0', 10)

      if (tone < 500) {
        return {
          className: `bg-${name}-200 text-${name}-800 dark:bg-${name}-800 dark:text-${name}-200`,
        }
      }

      return {
        className: `bg-${name}-600 text-${name}-50 dark:bg-${name}-400 dark:text-${name}-950`,
      }
    }
  }

  if (TAILWIND_COLORS.has(normalized)) {
    return {
      className: `bg-${normalized}-200 text-${normalized}-800 dark:bg-${normalized}-800 dark:text-${normalized}-200`,
    }
  }

  const rgb = parseColorToRgb(color)

  if (rgb) {
    const [r, g, b] = rgb
    const textColor = isDarkColor(r, g, b)
      ? `rgb(${Math.min(255, r + 140)}, ${Math.min(255, g + 140)}, ${Math.min(255, b + 140)})`
      : `rgb(${Math.max(0, r - 100)}, ${Math.max(0, g - 100)}, ${Math.max(0, b - 100)})`

    return {
      style: {
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
        color: textColor,
        borderColor: `rgba(${r}, ${g}, ${b}, 0.25)`,
      },
    }
  }

  return {}
}

/**
 * Build inline style for a small color dot/swatch from an enum option color.
 * Returns a `backgroundColor` style for hex/rgb/oklch values, or empty for
 * Tailwind colors (which should use className-based rendering).
 */
export function getEnumDotStyle(
  color: string | undefined,
): CSSProperties | undefined {
  if (!color) return undefined

  const normalized = color.trim().toLowerCase()

  const withTone = normalized.match(/^([a-z]+)-(\d+)$/)

  if (withTone?.[1] && TAILWIND_COLORS.has(withTone[1])) {
    return undefined // handled via className
  }

  if (TAILWIND_COLORS.has(normalized)) {
    return undefined // handled via className
  }

  return { backgroundColor: color }
}

/**
 * Build Tailwind className for a small color dot based on Tailwind color name.
 */
export function getEnumDotClassName(color: string | undefined): string {
  if (!color) return ''
  const normalized = color.trim().toLowerCase()

  const withTone = normalized.match(/^([a-z]+)-(\d+)$/)

  if (withTone?.[1] && TAILWIND_COLORS.has(withTone[1])) {
    return `bg-${withTone[1]}-${withTone[2]}`
  }

  if (TAILWIND_COLORS.has(normalized)) {
    return `bg-${normalized}-500`
  }

  return ''
}

/**
 * Returns Tailwind className + inline style to color an icon or text
 * based on an enum option color. Uses `text-{color}-500` for Tailwind
 * names and inline `color` for hex/rgb/oklch.
 */
export function getEnumIconColor(color: string | undefined): {
  className?: string
  style?: CSSProperties
} {
  if (!color) return {}
  const normalized = color.trim().toLowerCase()

  const withTone = normalized.match(/^([a-z]+)-(\d+)$/)

  if (withTone?.[1] && TAILWIND_COLORS.has(withTone[1])) {
    return { className: `text-${withTone[1]}-${withTone[2]}` }
  }

  if (TAILWIND_COLORS.has(normalized)) {
    return { className: `text-${normalized}-500` }
  }

  const rgb = parseColorToRgb(color)

  if (rgb) {
    return { style: { color: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` } }
  }

  return {}
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
