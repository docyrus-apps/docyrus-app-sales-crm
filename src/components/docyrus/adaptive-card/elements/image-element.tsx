'use client'

// @ts-nocheck
/* eslint-disable */
import { type CSSProperties, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import {
  type AdaptiveCardImage,
  type AdaptiveCardSelectAction,
} from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import {
  HORIZONTAL_FLEX_CLASS,
  resolveImageDimension,
} from '../lib/size-tokens'

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

export function ImageElement({ element }: { element: AdaptiveCardImage }) {
  const ctx = useAdaptiveCardContext()

  const dimension = resolveImageDimension(
    element.size,
    element.width,
    element.height,
  )
  const alignClass =
    HORIZONTAL_FLEX_CLASS[element.horizontalAlignment ?? 'left']

  const style: CSSProperties = {}

  if (dimension.width) style.width = dimension.width
  if (dimension.height) style.height = dimension.height
  if (element.backgroundColor) style.backgroundColor = element.backgroundColor

  const altText = element.altText ?? ''

  let img: ReactNode

  if (element.style === 'person') {
    const sizeStyle: CSSProperties = {
      width: style.width ?? undefined,
      height: style.height ?? undefined,
    }

    img = (
      <Avatar
        className={cn('overflow-hidden rounded-full', dimension.className)}
        style={sizeStyle}
      >
        <AvatarImage src={element.url} alt={altText} />
        <AvatarFallback>
          {altText.charAt(0)?.toUpperCase() || '·'}
        </AvatarFallback>
      </Avatar>
    )
  } else {
    img = (
      <img
        src={element.url}
        alt={altText}
        loading="lazy"
        className={cn('max-w-full', dimension.className)}
        style={style}
      />
    )
  }

  const { selectAction } = element
  const wrapped = selectAction ? (
    <div
      role="button"
      tabIndex={0}
      aria-label={selectAction.title ?? altText}
      className="inline-block cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => dispatchSelect(ctx, selectAction)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          dispatchSelect(ctx, selectAction)
        }
      }}
    >
      {img}
    </div>
  ) : (
    img
  )

  return <div className={cn('flex w-full', alignClass)}>{wrapped}</div>
}
