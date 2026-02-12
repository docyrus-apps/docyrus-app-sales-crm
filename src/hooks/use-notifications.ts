import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NotificationsCollection } from '@/collections'
import { QUERY_CONFIG } from '@/lib/constants'

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await NotificationsCollection.getNotifications()
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await NotificationsCollection.markNotificationAsRead(notificationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await NotificationsCollection.markAllNotificationsAsRead()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
