'use client'

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react'

import { Check, Copy, Hash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { type DocyrusValueProps } from './types'

export function IdentityValue({
  value,
  className,
  uuid = false,
}: DocyrusValueProps) {
  const [copied, setCopied] = useState(false)

  if (value == null || value === '') {
    return <span className="text-muted-foreground">–</span>
  }

  const text = String(value)

  if (uuid) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground',
              className,
            )}
          >
            <Hash className="size-3.5 shrink-0" />
            <span className="sr-only">Show UUID</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="flex max-w-80 items-center gap-2">
          <span className="truncate font-mono text-[11px]">{text}</span>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="size-6 shrink-0"
            aria-label="Copy UUID"
            onClick={() => {
              void navigator.clipboard.writeText(text)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            }}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 tabular-nums text-sm text-muted-foreground',
        className,
      )}
    >
      <Hash className="size-3.5 shrink-0" />
      <span>{text}</span>
    </span>
  )
}
