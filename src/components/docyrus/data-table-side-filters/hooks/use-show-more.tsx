import { useCallback, useMemo, useState } from 'react'

interface UseShowMoreOptions<T> {
  items: ReadonlyArray<T>
  threshold: number
  /** Initial expanded state. */
  defaultExpanded?: boolean
  /**
   * Predicate that forces an item to remain visible regardless of
   * collapse state — used to keep selected options pinned so users can
   * always uncheck them.
   */
  isPinned?: (item: T) => boolean
}

export function useShowMore<T>({
  items,
  threshold,
  defaultExpanded = false,
  isPinned,
}: UseShowMoreOptions<T>) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const { visible, hiddenCount, canExpand } = useMemo(() => {
    if (items.length <= threshold || expanded) {
      return {
        visible: items,
        hiddenCount: 0,
        canExpand: items.length > threshold,
      }
    }

    const pinned: Array<T> = []
    const rest: Array<T> = []

    if (isPinned) {
      for (const it of items) (isPinned(it) ? pinned : rest).push(it)
    } else {
      rest.push(...items)
    }

    const slot = Math.max(threshold - pinned.length, 0)
    const taken = rest.slice(0, slot)
    const visibleItems = isPinned ? [...pinned, ...taken] : taken
    const hidden = items.length - visibleItems.length

    return { visible: visibleItems, hiddenCount: hidden, canExpand: true }
  }, [items, threshold, expanded, isPinned])

  const toggle = useCallback(() => setExpanded((v) => !v), [])

  return {
    visible,
    hiddenCount,
    expanded,
    canExpand,
    toggle,
  }
}
