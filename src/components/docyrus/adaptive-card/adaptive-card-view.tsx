'use client'

// @ts-nocheck
/* eslint-disable */
import { type CSSProperties } from 'react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

import { type AdaptiveCardBackgroundImage } from './adaptive-card-types'

import { ActionBar } from './action-bar'
import {
  AdaptiveCardProvider,
  type AdaptiveCardContextValue,
} from './adaptive-card-context'
import { ElementList } from './element-node'
import { registerDefaultElements } from './register-default-elements'
import { isSafeBackgroundUrl } from './lib/parse-card'
import { VERTICAL_FLEX_CLASS } from './lib/size-tokens'

registerDefaultElements()

function backgroundStyle(
  bg: string | AdaptiveCardBackgroundImage | undefined,
): CSSProperties | undefined {
  if (!bg) return undefined

  const url = typeof bg === 'string' ? bg : bg.url

  if (!isSafeBackgroundUrl(url)) return undefined

  const obj = typeof bg === 'object' ? bg : null
  const fillMode = obj?.fillMode ?? 'cover'

  let backgroundRepeat: string | undefined

  if (fillMode === 'repeatHorizontally') backgroundRepeat = 'repeat-x'
  else if (fillMode === 'repeatVertically') backgroundRepeat = 'repeat-y'
  else if (fillMode === 'repeat') backgroundRepeat = 'repeat'
  else backgroundRepeat = 'no-repeat'

  return {
    backgroundImage: `url(${url})`,
    backgroundSize: fillMode === 'cover' ? 'cover' : undefined,
    backgroundRepeat,
    backgroundPosition:
      obj?.horizontalAlignment || obj?.verticalAlignment
        ? `${obj.horizontalAlignment ?? 'left'} ${obj.verticalAlignment ?? 'top'}`
        : undefined,
  }
}

export interface AdaptiveCardViewProps {
  cardProps: AdaptiveCardContextValue
  className?: string
}

export function AdaptiveCardView({
  cardProps,
  className,
}: AdaptiveCardViewProps) {
  const { card, openUrl, submit, execute, toggleVisibility } = cardProps

  const style: CSSProperties = {
    ...backgroundStyle(card.backgroundImage),
    ...(card.minHeight ? { minHeight: card.minHeight } : {}),
  }

  const verticalClass =
    VERTICAL_FLEX_CLASS[card.verticalContentAlignment ?? 'top']

  const rootSelectAction = card.selectAction
  const handleRootClick = rootSelectAction
    ? () => {
        if (rootSelectAction.type === 'Action.OpenUrl')
          openUrl(rootSelectAction)
        else if (rootSelectAction.type === 'Action.Submit')
          submit(rootSelectAction)
        else if (rootSelectAction.type === 'Action.Execute')
          execute(rootSelectAction)
        else if (rootSelectAction.type === 'Action.ToggleVisibility')
          toggleVisibility(rootSelectAction)
        else if (rootSelectAction.type === 'Action.ResetInputs')
          cardProps.resetInputs(rootSelectAction)
      }
    : undefined

  const content = (
    <Card
      role="region"
      aria-label={card.speak}
      lang={card.lang}
      dir={card.rtl ? 'rtl' : undefined}
      className={cn(
        'flex flex-col w-full overflow-hidden py-4 gap-4',
        verticalClass,
        className,
      )}
      style={style}
    >
      <CardContent className={cn('flex flex-col gap-1', verticalClass)}>
        {card.body && card.body.length > 0 ? (
          <ElementList items={card.body} />
        ) : card.fallbackText ? (
          <p className="text-sm text-muted-foreground">{card.fallbackText}</p>
        ) : null}
      </CardContent>
      {card.actions && card.actions.length > 0 ? (
        <CardFooter className="flex flex-col items-stretch">
          <ActionBar actions={card.actions} variant="card-footer" />
        </CardFooter>
      ) : null}
    </Card>
  )

  return (
    <AdaptiveCardProvider value={cardProps}>
      {handleRootClick ? (
        <div
          role="button"
          tabIndex={0}
          className="cursor-pointer rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(event) => {
            if (
              (event.target as HTMLElement).closest(
                'button, a, [role="button"]:not(:scope)',
              )
            )
              return
            handleRootClick()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleRootClick()
            }
          }}
        >
          {content}
        </div>
      ) : (
        content
      )}
    </AdaptiveCardProvider>
  )
}
