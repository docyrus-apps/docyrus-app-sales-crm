'use client'

// @ts-nocheck
/* eslint-disable */
import { type CSSProperties } from 'react'

import { cn } from '@/lib/utils'

import {
  type AdaptiveCardColumn,
  type AdaptiveCardColumnSet,
  type AdaptiveCardSelectAction,
} from '../adaptive-card-types'

import {
  isElementVisible,
  useAdaptiveCardContext,
} from '../adaptive-card-context'
import { ElementList } from '../element-node'
import { getContainerStyleClass } from '../lib/color-tokens'
import { HORIZONTAL_FLEX_CLASS, VERTICAL_FLEX_CLASS } from '../lib/size-tokens'

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

function columnFlexStyle(width: string | number | undefined): {
  className: string
  style: CSSProperties
} {
  if (width == null) return { className: 'flex-1', style: {} }

  if (typeof width === 'number') {
    return {
      className: '',
      style: { flexGrow: width, flexShrink: 1, flexBasis: 0 },
    }
  }

  if (width === 'auto') return { className: 'shrink-0', style: {} }
  if (width === 'stretch') return { className: 'flex-1', style: {} }

  const pxMatch = /^(\d+(?:\.\d+)?)px$/.exec(width)

  if (pxMatch) {
    return {
      className: 'shrink-0',
      style: { flexBasis: `${pxMatch[1]}px`, width: `${pxMatch[1]}px` },
    }
  }

  const num = Number.parseFloat(width)

  if (Number.isFinite(num)) {
    return {
      className: '',
      style: { flexGrow: num, flexShrink: 1, flexBasis: 0 },
    }
  }

  return { className: 'flex-1', style: {} }
}

function Column({
  column,
  index,
}: {
  column: AdaptiveCardColumn
  index: number
}) {
  const ctx = useAdaptiveCardContext()

  if (!isElementVisible(column, ctx.visibilityOverrides)) return null

  const flex = columnFlexStyle(column.width)
  const verticalClass =
    VERTICAL_FLEX_CLASS[column.verticalContentAlignment ?? 'top']
  const styleClass = getContainerStyleClass(column.style)

  const className = cn(
    'flex flex-col min-w-0',
    flex.className,
    verticalClass,
    styleClass,
    column.style && column.style !== 'default' ? 'p-3' : '',
    column.bleed ? (index === 0 ? '-ml-3' : '-mr-3') : '',
  )

  const style: CSSProperties = {
    ...flex.style,
    ...(column.minHeight ? { minHeight: column.minHeight } : {}),
  }

  const content = <ElementList items={column.items} />

  if (column.selectAction) {
    const action = column.selectAction

    return (
      <div
        role="button"
        tabIndex={0}
        dir={column.rtl ? 'rtl' : undefined}
        aria-label={action.title}
        className={cn(
          className,
          'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        style={style}
        onClick={() => dispatchSelect(ctx, action)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            dispatchSelect(ctx, action)
          }
        }}
      >
        {content}
      </div>
    )
  }

  return (
    <div
      dir={column.rtl ? 'rtl' : undefined}
      className={className}
      style={style}
    >
      {content}
    </div>
  )
}

export function ColumnSetElement({
  element,
}: {
  element: AdaptiveCardColumnSet
}) {
  const ctx = useAdaptiveCardContext()
  const columns = element.columns ?? []

  const horizontalClass =
    HORIZONTAL_FLEX_CLASS[element.horizontalAlignment ?? 'left']
  const styleClass = getContainerStyleClass(element.style)

  const className = cn(
    'flex flex-row gap-3',
    horizontalClass,
    styleClass,
    element.style && element.style !== 'default' ? 'p-3' : '',
    element.bleed ? '-mx-3' : '',
  )

  const style: CSSProperties = element.minHeight
    ? { minHeight: element.minHeight }
    : {}

  const inner = (
    <div className={className} style={style}>
      {columns.map((col, index) => (
        <Column key={col.id ?? `col-${index}`} column={col} index={index} />
      ))}
    </div>
  )

  if (element.selectAction) {
    const action = element.selectAction

    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={action.title}
        className="rounded-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => dispatchSelect(ctx, action)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            dispatchSelect(ctx, action)
          }
        }}
      >
        {inner}
      </div>
    )
  }

  return inner
}
