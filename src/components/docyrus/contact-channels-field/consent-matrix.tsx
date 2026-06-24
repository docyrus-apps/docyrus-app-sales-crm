'use client'

// @ts-nocheck
/* eslint-disable */
import { Fragment, useMemo } from 'react'

import { type LucideIcon } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import {
  allowedMediums,
  CONSENT_MEDIUM_ICONS,
  humanizeEnum,
} from './lib/contact-channels'
import {
  DEFAULT_CONSENT_KEY,
  type ChannelType,
  type ConsentCache,
  type ConsentMedium,
  type ConsentPurpose,
  type ConsentStatus,
  type ContactBrand,
} from './types'

const STATUS_OPTIONS: ConsentStatus[] = ['opted_in', 'unknown', 'opted_out']

export interface ConsentMatrixProps {
  channelType: ChannelType
  consent: ConsentCache | undefined
  /** Brands shown as columns alongside Organization-wide. Omit for organization-wide only. */
  brands?: ContactBrand[]
  /** Cache-based change (backend-agnostic) — receives the full rebuilt cache. */
  onChange?: (next: ConsentCache) => void
  /** Per-cell change (backend) — record a single ledger entry. `medium` is `null` for the medium-agnostic row. */
  onCellChange?: (
    brandKey: string,
    medium: ConsentMedium | null,
    purpose: ConsentPurpose,
    status: ConsentStatus,
  ) => void
  disabled?: boolean
  className?: string
}

/**
 * Pivot editor for a channel's consent cache: rows are medium × purpose,
 * columns are the organization plus each brand, every cell a status select.
 * Transactional is shown medium-agnostic (`_default`); marketing / newsletter
 * are split across the mediums the channel type allows.
 */
export function ConsentMatrix({
  channelType,
  consent,
  brands,
  onChange,
  onCellChange,
  disabled,
  className,
}: ConsentMatrixProps) {
  const mediums = useMemo<ConsentMedium[]>(
    () => allowedMediums(channelType),
    [channelType],
  )

  const columns = useMemo(
    () => [
      { key: DEFAULT_CONSENT_KEY, label: 'Org-wide' },
      ...(brands ?? []).map((brand) => ({ key: brand.id, label: brand.name })),
    ],
    [brands],
  )

  const read = (
    brandKey: string,
    medium: string,
    purpose: ConsentPurpose,
  ): ConsentStatus =>
    consent?.[brandKey]?.[medium]?.[purpose]?.status ?? 'unknown'

  const write = (
    brandKey: string,
    medium: string,
    purpose: ConsentPurpose,
    status: ConsentStatus,
  ) => {
    if (onChange) {
      const next: ConsentCache = structuredClone(consent ?? {})

      next[brandKey] ??= {}
      next[brandKey][medium] ??= {}
      next[brandKey][medium][purpose] = {
        status,
        on: new Date().toISOString(),
        source: 'form',
      }

      onChange(next)
    }

    onCellChange?.(
      brandKey,
      medium === DEFAULT_CONSENT_KEY ? null : (medium as ConsentMedium),
      purpose,
      status,
    )
  }

  const rows: Array<{
    medium: string
    label: string
    icon: LucideIcon | null
    purposes: ConsentPurpose[]
  }> = [
    {
      medium: DEFAULT_CONSENT_KEY,
      label: 'Any medium',
      icon: null,
      purposes: ['transactional'],
    },
    ...mediums.map((medium) => ({
      medium,
      label: humanizeEnum(medium),
      icon: CONSENT_MEDIUM_ICONS[medium] ?? null,
      purposes: ['marketing', 'newsletter'] as ConsentPurpose[],
    })),
  ]

  return (
    <div className={cn('overflow-x-auto rounded-md border', className)}>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
              Purpose
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className="min-w-[6.5rem] px-2 py-1.5 text-left font-medium text-muted-foreground"
                title={column.label}
              >
                <span className="block max-w-[7rem] truncate">
                  {column.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const RowIcon = row.icon

            return (
              <Fragment key={row.medium}>
                <tr className="border-b bg-background">
                  <td
                    colSpan={columns.length + 1}
                    className="px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    <span className="flex items-center gap-1.5">
                      {RowIcon && <RowIcon className="size-3" />}
                      {row.label}
                    </span>
                  </td>
                </tr>
                {row.purposes.map((purpose) => (
                  <tr
                    key={`${row.medium}:${purpose}`}
                    className="border-b last:border-0"
                  >
                    <td className="px-2 py-1 text-foreground">
                      {humanizeEnum(purpose)}
                    </td>
                    {columns.map((column) => (
                      <td key={column.key} className="px-2 py-1">
                        <Select
                          value={read(column.key, row.medium, purpose)}
                          onValueChange={(next: string) =>
                            write(
                              column.key,
                              row.medium,
                              purpose,
                              next as ConsentStatus,
                            )
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-7 w-full min-w-[6rem] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option}
                                value={option}
                                className="text-xs"
                              >
                                {humanizeEnum(option)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
