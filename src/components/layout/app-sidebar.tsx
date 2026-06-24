import { useEffect, useRef, useState } from 'react'

import type { UserEntity } from '@/collections/users.collection'

import { type LucideIcon } from 'lucide-react'

import {
  Activity,
  BadgeCheck,
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ChevronsUpDown,
  Contact,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  Package,
  PhoneCall,
  Route,
  Search,
  Settings,
  SlidersHorizontal,
  UserRoundSearch,
  Zap
} from 'lucide-react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDocyrusAuth } from '@docyrus/signin'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from '@/components/animate-ui/components/radix/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/animate-ui/components/radix/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUsersCollection } from '@/collections/users.collection'
import { ThemeToggle } from '@/components/theme-toggle'
import { ThemeSelector } from '@/components/theme-selector'
import { ProfileDialog } from '@/components/user/profile-dialog'
import { ChangePasswordDialog } from '@/components/user/change-password-dialog'
import { LanguageSelector } from '@/components/shared/language-selector'
import { useAppModules } from '@/hooks/use-app-config'
import { isModuleEnabled } from '@/lib/app-config'

type NavItem = {
  titleKey: string;
  url: string;
  icon: LucideIcon;
}

const DASHBOARD_NAV: NavItem = {
  titleKey: 'nav.dashboard',
  url: '/',
  icon: LayoutDashboard
}

const CRM_NAV_KEYS: Array<NavItem> = [
  { titleKey: 'leads.title', url: '/leads', icon: UserRoundSearch },
  { titleKey: 'deals.title', url: '/deals', icon: DollarSign },
  { titleKey: 'quotes.title', url: '/sales-orders', icon: FileText },
  { titleKey: 'contacts.title', url: '/contacts', icon: Contact },
  { titleKey: 'companies.title', url: '/companies', icon: Building2 },
  { titleKey: 'products.title', url: '/products', icon: Package }
]

const WEBPHONE_CALLS_ITEM: NavItem = {
  titleKey: 'webphone.calls.navTitle',
  url: '/calls',
  icon: PhoneCall
}

const FIELD_SALES_NAV_KEYS: Array<NavItem> = [
  {
    titleKey: 'fieldSales.plans.title',
    url: '/field-sales/plans',
    icon: Route
  },
  {
    titleKey: 'fieldSales.approvals.title',
    url: '/field-sales/approvals',
    icon: CalendarCheck2
  },
  {
    titleKey: 'fieldSales.calendar.title',
    url: '/field-sales/calendar',
    icon: MapPinned
  }
]

const APP_CONFIG_NAV: NavItem = {
  titleKey: 'appConfig.navTitle',
  url: '/app-config',
  icon: SlidersHorizontal
}

function useGroupOpen(groupId: string, hasActive: boolean) {
  const storageKey = `sidebar.group.${groupId}`
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem(storageKey)

    if (stored !== null) return stored === '1'

    return true
  })
  const prevActive = useRef(false)

  useEffect(() => {
    // Auto-expand a group when the active route moves into it.
    if (hasActive && !prevActive.current) {
      setOpen(true)
    }
    prevActive.current = hasActive
  }, [hasActive])

  const onOpenChange = (value: boolean) => {
    setOpen(value)
    try {
      window.localStorage.setItem(storageKey, value ? '1' : '0')
    } catch {
      // Ignore storage failures (e.g. private browsing).
    }
  }

  return { open, onOpenChange }
}

function CollapsibleNavGroup({
  groupId,
  label,
  icon: Icon,
  items,
  matchRoute,
  t
}: {
  groupId: string;
  label: string;
  icon: LucideIcon;
  items: Array<NavItem>;
  matchRoute: ReturnType<typeof useMatchRoute>;
  t: (key: string) => string;
}) {
  const { state } = useSidebar()
  const isIconMode = state === 'collapsed'
  const hasActive = items.some(
    item => !!matchRoute({ to: item.url, fuzzy: true })
  )
  const { open, onOpenChange } = useGroupOpen(groupId, hasActive)
  // In icon (rail) mode group labels are hidden, so keep items reachable.
  const effectiveOpen = isIconMode ? true : open

  return (
    <Collapsible
      open={effectiveOpen}
      onOpenChange={onOpenChange}
      className="group/collapsible">
      <SidebarGroup className="py-0.5">
        <SidebarGroupLabel
          asChild
          className="w-full cursor-pointer gap-2 text-[11px] font-semibold tracking-wider uppercase text-sidebar-foreground/55 transition-colors hover:text-sidebar-foreground">
          <CollapsibleTrigger>
            <Icon className="size-4 shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            <ChevronRight className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="pl-4 group-data-[collapsible=icon]:pl-0">
              {items.map((item) => {
                const isActive = matchRoute({ to: item.url, fuzzy: true })
                const title = t(item.titleKey)

                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={!!isActive}
                      tooltip={title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function AppSidebar() {
  const { signOut } = useDocyrusAuth()
  const matchRoute = useMatchRoute()
  const { state } = useSidebar()
  const { t } = useTranslation()
  const { data: modules } = useAppModules()
  const fieldSalesEnabled = isModuleEnabled(modules, 'fieldSales')
  const webphoneEnabled = isModuleEnabled(modules, 'webphone')
  const operationsItems: Array<NavItem> = [
    { titleKey: 'tasks.title', url: '/tasks', icon: CheckSquare },
    { titleKey: 'activities.title', url: '/activities', icon: Zap },
    { titleKey: 'calendar.title', url: '/calendar', icon: CalendarDays },
    ...(webphoneEnabled ? [WEBPHONE_CALLS_ITEM] : []),
    { titleKey: 'reports.title', url: '/reports', icon: BarChart3 }
  ]
  const usersCollection = useUsersCollection()
  const [userProfile, setUserProfile] = useState<
    (UserEntity & { photo?: string }) | null
  >(null)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false)

  useEffect(() => {
    usersCollection.getMyInfo().then(setUserProfile).catch(console.error)
  }, [])

  const initials = userProfile
    ? `${(userProfile.firstname[0] || '').toUpperCase()}${(userProfile.lastname[0] || '').toUpperCase()}`
    : '?'

  const displayName = userProfile
    ? [userProfile.firstname, userProfile.lastname].filter(Boolean).join(' ') ||
    userProfile.email
    : t('common.loading')

  const tenantName = userProfile?.tenant?.name ?? userProfile?.name ?? ''
  const tenantLogoUrl = userProfile?.tenant?.logo_url
  const tenantInitials = tenantName
    .split(' ')
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('')

  const isCollapsed = state === 'collapsed'

  const openCommandPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true
      })
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
                  className="cursor-pointer rounded-lg bg-card shadow-sm data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
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
                          className="h-4 w-4 shrink-0 rounded object-contain" />
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
                sideOffset={4}>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      {userProfile?.photo && (
                        <AvatarImage
                          src={userProfile.photo}
                          alt={displayName} />
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
                    onClick={() => setChangePasswordDialogOpen(true)}>
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

      <SidebarContent className="gap-0">
        {/* Search trigger */}
        <SidebarGroup className="pb-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t('nav.searchTooltip')}
                onClick={openCommandPalette}
                className="cursor-pointer rounded-lg bg-card text-muted-foreground shadow-sm">
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

        {/* Dashboard (pinned, top of nav list) */}
        <SidebarGroup className="py-0.5">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={!!matchRoute({ to: DASHBOARD_NAV.url })}
                tooltip={t(DASHBOARD_NAV.titleKey)}
                className="text-[11px] font-semibold tracking-wider uppercase text-sidebar-foreground/55">
                <Link to={DASHBOARD_NAV.url}>
                  <DASHBOARD_NAV.icon />
                  <span>{t(DASHBOARD_NAV.titleKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <CollapsibleNavGroup
          groupId="crm"
          label={t('nav.crm', 'CRM')}
          icon={Briefcase}
          items={CRM_NAV_KEYS}
          matchRoute={matchRoute}
          t={t} />
        <CollapsibleNavGroup
          groupId="operations"
          label={t('nav.operations', 'Operasyon')}
          icon={Activity}
          items={operationsItems}
          matchRoute={matchRoute}
          t={t} />
        {fieldSalesEnabled && (
          <CollapsibleNavGroup
            groupId="fieldSales"
            label={t('fieldSales.groupLabel', 'Saha Satış')}
            icon={Map}
            items={FIELD_SALES_NAV_KEYS}
            matchRoute={matchRoute}
            t={t} />
        )}

        {/* App Config (pinned, bottom) */}
        <SidebarGroup className="mt-auto pt-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={!!matchRoute({ to: APP_CONFIG_NAV.url, fuzzy: true })}
                tooltip={t(APP_CONFIG_NAV.titleKey)}>
                <Link to={APP_CONFIG_NAV.url}>
                  <APP_CONFIG_NAV.icon />
                  <span>{t(APP_CONFIG_NAV.titleKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={t('sidebar.appName')}
              className="cursor-default">
              <img
                src="/logo.svg"
                alt="Docyrus"
                className="h-8 w-8 shrink-0 rounded-lg object-contain" />
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
        onOpenChange={setProfileDialogOpen} />
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onOpenChange={setChangePasswordDialogOpen} />
    </Sidebar>
  )
}
