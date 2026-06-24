import { StrictMode } from 'react'

import ReactDOM from 'react-dom/client'
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter
} from '@tanstack/react-router'
import { DocyrusAuthProvider } from '@docyrus/signin'
import { DocyrusDevtools } from '@docyrus/devtools'
import { I18nextProvider } from 'react-i18next'
import { ThemeProvider } from '@docyrus/theme-provider'

import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx'
import i18n from './i18n'
import { I18nDirectionProvider } from './components/ui/i18n-direction-provider'
import { GlobalDialogProvider } from './components/docyrus/awesome-dialog'
import { DocyrusDevtoolsClientRegistration } from './components/devtools/docyrus-devtools-client-registration'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'

import App from './App.tsx'
import { Dashboard } from './routes/dashboard.tsx'
import { Deals } from './routes/deals.tsx'
import { DealDetail } from './routes/deal-detail.tsx'
import { Leads } from './routes/leads.tsx'
import { LeadDetail } from './routes/lead-detail.tsx'
import { Companies } from './routes/companies.tsx'
import { CompanyDetail } from './routes/company-detail.tsx'
import { Tasks } from './routes/tasks.tsx'
import { CalendarPage } from './routes/calendar.tsx'
import { Products } from './routes/products.tsx'
import { SalesOrders } from './routes/sales-orders.tsx'
import { SalesOrderDetail } from './routes/sales-order-detail.tsx'
import { QuoteDetail } from './routes/quote-detail.tsx'
import { QuoteBuild } from './routes/quote-build.tsx'
import { Contacts } from './routes/contacts.tsx'
import { ContactDetail } from './routes/contact-detail.tsx'
import { Activities } from './routes/activities.tsx'
import { Reports } from './routes/reports.tsx'
import { AppConfigPage } from './routes/app-config.tsx'
import { CallsPage } from './routes/calls.tsx'
import { FieldSalesPlansPage } from './routes/field-sales-plans.tsx'
import { FieldSalesApprovalsPage } from './routes/field-sales-approvals.tsx'
import { FieldSalesCalendarPage } from './routes/field-sales-calendar.tsx'
import { ModuleGuard } from './components/shared/module-guard.tsx'

const rootRoute = createRootRoute({
  component: App
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard
})

const dealsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deals',
  component: Deals
})

const dealDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deals/$dealId',
  component: DealDetail,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || 'overview'
  })
})

const leadsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leads',
  component: Leads
})

const leadDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leads/$leadId',
  component: LeadDetail,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || 'overview'
  })
})

const companiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/companies',
  component: Companies
})

const companyDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/companies/$companyId',
  component: CompanyDetail,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || 'overview'
  })
})

const contactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contacts',
  component: Contacts
})

const contactDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contacts/$contactId',
  component: ContactDetail,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || 'overview'
  })
})

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: Tasks
})

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarPage
})

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: Products
})

const salesOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales-orders',
  component: SalesOrders
})

const salesOrderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales-orders/$orderId',
  component: SalesOrderDetail
})

const quoteNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/quotes/new',
  component: QuoteBuild,
  validateSearch: (
    search: Record<string, unknown>
  ): {
    organization?: string;
    organizationName?: string;
    deal?: string;
  } => ({
    organization: (search.organization as string) || undefined,
    organizationName: (search.organizationName as string) || undefined,
    deal: (search.deal as string) || undefined
  })
})

const quoteEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/quotes/$quoteId',
  component: QuoteDetail
})

const quoteBuildRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/quotes/$quoteId/build',
  component: QuoteBuild
})

const activitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activities',
  component: Activities
})

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: Reports
})

const appConfigRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app-config',
  component: AppConfigPage
})

const callsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calls',
  component: () => (
    <ModuleGuard module="webphone">
      <CallsPage />
    </ModuleGuard>
  )
})

const fieldSalesPlansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/field-sales/plans',
  component: () => (
    <ModuleGuard module="fieldSales">
      <FieldSalesPlansPage />
    </ModuleGuard>
  )
})

const fieldSalesApprovalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/field-sales/approvals',
  component: () => (
    <ModuleGuard module="fieldSales">
      <FieldSalesApprovalsPage />
    </ModuleGuard>
  )
})

const fieldSalesCalendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/field-sales/calendar',
  component: () => (
    <ModuleGuard module="fieldSales">
      <FieldSalesCalendarPage />
    </ModuleGuard>
  )
})

const oauthRedirectPath = resolveOauthRedirectPath()

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: oauthRedirectPath,
  component: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse">Completing sign in...</div>
      </div>
    </div>
  )
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  dealsRoute,
  dealDetailRoute,
  leadsRoute,
  leadDetailRoute,
  companiesRoute,
  companyDetailRoute,
  contactsRoute,
  contactDetailRoute,
  tasksRoute,
  calendarRoute,
  productsRoute,
  salesOrdersRoute,
  salesOrderDetailRoute,
  quoteNewRoute,
  quoteEditRoute,
  quoteBuildRoute,
  activitiesRoute,
  reportsRoute,
  appConfigRoute,
  callsRoute,
  fieldSalesPlansRoute,
  fieldSalesApprovalsRoute,
  fieldSalesCalendarRoute,
  authCallbackRoute
])

const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProvider.getContext()
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const oauthScopes = (
  import.meta.env.VITE_OAUTH2_SCOPES || 'openid profile offline_access'
)
  .split(' ')
  .filter(Boolean)

function resolveOauthRedirectPath() {
  const redirectPath = (
    import.meta.env.VITE_OAUTH2_REDIRECT_PATH || '/auth/callback'
  ).trim()

  return redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`
}

function isEmbeddedInIframe() {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

function resolveAllowedHostOrigins(): Array<string> {
  const origins = new Set<string>()

  const envOrigins = (import.meta.env.VITE_ALLOWED_HOST_ORIGINS || '')
    .split(',')
    .map((origin: string) => origin.trim())
    .filter(Boolean)

  for (const origin of envOrigins) {
    origins.add(origin)
  }

  const locationWithAncestors = window.location as Location &
    Record<string, unknown>
  const ancestorOrigins = locationWithAncestors.ancestorOrigins as
    | { length: number; [index: number]: string }
    | undefined

  if (ancestorOrigins && ancestorOrigins.length > 0) {
    const parentOrigin = ancestorOrigins[0]

    if (parentOrigin) {
      origins.add(parentOrigin)
    }
  }

  if (document.referrer) {
    try {
      origins.add(new URL(document.referrer).origin)
    } catch {
      // Ignore invalid referrer URLs.
    }
  }

  return Array.from(origins)
}

const allowedHostOrigins = resolveAllowedHostOrigins()
const oauthRedirectUri = `${window.location.origin}${oauthRedirectPath}`
const forceMode =
  isEmbeddedInIframe() &&
  new URLSearchParams(window.location.search).get('embedded') === 'true'
    ? 'iframe'
    : undefined

const rootElement = document.getElementById('app')

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)

  root.render(
    <StrictMode>
      <ThemeProvider
        modeStorageKey="app-theme"
        colorThemeStorageKey="app-color-theme"
        defaultColorTheme="docyrus-default"
        disableTransitionOnChange>
        <DocyrusAuthProvider
          apiUrl={import.meta.env.VITE_API_BASE_URL}
          clientId={import.meta.env.VITE_OAUTH2_CLIENT_ID}
          redirectUri={oauthRedirectUri}
          scopes={oauthScopes}
          callbackPath={oauthRedirectPath}
          allowedHostOrigins={allowedHostOrigins.length > 0 ? allowedHostOrigins : undefined}
          forceMode={forceMode}
          syncRouteToHost>
          <TanStackQueryProvider.Provider>
            {/* @docyrus: [[architecture#Root Runtime Tooling]] */}
            <DocyrusDevtools
              queryClient={TanStackQueryProvider.queryClient}
              openApiSpecPath="/openapi.json">
              <DocyrusDevtoolsClientRegistration />
              <I18nextProvider i18n={i18n}>
                <I18nDirectionProvider>
                  <GlobalDialogProvider persist storageKey="sales-crm-dialogs">
                    <RouterProvider router={router} />
                  </GlobalDialogProvider>
                </I18nDirectionProvider>
              </I18nextProvider>
            </DocyrusDevtools>
          </TanStackQueryProvider.Provider>
        </DocyrusAuthProvider>
      </ThemeProvider>
    </StrictMode>
  )
}

/*
 * If you want to start measuring performance in your app, pass a function
 * to log results (for example: reportWebVitals(console.log))
 * or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
 */
reportWebVitals()
