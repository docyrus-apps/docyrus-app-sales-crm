import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNotificationsCollection } from '@/collections'
import { QUERY_CONFIG } from '@/lib/constants'

export function useNotifications() {
  const notificationsCollection = useNotificationsCollection()

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationsCollection.getNotifications()
      return response
    },
    // Auto-refresh notifications every 30 seconds
    refetchInterval: 30000,
    staleTime: QUERY_CONFIG.STALE_TIME.USER_DATA,
  })
}

export function useUnreadNotificationCount() {
  const { data: notifications } = useNotifications()
  return notifications?.filter((n: any) => !n.seen).length || 0
}

export function useMarkNotificationAsRead() {
  const notificationsCollection = useNotificationsCollection()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await notificationsCollection.markNotificationAsRead(notificationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const notificationsCollection = useNotificationsCollection()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await notificationsCollection.markAllNotificationsAsRead()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
