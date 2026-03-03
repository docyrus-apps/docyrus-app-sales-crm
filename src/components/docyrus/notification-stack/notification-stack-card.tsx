'use client'

import { forwardRef, useCallback } from 'react'

import { X } from 'lucide-react'
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'motion/react'
import { cva, type VariantProps } from 'class-variance-authority'

import {
  notificationIconVariants,
  notificationBadgeVariants,
  notificationButtonVariants,
  type NotificationItem,
} from '@/components/docyrus/notifications-panel'
import { cn } from '@/lib/utils'

const SWIPE_THRESHOLD = 100
const SWIPE_VELOCITY = 500

const notificationStackCardVariants = cva(
  'relative w-full rounded-lg border border-border bg-background shadow-sm select-none touch-pan-y',
  {
    variants: {
      variant: {
        default: '',
        unread: 'bg-background',
        highlighted: 'bg-background',
      },
      size: {
        sm: 'px-4 py-3 text-[10px]',
        default: 'px-6 py-4 text-xs',
        lg: 'px-8 py-5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface NotificationStackCardProps extends VariantProps<
  typeof notificationStackCardVariants
> {
  notification: NotificationItem
  onDismiss?: (id: string) => void
  onClick?: (id: string) => void
  onAction?: (id: string, action: string) => void
  className?: string
}

const NotificationStackCard = forwardRef<
  HTMLDivElement,
  NotificationStackCardProps
>(({ className, size, notification, onDismiss, onClick, onAction }, ref) => {
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0])
  const rotate = useTransform(x, [-200, 0, 200], [-8, 0, 8])

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const shouldDismiss =
        Math.abs(info.offset.x) > SWIPE_THRESHOLD ||
        Math.abs(info.velocity.x) > SWIPE_VELOCITY

      if (shouldDismiss) {
        onDismiss?.(notification.id)
      }
    },
    [notification.id, onDismiss],
  )

  const handleActionClick = useCallback(
    (action: { label: string; onClick?: () => void }) => {
      action.onClick?.()
      onAction?.(notification.id, action.label)
    },
    [notification.id, onAction],
  )

  const handleCardClick = useCallback(() => {
    onClick?.(notification.id)
  }, [notification.id, onClick])

  return (
    <motion.div
      ref={ref}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      style={{ x, opacity, rotate }}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      className={cn(
        notificationStackCardVariants({
          variant: notification.variant,
          size,
          className,
        }),
      )}
    >
      {/* Dismiss button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss?.(notification.id)
        }}
        className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors z-10"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardClick()
          }
        }}
      >
        {/* Icon */}
        <div className="flex-shrink-0 relative">
          {notification.icon ? (
            <div
              className={cn(
                notificationIconVariants({ variant: notification.type }),
                size === 'sm' && 'w-8 h-8 text-[10px]',
                size === 'lg' && 'w-12 h-12 text-sm',
              )}
            >
              {typeof notification.icon === 'string' ? (
                <span>{notification.icon}</span>
              ) : (
                notification.icon
              )}
            </div>
          ) : (
            <div
              className={cn(
                notificationIconVariants({ variant: notification.type }),
                size === 'sm' && 'w-8 h-8',
                size === 'lg' && 'w-12 h-12',
              )}
            />
          )}
          {notification.badge && (
            <span
              className={cn(
                notificationBadgeVariants({ variant: notification.type }),
                size === 'sm' && 'w-4 h-4',
                size === 'lg' && 'w-6 h-6',
              )}
            >
              {notification.badge}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-baseline justify-between">
            <div className="font-semibold text-foreground truncate">
              {notification.title}
            </div>
            {notification.timestamp && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                {notification.timestamp}
              </span>
            )}
          </div>

          {notification.subtitle && (
            <div className="mt-1 text-muted-foreground">
              {notification.subtitle}
            </div>
          )}

          {notification.content && (
            <div className="mt-1 text-muted-foreground">
              {notification.content}
            </div>
          )}

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              {notification.actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleActionClick(action)
                  }}
                  className={cn(
                    notificationButtonVariants({
                      variant: action.variant || 'default',
                    }),
                  )}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Unread indicator */}
        {notification.showUnreadIndicator && (
          <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
        )}
      </div>
    </motion.div>
  )
})

NotificationStackCard.displayName = 'NotificationStackCard'

export { NotificationStackCard, notificationStackCardVariants }
