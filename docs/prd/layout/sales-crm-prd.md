# Sales CRM SaaS - Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 2026-02-12
**Status:** Draft

---

## 1. Executive Summary

This PRD defines the first version of a Sales CRM SaaS application built as a React SPA on the Docyrus platform. The application provides a pipeline-driven sales management experience with kanban-based deal tracking, lead management, contact/company directories, task management, email integration, and sales order generation. The UI follows the reference layout in `docs/prd/layout/deals-layout.png`.

---

## 2. Reference Layout Analysis

The reference screenshot (`deals-layout.png`) establishes the core layout pattern:

### 2.1 Application Shell

```
┌────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  [Top Bar: Title + View Toggle + Actions]     │
│            │───────────────────────────────────────────────│
│ Workspace  │  [Main Content Area]                          │
│ Search     │                                               │
│ Navigation │  Kanban Board / List View / Detail View       │
│ Records    │                                               │
│            │                                               │
│ Footer     │                                               │
└────────────────────────────────────────────────────────────┘
```

### 2.2 Layout Elements Identified

| Element | Description |
|---|---|
| **Sidebar** | Collapsible left panel with workspace switcher, quick actions search, navigation menu, and records section |
| **Top Bar** | Page title with icon, view toggle (list/kanban), Sort, Filter, Settings buttons, and contextual search + primary action button |
| **Kanban Board** | Horizontal scrollable columns representing deal stages with draggable deal cards |
| **Deal Card** | Compact card showing deal name, organization (with colored avatar initial), deal value, and assignee avatar |
| **Outcome Lanes** | Bottom row with Won (green), Lost (red), and Cancelled (gray) dashed-border drop zones |

---

## 3. Tech Stack & Component Strategy

### 3.1 Core Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Routing | TanStack Router (code-based) |
| Data Fetching | TanStack Query |
| Forms | TanStack Form + Zod validation |
| Styling | Tailwind CSS v4 |
| Auth | @docyrus/app-auth-ui (OAuth2 PKCE) |
| API | @docyrus/api-client via collections |

### 3.2 Component Priority

Components are selected in this priority order:

1. **Animate-UI** (first priority for animated interactions)
2. **Shadcn/ui** (core primitives)
3. **DiceUI** (advanced/specialized components)
4. **REUI** (file uploads and sortable)

### 3.3 Component Mapping

| Feature | Component Source | Component |
|---|---|---|
| App Sidebar | animate-ui | Sidebar (animated collapsible) |
| Dropdown Menus | animate-ui | DropdownMenu (animated) |
| Alert Dialogs | animate-ui | AlertDialog (animated) |
| Checkboxes | animate-ui | Checkbox (animated) |
| Radio Groups | animate-ui | RadioGroup (animated) |
| Toggles/Switches | animate-ui | Switch (animated) |
| Kanban Board | diceui | Kanban (drag-and-drop) |
| Data Tables | diceui | DataTable (filtering, sorting, pagination) |
| Combobox/Search | diceui | Combobox (searchable select) |
| Tags Input | diceui | TagsInput (for followers, tags) |
| Timeline | diceui | Timeline (activity feeds) |
| Stat Cards | diceui | Stat (dashboard metrics) |
| Status Indicators | diceui | Status (deal/lead status dots) |
| File Upload | diceui | FileUpload (document attachments) |
| Stepper | diceui | Stepper (multi-step forms) |
| Phone Input | diceui | PhoneInput (contact phone fields) |
| Editable Text | diceui | Editable (inline editing) |
| Gauge | diceui | Gauge (close probability) |
| Sortable Lists | diceui | Sortable (reorderable items) |
| Empty States | shadcn | Empty |
| Buttons | shadcn | Button, ButtonGroup |
| Dialogs/Modals | shadcn | Dialog, Sheet |
| Forms | shadcn | Input, Textarea, Select, Field, Label |
| Cards | shadcn | Card |
| Tabs | shadcn | Tabs |
| Badges | shadcn | Badge |
| Avatars | shadcn | Avatar |
| Tooltips | shadcn | Tooltip |
| Toasts | shadcn | Sonner |
| Skeleton Loading | shadcn | Skeleton |
| Calendar/DatePicker | shadcn | Calendar, Popover |
| Charts | shadcn | Chart (Recharts) |
| Pagination | shadcn | Pagination |
| Breadcrumbs | shadcn | Breadcrumb |
| Separators | shadcn | Separator |
| Scroll Areas | shadcn | ScrollArea |
| Popovers | shadcn | Popover |
| Command Palette | shadcn | Command |
| Context Menu | shadcn | ContextMenu |
| Accordion | shadcn | Accordion |
| Progress | shadcn | Progress |
| Spinner | shadcn | Spinner |
| Typography | shadcn | Typography |
| Hover Card | shadcn | HoverCard |

---

## 4. Data Model (Existing Collections)

All entities below are pre-built and available in `src/collections/`. No backend changes are needed.

### 4.1 Entity Relationship Diagram

```
Country (1) ──→ (N) City
Country (1) ──→ (N) Organization
Country (1) ──→ (N) Deal
Country (1) ──→ (N) Lead

Organization (1) ──→ (N) Contact
Organization (1) ──→ (N) Deal
Organization (1) ──→ (N) Lead
Organization (1) ──→ (N) Task
Organization (1) ──→ (N) SalesOrder
Organization (1) ──→ (N) Thread

Contact (1) ──→ (N) Deal (via contact_person)
Contact (1) ──→ (N) Thread

Deal (1) ──→ (N) DealProduct
DealProduct ──→ Product

SalesOrder (1) ──→ (N) SalesOrderItem
SalesOrderItem ──→ Product

Thread (1) ──→ (N) Message

Event ──→ Calendar
Task ──→ Task (parent/child hierarchy)
```

### 4.2 CRM Core Entities

#### Deal (`base_crm/deals`)
| Field | Type | Notes |
|---|---|---|
| id | string | PK |
| record_owner | string | Assigned user |
| expected_revenue | number | Deal value |
| expected_closing_date | string | Target close date |
| hot_prospect | boolean | Hot flag |
| follow_up_on | string | Follow-up date |
| close_probability | number | Win probability % |
| closed_date | string | Actual close date |
| stage | enum | Prospecting, Discovery, Proposal, Negotiation, etc. |
| customer_type | enum | New, Existing |
| lead_source | enum | Web, Referral, etc. |
| reason_for_lost | enum | Lost reason |
| deal_value | number | Monetary value |
| country | FK → Country | |
| organizations | FK → Organization | Company |
| contact_person | FK → Contact | Primary contact |
| followers | User[] | Deal followers |

#### Lead (`base_crm/leads`)
| Field | Type | Notes |
|---|---|---|
| id | string | PK |
| record_owner | string | Assigned user |
| title | string | Lead name/title |
| phone, email | string | Contact info |
| website | string | Company website |
| address, city, state, town | string | Location fields |
| lead_source | enum | Source channel |
| lead_status | enum | Status (New, Contacted, Qualified, etc.) |
| lead_type | enum | Type classification |
| contact_message | string | Initial message |
| lost_reason | enum | Why lost |
| company_name | FK → Organization | Related company |
| countries | FK → Country | |

#### Deal Product (`base_crm/deal_product`)
| Field | Type | Notes |
|---|---|---|
| id | string | PK |
| related_deal | FK → Deal | **Required** |
| product | FK → Product | **Required** |
| category | FK | Product category, **Required** |
| qty | number | Quantity, **Required** |
| unit_price | number | Price per unit, **Required** |
| discount | number | Discount |
| tax_rate | number | Tax % |
| total, gross_total, net_total | number | Computed totals |

#### Product (`base_crm/product`)
| Field | Type | Notes |
|---|---|---|
| id | string | PK |
| product_code | string | SKU |
| unit_price | number | Default price |
| Unit | enum | UoM |
| category | FK | Product category |
| tax | number | Default tax rate |

#### Sales Order (`base_crm/sales_order`)
| Field | Type | Notes |
|---|---|---|
| id | string | PK |
| organization | FK → Organization | Customer |
| status | enum | Order status |
| sub_total | number | Before tax |
| tax_total | number | Tax amount |
| grand_total | number | Final total |

#### Sales Order Item (`base_crm/sales_order_item`)
| Field | Type | Notes |
|---|---|---|
| id | string | PK |
| related_sales_order | FK → SalesOrder | **Required** |
| product | FK → Product | |
| category | FK | **Required** |
| qty | number | **Required** |
| unit_price | number | **Required** |
| discount, tax_rate | number | |
| total, gross_total, net_total | number | Computed |

### 4.3 Supporting Entities

| Entity | Collection | Key Fields |
|---|---|---|
| Organization | `base/organization` | name, phone, email, website, industry (enum), address, country, city, tax_number, status (enum), type (enum) |
| Contact | `base/contact` | name, job_title, email, mobile, organization (FK) |
| Task | `base/task` | subject, description, start_date, end_date, status (enum), section (FK), project (FK), organization (FK), parent (FK → self), followers |
| Event | `base/event` | subject, description, start_date, end_date, calendar (FK), event_notes |
| Calendar | `base/calendar` | start_date (used as event type categorization) |
| Activity | `base/activity` | subject, description, start_date, end_date |
| Thread | `base/thread` | subject, body, contact (FK), organization (FK), case_status (enum), priority (enum), followers |
| Message | `base/message` | subject, body, body_text, thread (FK), direction (enum), message_type (enum), sender_email, send_to_email, files |
| Country | `base/country` | name, iso2, iso3, currency, currency_symbol, emoji, phone_code |
| City | `base/city` | name, country (FK), latitude, longitude |
| User | system | email, firstname, lastname, job_title, mobile, time_zone, language |
| Notification | system | subject, message, seen, created_by_fullname, created_by_photo |
| Enums | system | Shared enums for all enum-type fields (stages, statuses, types, etc.) |

### 4.4 Comments & File Attachments (Generic Data Source Endpoints)

Every data source entity exposes **comment** and **file attachment** sub-endpoints. These are not separate collections — they are generic REST endpoints available on all data sources, following a consistent URL pattern.

**API Reference:** `openapi.json` — endpoints follow the pattern below for every data source.

#### 4.4.1 Comment Endpoints

| Method | Path Pattern | Description |
|---|---|---|
| GET | `/v1/apps/{app}/data-sources/{ds}/comments` | List all comments for a data source |
| GET | `/v1/apps/{app}/data-sources/{ds}/items/{recordId}/comments` | List comments for a specific record |
| POST | `/v1/apps/{app}/data-sources/{ds}/items/{recordId}/comments` | Create a comment on a record (`CreateCommentDto`) |
| GET | `/v1/apps/{app}/data-sources/{ds}/items/{recordId}/comments/{commentId}` | Get a comment by ID |
| PATCH | `/v1/apps/{app}/data-sources/{ds}/items/{recordId}/comments/{commentId}` | Update a comment (`UpdateCommentDto`) |
| DELETE | `/v1/apps/{app}/data-sources/{ds}/items/{recordId}/comments/{commentId}` | Delete a comment |

**Example:** `GET /v1/apps/base/data-sources/contact/comments` — lists all comments across all contacts.

#### 4.4.2 File Attachment Endpoints

| Method | Path Pattern | Description |
|---|---|---|
| GET | `/v1/apps/{app}/data-sources/{ds}/files` | List all files for a data source |
| POST | `/v1/apps/{app}/data-sources/{ds}/files` | Insert file records (`InsertFilesDto`) |
| GET | `/v1/apps/{app}/data-sources/{ds}/files/{fileId}` | Get a file by ID |
| POST | `/v1/apps/{app}/data-sources/{ds}/files/upload` | Upload a file (`multipart/form-data`, `UploadFileDto`) |
| PUT | `/v1/apps/{app}/data-sources/{ds}/files/copy` | Copy a file (`CopyMoveFileDto`) |
| PUT | `/v1/apps/{app}/data-sources/{ds}/files/move` | Move a file (`CopyMoveFileDto`) |
| GET | `/v1/apps/{app}/data-sources/{ds}/items/{recordId}/files` | List files for a specific record |
| POST | `/v1/apps/{app}/data-sources/{ds}/items/{recordId}/files` | Insert file records for a specific record |
| POST | `/v1/apps/{app}/data-sources/{ds}/items/{recordId}/files/upload` | Upload a file for a specific record |
| DELETE | `/v1/apps/{app}/data-sources/{ds}/items/{recordId}/files/{fileId}` | Delete a file (`DeleteFileDto`) |

#### 4.4.3 Applicable Entities

These endpoints are available on **all** CRM data sources:

| Entity | Data Source Path | Comments | Files |
|---|---|---|---|
| Deal | `base_crm/data-sources/deals` | Deal discussions, internal notes | Proposals, contracts, attachments |
| Lead | `base_crm/data-sources/leads` | Lead qualification notes | Business cards, requirement docs |
| Organization | `base/data-sources/organization` | Account notes | Logos, agreements, NDAs |
| Contact | `base/data-sources/contact` | Meeting notes | vCards, profile photos |
| Task | `base/data-sources/task` | Task discussions | Task-related documents |
| Event | `base/data-sources/event` | Event notes | Agendas, minutes |
| Product | `base_crm/data-sources/product` | Product feedback | Spec sheets, images |
| Sales Order | `base_crm/data-sources/sales_order` | Order notes | Invoices, POs |
| Thread | `base/data-sources/thread` | Thread annotations | Email attachments |

---

## 5. Application Architecture

### 5.1 Route Structure

```
/                           → Dashboard (Home)
/deals                      → Deals Pipeline (Kanban + List views)
/deals/:dealId              → Deal Detail
/leads                      → Leads List
/leads/:leadId              → Lead Detail
/companies                  → Organizations List
/companies/:companyId       → Organization Detail
/contacts                   → Contacts List (within company context)
/tasks                      → Tasks List
/events                     → Events / Calendar
/emails                     → Email Threads (Inbox)
/emails/:threadId           → Thread Detail
/products                   → Products Catalog
/sales-orders               → Sales Orders List
/sales-orders/:orderId      → Sales Order Detail
/settings                   → App Settings
/auth/callback              → OAuth2 Callback (existing)
```

### 5.2 Folder Structure

```
src/
├── collections/            # Pre-generated API collections (DO NOT MODIFY)
├── components/
│   ├── animate-ui/         # Animate-UI components (sidebar, dialogs, etc.)
│   ├── ui/                 # Shadcn/ui primitives
│   ├── layout/             # App shell: sidebar, top-bar, page-container
│   ├── deals/              # Deal-specific components (kanban card, deal form, etc.)
│   ├── leads/              # Lead-specific components
│   ├── contacts/           # Contact components
│   ├── companies/          # Organization/company components
│   ├── tasks/              # Task components
│   ├── emails/             # Email/thread components
│   ├── sales-orders/       # Sales order components
│   ├── products/           # Product components
│   ├── dashboard/          # Dashboard widgets and charts
│   └── shared/             # Cross-feature shared components (filters, search, etc.)
├── hooks/                  # Custom React hooks
│   ├── use-deals.ts        # Deal data hooks (TanStack Query)
│   ├── use-leads.ts        # Lead data hooks
│   ├── use-companies.ts    # Organization data hooks
│   ├── use-contacts.ts     # Contact data hooks
│   ├── use-tasks.ts        # Task data hooks
│   ├── use-enums.ts        # Enum data hooks (cached)
│   └── use-notifications.ts
├── integrations/
│   └── tanstack-query/     # Query client config (existing)
├── lib/
│   ├── api.ts              # API client (existing)
│   ├── utils.ts            # General utilities (existing)
│   ├── formatters.ts       # Currency, date, number formatters
│   └── constants.ts        # App-wide constants (routes, defaults)
├── routes/                 # Route page components
│   ├── dashboard.tsx
│   ├── deals.tsx
│   ├── deal-detail.tsx
│   ├── leads.tsx
│   ├── lead-detail.tsx
│   ├── companies.tsx
│   ├── company-detail.tsx
│   ├── tasks.tsx
│   ├── events.tsx
│   ├── emails.tsx
│   ├── thread-detail.tsx
│   ├── products.tsx
│   ├── sales-orders.tsx
│   └── sales-order-detail.tsx
├── App.tsx                 # Main app component (existing, to be updated)
├── main.tsx                # Entry point with route tree (existing, to be updated)
└── styles.css              # Global styles (existing)
```

---

## 6. Feature Specifications

### 6.1 Application Shell & Navigation

**Priority:** P0 (Must Have)

#### 6.1.1 Animated Sidebar

**Component:** animate-ui `Sidebar`

The sidebar is the primary navigation element, matching the reference layout.

**Structure:**
```
┌─────────────────┐
│ Workspace  ↻ ↕  │  ← Workspace switcher (org name + logo)
├─────────────────┤
│ 🔍 Quick actions│  ← Command palette trigger (shadcn Command)
├─────────────────┤
│ 🏠 Home         │
│ 🔔 Notifications│  ← Badge count for unread
│ ✅ Tasks        │  ← Badge count for assigned
│ 📝 Notes        │
│ ✉️ Emails       │
├─────────────────┤
│ RECORDS         │  ← Section label
│ 🏢 Companies    │
│ 👤 Leads        │
│ 💰 Deals        │
│ 📦 Products     │
│ 📋 Sales Orders │
├─────────────────┤
│ 👤 User Profile │  ← Current user avatar + name (sidebar footer)
└─────────────────┘
```

**Behavior:**
- Collapsible to icon-only mode (animate-ui sidebar rail)
- Responsive: collapses to drawer on mobile
- Active route highlighted
- Notification badge shows unread count from `NotificationsCollection.getNotifications()`
- Task badge shows count of tasks assigned to current user

#### 6.1.2 Top Bar

**Components:** shadcn `Button`, `ButtonGroup`, `Input`, animate-ui `DropdownMenu`

**Structure (Deals page example):**
```
┌──────────────────────────────────────────────────────────┐
│ 🔴 Sales Pipeline ▾  │ [≡][▦] │ ↕Sort │ ▼Filter │ ⚙Settings │  🔍 Search deals...  │ [+ New Deal] │
└──────────────────────────────────────────────────────────┘
```

**Elements:**
- **Page title** with icon and optional dropdown for pipeline switching
- **View toggle**: List view / Kanban board (shadcn `ButtonGroup` or `Tabs`)
- **Sort button**: Opens sort options dropdown (animate-ui `DropdownMenu`)
- **Filter button**: Opens filter panel/popover (shadcn `Popover` with filter builder)
- **Settings button**: Page-level settings dropdown
- **Search input**: Contextual search for current entity (shadcn `Input`)
- **Primary action**: "+ New Deal" / "+ New Lead" etc. (shadcn `Button` variant="default")

#### 6.1.3 Command Palette

**Component:** shadcn `Command`

Global quick-action search triggered from sidebar or keyboard shortcut (`Cmd+K`).

**Features:**
- Search across all entities (deals, leads, contacts, companies)
- Quick navigation to any page
- Recent items list
- Action shortcuts (New Deal, New Lead, New Task, etc.)

---

### 6.2 Dashboard (Home)

**Priority:** P1 (Should Have)

**Route:** `/`

**Components:** diceui `Stat`, shadcn `Chart`, shadcn `Card`, diceui `Timeline`

#### Layout

```
┌──────────┬──────────┬──────────┬──────────┐
│ Total    │ Deals    │ Won      │ Revenue  │
│ Deals    │ in Pipe  │ This Mo  │ This Mo  │
│ [stat]   │ [stat]   │ [stat]   │ [stat]   │
├──────────┴──────────┼──────────┴──────────┤
│ Pipeline by Stage   │ Revenue Over Time   │
│ [bar chart]         │ [line chart]        │
├─────────────────────┼─────────────────────┤
│ Upcoming Tasks      │ Recent Activity     │
│ [task list]         │ [timeline]          │
├─────────────────────┼─────────────────────┤
│ Hot Deals           │ Leads by Source     │
│ [deal cards]        │ [pie chart]         │
└─────────────────────┴─────────────────────┘
```

#### Widgets

| Widget | Data Source | Component |
|---|---|---|
| Total Deals | `DealsCollection.list()` with count aggregation | diceui `Stat` |
| Deals in Pipeline | Deals filtered by active stages, count aggregation | diceui `Stat` |
| Won This Month | Deals with stage=Won + closed_date this_month | diceui `Stat` |
| Revenue This Month | Deals with stage=Won, sum(deal_value) this_month | diceui `Stat` |
| Pipeline by Stage | Deals grouped by stage, count per stage | shadcn `Chart` (bar) |
| Revenue Over Time | Deals grouped by closed_date month, sum(deal_value) | shadcn `Chart` (line) |
| Upcoming Tasks | `TaskCollection.list()` filtered by end_date upcoming, limit 5 | shadcn `Card` list |
| Recent Activity | `ActivityCollection.list()` ordered by created_on desc, limit 10 | diceui `Timeline` |
| Hot Deals | Deals with hot_prospect=true, ordered by deal_value desc | Deal mini-cards |
| Leads by Source | Leads grouped by lead_source, count | shadcn `Chart` (pie) |

---

### 6.3 Deals Pipeline

**Priority:** P0 (Must Have)

**Route:** `/deals`

This is the primary view of the application as shown in the reference layout.

#### 6.3.1 Kanban View

**Component:** diceui `Kanban`

**Stage Columns (from enum `base_crm/deals/stage`):**
- Prospecting
- Discovery
- Proposal
- Negotiation
- (additional stages from enums)

**Outcome Lanes (bottom row):**
- Won (green dashed border, checkmark icon)
- Lost (red dashed border, X icon)
- Cancelled (gray dashed border, arrow icon)

**Kanban Column Header:**
```
┌─────────────────────────┐
│ PROSPECTING  3    •••   │  ← Stage name + count + actions menu
└─────────────────────────┘
```

- Stage name (uppercase, bold)
- Deal count badge
- Column actions menu (animate-ui `DropdownMenu`): Sort within column, Collapse, Select all

**Deal Card:**
```
┌─────────────────────────┐
│ Acme Corp Expansion      │  ← Deal name (bold, truncated)
│ A  Acme Corp             │  ← Organization avatar initial + name
│                          │
│ $12,000              👤  │  ← Deal value (formatted) + assignee avatar
└─────────────────────────┘
```

**Components:**
- shadcn `Card` for card container
- shadcn `Avatar` for organization initial and assignee photo
- diceui `Status` for hot prospect indicator

**Card Interactions:**
- **Click**: Navigate to `/deals/:dealId`
- **Drag**: Move between stage columns (updates `stage` field via `DealsCollection.update()`)
- **Drag to outcome lane**: Move to Won/Lost/Cancelled (triggers stage update + optional reason dialog for Lost)
- **Context menu** (shadcn `ContextMenu`): Quick actions (Edit, Delete, Mark as Hot, Assign)

**Data Query:**
```typescript
DealsCollection.list({
  columns: [
    'id', 'record_owner', 'expected_revenue', 'deal_value',
    'stage', 'organizations(id,name)', 'contact_person(id,name)',
    'hot_prospect', 'expected_closing_date', 'close_probability'
  ],
  filters: { /* active stages only, exclude archived */ },
  orderBy: { field: 'created_on', direction: 'desc' }
})
```

#### 6.3.2 List View

**Component:** diceui `DataTable`

**Columns:**
| Column | Field | Features |
|---|---|---|
| Deal Name | id (name from record) | Link to detail, sortable |
| Organization | organizations | Avatar + name, sortable, filterable |
| Contact | contact_person | Name, sortable |
| Stage | stage | Badge with color, filterable |
| Deal Value | deal_value | Currency formatted, sortable |
| Expected Revenue | expected_revenue | Currency formatted, sortable |
| Close Probability | close_probability | Percentage, sortable |
| Expected Close | expected_closing_date | Date formatted, sortable |
| Owner | record_owner | Avatar + name, filterable |
| Hot | hot_prospect | animate-ui `Checkbox` toggle |

**Table Features:**
- Column sorting (single and multi)
- Column filtering with filter builder
- Full-text search via `filterKeyword`
- Pagination (shadcn `Pagination`)
- Row selection with bulk actions (diceui `ActionBar`)
- Export (future enhancement)

#### 6.3.3 Filters

**Components:** shadcn `Popover`, shadcn `Select`, shadcn `Calendar`, diceui `Combobox`

| Filter | Type | Field |
|---|---|---|
| Stage | Multi-select enum | stage |
| Owner | User select | record_owner |
| Organization | Combobox search | organizations |
| Deal Value | Range (min/max) | deal_value |
| Expected Close | Date range | expected_closing_date |
| Lead Source | Multi-select enum | lead_source |
| Customer Type | Multi-select enum | customer_type |
| Hot Prospect | Toggle | hot_prospect |

#### 6.3.4 New Deal Form

**Components:** shadcn `Dialog` or `Sheet`, shadcn `Field`, `Input`, `Select`, diceui `Combobox`, shadcn `Calendar`

**Form Fields:**
| Field | Input Type | Required | Notes |
|---|---|---|---|
| Deal Name | Text input | Yes | Auto-generated or manual |
| Organization | Combobox (search organizations) | Yes | Creates new if not found |
| Contact Person | Combobox (filtered by org) | No | |
| Stage | Select (enum) | Yes | Default: Prospecting |
| Deal Value | Number input (currency) | No | |
| Expected Revenue | Number input (currency) | No | |
| Close Probability | Slider or number (0-100) | No | |
| Expected Close Date | Date picker | No | |
| Lead Source | Select (enum) | No | |
| Customer Type | Select (enum) | No | |
| Country | Combobox (search countries) | No | |
| Hot Prospect | animate-ui `Switch` | No | Default: false |
| Owner | User select | Yes | Default: current user |

---

### 6.4 Deal Detail

**Priority:** P0 (Must Have)

**Route:** `/deals/:dealId`

**Layout:**

```
┌──────────────────────────────────────────────────────┐
│ ← Back to Pipeline    Acme Corp Expansion    [Edit] [•••] │
├───────────┬──────────────────────────────────────────┤
│ DETAILS   │                                          │
│ Stage     │  [Tabs: Overview | Products | Orders |   │
│ Value     │   Activity | Files | Notes]              │
│ Org       │                                          │
│ Contact   │  [Tab Content Area]                      │
│ Prob      │                                          │
│ Close     │                                          │
│ Source    │                                          │
│ Owner     │                                          │
│ Hot       │                                          │
└───────────┴──────────────────────────────────────────┘
```

**Left Panel (Deal Summary):**
- Key deal fields displayed with inline editing (diceui `Editable`)
- Stage progress indicator (diceui `Stepper` or custom)
- Close probability gauge (diceui `Gauge`)
- Followers list (diceui `AvatarGroup`)

**Tabs (shadcn `Tabs`):**

| Tab | Content |
|---|---|
| **Overview** | Full deal details, organization card, contact card, upcoming tasks/events |
| **Products** | Deal products table (diceui `DataTable`), add/edit/remove products, pricing summary |
| **Orders** | Related sales orders, create order from deal products |
| **Activity** | Activity timeline (diceui `Timeline`), notes, calls, emails |
| **Comments** | Threaded comment list via generic comment endpoints (see Section 4.4.1). Add/edit/delete comments with user avatar and timestamp |
| **Files** | File attachments via generic file endpoints (see Section 4.4.2). Upload (multipart), list, delete files using diceui `FileUpload` |
| **Notes** | Rich text notes |

#### 6.4.1 Deal Products Tab

**Component:** diceui `DataTable` (editable mode)

| Column | Field | Editable |
|---|---|---|
| Product | product (combobox) | Yes |
| Category | category | Yes |
| Qty | qty | Yes (number) |
| Unit Price | unit_price | Yes (currency) |
| Discount | discount | Yes (currency/%) |
| Tax Rate | tax_rate | Yes (%) |
| Net Total | net_total | Computed |
| Gross Total | gross_total | Computed |

**Summary Row:**
- Subtotal (sum of net_total)
- Tax Total (sum of tax amounts)
- Grand Total (sum of gross_total)

**Actions:**
- Add product row
- Remove product row
- Generate Sales Order from products (creates SalesOrder + SalesOrderItems)

---

### 6.5 Leads Management

**Priority:** P0 (Must Have)

**Route:** `/leads`

#### 6.5.1 Leads List View

**Component:** diceui `DataTable`

**Columns:**
| Column | Field |
|---|---|
| Title | title |
| Company | company_name (organization) |
| Email | email |
| Phone | phone |
| Lead Source | lead_source (enum badge) |
| Lead Status | lead_status (enum badge with diceui `Status`) |
| Lead Type | lead_type (enum) |
| Country | countries |
| Owner | record_owner |
| Created | created_on |

**Actions:**
- New Lead (shadcn `Dialog` form)
- Bulk delete (diceui `ActionBar`)
- Convert to Deal (creates a Deal from lead data)
- Filter by status, source, type, owner
- Search via `filterKeyword`

#### 6.5.2 Lead Detail

**Route:** `/leads/:leadId`

**Layout:** Similar to Deal Detail with left summary + tabbed content

**Tabs:**
| Tab | Content |
|---|---|
| Overview | Lead details, company info, contact info |
| Activity | Activity timeline, notes |
| Comments | Threaded comments via generic comment endpoints (Section 4.4.1) |
| Files | File attachments via generic file endpoints (Section 4.4.2) |

**Key Actions:**
- Edit lead fields (inline or form)
- Convert to Deal (pre-fills deal form with lead data)
- Mark as Lost (with reason selection)
- Change status

---

### 6.6 Companies (Organizations)

**Priority:** P0 (Must Have)

**Route:** `/companies`

#### 6.6.1 Companies List

**Component:** diceui `DataTable`

**Columns:**
| Column | Field |
|---|---|
| Name | name |
| Industry | industry (enum) |
| Phone | phone |
| Email | email |
| Website | website |
| Country | country |
| City | city |
| Status | status (enum) |
| Type | type (enum) |

#### 6.6.2 Company Detail

**Route:** `/companies/:companyId`

**Tabs:**
| Tab | Content |
|---|---|
| Overview | Company info, address, map location |
| Contacts | Contact list for this organization (diceui `DataTable`) |
| Deals | Deals linked to this organization |
| Leads | Leads linked to this organization |
| Tasks | Tasks linked to this organization |
| Orders | Sales orders for this organization |
| Emails | Threads/messages related to this organization |
| Comments | Threaded comments via generic comment endpoints (Section 4.4.1) |
| Files | File attachments via generic file endpoints (Section 4.4.2) |
| Activity | Activity timeline |

---

### 6.7 Tasks

**Priority:** P1 (Should Have)

**Route:** `/tasks`

**Component:** diceui `DataTable` + shadcn `Card` list view

**Columns:**
| Column | Field |
|---|---|
| Subject | subject |
| Status | status (enum) |
| Start Date | start_date |
| Due Date | end_date |
| Organization | organization |
| Owner | record_owner |
| Section | section |

**Features:**
- List and card views
- Filter by status, owner, date range, organization
- Create task with dialog form
- Inline status update (animate-ui `Checkbox`)
- Subtask support (parent/child via `parent` field)
- Task detail in `Sheet` side panel

---

### 6.8 Events / Calendar

**Priority:** P2 (Nice to Have for V1)

**Route:** `/events`

**Components:** shadcn `Calendar`, shadcn `Card`

**Features:**
- Calendar view showing events by date
- Event list view with filtering
- Create/edit events with dialog form
- Event categories from Calendar entity
- Event detail with notes

---

### 6.9 Emails (Threads & Messages)

**Priority:** P1 (Should Have)

**Route:** `/emails`

**Components:** shadcn `Card`, shadcn `ScrollArea`, shadcn `Tabs`

#### Layout

```
┌──────────────┬────────────────────────┐
│ Thread List   │ Thread Detail          │
│ [search]     │ Subject: ...           │
│ [filters]    │ [message 1]            │
│              │ [message 2]            │
│ ▸ Thread 1   │ [message 3]            │
│   Thread 2   │                        │
│   Thread 3   │ [Reply composer]       │
└──────────────┴────────────────────────┘
```

**Thread List:**
- Search via `filterKeyword`
- Filter by status, priority, contact, organization
- Star/unstar threads
- Archive threads
- Unread indicator

**Thread Detail:**
- Message timeline (chronological)
- Reply composer with rich text
- CC/BCC support
- File attachments (diceui `FileUpload`)
- Related entity links (contact, organization, product)

---

### 6.10 Products Catalog

**Priority:** P1 (Should Have)

**Route:** `/products`

**Component:** diceui `DataTable`

**Columns:**
| Column | Field |
|---|---|
| Product Code | product_code |
| Name | (from record) |
| Category | category |
| Unit | Unit (enum) |
| Unit Price | unit_price (currency) |
| Tax | tax (%) |

**Features:**
- CRUD operations
- Search and filter
- Used in Deal Products and Sales Order Items

---

### 6.11 Sales Orders

**Priority:** P1 (Should Have)

**Route:** `/sales-orders`

#### 6.11.1 Sales Orders List

**Component:** diceui `DataTable`

**Columns:**
| Column | Field |
|---|---|
| Order # | id |
| Organization | organization |
| Status | status (enum badge) |
| Subtotal | sub_total (currency) |
| Tax | tax_total (currency) |
| Grand Total | grand_total (currency) |
| Created | created_on |

#### 6.11.2 Sales Order Detail

**Route:** `/sales-orders/:orderId`

**Layout:**
- Order header (organization, status, dates)
- Line items table (editable, same structure as Deal Products)
- Totals summary
- Print/export action (future)

---

### 6.12 Notifications

**Priority:** P1 (Should Have)

**Component:** shadcn `Popover` triggered from sidebar notification icon

**Features:**
- Unread notification list from `NotificationsCollection.getNotifications()`
- Mark as read/unread
- Mark all as read
- Notification grouped by date
- Click to navigate to related entity
- Creator avatar and name display

---

## 7. Cross-Cutting Concerns

### 7.1 Empty States

**Component:** shadcn `Empty`

Every list/table view must have a well-designed empty state with:
- Descriptive icon
- Clear message explaining what will appear here
- Primary action button (e.g., "+ Create your first deal")

### 7.2 Loading States

**Component:** shadcn `Skeleton`, shadcn `Spinner`

- Skeleton placeholders for initial page loads
- Spinner for action-triggered loading (save, delete)
- Optimistic updates where possible via TanStack Query

### 7.3 Error Handling

- Toast notifications for success/failure (shadcn `Sonner`)
- Inline form validation errors (shadcn `Field` error state)
- Error boundaries per route
- Network error retry via TanStack Query defaults

### 7.4 Responsive Design

- Sidebar collapses to drawer on mobile (animate-ui sidebar built-in)
- Data tables switch to card layout on small screens
- Kanban board horizontal scroll on mobile
- Dialog forms become full-screen sheets on mobile (diceui `ResponsiveDialog`)

### 7.5 Accessibility

- All animate-ui components built on Radix UI primitives (WAI-ARIA compliant)
- Keyboard navigation for kanban (arrow keys to move between cards/columns)
- Focus management for dialogs and sheets
- Screen reader labels for all interactive elements
- Color contrast ratios meet WCAG AA

### 7.6 Data Formatting

| Type | Format | Notes |
|---|---|---|
| Currency | `$12,000` | Locale-aware, from org country currency_symbol |
| Date | `Jan 15, 2026` | Relative dates for recent ("2 hours ago") |
| Percentage | `75%` | For close probability |
| Phone | International format | diceui `PhoneInput` for entry |

### 7.7 Authentication & Authorization

- All routes except `/auth/callback` require authentication
- Unauthenticated users see sign-in page
- API calls use `@docyrus/app-auth-ui` token management
- `record_owner` field used for ownership-based visibility (future enhancement)

---

## 8. Form Implementation (TanStack Form + Zod)

All create/edit forms in the application use **TanStack Form** with **Zod** schema validation. This ensures consistent form handling, client-side validation, and accessible error display across all entities.

**Reference:** `docs/form-implementation-guide.md`

### 8.1 Form Architecture Pattern

Every entity form follows this standard pattern:

```typescript
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import * as z from 'zod'

// 1. Define Zod schema matching entity fields
const dealFormSchema = z.object({
  deal_name: z.string().min(1, 'Deal name is required.'),
  organizations: z.string().min(1, 'Organization is required.'),
  stage: z.string().min(1, 'Stage is required.'),
  deal_value: z.number().optional(),
  // ...
})

// 2. Initialize form with useForm hook
const form = useForm({
  defaultValues: {
    deal_name: '',
    organizations: '',
    stage: '',
    deal_value: undefined,
  },
  validators: {
    onSubmit: dealFormSchema,
  },
  onSubmit: async ({ value }) => {
    await DealsCollection.create({ data: value })
    toast.success('Deal created successfully')
  },
})
```

### 8.2 Field Component Mapping

Each entity field type maps to a specific UI component within the `form.Field` render prop pattern:

| Field Type | UI Component | Validation Pattern |
|---|---|---|
| Text (name, title, subject) | shadcn `Input` + `Field` + `FieldLabel` | `z.string().min(n)` |
| Long text (description, notes) | shadcn `Textarea` + `Field` | `z.string().max(n)` |
| Enum (stage, status, type) | shadcn `Select` + `SelectTrigger` | `z.string().min(1)` |
| Relation (organization, contact) | diceui `Combobox` | `z.string().min(1)` for required FK |
| Number (deal_value, qty, price) | shadcn `Input` type="number" | `z.number().positive()` |
| Boolean (hot_prospect) | animate-ui `Switch` | `z.boolean()` |
| Date (expected_closing_date) | shadcn `Calendar` + `Popover` | `z.string().datetime()` |
| Phone (phone, mobile) | diceui `PhoneInput` | `z.string()` with phone regex |
| Currency (deal_value, unit_price) | shadcn `Input` with currency prefix | `z.number().min(0)` |
| Multi-select (followers) | diceui `TagsInput` | `z.array(z.string())` |
| Array (deal products, order items) | `mode="array"` + nested `form.Field` | `z.array(z.object({...}))` |

### 8.3 Field Rendering Pattern

All form fields use the `form.Field` render prop with consistent error handling:

```tsx
<form.Field
  name="fieldName"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>Label</FieldLabel>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        <FieldDescription>Helper text.</FieldDescription>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    )
  }}
/>
```

**Key conventions:**
- `data-invalid` on `<Field>` for styling the error state container
- `aria-invalid` on the input control for accessibility
- `FieldError` renders only when `isTouched && !isValid`
- `FieldDescription` provides contextual help text

### 8.4 Validation Modes

| Mode | When to Use |
|---|---|
| `onSubmit` | Default for all forms. Validates on submit. |
| `onChange` | Use for fields that need real-time feedback (e.g., password strength). |
| `onBlur` | Use for fields where immediate post-input validation improves UX (e.g., email format). |

### 8.5 Array Fields (Line Items)

Deal Products and Sales Order Items use TanStack Form's `mode="array"` for dynamic line item management:

```tsx
<form.Field
  name="products"
  mode="array"
  children={(field) => (
    <FieldSet>
      <FieldGroup>
        {field.state.value.map((_, index) => (
          <form.Field
            key={index}
            name={`products[${index}].unit_price`}
            children={(subField) => { /* nested field render */ }}
          />
        ))}
      </FieldGroup>
      <Button type="button" onClick={() => field.pushValue({ qty: 1, unit_price: 0 })}>
        Add Product
      </Button>
    </FieldSet>
  )}
/>
```

**Array operations:**
- `field.pushValue(item)` -- Add a new line item
- `field.removeValue(index)` -- Remove a line item
- Bracket notation `products[${index}].field` for nested fields

### 8.6 Form Schemas Per Entity

| Entity | Form Used In | Key Required Fields |
|---|---|---|
| Deal | New Deal dialog, Deal edit | deal_name, organizations, stage, record_owner |
| Lead | New Lead dialog, Lead edit | title, email |
| Organization | New Company dialog, Company edit | name |
| Contact | New Contact dialog, Contact edit | name, organization |
| Task | New Task dialog/sheet, Task edit | subject |
| Event | New Event dialog, Event edit | subject, start_date |
| Product | New Product dialog, Product edit | product_code, unit_price |
| Deal Product | Deal Products tab (array field) | product, qty, unit_price, category |
| Sales Order Item | Order detail (array field) | product, qty, unit_price, category, related_sales_order |

### 8.7 Form UX Standards

- All forms open in shadcn `Dialog` (simple forms) or `Sheet` (complex forms with many fields)
- On mobile, forms use diceui `ResponsiveDialog` to auto-switch between dialog and bottom drawer
- Submit button shows shadcn `Spinner` during async submission
- Success/failure feedback via shadcn `Sonner` toasts
- `form.reset()` on cancel button to clear form state
- Optimistic updates via TanStack Query `onMutate` where appropriate

---

## 9. Implementation Phases

### Phase 1 - App Shell & Data Views (P0)

**Goal:** Application shell + all data list/kanban views. **No object detail pages or create/edit forms in this phase.**

| # | Task | Components Needed |
|---|---|---|
| 1 | Install animate-ui: sidebar, dropdown-menu, alert-dialog, checkbox, switch, radio-group | animate-ui |
| 2 | Install shadcn: button, button-group, card, input, select, tabs, badge, avatar, tooltip, sonner, skeleton, spinner, label, popover, command, context-menu, breadcrumb, separator, scroll-area, empty, typography, pagination | shadcn |
| 3 | Install diceui: kanban, data-table, combobox, status, stat, tags-input, action-bar, avatar-group | diceui |
| 4 | Build app shell layout: animated sidebar + top bar + page container | Layout components |
| 5 | Set up route tree in `main.tsx` (list routes only: `/`, `/deals`, `/leads`, `/companies`, `/tasks`, `/emails`, `/products`, `/sales-orders`) | TanStack Router |
| 6 | Create shared data hooks: `use-enums.ts`, `use-deals.ts`, `use-leads.ts`, `use-companies.ts`, `use-contacts.ts`, `use-tasks.ts`, `use-notifications.ts` | TanStack Query |
| 7 | Build shared filter/sort toolbar component (reusable across all list pages) | Popover, Select, Combobox, DropdownMenu |
| 8 | Build Deals Pipeline page - Kanban view with drag-drop stage changes | diceui Kanban, Card, Avatar, Status |
| 9 | Build Deals Pipeline page - List view with DataTable | diceui DataTable, Badge, Pagination |
| 10 | Build Leads list page with DataTable | diceui DataTable, Status |
| 11 | Build Companies list page with DataTable | diceui DataTable |
| 12 | Build Tasks list page with DataTable | diceui DataTable, Checkbox |
| 13 | Build Emails/Threads list page (thread list panel only, no detail) | Card, ScrollArea, Badge |
| 14 | Build Products catalog list page | diceui DataTable |
| 15 | Build Sales Orders list page | diceui DataTable, Badge |
| 16 | Build Notifications popover | Popover, Avatar |
| 17 | Add empty states for all list views | shadcn Empty |
| 18 | Add skeleton loading states for all data views | shadcn Skeleton |
| 19 | `pnpm build` + `pnpm check` pass | QA |

### Phase 2 - Object Detail Views (P0-P1)

**Goal:** Detail pages for all entities with tabbed layouts and related data

| # | Task |
|---|---|
| 20 | Add detail routes to route tree (`/deals/:dealId`, `/leads/:leadId`, `/companies/:companyId`, `/sales-orders/:orderId`, `/emails/:threadId`) |
| 21 | Install diceui: editable, timeline, gauge, stepper, file-upload |
| 22 | Install shadcn: dialog, sheet, field, calendar, accordion, hover-card, progress, textarea |
| 23 | Build reusable **CommentsPanel** component — generic threaded comment list with create/edit/delete using data source comment endpoints (Section 4.4.1). Displays user avatar, timestamp, and comment body. Reused across all detail views. |
| 24 | Build reusable **FileAttachments** component — generic file list with upload (multipart), insert, delete using data source file endpoints (Section 4.4.2). Uses diceui `FileUpload` for drag-and-drop upload. Reused across all detail views. |
| 25 | Build Deal Detail page (left summary panel + tabs: Overview, Products, Orders, Activity, Comments, Files) |
| 26 | Build Deal Products tab (read-only data table with pricing summary) |
| 27 | Build Lead Detail page (summary + tabs: Overview, Activity, Comments, Files) |
| 28 | Build Company Detail page (summary + relationship tabs: Contacts, Deals, Leads, Tasks, Orders, Emails, Comments, Files) |
| 29 | Build Sales Order Detail page (header + line items table + totals + Comments + Files tabs) |
| 30 | Build Email Thread Detail page (message timeline + thread metadata) |
| 31 | Build Task detail side panel (Sheet + Comments + Files) |

### Phase 3 - Forms & CRUD (P1)

**Goal:** All create/edit forms using TanStack Form + Zod. Full CRUD across entities.

| # | Task |
|---|---|
| 32 | Install TanStack Form + Zod adapter (`@tanstack/react-form`, `@tanstack/zod-form-adapter`, `zod`) |
| 33 | Install diceui: phone-input, responsive-dialog |
| 34 | Build New Deal form (Dialog) with Zod schema validation |
| 35 | Build Deal edit form (reuses schema, pre-populated) |
| 36 | Build Deal Products inline editor (array fields with `mode="array"`) |
| 37 | Build New Lead form + Lead edit form |
| 38 | Build Lead-to-Deal conversion flow (pre-fills deal form from lead data) |
| 39 | Build New Company form + Company edit form |
| 40 | Build New Contact form + Contact edit form |
| 41 | Build Task create/edit form (Sheet side panel) |
| 42 | Build Event create/edit form (Dialog) |
| 43 | Build Product create/edit form (Dialog) |
| 44 | Build Sales Order line item editor (array fields) |
| 45 | Build "Generate Sales Order from Deal Products" action |
| 46 | Build Email reply composer with rich text |
| 47 | Add bulk delete with ActionBar + AlertDialog confirmation across all list views |

### Phase 4 - Dashboard, Calendar & Polish (P1-P2)

**Goal:** Dashboard, calendar, command palette, responsive polish

| # | Task |
|---|---|
| 46 | Build Dashboard home page with stat widgets (diceui Stat) |
| 47 | Build Dashboard charts: pipeline by stage, revenue over time, leads by source (shadcn Chart) |
| 48 | Build Dashboard lists: upcoming tasks, recent activity (diceui Timeline), hot deals |
| 49 | Build Events/Calendar page |
| 50 | Add command palette (Cmd+K) for global search and quick actions |
| 51 | Add responsive breakpoints and mobile optimizations (ResponsiveDialog, sidebar drawer) |
| 52 | Performance optimization (query caching strategies, lazy route loading, optimistic updates) |
| 53 | Final QA pass: `pnpm build`, `pnpm check`, `pnpm test` |

---

## 10. Component Installation Commands

### Animate-UI (Priority 1)

```bash
# Sidebar (main layout)
pnpm dlx shadcn@latest add "https://animate-ui.com/r/radix-sidebar"

# Alert Dialog
pnpm dlx shadcn@latest add "https://animate-ui.com/r/radix-alert-dialog"

# Dropdown Menu
pnpm dlx shadcn@latest add "https://animate-ui.com/r/radix-dropdown-menu"

# Checkbox
pnpm dlx shadcn@latest add "https://animate-ui.com/r/radix-checkbox"

# Radio Group
pnpm dlx shadcn@latest add "https://animate-ui.com/r/radix-radio-group"

# Switch
pnpm dlx shadcn@latest add "https://animate-ui.com/r/radix-switch"
```

### Shadcn/ui (Priority 2)

```bash
pnpm dlx shadcn@latest add button button-group card input select dialog sheet tabs \
  badge avatar tooltip sonner skeleton spinner field label calendar popover command \
  context-menu breadcrumb separator scroll-area progress empty typography textarea \
  accordion hover-card pagination dropdown-menu alert-dialog checkbox radio-group switch
```

### DiceUI (Priority 3)

```bash
pnpm dlx shadcn@latest add @diceui/kanban
pnpm dlx shadcn@latest add "@diceui/data-table"
pnpm dlx shadcn@latest add @diceui/combobox
pnpm dlx shadcn@latest add "https://diceui.com/r/status"
pnpm dlx shadcn@latest add "https://diceui.com/r/stat"
pnpm dlx shadcn@latest add @diceui/tags-input
pnpm dlx shadcn@latest add "@diceui/action-bar"
pnpm dlx shadcn@latest add "@diceui/editable"
pnpm dlx shadcn@latest add "@diceui/avatar-group"
pnpm dlx shadcn@latest add @diceui/timeline
pnpm dlx shadcn@latest add "https://diceui.com/r/file-upload"
pnpm dlx shadcn@latest add @diceui/stepper
pnpm dlx shadcn@latest add @diceui/phone-input
pnpm dlx shadcn@latest add "@diceui/gauge"
pnpm dlx shadcn@latest add @diceui/sortable
pnpm dlx shadcn@latest add @diceui/responsive-dialog
```

---

## 11. Success Metrics

| Metric | Target |
|---|---|
| Build passes | `pnpm build` succeeds with zero errors |
| Code quality | `pnpm check` passes with zero warnings |
| Page load time | < 2s on 3G (with skeleton loading) |
| Core Kanban interaction | Drag-drop stage change < 300ms perceived |
| Entity CRUD | Create/update/delete with optimistic UI |
| Responsive | Usable on tablet (768px+) and mobile (375px+) |

---

## 12. Out of Scope (V1)

- User role-based access control (beyond basic authentication)
- Custom pipeline creation / stage management
- Email sending integration (SMTP)
- Calendar sync (Google/Outlook)
- Reporting / advanced analytics
- Import/export (CSV, Excel)
- Workflow automation / triggers
- Multi-language support
- Offline mode
- Real-time collaboration / presence
- Custom fields per entity

---

## 13. Assumptions & Dependencies

1. All backend entities exist and are accessible via the generated collections in `src/collections/`
2. Enum values for deal stages, lead statuses, etc. are pre-configured in the backend
3. Authentication is fully handled by `@docyrus/app-auth-ui`
4. The Docyrus API supports all query capabilities described in `docs/docyrus-api-query-guide.md`
5. File upload/attachment relies on existing document storage backend
6. No new backend endpoints or entities are needed for V1
