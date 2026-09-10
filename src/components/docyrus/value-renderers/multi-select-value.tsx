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

export function MultiSelectValue({
  value,
  enumOptions,
  className,
}: DocyrusValueProps) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-muted-foreground">–</span>
  }

  const items = Array.isArray(value) ? value : [value]

  const options = items.map((item) => {
    const id = extractEnumId(item)
    const option =
      id != null ? enumOptions?.find((o) => o.id === id) : undefined

    if (option) return option

    const label =
      extractEnumLabel(item) ?? (id != null ? String(id) : String(item))

    return { id: id != null ? String(id) : String(item), name: label }
  })

  return (
    <span className={cn('inline-flex flex-wrap gap-1', className)}>
      {options.map((option) => {
        const colors =
          'color' in option
            ? getEnumBadgeColors(option.color as string | undefined)
            : {}

        return (
          <Badge
            key={option.id}
            variant="secondary"
            className={cn(
              shouldRenderEnumOptionChip(
                'icon' in option ? option : undefined,
              ) && 'rounded-md',
              colors.className,
            )}
            style={colors.style}
          >
            {'icon' in option && option.icon && (
              <DocyrusIcon icon={option.icon} className="size-3.5 shrink-0" />
            )}
            <span className="truncate">{option.name}</span>
          </Badge>
        )
      })}
    </span>
  )
}
