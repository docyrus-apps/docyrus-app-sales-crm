'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const notificationsPanelVariants = cva(
  'w-full max-w-2xl bg-card rounded-lg border border-border shadow-sm overflow-hidden',
  {
    variants: {
      variant: {
        default: '',
        bordered: 'shadow-md',
      },
      size: {
        default: 'text-xs',
        sm: 'text-[10px]',
        lg: 'text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

const notificationItemVariants = cva(
  'px-8 py-6 hover:bg-muted/50 transition-colors group',
  {
    variants: {
      variant: {
        default: '',
        unread: 'bg-orange-50/30 dark:bg-orange-950/20',
        highlighted: 'bg-blue-50/20 dark:bg-blue-950/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const notificationIconVariants = cva(
  'w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs',
  {
    variants: {
      variant: {
        comment: 'bg-blue-100 text-blue-600 border-blue-200',
        approval: 'bg-orange-100 text-orange-600 border-orange-200',
        status: 'bg-purple-100 text-purple-600 border-purple-200',
        info: 'bg-blue-50 text-blue-500 border-blue-100',
        success: 'bg-emerald-100 text-emerald-600 border-emerald-200',
        warning: 'bg-amber-100 text-amber-600 border-amber-200',
        error: 'bg-red-100 text-red-600 border-red-200',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

const notificationBadgeVariants = cva(
  'absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center shadow-sm border border-border',
  {
    variants: {
      variant: {
        comment: 'text-blue-500',
        approval: 'text-orange-500',
        status: 'text-purple-500',
        info: 'text-blue-400',
        success: 'text-emerald-500',
        warning: 'text-amber-500',
        error: 'text-red-500',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

const notificationTabVariants = cva(
  'pb-4 text-xs font-semibold px-1 transition-colors',
  {
    variants: {
      active: {
        true: 'border-b-2 border-primary text-foreground',
        false: 'text-muted-foreground hover:text-foreground',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
)

const notificationButtonVariants = cva(
  'text-[10px] font-medium px-3 py-1.5 rounded-md transition-colors shadow-sm flex items-center gap-1',
  {
    variants: {
      variant: {
        default:
          'text-muted-foreground bg-card border border-border hover:bg-muted/50 hover:text-foreground',
        primary: 'text-primary-foreground bg-primary hover:bg-primary/90',
        danger:
          'text-destructive bg-card border border-border hover:bg-destructive/10 hover:border-destructive/30',
        link: 'text-primary hover:text-primary/80 shadow-none px-0 py-0 gap-1 group-hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface NotificationsPanelProps
  extends
    HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationsPanelVariants> {
  /**
   * Header title for the notifications panel
   */
  title?: string
  /**
   * Action button in the header (e.g., "Mark all as read")
   */
  headerAction?: ReactNode
  /**
   * Tab configuration for filtering notifications
   */
  tabs?: Array<{
    label: string
    count?: number
    active?: boolean
    onClick?: () => void
  }>
  /**
   * Array of notification items
   */
  notifications?: Array<NotificationItem>
  /**
   * Footer content (e.g., "Load more" button)
   */
  footer?: ReactNode
  /**
   * Callback when a notification action is triggered
   */
  onNotificationAction?: (notificationId: string, action: string) => void
}

export interface NotificationItem {
  id: string
  type:
    | 'comment'
    | 'approval'
    | 'status'
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
  variant?: 'default' | 'unread' | 'highlighted'
  icon?: ReactNode
  badge?: ReactNode
  title: string | ReactNode
  subtitle?: string | ReactNode
  content?: ReactNode
  timestamp?: string
  showUnreadIndicator?: boolean
  actions?: Array<{
    label: string
    variant?: 'default' | 'primary' | 'danger' | 'link'
    icon?: ReactNode
    onClick?: () => void
  }>
}

const NotificationsPanel = forwardRef<HTMLDivElement, NotificationsPanelProps>(
  (
    {
      className,
      variant,
      size,
      title = 'Notifications',
      headerAction,
      tabs,
      notifications,
      footer,
      onNotificationAction,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(notificationsPanelVariants({ variant, size, className }))}
        {...props}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            {headerAction}
          </div>

          {/* Tabs */}
          {tabs && tabs.length > 0 && (
            <div className="flex space-x-8 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  onClick={tab.onClick}
                  className={cn(
                    notificationTabVariants({ active: tab.active }),
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && ` (${tab.count})`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-border">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  notificationItemVariants({ variant: notification.variant }),
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 relative">
                    {notification.icon ? (
                      <div
                        className={cn(
                          notificationIconVariants({
                            variant: notification.type,
                          }),
                        )}
                      >
                        {notification.icon}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          notificationIconVariants({
                            variant: notification.type,
                          }),
                        )}
                      />
                    )}
                    {notification.badge && (
                      <span
                        className={cn(
                          notificationBadgeVariants({
                            variant: notification.type,
                          }),
                        )}
                      >
                        {notification.badge}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <div className="text-xs font-semibold text-foreground">
                        {notification.title}
                      </div>
                      {notification.timestamp && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {notification.timestamp}
                        </span>
                      )}
                    </div>

                    {notification.subtitle && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {notification.subtitle}
                      </div>
                    )}

                    {notification.content && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {notification.content}
                      </div>
                    )}

                    {/* Actions */}
                    {notification.actions &&
                      notification.actions.length > 0 && (
                        <div className="mt-3 flex items-center gap-3">
                          {notification.actions.map((action) => (
                            <button
                              key={action.label}
                              onClick={() => {
                                action.onClick?.()
                                onNotificationAction?.(
                                  notification.id,
                                  action.label,
                                )
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

                  {/* Unread Indicator */}
                  {notification.showUnreadIndicator && (
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-8 py-12 text-center text-muted-foreground">
              No notifications
            </div>
          )}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-8 py-4 bg-muted/50 flex justify-center border-t border-border">
            {footer}
          </div>
        )}
      </div>
    )
  },
)

NotificationsPanel.displayName = 'NotificationsPanel'

export {
  NotificationsPanel,
  notificationsPanelVariants,
  notificationItemVariants,
  notificationIconVariants,
  notificationBadgeVariants,
  notificationTabVariants,
  notificationButtonVariants,
}
