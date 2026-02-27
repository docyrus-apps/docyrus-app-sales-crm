// Generated collection for notifications
import { useDocyrusClient } from '@docyrus/signin'

export interface NotificationEntity {
  /** Notification ID */
  id: string

  /** Notification subject */
  subject: string

  /** Notification message */
  message: string

  /** Notification status */
  status: string

  /** Whether notification is seen */
  seen: boolean

  /** Notification created on */
  created_on: string

  /** Notification notify on */
  notify_on: string

  /** Notification created by */
  created_by: string

  /** Notification record owner */
  record_owner: string

  /** Notification created by ID */
  created_by_id: string

  /** Notification created by full name */
  created_by_fullname: string

  /** Notification created by photo */
  created_by_photo: string
}

export function useNotificationsCollection() {
  const client = useDocyrusClient()

  return {
    /**
     * Get notifications
     * @returns Array<NotificationEntity>
     */
    getNotifications: (): Promise<Array<NotificationEntity>> =>
      client!.get<Array<NotificationEntity>>('/v1/notifications'),

    /**
     * Mark notification as read
     * @param notification_id -
     */
    markNotificationAsRead: (notification_id: string) =>
      client!.put(
        '/v1/notifications/{notification_id}/status/read'.replace(
          '{notification_id}',
          notification_id.toString(),
        ),
      ),

    /**
     * Mark notification as unread
     * @param notification_id -
     */
    markNotificationAsUnread: (notification_id: string) =>
      client!.put(
        '/v1/notifications/{notification_id}/status/unread'.replace(
          '{notification_id}',
          notification_id.toString(),
        ),
      ),

    /**
     * Mark all notifications as read
     */
    markAllNotificationsAsRead: () =>
      client!.put('/v1/notifications/status/read'),
  }
}
