import { formatDistanceToNow } from 'date-fns'
import { Link } from '@tanstack/react-router'
import {
  Bell,
  Building2,
  CheckSquare,
  ChevronDown,
  Contact,
  DollarSign,
  Plus,
  UserRoundSearch,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { NotificationItem } from '@/components/docyrus/notifications-panel'
import { ActivityFormDialog } from '@/components/activities/activity-form-dialog'
import { CompanyFormDialog } from '@/components/companies/company-form-dialog'
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog'
import { DealFormDialog } from '@/components/deals/deal-form-dialog'
import { NotificationsPanel } from '@/components/docyrus/notifications-panel'
import { LeadFormDialog } from '@/components/leads/lead-form-dialog'
import { QuickTaskDialog } from '@/components/tasks/quick-task-dialog'
import { FieldSalesLocationActions } from '@/components/field-sales/field-sales-location-actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from '@/hooks/use-notifications'

function getNotificationInitials(notification: any) {
  const fallback =
    notification.created_by_fullname || notification.subject || 'N'
  return fallback
    .split(' ')
    .map((part: string) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function AppHeaderActions() {
  const { t } = useTranslation()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState<
    'all' | 'unread'
  >('all')

  const [dealOpen, setDealOpen] = useState(false)
  const [leadOpen, setLeadOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [companyOpen, setCompanyOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  const { data: notifications = [], isLoading } = useNotifications()
  const unreadCount = notifications.filter(
    (notification: any) => !notification.seen,
  ).length
  const markNotificationAsRead = useMarkNotificationAsRead()
  const markAllNotificationsAsRead = useMarkAllNotificationsAsRead()

  const visibleNotifications = useMemo(() => {
    if (notificationFilter === 'unread') {
      return notifications.filter((notification: any) => !notification.seen)
    }
    return notifications
  }, [notificationFilter, notifications])

  const panelNotifications = useMemo<Array<NotificationItem>>(
    () =>
      visibleNotifications.slice(0, 6).map((notification: any) => ({
        id: notification.id,
        type: 'info',
        variant: notification.seen ? 'default' : 'unread',
        title: notification.subject || notification.message,
        subtitle: notification.created_by_fullname || t('notifications.title'),
        content: notification.message,
        timestamp: notification.created_on
          ? formatDistanceToNow(new Date(notification.created_on), {
              addSuffix: true,
            })
          : undefined,
        showUnreadIndicator: !notification.seen,
        icon: (
          <span className="text-xs font-semibold">
            {getNotificationInitials(notification)}
          </span>
        ),
        actions: notification.seen
          ? []
          : [
              {
                label: t('notifications.markRead'),
                variant: 'link',
                onClick: () => markNotificationAsRead.mutate(notification.id),
              },
            ],
      })),
    [markNotificationAsRead, t, visibleNotifications],
  )

  return (
    <>
      <DropdownMenu open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            {t('quickAdd.label')}
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>{t('quickAdd.label')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setLeadOpen(true)
            }}
          >
            <UserRoundSearch className="size-4" />
            {t('leads.newLead')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setDealOpen(true)
            }}
          >
            <DollarSign className="size-4" />
            {t('deals.newDeal')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setTaskOpen(true)
            }}
          >
            <CheckSquare className="size-4" />
            {t('tasks.newTask')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setCompanyOpen(true)
            }}
          >
            <Building2 className="size-4" />
            {t('companies.newCompany')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setContactOpen(true)
            }}
          >
            <Contact className="size-4" />
            {t('contacts.newContact')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setQuickCreateOpen(false)
              setActivityOpen(true)
            }}
          >
            <Zap className="size-4" />
            {t('activities.newActivity')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FieldSalesLocationActions />

      <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label={t('notifications.title')}
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[420px] p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-20 animate-pulse rounded-lg bg-muted" />
              <div className="h-20 animate-pulse rounded-lg bg-muted" />
              <div className="h-20 animate-pulse rounded-lg bg-muted" />
            </div>
          ) : (
            <NotificationsPanel
              className="max-w-none rounded-none border-0 shadow-none"
              title={t('notifications.title')}
              tabs={[
                {
                  label: t('notifications.all'),
                  count: notifications.length,
                  active: notificationFilter === 'all',
                  onClick: () => setNotificationFilter('all'),
                },
                {
                  label: t('notifications.unread'),
                  count: unreadCount,
                  active: notificationFilter === 'unread',
                  onClick: () => setNotificationFilter('unread'),
                },
              ]}
              headerAction={
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={
                    unreadCount === 0 || markAllNotificationsAsRead.isPending
                  }
                  onClick={() => markAllNotificationsAsRead.mutate()}
                >
                  {t('notifications.markAllRead')}
                </Button>
              }
              notifications={panelNotifications}
              emptyState={
                <div className="px-8 py-12 text-center text-muted-foreground">
                  {t('notifications.noNotifications')}
                </div>
              }
              footer={
                <Button variant="ghost" asChild>
                  <Link to="/inbox" onClick={() => setNotificationsOpen(false)}>
                    {t('notifications.viewAll')}
                  </Link>
                </Button>
              }
            />
          )}
        </PopoverContent>
      </Popover>

      <LeadFormDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        mode="create"
      />
      <DealFormDialog
        open={dealOpen}
        onOpenChange={setDealOpen}
        mode="create"
      />
      <CompanyFormDialog
        open={companyOpen}
        onOpenChange={setCompanyOpen}
        mode="create"
      />
      <ContactFormDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        mode="create"
      />
      <QuickTaskDialog open={taskOpen} onOpenChange={setTaskOpen} />
      <ActivityFormDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        mode="create"
      />
    </>
  )
}
