'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Transition } from 'motion/react'

import { cn } from '@/lib/utils'

function getTransitionDelay(t: Transition | undefined): number {
  if (!t || typeof t !== 'object') return 0
  const delay = (t as Record<string, number>).delay
  return typeof delay === 'number' ? delay : 0
}

type HighlightMode = 'children' | 'parent'

type Bounds = {
  top: number
  left: number
  width: number
  height: number
}

type HighlightContextType<T extends string> = {
  mode: HighlightMode
  activeValue: T | null
  setActiveValue: (value: T | null) => void
  setBounds: (bounds: DOMRect) => void
  clearBounds: () => void
  id: string
  hover: boolean
  className?: string
  activeClassName?: string
  setActiveClassName: (className: string) => void
  transition?: Transition
  disabled?: boolean
  enabled?: boolean
  exitDelay?: number
  forceUpdateBounds?: boolean
}

const HighlightContext = React.createContext<
  HighlightContextType<any> | undefined
>(undefined)

function useHighlight<T extends string>(): HighlightContextType<T> {
  const context = React.useContext(HighlightContext)
  if (!context) {
    throw new Error('useHighlight must be used within a Highlight provider')
  }
  return context as unknown as HighlightContextType<T>
}

type BaseHighlightProps<T extends string> = {
  mode?: HighlightMode
  value?: T | null
  defaultValue?: T | null
  onValueChange?: (value: T | null) => void
  className?: string
  transition?: Transition
  hover?: boolean
  disabled?: boolean
  enabled?: boolean
  exitDelay?: number
}

type ParentModeHighlightProps = {
  boundsOffset?: Partial<Bounds>
  containerClassName?: string
  forceUpdateBounds?: boolean
}

type ControlledParentModeHighlightProps<T extends string> =
  BaseHighlightProps<T> &
    ParentModeHighlightProps & {
      mode: 'parent'
      controlledItems: true
      children: React.ReactNode
    }

type ControlledChildrenModeHighlightProps<T extends string> =
  BaseHighlightProps<T> & {
    mode?: 'children' | undefined
    controlledItems: true
    children: React.ReactNode
  }

type UncontrolledParentModeHighlightProps<T extends string> =
  BaseHighlightProps<T> &
    ParentModeHighlightProps & {
      mode: 'parent'
      controlledItems?: false
      itemsClassName?: string
      children: React.ReactElement | Array<React.ReactElement>
    }

type UncontrolledChildrenModeHighlightProps<T extends string> =
  BaseHighlightProps<T> & {
    mode?: 'children'
    controlledItems?: false
    itemsClassName?: string
    children: React.ReactElement | Array<React.ReactElement>
  }

type HighlightProps<T extends string> = React.ComponentProps<'div'> &
  (
    | ControlledParentModeHighlightProps<T>
    | ControlledChildrenModeHighlightProps<T>
    | UncontrolledParentModeHighlightProps<T>
    | UncontrolledChildrenModeHighlightProps<T>
  )

function Highlight<T extends string>({ ref, ...props }: HighlightProps<T>) {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    className,
    transition = { type: 'spring', stiffness: 350, damping: 35 },
    hover = false,
    enabled = true,
    controlledItems,
    disabled = false,
    exitDelay = 0.2,
    mode = 'children',
  } = props

  const localRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement)

  const [activeValue, setActiveValue] = React.useState<T | null>(
    value ?? defaultValue ?? null,
  )
  const [boundsState, setBoundsState] = React.useState<Bounds | null>(null)
  const [activeClassNameState, setActiveClassNameState] =
    React.useState<string>('')

  const safeSetActiveValue = React.useCallback(
    (id: T | null) => {
      setActiveValue((prev) => (prev === id ? prev : id))
      if (id !== activeValue) onValueChange?.(id as T)
    },
    [activeValue, onValueChange],
  )

  const safeSetBounds = React.useCallback(
    (bounds: DOMRect) => {
      if (!localRef.current) return

      const parentProps = props as ParentModeHighlightProps
      const boundsOffset = parentProps.boundsOffset ?? {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      }

      const containerRect = localRef.current.getBoundingClientRect()
      const newBounds: Bounds = {
        top: bounds.top - containerRect.top + (boundsOffset.top ?? 0),
        left: bounds.left - containerRect.left + (boundsOffset.left ?? 0),
        width: bounds.width + (boundsOffset.width ?? 0),
        height: bounds.height + (boundsOffset.height ?? 0),
      }

      setBoundsState((prev) => {
        if (
          prev &&
          prev.top === newBounds.top &&
          prev.left === newBounds.left &&
          prev.width === newBounds.width &&
          prev.height === newBounds.height
        ) {
          return prev
        }
        return newBounds
      })
    },
    [props],
  )

  const clearBounds = React.useCallback(() => {
    setBoundsState((prev) => (prev === null ? prev : null))
  }, [])

  React.useEffect(() => {
    if (value !== undefined) setActiveValue(value)
    else if (defaultValue !== undefined) setActiveValue(defaultValue)
  }, [value, defaultValue])

  const id = React.useId()

  React.useEffect(() => {
    if (mode !== 'parent') return
    const container = localRef.current
    if (!container) return

    const onScroll = () => {
      if (!activeValue) return
      const activeEl = container.querySelector<HTMLElement>(
        `[data-value="${activeValue}"][data-highlight="true"]`,
      )
      if (activeEl) safeSetBounds(activeEl.getBoundingClientRect())
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [mode, activeValue, safeSetBounds])

  const render = React.useCallback(
    (innerChildren: React.ReactNode) => {
      if (mode === 'parent') {
        const parentProps = props as ParentModeHighlightProps
        return (
          <div
            ref={localRef}
            data-slot="highlight-container"
            className={cn('relative', parentProps.containerClassName)}
          >
            <AnimatePresence initial={false}>
              {boundsState && (
                <motion.div
                  data-slot="highlight"
                  animate={{
                    top: boundsState.top,
                    left: boundsState.left,
                    width: boundsState.width,
                    height: boundsState.height,
                    opacity: 1,
                  }}
                  initial={{
                    top: boundsState.top,
                    left: boundsState.left,
                    width: boundsState.width,
                    height: boundsState.height,
                    opacity: 0,
                  }}
                  exit={{
                    opacity: 0,
                    transition: {
                      ...transition,
                      delay: getTransitionDelay(transition) + exitDelay,
                    },
                  }}
                  transition={transition}
                  className={cn(
                    'absolute bg-muted z-0',
                    className,
                    activeClassNameState,
                  )}
                />
              )}
            </AnimatePresence>
            {innerChildren}
          </div>
        )
      }

      return innerChildren
    },
    [
      mode,
      props,
      boundsState,
      transition,
      exitDelay,
      className,
      activeClassNameState,
    ],
  )

  const uncontrolledProps = props as { itemsClassName?: string }

  return (
    <HighlightContext.Provider
      value={{
        mode,
        activeValue,
        setActiveValue: safeSetActiveValue,
        id,
        hover,
        className,
        transition,
        disabled,
        enabled,
        exitDelay,
        setBounds: safeSetBounds,
        clearBounds,
        activeClassName: activeClassNameState,
        setActiveClassName: setActiveClassNameState,
        forceUpdateBounds: (props as ParentModeHighlightProps)
          .forceUpdateBounds,
      }}
    >
      {enabled
        ? controlledItems
          ? render(children)
          : render(
              React.Children.map(children, (child, index) => (
                <HighlightItem
                  key={index}
                  className={uncontrolledProps.itemsClassName}
                >
                  {child}
                </HighlightItem>
              )),
            )
        : children}
    </HighlightContext.Provider>
  )
}

function getNonOverridingDataAttributes(
  element: React.ReactElement,
  dataAttributes: Record<string, unknown>,
): Record<string, unknown> {
  return Object.keys(dataAttributes).reduce<Record<string, unknown>>(
    (acc, key) => {
      if ((element.props as Record<string, unknown>)[key] === undefined) {
        acc[key] = dataAttributes[key]
      }
      return acc
    },
    {},
  )
}

type ExtendedChildProps = React.ComponentProps<'div'> & {
  id?: string
  ref?: React.Ref<HTMLElement>
  'data-active'?: string
  'data-value'?: string
  'data-disabled'?: boolean
  'data-highlight'?: boolean
  'data-slot'?: string
}

type HighlightItemProps = React.ComponentProps<'div'> & {
  children: React.ReactElement
  id?: string
  value?: string
  className?: string
  transition?: Transition
  activeClassName?: string
  disabled?: boolean
  exitDelay?: number
  asChild?: boolean
  forceUpdateBounds?: boolean
}

function HighlightItem({
  ref,
  children,
  id,
  value,
  className,
  transition,
  disabled,
  activeClassName,
  exitDelay,
  asChild = false,
  forceUpdateBounds,
  ...props
}: HighlightItemProps) {
  const itemId = React.useId()
  const {
    activeValue,
    setActiveValue,
    mode,
    setBounds,
    clearBounds,
    hover,
    enabled,
    className: contextClassName,
    transition: contextTransition,
    id: contextId,
    disabled: contextDisabled,
    exitDelay: contextExitDelay,
    forceUpdateBounds: contextForceUpdateBounds,
    setActiveClassName,
  } = useHighlight()

  const element = children as React.ReactElement<ExtendedChildProps>
  const elementProps = element.props
  const childValue =
    id ?? value ?? elementProps['data-value'] ?? elementProps.id ?? itemId
  const isActive = activeValue === childValue
  const isDisabled = disabled ?? contextDisabled
  const itemTransition = transition ?? contextTransition

  const localRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement)

  React.useEffect(() => {
    if (mode !== 'parent') return
    let rafId: number
    let previousBounds: Bounds | null = null
    const shouldUpdateBounds =
      forceUpdateBounds === true ||
      (contextForceUpdateBounds && forceUpdateBounds !== false)

    const updateBounds = () => {
      if (!localRef.current) return

      const bounds = localRef.current.getBoundingClientRect()

      if (shouldUpdateBounds) {
        if (
          previousBounds &&
          previousBounds.top === bounds.top &&
          previousBounds.left === bounds.left &&
          previousBounds.width === bounds.width &&
          previousBounds.height === bounds.height
        ) {
          rafId = requestAnimationFrame(updateBounds)
          return
        }
        previousBounds = bounds
        rafId = requestAnimationFrame(updateBounds)
      }

      setBounds(bounds)
    }

    if (isActive) {
      updateBounds()
      setActiveClassName(activeClassName ?? '')
    } else if (!activeValue) clearBounds()

    if (shouldUpdateBounds) return () => cancelAnimationFrame(rafId)
  }, [
    mode,
    isActive,
    activeValue,
    setBounds,
    clearBounds,
    activeClassName,
    setActiveClassName,
    forceUpdateBounds,
    contextForceUpdateBounds,
  ])

  if (!React.isValidElement(children)) return children

  const dataAttributes = {
    'data-active': isActive ? 'true' : 'false',
    'aria-selected': isActive,
    'data-disabled': isDisabled,
    'data-value': childValue,
    'data-highlight': true,
  }

  const transitionDelay = getTransitionDelay(itemTransition)
  const resolvedExitDelay = exitDelay ?? contextExitDelay ?? 0

  const commonHandlers = hover
    ? {
        onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
          setActiveValue(childValue)
          elementProps.onMouseEnter?.(e)
        },
        onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
          setActiveValue(null)
          elementProps.onMouseLeave?.(e)
        },
      }
    : {
        onClick: (e: React.MouseEvent<HTMLDivElement>) => {
          setActiveValue(childValue)
          elementProps.onClick?.(e)
        },
      }

  if (asChild) {
    if (mode === 'children') {
      return React.cloneElement(element, {
        key: childValue,
        ref: localRef,
        className: cn('relative', elementProps.className),
        ...getNonOverridingDataAttributes(element, {
          ...dataAttributes,
          'data-slot': 'highlight-item-container',
        }),
        ...commonHandlers,
        ...props,
        children: (
          <>
            <AnimatePresence initial={false}>
              {isActive && !isDisabled && (
                <motion.div
                  layoutId={`transition-background-${contextId}`}
                  data-slot="highlight"
                  className={cn(
                    'absolute inset-0 bg-muted z-0',
                    contextClassName,
                    activeClassName,
                  )}
                  transition={itemTransition}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: {
                      ...itemTransition,
                      delay: transitionDelay + resolvedExitDelay,
                    },
                  }}
                  {...dataAttributes}
                />
              )}
            </AnimatePresence>

            <div
              data-slot="highlight-item"
              className={cn('relative z-[1]', className)}
              {...dataAttributes}
            >
              {children}
            </div>
          </>
        ),
      })
    }

    return React.cloneElement(element, {
      ref: localRef,
      ...getNonOverridingDataAttributes(element, {
        ...dataAttributes,
        'data-slot': 'highlight-item',
      }),
      ...commonHandlers,
    })
  }

  return enabled ? (
    <div
      key={childValue}
      ref={localRef}
      data-slot="highlight-item-container"
      className={cn(mode === 'children' && 'relative', className)}
      {...dataAttributes}
      {...props}
      {...commonHandlers}
    >
      {mode === 'children' && (
        <AnimatePresence initial={false}>
          {isActive && !isDisabled && (
            <motion.div
              layoutId={`transition-background-${contextId}`}
              data-slot="highlight"
              className={cn(
                'absolute inset-0 bg-muted z-0',
                contextClassName,
                activeClassName,
              )}
              transition={itemTransition}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: {
                  ...itemTransition,
                  delay: transitionDelay + resolvedExitDelay,
                },
              }}
              {...dataAttributes}
            />
          )}
        </AnimatePresence>
      )}

      {React.cloneElement(element, {
        className: cn('relative z-[1]', elementProps.className),
        ...getNonOverridingDataAttributes(element, {
          ...dataAttributes,
          'data-slot': 'highlight-item',
        }),
      })}
    </div>
  ) : (
    children
  )
}

export {
  Highlight,
  HighlightItem,
  useHighlight,
  type HighlightProps,
  type HighlightItemProps,
}
