import { Link, useLocation } from '@tanstack/react-router'
import {
  Bell,
  Building2,
  Calendar,
  CheckSquare,
  DollarSign,
  FileText,
  Home,
  Mail,
  Package,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
    badge: 'notifications',
  },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, badge: 'tasks' },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Emails', href: '/emails', icon: Mail },
]

const records = [
  { name: 'Deals', href: '/deals', icon: DollarSign },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Sales Orders', href: '/sales-orders', icon: FileText },
]

export function AppSidebar() {
  const location = useLocation()
  const { data: notifications } = useNotifications()

  const unreadCount = notifications?.filter((n: any) => !n.seen).length || 0

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Sales CRM</h2>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.name}</span>
                {item.badge === 'notifications' && unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-5 min-w-5 rounded-full px-1 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
            RECORDS
          </div>
          {records.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">© 2026 Sales CRM</div>
      </div>
    </div>
  )
}
