'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react'

import { AnimatePresence, motion } from 'motion/react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import { type NotificationStackProps } from './types'

import { NotificationStackCard } from './notification-stack-card'

const SCALE_STEP = 0.05
const OFFSET_STEP = 10
const OPACITY_STEP = 0.15

const notificationStackVariants = cva('relative w-full max-w-2xl', {
  variants: {
    variant: {
      default: '',
      bordered: '[&_[data-slot=stack-card]]:shadow-md',
    },
    size: {
      sm: '',
      default: '',
      lg: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

const NotificationStack = forwardRef<
  HTMLDivElement,
  NotificationStackProps &
    HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof notificationStackVariants>
>(
  (
    {
      notifications,
      maxVisible = 10,
      loadMoreThreshold = 2,
      onLoadMore,
      onDismiss,
      onClick,
      onAction,
      variant,
      size,
      emptyState,
      className,
      ...props
    },
    ref,
  ) => {
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
    const loadMoreCalledRef = useRef(false)

    const visibleNotifications = useMemo(() => {
      return notifications
        .filter((n) => !dismissedIds.has(n.id))
        .slice(0, maxVisible)
    }, [notifications, dismissedIds, maxVisible])

    const remainingCount = notifications.filter(
      (n) => !dismissedIds.has(n.id),
    ).length

    useEffect(() => {
      if (
        remainingCount <= loadMoreThreshold &&
        remainingCount > 0 &&
        onLoadMore &&
        !loadMoreCalledRef.current
      ) {
        loadMoreCalledRef.current = true
        onLoadMore()
      }
    }, [remainingCount, loadMoreThreshold, onLoadMore])

    useEffect(() => {
      if (remainingCount > loadMoreThreshold) {
        loadMoreCalledRef.current = false
      }
    }, [remainingCount, loadMoreThreshold])

    const handleDismiss = useCallback(
      (id: string) => {
        setDismissedIds((prev) => new Set(prev).add(id))
        onDismiss?.(id)
      },
      [onDismiss],
    )

    const handleAction = useCallback(
      (id: string, action: string) => {
        onAction?.(id, action)
        setDismissedIds((prev) => new Set(prev).add(id))
        onDismiss?.(id)
      },
      [onAction, onDismiss],
    )

    if (visibleNotifications.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(
            notificationStackVariants({ variant, size, className }),
          )}
          {...props}
        >
          {emptyState ?? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-sm text-muted-foreground">
              No notifications
            </div>
          )}
        </div>
      )
    }

    const stackDepth = Math.min(visibleNotifications.length, maxVisible)
    const stackOffset = (stackDepth - 1) * OFFSET_STEP

    return (
      <div
        ref={ref}
        className={cn(notificationStackVariants({ variant, size, className }))}
        style={{ paddingBottom: `${stackOffset}px` }}
        {...props}
      >
        <div className="relative">
          <AnimatePresence mode="popLayout">
            {visibleNotifications.map((notification, index) => {
              const itemScale = 1 - index * SCALE_STEP
              const translateY = index * OFFSET_STEP
              const zIndex = visibleNotifications.length - index
              const itemOpacity = 1 - index * OPACITY_STEP

              return (
                <motion.div
                  key={notification.id}
                  data-slot="stack-card"
                  layout
                  initial={{ scale: 0.95, opacity: 0, y: -20 }}
                  animate={{
                    scale: itemScale,
                    opacity: itemOpacity,
                    y: translateY,
                    zIndex,
                  }}
                  exit={{
                    x: 300,
                    opacity: 0,
                    transition: { duration: 0.3, ease: 'easeIn' },
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                  style={{
                    position: index === 0 ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transformOrigin: 'top center',
                    zIndex,
                    pointerEvents: index === 0 ? 'auto' : 'none',
                  }}
                >
                  <NotificationStackCard
                    notification={notification}
                    size={size}
                    onDismiss={handleDismiss}
                    onClick={onClick}
                    onAction={handleAction}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    )
  },
)

NotificationStack.displayName = 'NotificationStack'

export { NotificationStack, notificationStackVariants }
