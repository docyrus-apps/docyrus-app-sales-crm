'use client'

import { type ReactNode } from 'react'

import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface SideFilterClearProps {
  count: number
  onClick: () => void
  label?: ReactNode
  className?: string
}

export function SideFilterClear({
  count,
  onClick,
  label = 'Clear all',
  className,
}: SideFilterClearProps) {
  if (count === 0) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={
        className ??
        'h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive'
      }
    >
      <X className="size-3.5" />
      {label} ({count})
    </Button>
  )
}
