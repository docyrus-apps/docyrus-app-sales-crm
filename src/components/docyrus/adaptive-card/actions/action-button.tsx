'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  type AdaptiveCardAction,
  type AdaptiveCardActionStyle,
} from '../adaptive-card-types'

const STYLE_VARIANT: Record<
  AdaptiveCardActionStyle,
  'default' | 'destructive' | 'secondary'
> = {
  default: 'default',
  positive: 'default',
  destructive: 'destructive',
}

const STYLE_CLASS: Partial<Record<AdaptiveCardActionStyle, string>> = {
  positive: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
}

interface ActionButtonProps {
  action: AdaptiveCardAction
  onClick: () => void
  asChild?: boolean
  children?: ReactNode
  className?: string
}

export function ActionButton({
  action,
  onClick,
  asChild,
  children,
  className,
}: ActionButtonProps) {
  const isEnabled = action.isEnabled !== false
  const style = action.style ?? 'default'
  const baseVariant =
    action.mode === 'secondary' ? 'outline' : STYLE_VARIANT[style]

  const inner = (
    <Button
      type="button"
      variant={baseVariant}
      size="sm"
      disabled={!isEnabled}
      onClick={onClick}
      asChild={asChild}
      className={cn(STYLE_CLASS[style], className)}
    >
      {children ?? (
        <>
          {action.iconUrl ? (
            <img
              src={action.iconUrl}
              alt=""
              aria-hidden="true"
              className="mr-1 size-4"
            />
          ) : null}
          <span>{action.title ?? action.type.replace('Action.', '')}</span>
        </>
      )}
    </Button>
  )

  if (action.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{inner}</TooltipTrigger>
          <TooltipContent>{action.tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return inner
}
