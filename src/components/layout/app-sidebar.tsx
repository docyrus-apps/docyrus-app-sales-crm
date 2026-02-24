import { useEffect, useState } from 'react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronsUpDown,
  Contact,
  DollarSign,
  Home,
  LogOut,
  Monitor,
  Moon,
  NotepadText,
  Package,
  Search,
  ShoppingCart,
  Sun,
  UserRoundSearch,
  Zap,
} from 'lucide-react'
import { useTheme } from 'next-themes'
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
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UsersCollection } from '@/collections/users.collection'
import { useNotifications } from '@/hooks/use-notifications'

const MAIN_NAV = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Notifications', url: '/notifications', icon: Bell, hasBadge: true },
  { title: 'Deals', url: '/deals', icon: DollarSign },
  { title: 'Leads', url: '/leads', icon: UserRoundSearch },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare },
  { title: 'Notes', url: '/notes', icon: NotepadText },
  { title: 'Activities', url: '/activities', icon: Zap },
  { title: 'Events', url: '/events', icon: CalendarDays },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
]

const DATA_SOURCES_NAV = [
  { title: 'Organizations', url: '/companies', icon: Building2 },
  { title: 'Contacts', url: '/contacts', icon: Contact },
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Sales Orders', url: '/sales-orders', icon: ShoppingCart },
]

type NavItem = (typeof MAIN_NAV)[number]

function NavGroup({
  label,
  items,
  matchRoute,
  unreadCount,
}: {
  label: string
  items: Array<NavItem>
  matchRoute: ReturnType<typeof useMatchRoute>
  unreadCount?: number
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = matchRoute({ to: item.url, fuzzy: true })
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={!!isActive}
                tooltip={item.title}
              >
                <Link to={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
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
  const { setTheme, theme } = useTheme()
  const { data: notifications } = useNotifications()
  const [userProfile, setUserProfile] = useState<UserEntity | null>(null)

  const unreadCount = notifications?.filter((n: any) => !n.seen).length || 0

  useEffect(() => {
    UsersCollection.getMyInfo().then(setUserProfile).catch(console.error)
  }, [])

  const initials = userProfile
    ? `${(userProfile.firstname[0] || '').toUpperCase()}${(userProfile.lastname[0] || '').toUpperCase()}`
    : '?'

  const displayName = userProfile
    ? [userProfile.firstname, userProfile.lastname].filter(Boolean).join(' ') ||
      userProfile.email
    : 'Loading...'

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
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <img src="/logo.svg" alt="Docyrus" className="size-8" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Sales CRM by Docyrus
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Search trigger */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Search"
                onClick={openCommandPalette}
                className="rounded-lg bg-card text-muted-foreground shadow-sm"
              >
                <Search />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">Search anything</span>
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
          label="Main Navigation"
          items={MAIN_NAV}
          matchRoute={matchRoute}
          unreadCount={unreadCount}
        />
        <NavGroup
          label="Data Sources"
          items={DATA_SOURCES_NAV}
          matchRoute={matchRoute}
        />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-lg bg-card shadow-sm data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
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
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
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
                  <DropdownMenuItem>
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Theme
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setTheme('light')}
                    className={theme === 'light' ? 'bg-accent' : ''}
                  >
                    <Sun />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme('dark')}
                    className={theme === 'dark' ? 'bg-accent' : ''}
                  >
                    <Moon />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme('system')}
                    className={theme === 'system' ? 'bg-accent' : ''}
                  >
                    <Monitor />
                    System
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
