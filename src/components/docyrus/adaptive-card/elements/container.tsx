'use client'

// @ts-nocheck
/* eslint-disable */
import { type CSSProperties } from 'react'

import { cn } from '@/lib/utils'

import {
  type AdaptiveCardBackgroundImage,
  type AdaptiveCardContainer,
  type AdaptiveCardSelectAction,
} from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import { ElementList } from '../element-node'
import { getContainerStyleClass } from '../lib/color-tokens'
import { VERTICAL_FLEX_CLASS } from '../lib/size-tokens'
import { isSafeBackgroundUrl } from '../lib/parse-card'

function backgroundStyle(
  bg: string | AdaptiveCardBackgroundImage | undefined,
): CSSProperties | undefined {
  if (!bg) return undefined

  const url = typeof bg === 'string' ? bg : bg.url

  if (!isSafeBackgroundUrl(url)) return undefined

  const obj = typeof bg === 'object' ? bg : null
  let backgroundSize: string | undefined
  let backgroundRepeat: string | undefined
  let backgroundPosition: string | undefined

  if (obj?.fillMode === 'cover' || !obj?.fillMode) {
    backgroundSize = 'cover'
    backgroundRepeat = 'no-repeat'
  } else if (obj.fillMode === 'repeatHorizontally') {
    backgroundRepeat = 'repeat-x'
  } else if (obj.fillMode === 'repeatVertically') {
    backgroundRepeat = 'repeat-y'
  } else if (obj.fillMode === 'repeat') {
    backgroundRepeat = 'repeat'
  }

  if (obj?.horizontalAlignment || obj?.verticalAlignment) {
    const h = obj.horizontalAlignment ?? 'left'
    const v = obj.verticalAlignment ?? 'top'

    backgroundPosition = `${h} ${v}`
  }

  return {
    backgroundImage: `url(${url})`,
    backgroundSize,
    backgroundRepeat,
    backgroundPosition,
  }
}

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

export function ContainerElement({
  element,
}: {
  element: AdaptiveCardContainer
}) {
  const ctx = useAdaptiveCardContext()

  const verticalClass =
    VERTICAL_FLEX_CLASS[element.verticalContentAlignment ?? 'top']
  const styleClass = getContainerStyleClass(element.style)

  const className = cn(
    'flex flex-col',
    verticalClass,
    styleClass,
    element.roundedCorners ? 'rounded-md' : '',
    element.showBorder && !styleClass.includes('border')
      ? 'border border-border'
      : '',
    element.style && element.style !== 'default' ? 'p-3' : '',
    element.bleed ? '-mx-3' : '',
  )

  const style: CSSProperties = {
    ...backgroundStyle(element.backgroundImage),
    ...(element.minHeight ? { minHeight: element.minHeight } : {}),
  }

  const dir = element.rtl ? 'rtl' : undefined

  const content = <ElementList items={element.items} />

  if (element.selectAction) {
    const action = element.selectAction

    return (
      <div
        role="button"
        tabIndex={0}
        dir={dir}
        aria-label={action.title}
        className={cn(
          className,
          'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        style={style}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('[data-ac-select-action]'))
            return
          dispatchSelect(ctx, action)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            dispatchSelect(ctx, action)
          }
        }}
        data-ac-select-action="true"
      >
        {content}
      </div>
    )
  }

  return (
    <div dir={dir} className={className} style={style}>
      {content}
    </div>
  )
}
