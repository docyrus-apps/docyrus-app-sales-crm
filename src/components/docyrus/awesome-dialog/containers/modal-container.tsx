'use client'

import { type ReactNode } from 'react'

import { Dialog as DialogPrimitive, VisuallyHidden } from 'radix-ui'

import { cn } from '@/lib/utils'

import { MODAL_SIZES, type DialogSize } from '../types'

export function ModalContainer({
  open,
  onOpenChange,
  children,
  className,
  size = 'default',
  isFullscreen = false,
  zIndex,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
  className?: string
  size?: DialogSize
  isFullscreen?: boolean
  zIndex?: number
}) {
  const sizeStyle = isFullscreen
    ? {
        width: '100vw',
        maxWidth: '100vw',
        height: '100vh',
        maxHeight: '100vh',
      }
    : { width: MODAL_SIZES[size].width, maxHeight: MODAL_SIZES[size].maxHeight }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="awesome-dialog-overlay"
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0"
          style={{ zIndex: zIndex ?? 50 }}
        />
        <div
          data-slot="awesome-dialog-positioner"
          className={cn(
            'pointer-events-none fixed inset-0 flex items-center justify-center',
            isFullscreen ? 'p-0' : 'p-4',
          )}
          style={{ zIndex: zIndex ?? 50 }}
        >
          <DialogPrimitive.Content
            aria-describedby={undefined}
            data-slot="awesome-dialog-container"
            className={cn(
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'pointer-events-auto flex w-full flex-col outline-none duration-200',
              'max-w-[calc(100%-2rem)]',
              isFullscreen && 'max-w-none h-full',
              className,
            )}
            style={sizeStyle}
          >
            <VisuallyHidden.Root>
              <DialogPrimitive.Title>Dialog</DialogPrimitive.Title>
            </VisuallyHidden.Root>
            {children}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
