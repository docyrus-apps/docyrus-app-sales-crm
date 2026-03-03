'use client'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { getEnumBadgeColors } from '../form-fields/lib/utils'
import { type DocyrusValueProps } from './types'

export function SelectValue({
  value,
  enumOptions,
  className,
}: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  const option = enumOptions?.find((o) => o.id === value)

  if (!option) {
    return (
      <span className={cn('truncate text-sm', className)}>{String(value)}</span>
    )
  }

  const colors = getEnumBadgeColors(option.color)

  return (
    <Badge
      variant="secondary"
      className={cn('max-w-full', colors.className, className)}
      style={colors.style}
    >
      {option.icon && (
        <DocyrusIcon icon={option.icon} className="size-3.5 shrink-0" />
      )}
      <span className="truncate">{option.name}</span>
    </Badge>
  )
}
