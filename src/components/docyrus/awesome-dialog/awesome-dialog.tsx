'use client'

import { useCallback, useEffect } from 'react'

import { AwesomeDialogContent } from './awesome-dialog-content'
import { DrawerContainer } from './containers/drawer-container'
import { ModalContainer } from './containers/modal-container'
import { SheetContainer } from './containers/sheet-container'
import {
  AwesomeDialogProvider,
  useAwesomeDialog,
} from './contexts/dialog-context'
import type { AwesomeDialogProps } from './types'

export function AwesomeDialog({
  open,
  onOpenChange,
  children,
  container = 'modal',
  side = 'right',
  size = 'default',
  pattern = true,
  patternStyle = 'stripes',
  resizable = false,
  fullscreenable = false,
  defaultFullscreen = false,
  minimizable = false,
  dialogId,
  className,
}: AwesomeDialogProps) {
  const handleClose = useCallback(() => {
    onOpenChange?.(false)
  }, [onOpenChange])

  useGlobalRegistration(dialogId, open)

  return (
    <AwesomeDialogProvider
      container={container}
      side={side}
      size={size}
      fullscreenable={fullscreenable}
      defaultFullscreen={defaultFullscreen}
      minimizable={minimizable}
      resizable={resizable}
      onClose={handleClose}
      dialogId={dialogId}
    >
      <AwesomeDialogInner
        open={open}
        onOpenChange={onOpenChange}
        pattern={pattern}
        patternStyle={patternStyle}
        className={className}
      >
        {children}
      </AwesomeDialogInner>
    </AwesomeDialogProvider>
  )
}

function AwesomeDialogInner({
  open,
  onOpenChange,
  children,
  pattern,
  patternStyle,
  className,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: AwesomeDialogProps['children']
  pattern?: boolean
  patternStyle?: AwesomeDialogProps['patternStyle']
  className?: string
}) {
  const { container, side, size, isFullscreen } = useAwesomeDialog()

  const content = (
    <AwesomeDialogContent
      pattern={pattern}
      patternStyle={patternStyle}
      isFullscreen={isFullscreen}
      className={className}
    >
      {children}
    </AwesomeDialogContent>
  )

  switch (container) {
    case 'sheet':
      return (
        <SheetContainer
          open={open}
          onOpenChange={onOpenChange}
          side={side}
          size={size}
          isFullscreen={isFullscreen}
        >
          {content}
        </SheetContainer>
      )

    case 'drawer':
      return (
        <DrawerContainer
          open={open}
          onOpenChange={onOpenChange}
          side={side}
          size={size}
        >
          {content}
        </DrawerContainer>
      )

    default:
      return (
        <ModalContainer
          open={open}
          onOpenChange={onOpenChange}
          size={size}
          isFullscreen={isFullscreen}
        >
          {content}
        </ModalContainer>
      )
  }
}

function useGlobalRegistration(
  dialogId: string | undefined,
  open: boolean | undefined,
) {
  useEffect(() => {
    /*
     * Global registration is handled by GlobalDialogProvider if present
     * This hook is a placeholder for future global dialog integration
     */
  }, [dialogId, open])
}
