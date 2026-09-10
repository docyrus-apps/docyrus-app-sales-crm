'use client'

// @ts-nocheck
/* eslint-disable */
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'

import { type AdaptiveCardActionShowCard } from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import { ElementList } from '../element-node'
import { ActionBar } from '../action-bar'
import { ActionButton } from './action-button'

export function ActionShowCardButton({
  action,
}: {
  action: AdaptiveCardActionShowCard
}) {
  const ctx = useAdaptiveCardContext()
  const actionId = action.id ?? action.title ?? 'show-card'
  const open = !!ctx.showCardOpen[actionId]

  return (
    <ActionButton action={action} onClick={() => ctx.toggleShowCard(action)}>
      {action.iconUrl ? (
        <img
          src={action.iconUrl}
          alt=""
          aria-hidden="true"
          className="mr-1 size-4"
        />
      ) : null}
      <span>{action.title ?? 'Show card'}</span>
      <ChevronDown
        className={cn(
          'ml-1 size-4 transition-transform',
          open ? 'rotate-180' : '',
        )}
      />
    </ActionButton>
  )
}

export function ShowCardPanel({
  action,
}: {
  action: AdaptiveCardActionShowCard
}) {
  const ctx = useAdaptiveCardContext()
  const actionId = action.id ?? action.title ?? 'show-card'
  const open = !!ctx.showCardOpen[actionId]

  return (
    <Collapsible open={open}>
      <CollapsibleContent>
        <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-3">
          <ElementList items={action.card.body} />
          {action.card.actions ? (
            <ActionBar actions={action.card.actions} variant="nested" />
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
