import { Link, useLocation } from '@tanstack/react-router'
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronsUpDown,
  Contact,
  CreditCard,
  DollarSign,
  Home,
  LogOut,
  Monitor,
  Moon,
  NotepadText,
  Package,
  ShoppingCart,
  Sparkles,
  Sun,
  UserRoundSearch,
  Zap,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useDocyrusAuth } from '@docyrus/signin'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
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
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/hooks/use-mobile'
import { useNotifications } from '@/hooks/use-notifications'

const menuItems = [
  { title: 'Home', url: '/', icon: Home },
  {
    title: 'Notifications',
    url: '/notifications',
    icon: Bell,
    badge: 'notifications',
  },
  { title: 'Deals', url: '/deals', icon: DollarSign },
  { title: 'Leads', url: '/leads', icon: UserRoundSearch },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare },
  { title: 'Notes', url: '/notes', icon: NotepadText },
  { title: 'Activities', url: '/activities', icon: Zap },
  { title: 'Events', url: '/events', icon: CalendarDays },
  { title: 'Reports', url: '/reports', icon: BarChart3 },
]

const dataSources = [
  { title: 'Organizations', url: '/companies', icon: Building2 },
  { title: 'Contacts', url: '/contacts', icon: Contact },
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Sales Orders', url: '/sales-orders', icon: ShoppingCart },
]

export function AppSidebar() {
  const location = useLocation()
  const isMobile = useIsMobile()
  const { data: notifications } = useNotifications()
  const { signOut } = useDocyrusAuth()
  const { setTheme, theme } = useTheme()

  const unreadCount = notifications?.filter((n: any) => !n.seen).length || 0

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* App Branding */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img src="/logo.svg" alt="Sales CRM" className="size-6" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Sales CRM by Docyrus
                  </span>
                  <span className="truncate text-xs">Manage your pipeline</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => {
              const isActive =
                item.url === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.url)
              const showBadge =
                'badge' in item &&
                item.badge === 'notifications' &&
                unreadCount > 0

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                      {showBadge && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 min-w-5 rounded-full px-1 text-xs"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Data Sources */}
        <SidebarGroup>
          <SidebarGroupLabel>Data Sources</SidebarGroupLabel>
          <SidebarMenu>
            {dataSources.map((item) => {
              const isActive = location.pathname.startsWith(item.url)
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Nav User */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">User</span>
                    <span className="truncate text-xs">user@example.com</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">User</span>
                      <span className="truncate text-xs">user@example.com</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Sparkles />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard />
                    Billing
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
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun />
                    Light
                    {theme === 'light' && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        ✓
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon />
                    Dark
                    {theme === 'dark' && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        ✓
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor />
                    System
                    {theme === 'system' && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        ✓
                      </span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut />
                  Log out
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
