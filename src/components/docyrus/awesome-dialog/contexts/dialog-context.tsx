'use client'

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

import {
  type DialogContainer,
  type DialogSide,
  type DialogSize,
} from '../types'

interface AwesomeDialogContextValue {
  container: DialogContainer
  side: DialogSide
  size: DialogSize
  isFullscreen: boolean
  setFullscreen: (value: boolean) => void
  toggleFullscreen: () => void
  fullscreenable: boolean
  minimizable: boolean
  resizable: boolean
  onClose: () => void
  dialogId?: string
}

const AwesomeDialogContext = createContext<AwesomeDialogContextValue | null>(
  null,
)

export function AwesomeDialogProvider({
  children,
  container = 'modal',
  side = 'right',
  size = 'default',
  fullscreenable = false,
  defaultFullscreen = false,
  minimizable = false,
  resizable = false,
  onClose,
  dialogId,
}: {
  children: ReactNode
  container?: DialogContainer
  side?: DialogSide
  size?: DialogSize
  fullscreenable?: boolean
  defaultFullscreen?: boolean
  minimizable?: boolean
  resizable?: boolean
  onClose: () => void
  dialogId?: string
}) {
  const [isFullscreen, setFullscreen] = useState(defaultFullscreen)

  const toggleFullscreen = useCallback(() => {
    setFullscreen((prev) => !prev)
  }, [])

  const value = useMemo<AwesomeDialogContextValue>(
    () => ({
      container,
      side,
      size,
      isFullscreen,
      setFullscreen,
      toggleFullscreen,
      fullscreenable,
      minimizable,
      resizable,
      onClose,
      dialogId,
    }),
    [
      container,
      side,
      size,
      isFullscreen,
      toggleFullscreen,
      fullscreenable,
      minimizable,
      resizable,
      onClose,
      dialogId,
    ],
  )

  return (
    <AwesomeDialogContext.Provider value={value}>
      {children}
    </AwesomeDialogContext.Provider>
  )
}

export function useAwesomeDialog(): AwesomeDialogContextValue {
  const context = useContext(AwesomeDialogContext)

  if (!context) {
    throw new Error('useAwesomeDialog must be used within an AwesomeDialog.')
  }

  return context
}
