'use client'

// @ts-nocheck
/* eslint-disable */
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

import { type EnumOption } from '../types'

import {
  getEnumBadgeColors,
  getEnumDotClassName,
  getEnumDotStyle,
  getEnumIconColor,
  shouldRenderEnumOptionChip,
} from './utils'

interface EnumOptionDisplayProps {
  option: EnumOption
  variant?: 'auto' | 'inline' | 'chip'
  className?: string
  nameClassName?: string
}

export function EnumOptionDisplay({
  option,
  variant = 'auto',
  className,
  nameClassName,
}: EnumOptionDisplayProps) {
  const shouldRenderChip =
    variant === 'chip' ||
    (variant === 'auto' && shouldRenderEnumOptionChip(option))

  if (shouldRenderChip) {
    const colors = getEnumBadgeColors(option.color)

    return (
      <Badge
        variant="secondary"
        className={cn(
          'max-w-full gap-1.5 rounded-md px-1.5 py-0.5 font-normal',
          colors.className,
          className,
        )}
        style={colors.style}
      >
        {option.icon && (
          <DocyrusIcon icon={option.icon} className="size-3.5 shrink-0" />
        )}
        <span className={cn('truncate', nameClassName)}>{option.name}</span>
      </Badge>
    )
  }

  const iconColor = getEnumIconColor(option.color)

  return (
    <span className={cn('flex items-center gap-2', className)}>
      {option.icon ? (
        <span className={iconColor.className} style={iconColor.style}>
          <DocyrusIcon icon={option.icon} className="size-4 shrink-0" />
        </span>
      ) : option.color ? (
        <span
          className={cn(
            'size-2.5 shrink-0 rounded-full',
            getEnumDotClassName(option.color),
          )}
          style={getEnumDotStyle(option.color)}
        />
      ) : null}
      <span className={cn('truncate', nameClassName)}>{option.name}</span>
    </span>
  )
}
