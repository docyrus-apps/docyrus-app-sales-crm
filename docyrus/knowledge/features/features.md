## Companies & Contacts Workspace

The companies and contacts routes now use the Docyrus data-grid runtime for list views with saved views, Docyrus-backed search/filtering, inline change saving, and toolbar import/export actions. Alternate layouts remain where implemented.

## Products & Sales Orders

The products and sales orders routes now follow the shared Docyrus grid pattern with saved views, card/list browsing, inline change saving, and toolbar import/export actions so catalog workflows behave consistently with the CRM workspaces.

## Leads & Deals Pipeline

The leads and deals routes now use the shared Docyrus grid runtime for list tabs and the Docyrus kanban hook for board tabs, with saved views, inline updates, and toolbar import/export actions.

Lead conversion follows the pure lead model: leads keep pre-conversion company, contact, and qualification fields; conversion creates or reuses company/contact records, creates the deal, writes converted record links and conversion state, resumes partial conversions, and keeps converted leads read-only in edit/detail flows.

## Tasks, Activities & Calendar

The tasks route now uses the shared Docyrus grid runtime with saved views, inline updates, and toolbar import/export actions so task management behaves consistently with the other CRM workspaces.

<!-- docyrus-knowledge:auto:begin -->

# Features

This file groups the user-facing surface area that the repo currently exposes so future knowledge updates can attach behavior changes to stable feature buckets.

## Routes And Surface Areas

This section captures the visible feature surface inferred from route and page files.

- src/routes/activities.tsx
- src/routes/calendar.tsx
- src/routes/companies.tsx
- src/routes/company-detail.tsx
- src/routes/contact-detail.tsx
- src/routes/contacts.tsx
- src/routes/dashboard.tsx
- src/routes/deal-detail.tsx
- src/routes/deals.tsx
- src/routes/emails.tsx
- +10 more

## API Integration Points

This section highlights the files that appear to integrate with Docyrus APIs or auth flows.

- src/App.test.tsx
- src/App.tsx
- src/collections/base_crm-deal_product.collection.ts
- src/collections/base_crm-deals.collection.ts
- src/collections/base_crm-leads.collection.ts
- src/collections/base_crm-product.collection.ts
- src/collections/base_crm-sales_order_item.collection.ts
- src/collections/base_crm-sales_order.collection.ts
- +7 more

<!-- docyrus-knowledge:auto:end -->

<!-- docyrus-project-plan:features:begin -->

## Planned Features

Features tracked in the project plan.

- **Runtime, Auth & Developer Tooling** — The shared app shell, Docyrus authentication, query runtime, command infrastructure, and developer tooling at the root of the SPA.
- **Executive Dashboard** — Home screen metrics and operational summaries for deals, leads, tasks, and recent pipeline activity.
- **Leads & Deals Pipeline** — Pipeline views, detail flows, conversion paths, and related revenue records for opportunity management.
- **Companies & Contacts Workspace** — Company and contact directories with relationship-aware detail pages and cross-linked CRM context.
- **Tasks, Activities & Calendar** — Execution workflows for follow-ups, meetings, and time-based coordination across the sales team.
- **Products & Sales Orders** — Catalog management and order-building workflows that connect products, pricing, and customer orders.
- **Inbox, Email & Notes** — Communication views and lightweight note-taking that keep account context and follow-up history visible.
- **Reports & Analytics** — Pipeline, lead, productivity, and order analytics used by managers and reps to track sales performance.

<!-- docyrus-project-plan:features:end -->
