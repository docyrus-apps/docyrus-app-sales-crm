'use client'

import { Calendar } from 'lucide-react'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { shouldRenderEnumOptionChip } from '../form-fields/lib/enum-option-display'
import { getEnumBadgeColors } from '../form-fields/lib/utils'
import { extractEnumId, extractEnumLabel, getCompanionValue } from './utils'
import { type DocyrusValueProps } from './types'

export function StatusValue({
  field,
  value,
  record,
  enumOptions,
  className,
}: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  const primaryId = extractEnumId(value)
  const primaryOption =
    primaryId != null ? enumOptions?.find((o) => o.id === primaryId) : undefined
  const secondaryId = getCompanionValue(record, field.slug, 'secondary')
  const secondaryOption =
    secondaryId && enumOptions
      ? enumOptions.find((o) => o.id === secondaryId)
      : null
  const description = getCompanionValue(record, field.slug, 'description')
  const followupDate = getCompanionValue(record, field.slug, 'followup_date')

  const primaryColors = primaryOption
    ? getEnumBadgeColors(primaryOption.color)
    : {}
  const primaryFallback =
    extractEnumLabel(value) ??
    (primaryId != null ? String(primaryId) : String(value))

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 flex-wrap', className)}
    >
      {primaryOption ? (
        <Badge
          variant="secondary"
          className={cn(
            shouldRenderEnumOptionChip(primaryOption) && 'rounded-md',
            primaryColors.className,
          )}
          style={primaryColors.style}
        >
          {primaryOption.icon && (
            <DocyrusIcon
              icon={primaryOption.icon}
              className="size-3.5 shrink-0"
            />
          )}
          <span className="truncate">{primaryOption.name}</span>
        </Badge>
      ) : (
        <Badge variant="secondary">
          <span className="truncate">{primaryFallback}</span>
        </Badge>
      )}
      {secondaryOption && (
        <Badge
          variant="outline"
          className={cn(
            shouldRenderEnumOptionChip(secondaryOption) && 'rounded-md',
          )}
        >
          {secondaryOption.icon && (
            <DocyrusIcon
              icon={secondaryOption.icon}
              className="size-3.5 shrink-0"
            />
          )}
          <span className="truncate">{secondaryOption.name}</span>
        </Badge>
      )}
      {typeof description === 'string' && description && (
        <span className="text-muted-foreground truncate text-xs">
          {description}
        </span>
      )}
      {typeof followupDate === 'string' && followupDate && (
        <span className="text-muted-foreground inline-flex items-center gap-0.5 text-xs">
          <Calendar className="size-3" />
          {followupDate}
        </span>
      )}
    </span>
  )
}
