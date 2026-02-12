import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { DocyrusAuthProvider } from '@docyrus/app-auth-ui'

import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx'

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
import { Notifications } from './routes/notifications.tsx'
import { Emails } from './routes/emails.tsx'
import { Events } from './routes/events.tsx'
import { Products } from './routes/products.tsx'
import { SalesOrders } from './routes/sales-orders.tsx'
import { SalesOrderDetail } from './routes/sales-order-detail.tsx'

const rootRoute = createRootRoute({
  component: App,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
})

const dealsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deals',
  component: Deals,
})

const dealDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deals/$dealId',
  component: DealDetail,
})

const leadsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leads',
  component: Leads,
})

const leadDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leads/$leadId',
  component: LeadDetail,
})

const companiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/companies',
  component: Companies,
})

const companyDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/companies/$companyId',
  component: CompanyDetail,
})

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: Tasks,
})

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notifications',
  component: Notifications,
})

const emailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/emails',
  component: Emails,
})

const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/events',
  component: Events,
})

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: Products,
})

const salesOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales-orders',
  component: SalesOrders,
})

const salesOrderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sales-orders/$orderId',
  component: SalesOrderDetail,
})

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse">Completing sign in...</div>
      </div>
    </div>
  ),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  dealsRoute,
  dealDetailRoute,
  leadsRoute,
  leadDetailRoute,
  companiesRoute,
  companyDetailRoute,
  tasksRoute,
  notificationsRoute,
  emailsRoute,
  eventsRoute,
  productsRoute,
  salesOrdersRoute,
  salesOrderDetailRoute,
  authCallbackRoute,
])

const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProvider.getContext(),
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const oauthScopes = (
  import.meta.env.VITE_OAUTH2_SCOPES || 'openid profile offline_access'
)
  .split(' ')
  .filter(Boolean)

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <DocyrusAuthProvider
        apiUrl={import.meta.env.VITE_API_BASE_URL}
        clientId={import.meta.env.VITE_OAUTH2_CLIENT_ID}
        redirectUri={import.meta.env.VITE_OAUTH2_REDIRECT_URI}
        scopes={oauthScopes}
        callbackPath="/auth/callback"
      >
        <TanStackQueryProvider.Provider>
          <RouterProvider router={router} />
        </TanStackQueryProvider.Provider>
      </DocyrusAuthProvider>
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
