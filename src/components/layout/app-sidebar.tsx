import { useEffect, useState } from 'react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckSquare,
  ChevronsUpDown,
  Contact,
  DollarSign,
  Home,
  Inbox,
  LogOut,
  MapPinned,
  NotepadText,
  Package,
  Route,
  Search,
  Settings,
  ShoppingCart,
  UserRoundSearch,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDocyrusAuth } from '@docyrus/signin'
import type { UserEntity } from '@/collections/users.collection'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/animate-ui/components/radix/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUsersCollection } from '@/collections/users.collection'
import { useNotifications } from '@/hooks/use-notifications'
import { ThemeToggle } from '@/components/theme-toggle'
import { ThemeSelector } from '@/components/theme-selector'
import { ProfileDialog } from '@/components/user/profile-dialog'
import { ChangePasswordDialog } from '@/components/user/change-password-dialog'
import { LanguageSelector } from '@/components/shared/language-selector'

type NavItem = {
  titleKey: string
  url: string
  icon: typeof Home
  hasBadge?: boolean
}

const MAIN_NAV_KEYS: NavItem[] = [
  { titleKey: 'nav.home', url: '/', icon: Home },
  {
    titleKey: 'notifications.title',
    url: '/inbox',
    icon: Inbox,
  },
  { titleKey: 'deals.title', url: '/deals', icon: DollarSign },
  { titleKey: 'leads.title', url: '/leads', icon: UserRoundSearch },
  { titleKey: 'tasks.title', url: '/tasks', icon: CheckSquare },
  { titleKey: 'notes.title', url: '/notes', icon: NotepadText },
  { titleKey: 'activities.title', url: '/activities', icon: Zap },
  { titleKey: 'calendar.title', url: '/calendar', icon: CalendarDays },
  { titleKey: 'reports.title', url: '/reports', icon: BarChart3 },
]

const DATA_SOURCES_NAV_KEYS: NavItem[] = [
  { titleKey: 'companies.title', url: '/companies', icon: Building2 },
  { titleKey: 'contacts.title', url: '/contacts', icon: Contact },
  { titleKey: 'products.title', url: '/products', icon: Package },
  { titleKey: 'salesOrders.title', url: '/sales-orders', icon: ShoppingCart },
]

const FIELD_SALES_NAV_KEYS: NavItem[] = [
  {
    titleKey: 'fieldSales.plans.title',
    url: '/field-sales/plans',
    icon: Route,
  },
  {
    titleKey: 'fieldSales.approvals.title',
    url: '/field-sales/approvals',
    icon: CalendarCheck2,
  },
  {
    titleKey: 'fieldSales.calendar.title',
    url: '/field-sales/calendar',
    icon: MapPinned,
  },
  {
    titleKey: 'fieldSales.settings.title',
    url: '/settings',
    icon: Settings,
  },
]

function NavGroup({
  label,
  items,
  matchRoute,
  unreadCount,
  t,
}: {
  label: string
  items: Array<NavItem>
  matchRoute: ReturnType<typeof useMatchRoute>
  unreadCount?: number
  t: (key: string) => string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = matchRoute({ to: item.url, fuzzy: true })
          const title = t(item.titleKey)
          return (
            <SidebarMenuItem key={item.titleKey}>
              <SidebarMenuButton asChild isActive={!!isActive} tooltip={title}>
                <Link to={item.url}>
                  <item.icon />
                  <span>{title}</span>
                </Link>
              </SidebarMenuButton>
              {'hasBadge' in item &&
                item.hasBadge &&
                unreadCount !== undefined &&
                unreadCount > 0 && (
                  <SidebarMenuBadge>{unreadCount}</SidebarMenuBadge>
                )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const { signOut } = useDocyrusAuth()
  const matchRoute = useMatchRoute()
  const { state } = useSidebar()
  const { t } = useTranslation()
  const { data: notifications } = useNotifications()
  const usersCollection = useUsersCollection()
  const [userProfile, setUserProfile] = useState<
    (UserEntity & { photo?: string }) | null
  >(null)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false)

  const unreadCount = notifications?.filter((n: any) => !n.seen).length || 0

  useEffect(() => {
    usersCollection.getMyInfo().then(setUserProfile).catch(console.error)
  }, [])

  const initials = userProfile
    ? `${(userProfile.firstname[0] || '').toUpperCase()}${(userProfile.lastname[0] || '').toUpperCase()}`
    : '?'

  const displayName = userProfile
    ? [userProfile.firstname, userProfile.lastname].filter(Boolean).join(' ') ||
      userProfile.email
    : 'Loading...'

  const tenantName = userProfile?.tenant?.name ?? userProfile?.name ?? ''
  const tenantLogoUrl = userProfile?.tenant?.logo_url
  const tenantInitials = tenantName
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')

  const isCollapsed = state === 'collapsed'

  const openCommandPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
      }),
    )
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="cursor-pointer rounded-lg bg-card shadow-sm data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    {userProfile?.photo && (
                      <AvatarImage src={userProfile.photo} alt={displayName} />
                    )}
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {displayName}
                    </span>
                    <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      {tenantLogoUrl ? (
                        <img
                          src={tenantLogoUrl}
                          alt={tenantName}
                          className="h-4 w-4 shrink-0 rounded object-contain"
                        />
                      ) : tenantInitials ? (
                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-medium text-primary">
                          {tenantInitials}
                        </span>
                      ) : null}
                      <span className="truncate">{tenantName}</span>
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="right"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      {userProfile?.photo && (
                        <AvatarImage
                          src={userProfile.photo}
                          alt={displayName}
                        />
                      )}
                      <AvatarFallback className="rounded-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {displayName}
                      </span>
                      <span className="truncate text-xs">
                        {userProfile?.email ?? ''}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                    <BadgeCheck />
                    {t('sidebar.myProfile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setChangePasswordDialogOpen(true)}
                  >
                    <Settings />
                    {t('sidebar.changePassword')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {t('sidebar.themeMode', 'Theme Mode')}
                  </DropdownMenuLabel>
                  <div className="px-2 pb-1.5">
                    <ThemeToggle />
                  </div>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {t('sidebar.colorTheme', 'Color Theme')}
                  </DropdownMenuLabel>
                  <div className="px-2 pb-1.5">
                    <ThemeSelector />
                  </div>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <LanguageSelector />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut />
                  {t('sidebar.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Search trigger */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t('nav.searchTooltip')}
                onClick={openCommandPalette}
                className="cursor-pointer rounded-lg bg-card text-muted-foreground shadow-sm"
              >
                <Search />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">
                      {t('nav.searchAnything')}
                    </span>
                    <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">&#8984;</span>K
                    </kbd>
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <NavGroup
          label={t('nav.mainNavigation')}
          items={MAIN_NAV_KEYS}
          matchRoute={matchRoute}
          unreadCount={unreadCount}
          t={t}
        />
        <NavGroup
          label={t('nav.dataSources', 'Data Sources')}
          items={DATA_SOURCES_NAV_KEYS}
          matchRoute={matchRoute}
          t={t}
        />
        <NavGroup
          label={t('fieldSales.groupLabel', 'Saha Satış')}
          items={FIELD_SALES_NAV_KEYS}
          matchRoute={matchRoute}
          t={t}
        />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Sales CRM"
              className="cursor-default"
            >
              <img
                src="/logo.svg"
                alt="Docyrus"
                className="h-8 w-8 shrink-0 rounded-lg object-contain"
              />
              <span className="flex items-baseline gap-1 truncate">
                <span className="text-sm font-semibold">
                  {t('sidebar.appName')}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  by Docyrus
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onOpenChange={setChangePasswordDialogOpen}
      />
    </Sidebar>
  )
}
