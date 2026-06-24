'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useState } from 'react'

import { ChevronDown, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

interface PropSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export function PropSection({
  title,
  defaultOpen = true,
  children,
  className,
}: PropSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn('border-b border-border last:border-b-0', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        {open ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
        {title}
      </button>
      {open ? (
        <div className="space-y-2.5 px-3 pb-3 pt-1">{children}</div>
      ) : null}
    </div>
  )
}
