'use client'

import { Check, X } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

export function CheckboxValue({ value, className }: DocyrusValueProps) {
  if (value == null) {
    return <span className="text-muted-foreground">—</span>
  }

  const checked = value === true || value === 'true' || value === 1

  return (
    <span className={cn('inline-flex items-center', className)}>
      {checked ? (
        <Check className="size-4 text-green-600" />
      ) : (
        <X className="size-4 text-muted-foreground" />
      )}
    </span>
  )
}
