'use client'

import { type ReactNode } from 'react'

import { Dialog as SheetPrimitive, VisuallyHidden } from 'radix-ui'

import { cn } from '@/lib/utils'

import { SHEET_SIZES, type DialogSide, type DialogSize } from '../types'

const sideClasses: Record<DialogSide, string> = {
  right:
    'inset-y-0 right-0 h-full border-l data-closed:slide-out-to-right-10 data-open:slide-in-from-right-10',
  left: 'inset-y-0 left-0 h-full border-r data-closed:slide-out-to-left-10 data-open:slide-in-from-left-10',
  top: 'inset-x-0 top-0 w-full sm:w-auto border-b data-closed:slide-out-to-top-10 data-open:slide-in-from-top-10 sm:left-1/2 sm:-translate-x-1/2 sm:rounded-b-xl',
  bottom:
    'inset-x-0 bottom-0 w-full sm:w-auto border-t data-closed:slide-out-to-bottom-10 data-open:slide-in-from-bottom-10 sm:left-1/2 sm:-translate-x-1/2 sm:rounded-t-xl',
}

function getSheetSizeStyle(
  side: DialogSide,
  size: DialogSize,
  isFullscreen: boolean,
) {
  if (isFullscreen) {
    return {
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
    }
  }

  const isHorizontal = side === 'left' || side === 'right'

  if (isHorizontal) {
    return { width: SHEET_SIZES[size].horizontal, maxWidth: '100%' }
  }

  return {
    height: SHEET_SIZES[size].vertical,
    maxHeight: '100%',
    width: SHEET_SIZES[size].verticalWidth,
    maxWidth: '100%',
  }
}

export function SheetContainer({
  open,
  onOpenChange,
  children,
  className,
  side = 'right',
  size = 'default',
  isFullscreen = false,
  zIndex,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
  className?: string
  side?: DialogSide
  size?: DialogSize
  isFullscreen?: boolean
  zIndex?: number
}) {
  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay
          data-slot="awesome-dialog-overlay"
          className="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0"
          style={{ zIndex: zIndex ?? 50 }}
        />
        <SheetPrimitive.Content
          aria-describedby={undefined}
          data-slot="awesome-dialog-container"
          data-side={side}
          className={cn(
            'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0',
            'fixed flex flex-col bg-clip-padding shadow-lg transition duration-200 ease-in-out outline-none',
            sideClasses[side],
            isFullscreen &&
              'inset-0 w-full h-full max-w-none max-h-none border-none rounded-none',
            className,
          )}
          style={{
            zIndex: zIndex ? zIndex + 1 : 51,
            ...getSheetSizeStyle(side, size, isFullscreen),
          }}
        >
          <VisuallyHidden.Root>
            <SheetPrimitive.Title>Dialog</SheetPrimitive.Title>
          </VisuallyHidden.Root>
          {children}
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  )
}
