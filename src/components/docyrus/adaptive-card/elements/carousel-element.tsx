'use client'

// @ts-nocheck
/* eslint-disable */
import { type CSSProperties, useEffect, useState } from 'react'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import {
  type AdaptiveCardCarousel,
  type AdaptiveCardCarouselPage,
} from '../adaptive-card-types'

import { ElementList } from '../element-node'
import { getContainerStyleClass } from '../lib/color-tokens'
import { VERTICAL_FLEX_CLASS } from '../lib/size-tokens'

function Page({ page }: { page: AdaptiveCardCarouselPage }) {
  const verticalClass =
    VERTICAL_FLEX_CLASS[page.verticalContentAlignment ?? 'top']
  const styleClass = getContainerStyleClass(page.style)

  return (
    <div
      className={cn(
        'flex flex-col w-full shrink-0',
        verticalClass,
        styleClass,
        page.style && page.style !== 'default' ? 'p-3 rounded-md' : '',
      )}
      style={page.minHeight ? { minHeight: page.minHeight } : undefined}
    >
      <ElementList items={page.items} />
    </div>
  )
}

export function CarouselElement({
  element,
}: {
  element: AdaptiveCardCarousel
}) {
  const pages = element.pages ?? []
  const orientation = element.orientation ?? 'horizontal'
  const initial = Math.min(
    Math.max(0, element.initialPage ?? 0),
    Math.max(0, pages.length - 1),
  )
  const [index, setIndex] = useState(initial)

  const loop = element.loop !== false
  const { timer } = element

  useEffect(() => {
    if (!timer || timer <= 0 || pages.length < 2) return

    const handle = window.setInterval(
      () => {
        setIndex((prev) => {
          const next = prev + 1

          if (next >= pages.length) return loop ? 0 : prev

          return next
        })
      },
      Math.max(1000, timer),
    )

    return () => window.clearInterval(handle)
  }, [timer, loop, pages.length])

  const goPrev = () =>
    setIndex((prev) => {
      if (prev === 0) return loop ? pages.length - 1 : 0

      return prev - 1
    })

  const goNext = () =>
    setIndex((prev) => {
      if (prev === pages.length - 1) return loop ? 0 : prev

      return prev + 1
    })

  if (pages.length === 0) return null

  const style: CSSProperties = element.heightInPixels
    ? { height: `${element.heightInPixels}px` }
    : {}

  if (orientation === 'vertical') {
    return (
      <div className="relative flex flex-col gap-2" style={style}>
        <div className="relative w-full flex-1 overflow-hidden rounded-md">
          <div
            className="flex h-full w-full flex-col transition-transform duration-300"
            style={{ transform: `translateY(-${index * 100}%)` }}
          >
            {pages.map((page, idx) => (
              <div
                key={page.id ?? `page-${idx}`}
                className="h-full w-full shrink-0"
              >
                <Page page={page} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={!loop && index === 0}
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            {index + 1} / {pages.length}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={!loop && index === pages.length - 1}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-2" style={style}>
      <div className="relative w-full overflow-hidden rounded-md">
        <div
          className="flex w-full transition-transform duration-300"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {pages.map((page, idx) => (
            <div key={page.id ?? `page-${idx}`} className="w-full shrink-0">
              <Page page={page} />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={goPrev}
          disabled={!loop && index === 0}
          aria-label="Previous page"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/90 p-1.5 shadow-sm hover:bg-background disabled:opacity-50"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!loop && index === pages.length - 1}
          aria-label="Next page"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/90 p-1.5 shadow-sm hover:bg-background disabled:opacity-50"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="flex items-center justify-center gap-1">
        {pages.map((page, idx) => (
          <button
            key={page.id ?? `dot-${idx}`}
            type="button"
            onClick={() => setIndex(idx)}
            aria-label={`Go to page ${idx + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all',
              idx === index ? 'w-6 bg-primary' : 'w-1.5 bg-border',
            )}
          />
        ))}
      </div>
    </div>
  )
}
