import { type ReactNode } from 'react'

import { type NotificationItem } from '@/components/docyrus/notifications-panel'

export type { NotificationItem }

export interface NotificationStackProps {
  /**
   * Array of notification items to display in the stack
   */
  notifications: NotificationItem[]
  /**
   * Maximum number of cards visible in the stack
   * @default 10
   */
  maxVisible?: number
  /**
   * When remaining cards reach this count, auto-trigger onLoadMore
   * @default 2
   */
  loadMoreThreshold?: number
  /**
   * Callback to fetch more unread notifications
   */
  onLoadMore?: () => void
  /**
   * Callback when a card is dismissed (swiped or skip button)
   */
  onDismiss?: (id: string) => void
  /**
   * Callback when a card is clicked
   */
  onClick?: (id: string) => void
  /**
   * Callback when a notification action button is clicked.
   * The card is auto-dismissed after the action fires.
   */
  onAction?: (id: string, action: string) => void
  /**
   * Visual variant
   * @default 'default'
   */
  variant?: 'default' | 'bordered'
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg'
  /**
   * Content shown when no notifications remain
   */
  emptyState?: ReactNode
  /**
   * Additional className for the root element
   */
  className?: string
}
