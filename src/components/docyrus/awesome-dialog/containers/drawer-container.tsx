'use client';

import { type ReactNode } from 'react';

import { VisuallyHidden } from 'radix-ui';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';

import { SHEET_SIZES, type DialogSide, type DialogSize } from '../types';

const directionClasses: Record<DialogSide, string> = {
  bottom: 'inset-x-0 bottom-0 rounded-t-xl border-t sm:w-auto sm:left-1/2 sm:-translate-x-1/2',
  top: 'inset-x-0 top-0 rounded-b-xl border-b sm:w-auto sm:left-1/2 sm:-translate-x-1/2',
  left: 'inset-y-0 left-0 rounded-r-xl border-r',
  right: 'inset-y-0 right-0 rounded-l-xl border-l'
};

function getDrawerSizeStyle(side: DialogSide, size: DialogSize, isFullscreen: boolean) {
  if (isFullscreen) {
    return {
      width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%'
    };
  }

  const isHorizontal = side === 'left' || side === 'right';

  if (isHorizontal) {
    return { width: SHEET_SIZES[size].horizontal, maxWidth: '100%' };
  }

  return {
    maxHeight: SHEET_SIZES[size].vertical,
    width: SHEET_SIZES[size].verticalWidth,
    maxWidth: '100%'
  };
}

export function DrawerContainer({
  open,
  onOpenChange,
  children,
  className,
  side = 'bottom',
  size = 'default',
  isFullscreen = false,
  zIndex
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  side?: DialogSide;
  size?: DialogSize;
  isFullscreen?: boolean;
  zIndex?: number;
}) {
  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} direction={side}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          data-slot="awesome-dialog-overlay"
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs fixed inset-0"
          style={{ zIndex: zIndex ?? 50 }} />
        <DrawerPrimitive.Content
          aria-describedby={undefined}
          data-slot="awesome-dialog-container"
          className={cn(
            'group/drawer-content fixed flex flex-col',
            directionClasses[side],
            isFullscreen && 'inset-0 w-full h-full max-w-none max-h-none border-none rounded-none',
            className
          )}
          style={{
            zIndex: zIndex ?? 50,
            ...getDrawerSizeStyle(side, size, isFullscreen)
          }}>
          <VisuallyHidden.Root>
            <DrawerPrimitive.Title>Dialog</DrawerPrimitive.Title>
          </VisuallyHidden.Root>
          {side === 'bottom' && !isFullscreen && (
            <div className="bg-muted mx-auto mt-4 hidden h-1.5 w-25 shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
          )}
          {children}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}