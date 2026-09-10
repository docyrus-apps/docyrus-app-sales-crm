'use client'

// @ts-nocheck
/* eslint-disable */
import { createElement, type ReactNode } from 'react'

import { Check, Star, X } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

import { cn } from '@/lib/utils'

import {
  type CellOpts,
  type CellSelectOption,
  type CellUserOption,
  type FileCellData,
} from './types'
import { getFileIcon, getUrlHref } from './lib/data-grid'
import {
  formatDateRange,
  formatDuration,
  formatTime,
  parseDateRange,
} from './lib/utils'

const EMPTY_PLACEHOLDER = '—'

/*
 * Pulls Tailwind-500-ish neons (the default Docyrus picker palette —
 * `#22c55e`, `#a855f7`, `#ec4899`, `#3b82f6`, `#f59e0b`) toward an
 * earthy mid-tone so the small color dot reads as a handpicked print
 * swatch rather than a UI library default. Mixes the source color
 * with a warm neutral (`oklch(0.62 0.025 60)` — low chroma, warm hue)
 * in OKLab so the hue stays recognizable while saturation drops to
 * something a designer would actually pick.
 *
 * Anything already low-saturation (custom hand-picked color from the
 * tenant) ends up only slightly muted — the function works on every
 * input without a lookup table.
 */
function humanizeColor(color: string): string {
  return `color-mix(in oklab, ${color} 55%, oklch(0.62 0.025 60))`
}

/*
 * Card-view chip: every chip looks the same — neutral border, plain
 * foreground text — and the option's color appears only as a small dot
 * before the label. The previous tinted-bg-per-option approach turned
 * cards into a "designer palette" with purple/pink/cyan/yellow chips
 * across each row, which read as auto-generated AI styling. Linear,
 * Notion, Tana, and Height all converge on the dot-prefix pattern for
 * the same reason: it keeps the semantic color signal without letting
 * it dominate visual hierarchy.
 */
function ColorChip({ label, color }: { label: string; color?: string }) {
  return (
    <Badge
      variant="outline"
      className="max-w-full gap-1.5 truncate border-border/60 bg-transparent px-2 py-0.5 font-normal text-foreground/85"
    >
      {color && (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: humanizeColor(color) }}
        />
      )}
      <span className="truncate">{label}</span>
    </Badge>
  )
}

function getInitials(value: string, fallback?: string): string {
  const fallbackValue = fallback?.trim().toUpperCase()

  if (fallbackValue) return fallbackValue.slice(0, 2)

  const parts = value.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? 'U'

  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''

  return `${first}${last}`.toUpperCase() || 'U'
}

function formatNumberDisplayValue(params: {
  value: string
  variant: 'number' | 'currency' | 'percent'
  currency?: string
  decimalPrecision?: number
  thousandSeparator?: string
}): string {
  const { value, variant, currency, decimalPrecision, thousandSeparator } =
    params

  if (!value) return ''

  const parsedValue = Number(value)

  if (Number.isNaN(parsedValue)) return value

  if (variant === 'currency') {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency ?? 'USD',
        ...(decimalPrecision !== undefined
          ? {
              minimumFractionDigits: decimalPrecision,
              maximumFractionDigits: decimalPrecision,
            }
          : {}),
        ...(thousandSeparator === '' ? { useGrouping: false } : {}),
      }).format(parsedValue)
    } catch {
      return parsedValue.toFixed(decimalPrecision ?? 2)
    }
  }

  if (variant === 'percent') {
    if (decimalPrecision !== undefined)
      return `${parsedValue.toFixed(decimalPrecision)}%`

    return `${parsedValue}%`
  }

  if (decimalPrecision !== undefined || thousandSeparator !== undefined) {
    return new Intl.NumberFormat(undefined, {
      ...(decimalPrecision !== undefined
        ? {
            minimumFractionDigits: decimalPrecision,
            maximumFractionDigits: decimalPrecision,
          }
        : {}),
      ...(thousandSeparator === '' ? { useGrouping: false } : {}),
    }).format(parsedValue)
  }

  return value
}

interface DataGridCardFieldProps {
  value: unknown
  cellOpts: CellOpts | undefined
  /**
   * Tenant-aware date formatter, sourced from
   * `useDataGrid({ meta: { formatDate } })`. Falls back to the raw value
   * when not provided so existing consumers keep their behavior.
   */
  formatDate?: (value: unknown) => string
  /** Tenant-aware datetime formatter (see `formatDate`). */
  formatDateTime?: (value: unknown) => string
}

export function DataGridCardField({
  value,
  cellOpts,
  formatDate,
  formatDateTime,
}: DataGridCardFieldProps): ReactNode {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">{EMPTY_PLACEHOLDER}</span>
  }

  const variant = cellOpts?.variant

  if (!variant) {
    return <span className="break-words">{String(value)}</span>
  }

  switch (variant) {
    case 'short-text':

    case 'long-text':
      return <span className="break-words">{String(value)}</span>

    case 'email':
      return (
        <a
          href={`mailto:${String(value)}`}
          className="break-all text-primary hover:underline"
        >
          {String(value)}
        </a>
      )

    case 'phone':
      return <span className="break-words">{String(value)}</span>

    case 'url':
      return (
        <a
          href={getUrlHref(String(value))}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-primary hover:underline"
        >
          {String(value)}
        </a>
      )

    case 'number':

    case 'currency':

    case 'percent':
      return (
        <span className="break-words tabular-nums">
          {formatNumberDisplayValue({
            value: String(value),
            variant,
            currency: variant === 'currency' ? cellOpts.currency : undefined,
            decimalPrecision: cellOpts.decimalPrecision,
            thousandSeparator: cellOpts.thousandSeparator,
          })}
        </span>
      )

    case 'duration':
      return (
        <span className="break-words tabular-nums">
          {formatDuration(typeof value === 'number' ? value : Number(value))}
        </span>
      )

    case 'select':

    case 'status': {
      const options: Array<CellSelectOption> = cellOpts.options ?? []
      const option = options.find((o) => o.value === String(value))

      return (
        <ColorChip
          label={option?.label ?? String(value)}
          color={option?.color}
        />
      )
    }

    case 'enum': {
      const options: Array<CellSelectOption> = cellOpts.options ?? []
      const option = options.find((o) => o.value === String(value))

      return (
        <ColorChip
          label={option?.label ?? String(value)}
          color={option?.color}
        />
      )
    }

    case 'multi-select':

    case 'tag-select': {
      const options: Array<CellSelectOption> = cellOpts.options ?? []
      const values = Array.isArray(value) ? value : [value]

      return (
        <div className="flex flex-wrap gap-1">
          {values.slice(0, 5).map((v) => {
            const option = options.find((o) => o.value === String(v))

            return (
              <ColorChip
                key={String(v)}
                label={option?.label ?? String(v)}
                color={option?.color}
              />
            )
          })}
          {values.length > 5 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              +{values.length - 5}
            </span>
          )}
        </div>
      )
    }

    case 'user': {
      const options: Array<CellUserOption> = cellOpts.options ?? []
      const option = options.find((o) => o.value === String(value))
      const label = option?.label ?? String(value)

      return (
        <div className="flex items-center gap-2">
          <Avatar className="size-5 rounded-md">
            {option?.avatarUrl ? (
              <AvatarImage src={option.avatarUrl} alt={label} />
            ) : null}
            <AvatarFallback className="rounded-md text-[10px]">
              {getInitials(label, option?.initials)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{label}</span>
        </div>
      )
    }

    case 'user-multi-select': {
      const options: Array<CellUserOption> = cellOpts.options ?? []
      const values = Array.isArray(value) ? value : [value]

      return (
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            {values.slice(0, 4).map((v) => {
              const option = options.find((o) => o.value === String(v))
              const label = option?.label ?? String(v)

              return (
                <Avatar
                  key={String(v)}
                  className="size-5 rounded-md ring-2 ring-background"
                >
                  {option?.avatarUrl ? (
                    <AvatarImage src={option.avatarUrl} alt={label} />
                  ) : null}
                  <AvatarFallback className="rounded-md text-[10px]">
                    {getInitials(label, option?.initials)}
                  </AvatarFallback>
                </Avatar>
              )
            })}
          </div>
          {values.length > 4 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              +{values.length - 4}
            </span>
          )}
        </div>
      )
    }

    case 'checkbox':

    case 'switch':
      return value ? (
        <Check className="size-4 text-primary" />
      ) : (
        <X className="size-4 text-muted-foreground" />
      )

    case 'date':
      return (
        <span className="truncate">
          {formatDate ? formatDate(value) : String(value)}
        </span>
      )

    case 'datetime':
      return (
        <span className="truncate">
          {formatDateTime ? formatDateTime(value) : String(value)}
        </span>
      )

    case 'time':
      return <span className="truncate">{formatTime(String(value))}</span>

    case 'date-range': {
      const range = parseDateRange(String(value))

      if (!range) return <span className="break-words">{String(value)}</span>

      return (
        <span className="truncate">
          {formatDateRange(range.start, range.end, formatDate)}
        </span>
      )
    }

    case 'rating': {
      const max = cellOpts.max ?? 5
      const numValue = typeof value === 'number' ? value : Number(value)
      const filledCount = Number.isNaN(numValue) ? 0 : Math.round(numValue)

      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: max }, (_, i) => (
            <Star
              key={i}
              className={cn(
                'size-3.5',
                i < filledCount
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30',
              )}
            />
          ))}
        </div>
      )
    }

    case 'color':
      return (
        <div className="flex items-center gap-2">
          <div
            className="size-4 rounded-sm border"
            style={{ backgroundColor: String(value) }}
          />
          <span className="truncate text-xs">{String(value)}</span>
        </div>
      )

    case 'image': {
      const src = typeof value === 'string' ? value : undefined

      if (!src) return null

      return (
        <img src={src} alt="" className="h-10 w-auto rounded-sm object-cover" />
      )
    }

    case 'icon':
      return <span className="break-words">{String(value)}</span>

    case 'currency-code':
      return <span className="break-all font-mono">{String(value)}</span>

    case 'file': {
      if (Array.isArray(value)) {
        const files = value.filter(
          (item): item is FileCellData =>
            !!item && typeof item === 'object' && 'name' in item,
        )

        if (files.length === 0) return null

        return (
          <div className="flex items-center gap-1">
            {files.slice(0, 3).map((file) => {
              const FileTypeIcon = getFileIcon(file.type)

              return (
                <div key={file.id} className="flex items-center gap-1 text-xs">
                  {createElement(FileTypeIcon, {
                    className: 'size-3.5 shrink-0 text-muted-foreground',
                  })}
                  <span className="max-w-20 truncate">{file.name}</span>
                </div>
              )
            })}
            {files.length > 3 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                +{files.length - 3}
              </span>
            )}
          </div>
        )
      }

      return <span className="break-words">{String(value)}</span>
    }

    case 'relation': {
      const presentation = getRelationPresentation(value)

      if (!presentation)
        return <span className="break-words">{String(value)}</span>

      if (cellOpts.showAutonumber && presentation.autonumberId) {
        return (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="inline-block shrink-0 min-w-[1ch] font-mono text-[10px] font-medium tabular-nums text-muted-foreground/80">
              <span className="opacity-50">#</span>
              {presentation.autonumberId}
            </span>
            <ColorChip label={presentation.label} color={presentation.color} />
          </span>
        )
      }

      return <ColorChip label={presentation.label} color={presentation.color} />
    }

    default:
      return <span className="break-words">{String(value)}</span>
  }
}

function getRelationPresentation(
  value: unknown,
): { label: string; color?: string; autonumberId?: string } | null {
  if (value == null) return null

  if (typeof value === 'string' || typeof value === 'number') {
    const label = String(value).trim()

    return label ? { label } : null
  }

  if (typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const labelFields = [
    'name',
    'label',
    'title',
    'display_name',
    'displayName',
    'email',
  ]

  const rawAutonumber = record.autonumber_id
  const autonumberId =
    typeof rawAutonumber === 'string' || typeof rawAutonumber === 'number'
      ? String(rawAutonumber)
      : undefined

  for (const field of labelFields) {
    const candidate = record[field]

    if (typeof candidate === 'string' && candidate.trim()) {
      const color = typeof record.color === 'string' ? record.color : undefined

      return { label: candidate, color, autonumberId }
    }
  }

  return null
}
