'use client'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { getEnumBadgeColors } from '../form-fields/lib/utils'
import { type DocyrusValueProps } from './types'

export function MultiSelectValue({
  value,
  enumOptions,
  className,
}: DocyrusValueProps) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-muted-foreground">—</span>
  }

  const ids = Array.isArray(value) ? value : [value]

  const options = ids.map((id) => {
    const option = enumOptions?.find((o) => o.id === id)

    return option ?? { id: String(id), name: String(id) }
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
            className={colors.className}
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
