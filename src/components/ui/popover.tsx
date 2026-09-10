/* eslint-disable */
// @ts-nocheck
'use client'

import * as React from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

type PopoverPortalContextValue = {
  portalContainer: HTMLElement | null
  setTriggerNode: (node: HTMLElement | null) => void
}

const PopoverPortalContext = React.createContext<PopoverPortalContextValue>({
  portalContainer: null,
  setTriggerNode: () => undefined,
})

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  const [portalContainer, setPortalContainer] =
    React.useState<HTMLElement | null>(null)

  const setTriggerNode = React.useCallback((node: HTMLElement | null) => {
    setPortalContainer(
      node?.closest<HTMLElement>(
        '[data-slot="awesome-dialog-container"], [data-slot="dialog-content"], [data-slot="sheet-content"]',
      ) ?? null,
    )
  }, [])

  const contextValue = React.useMemo(
    () => ({ portalContainer, setTriggerNode }),
    [portalContainer, setTriggerNode],
  )

  return (
    <PopoverPortalContext.Provider value={contextValue}>
      <PopoverPrimitive.Root data-slot="popover" {...props} />
    </PopoverPortalContext.Provider>
  )
}

function PopoverTrigger({
  ref,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  const { setTriggerNode } = React.useContext(PopoverPortalContext)

  const composedRef = React.useCallback(
    (node: HTMLElement | null) => {
      setTriggerNode(node)

      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref, setTriggerNode],
  )

  return (
    <PopoverPrimitive.Trigger
      ref={composedRef}
      data-slot="popover-trigger"
      {...props}
    />
  )
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const { portalContainer } = React.useContext(PopoverPortalContext)

  return (
    <PopoverPrimitive.Portal container={portalContainer ?? undefined}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-header"
      className={cn('flex flex-col gap-1 text-sm', className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <div
      data-slot="popover-title"
      className={cn('font-medium', className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="popover-description"
      className={cn('text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
}
