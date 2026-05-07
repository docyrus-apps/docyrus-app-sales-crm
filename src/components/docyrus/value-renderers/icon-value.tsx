'use client'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { cn } from '@/lib/utils'

import { type DocyrusValueProps } from './types'

export function IconValue({ value, className }: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <DocyrusIcon icon={String(value)} className={cn('size-5', className)} />
  )
}
