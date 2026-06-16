// @docyrus: [[architecture#Shared Record Detail Layout]]
import { useEffect, useSyncExternalStore } from 'react'

/**
 * Lightweight external store that lets a detail route publish the title of the
 * record currently being viewed so the global breadcrumb (rendered in the app
 * header, outside the route subtree) can show a human-readable name instead of
 * the raw UUID path segment.
 *
 * An external store is used instead of React context to avoid render-phase
 * setState warnings when a route publishes its title while the breadcrumb is
 * mounted elsewhere in the tree.
 */
let currentTitle: string | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function setDetailBreadcrumbTitle(next: string | null) {
  const normalized = next?.trim() || null

  if (currentTitle === normalized) return

  currentTitle = normalized
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return currentTitle
}

/** Read the active detail title (re-renders on change). */
export function useDetailBreadcrumbTitle(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Publish the current record's title to the breadcrumb for the lifetime of the
 * calling component, clearing it on unmount. Pass the resolved record name.
 */
export function useSetDetailBreadcrumbTitle(title: string | null | undefined) {
  useEffect(() => {
    setDetailBreadcrumbTitle(title ?? null)

    return () => setDetailBreadcrumbTitle(null)
  }, [title])
}
