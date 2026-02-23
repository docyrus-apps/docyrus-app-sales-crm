import { useMemo } from 'react'
import { Link, useLocation, useParams } from '@tanstack/react-router'
import { AppSidebar } from './app-sidebar'
import type { ReactNode } from 'react'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const SEGMENT_LABELS: Record<string, string> = {
  deals: 'Deals',
  leads: 'Leads',
  companies: 'Organizations',
  contacts: 'Contacts',
  tasks: 'Tasks',
  notifications: 'Notifications',
  emails: 'Emails',
  events: 'Events',
  notes: 'Notes',
  products: 'Products',
  'sales-orders': 'Sales Orders',
  activities: 'Activities',
  reports: 'Reports',
}

function AppBreadcrumb() {
  const location = useLocation()
  const params = useParams({ strict: false })

  const segments = useMemo(() => {
    return location.pathname.split('/').filter(Boolean)
  }, [location.pathname])

  const p = params as Record<string, string>
  const entityId = p.dealId || p.leadId || p.companyId || p.orderId || ''

  const crumbs = useMemo(() => {
    const items: Array<{ label: string; href?: string }> = []

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const href = `/${segments.slice(0, i + 1).join('/')}`

      // Skip dynamic param segments
      if (segment === entityId && entityId) continue

      const label =
        SEGMENT_LABELS[segment] ??
        segment.charAt(0).toUpperCase() + segment.slice(1)
      items.push({ label, href })
    }

    // Append entity ID as last crumb for detail pages
    if (entityId) {
      items.push({ label: 'Detail' })
    }

    return items
  }, [segments, entityId])

  if (crumbs.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <span key={crumb.href ?? i} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

interface AppLayoutProps {
  children: ReactNode
}

/**
 * Main application layout with animated sidebar
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <AppBreadcrumb />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
