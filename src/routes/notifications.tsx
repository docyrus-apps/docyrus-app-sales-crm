import { Bell } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { useNotifications } from '@/hooks/use-notifications'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function Notifications() {
  const { data: notifications, isLoading } = useNotifications()

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Stay updated with your latest activities"
        icon={Bell}
      />
      <PageContainer>
        {isLoading && <Skeleton className="h-64 w-full" />}

        {notifications && notifications.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground mt-2">
                You're all caught up!
              </p>
            </CardContent>
          </Card>
        )}

        {notifications && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notification: any) => (
              <Card key={notification.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      {notification.created_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  )
}
