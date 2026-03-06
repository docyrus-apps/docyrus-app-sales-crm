/**
 * Application-wide constants and configuration
 */

/**
 * Route paths for navigation
 */
export const ROUTES = {
  HOME: '/',
  AUTH_CALLBACK: '/auth/callback',
  DEALS: '/deals',
  DEAL_DETAIL: '/deals/:dealId',
  LEADS: '/leads',
  LEAD_DETAIL: '/leads/:leadId',
  COMPANIES: '/companies',
  COMPANY_DETAIL: '/companies/:companyId',
  CONTACTS: '/contacts',
  CONTACT_DETAIL: '/contacts/:contactId',
  TASKS: '/tasks',
  EVENTS: '/calendar',
  EMAILS: '/emails',
  THREAD_DETAIL: '/emails/:threadId',
  PRODUCTS: '/products',
  SALES_ORDERS: '/sales-orders',
  SALES_ORDER_DETAIL: '/sales-orders/:orderId',
  SETTINGS: '/settings',
} as const

/**
 * Date format constants
 */
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy, hh:mm a',
  ISO: 'yyyy-MM-dd',
  TIME: 'hh:mm a',
} as const

/**
 * Default query configurations for TanStack Query
 */
export const QUERY_CONFIG = {
  STALE_TIME: {
    ENUMS: 1000 * 60 * 60, // 1 hour - enums rarely change
    REFERENCE_DATA: 1000 * 60 * 30, // 30 minutes - countries, cities
    USER_DATA: 1000 * 60 * 5, // 5 minutes - user profile
    LIST_DATA: 1000 * 60, // 1 minute - list views
  },
  RETRY: {
    DEFAULT: 3,
    MUTATIONS: 1,
  },
} as const

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

/**
 * Status colors for badges and indicators
 */
export const STATUS_COLORS = {
  // Deal stages
  PROSPECTING: 'blue',
  DISCOVERY: 'purple',
  PROPOSAL: 'yellow',
  NEGOTIATION: 'orange',
  WON: 'green',
  LOST: 'red',
  CANCELLED: 'gray',

  // Lead statuses
  NEW: 'blue',
  CONTACTED: 'purple',
  QUALIFIED: 'green',
  UNQUALIFIED: 'gray',

  // Task statuses
  TODO: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  BLOCKED: 'red',
} as const

/**
 * Navigation menu items configuration
 */
export const NAV_ITEMS = [
  {
    title: 'Home',
    href: ROUTES.HOME,
    icon: 'Home',
  },
  {
    title: 'Deals',
    href: ROUTES.DEALS,
    icon: 'DollarSign',
    section: 'records',
  },
  {
    title: 'Leads',
    href: ROUTES.LEADS,
    icon: 'Users',
    section: 'records',
  },
  {
    title: 'Companies',
    href: ROUTES.COMPANIES,
    icon: 'Building',
    section: 'records',
  },
  {
    title: 'Tasks',
    href: ROUTES.TASKS,
    icon: 'CheckSquare',
  },
  {
    title: 'Emails',
    href: ROUTES.EMAILS,
    icon: 'Mail',
  },
  {
    title: 'Products',
    href: ROUTES.PRODUCTS,
    icon: 'Package',
    section: 'records',
  },
  {
    title: 'Sales Orders',
    href: ROUTES.SALES_ORDERS,
    icon: 'FileText',
    section: 'records',
  },
] as const

/**
 * Currency symbols by country code
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  TRY: '₺',
  default: '$',
}
