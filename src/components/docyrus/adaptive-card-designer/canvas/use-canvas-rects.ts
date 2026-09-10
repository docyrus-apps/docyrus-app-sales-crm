'use client'

// @ts-nocheck
/* eslint-disable */
import { useEffect, useState, type RefObject } from 'react'

export interface CanvasRect {
  top: number
  left: number
  width: number
  height: number
}

export interface CanvasNodeRect {
  designerId: string
  rect: CanvasRect
}

/**
 * Measure every `[data-ac-designer-id]` element rendered inside `containerRef`
 * and return their positions relative to the container's top-left. Remeasures
 * on `trackKey` change, on `ResizeObserver` events for the container and each
 * tracked element, on container scroll, and on window resize.
 */
export function useCanvasNodeRects(
  containerRef: RefObject<HTMLElement | null>,
  trackKey: unknown,
): CanvasNodeRect[] {
  const [rects, setRects] = useState<CanvasNodeRect[]>([])

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    let rafId = 0

    function scheduleMeasure() {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        measure()
      })
    }

    function measure() {
      if (!container) return

      const base = container.getBoundingClientRect()
      const elements = container.querySelectorAll<HTMLElement>(
        '[data-ac-designer-id]',
      )
      const next: CanvasNodeRect[] = []

      elements.forEach((el) => {
        const id = el.dataset.acDesignerId

        if (!id) return

        const r = el.getBoundingClientRect()

        next.push({
          designerId: id,
          rect: {
            top: r.top - base.top + container.scrollTop,
            left: r.left - base.left + container.scrollLeft,
            width: r.width,
            height: r.height,
          },
        })
      })

      setRects((prev) => {
        if (prev.length !== next.length) return next

        for (let i = 0; i < prev.length; i += 1) {
          const a = prev[i]
          const b = next[i]

          if (!a || !b) return next
          if (a.designerId !== b.designerId) return next
          if (
            a.rect.top !== b.rect.top ||
            a.rect.left !== b.rect.left ||
            a.rect.width !== b.rect.width ||
            a.rect.height !== b.rect.height
          ) {
            return next
          }
        }

        return prev
      })
    }

    scheduleMeasure()

    const ro = new ResizeObserver(scheduleMeasure)

    ro.observe(container)

    const tracked = container.querySelectorAll<HTMLElement>(
      '[data-ac-designer-id]',
    )

    tracked.forEach((el) => ro.observe(el))

    const onScroll = () => scheduleMeasure()
    const onWinResize = () => scheduleMeasure()

    container.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onWinResize)

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      ro.disconnect()
      container.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onWinResize)
    }
  }, [containerRef, trackKey])

  return rects
}
