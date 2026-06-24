'use client'

// @ts-nocheck
/* eslint-disable */
import { MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  type AdaptiveCardAction,
  type AdaptiveCardActionShowCard,
} from './adaptive-card-types'

import { useAdaptiveCardContext } from './adaptive-card-context'
import { ActionExecuteButton } from './actions/action-execute'
import { ActionOpenUrlButton } from './actions/action-open-url'
import { ActionResetInputsButton } from './actions/action-reset-inputs'
import { ActionShowCardButton, ShowCardPanel } from './actions/action-show-card'
import { ActionSubmitButton } from './actions/action-submit'
import { ActionToggleVisibilityButton } from './actions/action-toggle-visibility'
import { satisfiesRequires } from './lib/version'

interface ActionBarProps {
  actions: Array<AdaptiveCardAction> | undefined
  variant?: 'card-footer' | 'inline' | 'nested'
}

function renderAction(action: AdaptiveCardAction) {
  switch (action.type) {
    case 'Action.Submit':
      return <ActionSubmitButton action={action} />

    case 'Action.Execute':
      return <ActionExecuteButton action={action} />

    case 'Action.OpenUrl':
      return <ActionOpenUrlButton action={action} />

    case 'Action.ShowCard':
      return <ActionShowCardButton action={action} />

    case 'Action.ToggleVisibility':
      return <ActionToggleVisibilityButton action={action} />

    case 'Action.ResetInputs':
      return <ActionResetInputsButton action={action} />

    default:
      return null
  }
}

function actionLabel(action: AdaptiveCardAction): string {
  return action.title ?? action.type.replace('Action.', '')
}

export function ActionBar({
  actions,
  variant = 'card-footer',
}: ActionBarProps) {
  const ctx = useAdaptiveCardContext()

  if (!actions || actions.length === 0) return null

  const visible = actions.filter((a) =>
    satisfiesRequires(a.requires, ctx.hostConfig.hostCapabilities),
  )

  if (visible.length === 0) return null

  const max = ctx.hostConfig.actions.maxActions
  const orientation = ctx.hostConfig.actions.actionsOrientation
  const primary = visible.slice(0, max)
  const overflow = visible.slice(max)

  const showCards = primary.filter(
    (a): a is AdaptiveCardActionShowCard => a.type === 'Action.ShowCard',
  )

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2',
        orientation === 'vertical' ? 'flex-col items-stretch' : 'flex-row',
        variant === 'nested' ? 'pt-2' : '',
      )}
    >
      <div
        className={cn(
          'flex flex-wrap gap-2',
          orientation === 'vertical'
            ? 'flex-col items-stretch'
            : 'flex-row items-center',
        )}
      >
        {primary.map((action, index) => (
          <div key={action.id ?? `action-${index}`}>{renderAction(action)}</div>
        ))}
        {overflow.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="More actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {overflow.map((action, index) => (
                <DropdownMenuItem
                  key={action.id ?? `overflow-${index}`}
                  onSelect={() => {
                    if (action.type === 'Action.Submit') ctx.submit(action)
                    else if (action.type === 'Action.Execute')
                      ctx.execute(action)
                    else if (action.type === 'Action.OpenUrl')
                      ctx.openUrl(action)
                    else if (action.type === 'Action.ToggleVisibility')
                      ctx.toggleVisibility(action)
                    else if (action.type === 'Action.ResetInputs')
                      ctx.resetInputs(action)
                    else if (action.type === 'Action.ShowCard')
                      ctx.toggleShowCard(action)
                  }}
                >
                  {actionLabel(action)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {showCards.length > 0 ? (
        <div className="basis-full">
          {showCards.map((action, index) => (
            <ShowCardPanel
              key={action.id ?? `showcard-${index}`}
              action={action}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
