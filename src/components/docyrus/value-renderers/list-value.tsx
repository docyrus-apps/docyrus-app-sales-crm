'use client'

// @ts-nocheck
/* eslint-disable */
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import {
  getEnumBadgeColors,
  shouldRenderEnumOptionChip,
} from '../form-fields/lib/utils'
import { extractEnumId, extractEnumLabel } from './utils'
import { type DocyrusValueProps } from './types'

export function ListValue({
  value,
  enumOptions,
  className,
}: DocyrusValueProps) {
  if (
    value == null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return <span className="text-muted-foreground">–</span>
  }

  const id = extractEnumId(value)
  const option = id != null ? enumOptions?.find((o) => o.id === id) : undefined

  if (!option) {
    const fallback =
      extractEnumLabel(value) ?? (id != null ? String(id) : String(value))

    return (
      <span className={cn('block truncate text-sm', className)}>
        {fallback}
      </span>
    )
  }

  const colors = getEnumBadgeColors(option.color)

  return (
    <Badge
      variant="secondary"
      className={cn(
        'max-w-full',
        shouldRenderEnumOptionChip(option) && 'rounded-md',
        colors.className,
        className,
      )}
      style={colors.style}
    >
      {option.icon && (
        <DocyrusIcon icon={option.icon} className="size-3.5 shrink-0" />
      )}
      <span className="truncate">{option.name}</span>
    </Badge>
  )
}
