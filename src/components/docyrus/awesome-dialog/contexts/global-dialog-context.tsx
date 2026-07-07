'use client'

// @ts-nocheck
/* eslint-disable */
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  type DialogState,
  type GlobalDialogContextValue,
  type GlobalDialogProviderProps,
} from '../types'

import { useLocalStorage } from '../hooks/use-local-storage'

const GlobalDialogContext = createContext<GlobalDialogContextValue | null>(null)

const BASE_Z_INDEX = 50

interface PersistedDialogStates {
  [dialogId: string]: {
    minimized: boolean
    fullscreen: boolean
  }
}

export function GlobalDialogProvider({
  children,
  persist = false,
  storageKey = 'awesome-dialog-states',
}: GlobalDialogProviderProps) {
  const [dialogs, setDialogs] = useState<Map<string, DialogState>>(
    () => new Map(),
  )
  const zIndexCounterRef = useRef(BASE_Z_INDEX)
  const [persistedStates, setPersistedStates] =
    useLocalStorage<PersistedDialogStates>(storageKey, {})

  const syncPersistence = useCallback(
    (
      id: string,
      state: Partial<Pick<DialogState, 'minimized' | 'fullscreen'>>,
    ) => {
      if (!persist) return

      setPersistedStates((prev) => ({
        ...prev,
        [id]: {
          minimized: state.minimized ?? prev[id]?.minimized ?? false,
          fullscreen: state.fullscreen ?? prev[id]?.fullscreen ?? false,
        },
      }))
    },
    [persist, setPersistedStates],
  )

  const register = useCallback(
    (id: string, meta: { title?: string; icon?: string }) => {
      setDialogs((prev) => {
        const next = new Map(prev)
        const persisted = persistedStates[id]

        zIndexCounterRef.current += 1

        next.set(id, {
          dialogId: id,
          minimized: persisted?.minimized ?? false,
          fullscreen: persisted?.fullscreen ?? false,
          zIndex: zIndexCounterRef.current,
          title: meta.title,
          icon: meta.icon,
        })

        return next
      })
    },
    [persistedStates],
  )

  const unregister = useCallback((id: string) => {
    setDialogs((prev) => {
      const next = new Map(prev)

      next.delete(id)

      return next
    })
  }, [])

  const minimize = useCallback(
    (id: string) => {
      setDialogs((prev) => {
        const next = new Map(prev)
        const dialog = next.get(id)

        if (dialog) {
          next.set(id, { ...dialog, minimized: true })
        }

        return next
      })
      syncPersistence(id, { minimized: true })
    },
    [syncPersistence],
  )

  const restore = useCallback(
    (id: string) => {
      setDialogs((prev) => {
        const next = new Map(prev)
        const dialog = next.get(id)

        if (dialog) {
          zIndexCounterRef.current += 1
          next.set(id, {
            ...dialog,
            minimized: false,
            zIndex: zIndexCounterRef.current,
          })
        }

        return next
      })
      syncPersistence(id, { minimized: false })
    },
    [syncPersistence],
  )

  const bringToFront = useCallback((id: string) => {
    setDialogs((prev) => {
      const next = new Map(prev)
      const dialog = next.get(id)

      if (dialog) {
        zIndexCounterRef.current += 1
        next.set(id, { ...dialog, zIndex: zIndexCounterRef.current })
      }

      return next
    })
  }, [])

  const toggleFullscreen = useCallback(
    (id: string) => {
      setDialogs((prev) => {
        const next = new Map(prev)
        const dialog = next.get(id)

        if (dialog) {
          const newFullscreen = !dialog.fullscreen

          next.set(id, { ...dialog, fullscreen: newFullscreen })
          syncPersistence(id, { fullscreen: newFullscreen })
        }

        return next
      })
    },
    [syncPersistence],
  )

  const getZIndex = useCallback(
    (id: string) => {
      return dialogs.get(id)?.zIndex ?? BASE_Z_INDEX
    },
    [dialogs],
  )

  const isMinimized = useCallback(
    (id: string) => {
      return dialogs.get(id)?.minimized ?? false
    },
    [dialogs],
  )

  const isFullscreen = useCallback(
    (id: string) => {
      return dialogs.get(id)?.fullscreen ?? false
    },
    [dialogs],
  )

  const minimizedDialogs = useMemo(() => {
    return Array.from(dialogs.values()).filter((d) => d.minimized)
  }, [dialogs])

  const value = useMemo<GlobalDialogContextValue>(
    () => ({
      dialogs,
      register,
      unregister,
      minimize,
      restore,
      bringToFront,
      toggleFullscreen,
      getZIndex,
      isMinimized,
      isFullscreen,
      minimizedDialogs,
    }),
    [
      dialogs,
      register,
      unregister,
      minimize,
      restore,
      bringToFront,
      toggleFullscreen,
      getZIndex,
      isMinimized,
      isFullscreen,
      minimizedDialogs,
    ],
  )

  return <GlobalDialogContext value={value}>{children}</GlobalDialogContext>
}

export function useGlobalDialog(): GlobalDialogContextValue {
  const context = use(GlobalDialogContext)

  if (!context) {
    throw new Error(
      'useGlobalDialog must be used within a GlobalDialogProvider.',
    )
  }

  return context
}

export function useOptionalGlobalDialog(): GlobalDialogContextValue | null {
  return use(GlobalDialogContext)
}
