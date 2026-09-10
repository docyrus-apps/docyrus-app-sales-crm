'use client'

// @ts-nocheck
/* eslint-disable */
import { type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

import {
  type AdaptiveCardCompoundButton,
  type AdaptiveCardSelectAction,
} from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import { renderLucideIcon } from './icon-element'

function dispatchSelect(
  ctx: ReturnType<typeof useAdaptiveCardContext>,
  action: AdaptiveCardSelectAction,
): void {
  if (action.type === 'Action.OpenUrl') ctx.openUrl(action)
  else if (action.type === 'Action.Submit') ctx.submit(action)
  else if (action.type === 'Action.Execute') ctx.execute(action)
  else if (action.type === 'Action.ToggleVisibility')
    ctx.toggleVisibility(action)
  else if (action.type === 'Action.ResetInputs') ctx.resetInputs(action)
}

export function CompoundButtonElement({
  element,
}: {
  element: AdaptiveCardCompoundButton
}) {
  const ctx = useAdaptiveCardContext()
  const { selectAction } = element

  const handleClick = () => {
    if (selectAction) dispatchSelect(ctx, selectAction)
  }

  const handleKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!selectAction) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      dispatchSelect(ctx, selectAction)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKey}
      disabled={!selectAction}
      className={cn(
        'flex w-full items-start gap-3 rounded-md border border-border bg-card px-3 py-3 text-left transition-colors',
        selectAction
          ? 'cursor-pointer hover:bg-accent/40 hover:border-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          : 'cursor-default',
      )}
    >
      {element.icon ? (
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
          {renderLucideIcon(element.icon, 'size-4')}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {element.title}
          </span>
          {element.badge ? (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {element.badge}
            </Badge>
          ) : null}
        </div>
        {element.description ? (
          <p className="text-xs text-muted-foreground break-words">
            {element.description}
          </p>
        ) : null}
      </div>
    </button>
  )
}
