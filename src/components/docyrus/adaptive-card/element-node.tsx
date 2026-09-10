'use client'

// @ts-nocheck
/* eslint-disable */
import { Fragment } from 'react'

import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

import { type AdaptiveCardElement } from './adaptive-card-types'

import {
  isElementVisible,
  useAdaptiveCardContext,
} from './adaptive-card-context'
import { getElementRenderer } from './element-registry'
import { getSpacingMarginTop } from './lib/spacing-tokens'
import { satisfiesRequires } from './lib/version'

interface ElementNodeProps {
  element: AdaptiveCardElement
  index?: number
}

export function ElementNode({ element, index = 0 }: ElementNodeProps) {
  const ctx = useAdaptiveCardContext()

  if (!isElementVisible(element, ctx.visibilityOverrides)) return null

  if (!satisfiesRequires(element.requires, ctx.hostConfig.hostCapabilities)) {
    if (
      element.fallback &&
      element.fallback !== 'drop' &&
      typeof element.fallback === 'object'
    ) {
      return (
        <ElementNode
          element={element.fallback as AdaptiveCardElement}
          index={index}
        />
      )
    }

    return null
  }

  const renderer =
    ctx.customElements[element.type] ?? getElementRenderer(element.type)

  if (!renderer) {
    if (
      element.fallback &&
      element.fallback !== 'drop' &&
      typeof element.fallback === 'object'
    ) {
      return (
        <ElementNode
          element={element.fallback as AdaptiveCardElement}
          index={index}
        />
      )
    }

    if (process.env.NODE_ENV !== 'production') {
      return (
        <div className="rounded border border-dashed border-destructive/50 bg-destructive/5 p-2 text-xs text-destructive">
          Unknown Adaptive Card element type:{' '}
          <code className="font-mono">{element.type}</code>
        </div>
      )
    }

    return null
  }

  const showSeparator = element.separator === true && index > 0
  const spacingClass = index === 0 ? '' : getSpacingMarginTop(element.spacing)
  const heightClass = element.height === 'stretch' ? 'flex-1' : ''

  /*
   * `_designerId` is a non-schema extension key written by the in-repo
   * Adaptive Card Designer so it can map rendered DOM back to designer-tree
   * nodes for overlay drop-zones and selection. It is `undefined` for every
   * non-designer caller and emits no attribute in that case.
   */
  const designerId = (element as { _designerId?: unknown })._designerId

  return (
    <Fragment>
      {showSeparator ? <Separator className="my-2" /> : null}
      <div
        className={cn(spacingClass, heightClass)}
        data-ac-type={element.type}
        data-ac-id={element.id}
        data-ac-designer-id={
          typeof designerId === 'string' ? designerId : undefined
        }
      >
        {renderer({ element })}
      </div>
    </Fragment>
  )
}

export function ElementList({
  items,
  emptyClassName,
}: {
  items: Array<AdaptiveCardElement> | undefined
  emptyClassName?: string
}) {
  if (!items || items.length === 0) {
    return <div className={emptyClassName} />
  }

  return (
    <>
      {items.map((element, index) => (
        <ElementNode
          key={element.id ?? `${element.type}-${index}`}
          element={element}
          index={index}
        />
      ))}
    </>
  )
}
