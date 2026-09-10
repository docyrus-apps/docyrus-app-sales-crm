import { type ReactNode, useMemo } from 'react'

import { Link, useLocation, useParams } from '@tanstack/react-router'

import { useTranslation } from 'react-i18next'

import { AppSidebar } from './app-sidebar'
import { AppHeaderActions } from './app-header-actions'

import { useDetailBreadcrumbTitle } from '@/lib/detail-breadcrumb'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@/components/animate-ui/components/radix/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'

const SEGMENT_BREADCRUMB_KEYS: Record<string, string> = {
  deals: 'breadcrumb.deals',
  leads: 'breadcrumb.leads',
  companies: 'breadcrumb.companies',
  contacts: 'breadcrumb.contacts',
  tasks: 'breadcrumb.tasks',
  notifications: 'breadcrumb.notifications',
  emails: 'breadcrumb.emails',
  calendar: 'breadcrumb.calendar',
  notes: 'breadcrumb.notes',
  products: 'breadcrumb.products',
  'sales-orders': 'breadcrumb.salesOrders',
  quotes: 'quotes.title',
  build: 'quotes.builderCrumb',
  activities: 'breadcrumb.activities',
  calls: 'webphone.calls.title',
  'app-config': 'appConfig.title',
  'field-sales': 'fieldSales.groupLabel',
  plans: 'fieldSales.plans.title',
  approvals: 'fieldSales.approvals.title'
}

function AppBreadcrumb() {
  const location = useLocation()
  const params = useParams({ strict: false })
  const { t } = useTranslation()
  const detailTitle = useDetailBreadcrumbTitle()

  const segments = useMemo(() => {
    return location.pathname.split('/').filter(Boolean)
  }, [location.pathname])

  const p = params as Record<string, string>
  const entityId =
    p.dealId ||
    p.leadId ||
    p.companyId ||
    p.contactId ||
    p.orderId ||
    p.quoteId ||
    ''

  const crumbs = useMemo(() => {
    const items: Array<{ label: string; href?: string }> = []

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const href = `/${segments.slice(0, i + 1).join('/')}`

      // Skip dynamic param segments
      if (segment === entityId && entityId) continue

      const key =
        segment === 'calendar' && segments[i - 1] === 'field-sales'
          ? 'fieldSales.calendar.title'
          : SEGMENT_BREADCRUMB_KEYS[segment]
      const label = key
        ? t(key)
        : segment.charAt(0).toUpperCase() + segment.slice(1)

      items.push({ label, href })
    }

    /*
     * Append the record's name as the last crumb for detail pages, falling
     * back to a generic label until the route publishes its resolved title.
     */
    if (entityId) {
      items.push({ label: detailTitle || t('breadcrumb.detail') })
    }

    return items
  }, [
segments,
entityId,
detailTitle,
t
])

  if (crumbs.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{t('breadcrumb.home')}</BreadcrumbPage>
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
            <Link to="/">{t('breadcrumb.home')}</Link>
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
  children: ReactNode;
}

/**
 * Main application layout with animated sidebar
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh flex-col overflow-hidden">
        <header className="flex h-14 flex-none items-center justify-between gap-3 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <AppBreadcrumb />
          </div>
          <div className="flex items-center gap-2">
            <AppHeaderActions />
          </div>
        </header>
        <main className="relative flex grow flex-col overflow-hidden p-4 pt-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
