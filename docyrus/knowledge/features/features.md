## Companies & Contacts Workspace

The companies and contacts routes now use the Docyrus data-grid runtime for list views with saved views, Docyrus-backed search/filtering, inline change saving, and toolbar import/export actions. Alternate layouts remain where implemented.

## Products & Sales Orders

The products and sales orders routes now follow the shared Docyrus grid pattern with saved views, card/list browsing, inline change saving, and toolbar import/export actions so catalog workflows behave consistently with the CRM workspaces.

## Leads & Deals Pipeline

The leads and deals routes use the shared Docyrus grid runtime for list tabs and the Docyrus kanban hook for board tabs, with saved views, inline updates, and toolbar import/export actions.

### Lead Datasource (Pure Lead Model)

`base_crm.leads` follows a pure lead model: no contact/organization/deal record exists before convert — the lead carries the pre-conversion raw data itself.

- Contact display name lives in the system `name` field; the legacy `title` field is unused.
- Company info is raw: `company_name_text`, `company_email`, `company_phone`, `company_industry`, `company_size`, `website`, `address`, `city`. The old `company_name` relation has been removed.
- Qualification fields: `lead_status`, `lead_source`, `lead_type`, `lead_form`, `lost_reason`, `contact_message`.
- Only deal-seed field kept: `deal_value` (UI label "Tahmini Değer / Estimated Value"). `expected_revenue`, `close_probability`, `expected_closing_date`, `deal_name` were removed; users add them dialog-only via "+ Alan ekle" during convert.
- Conversion tracking: `converted_organization`, `converted_contact`, `converted_deal`, `converted_on`, `converted_by`, `conversion_state` (enum: in_progress/completed/partial/failed), `conversion_mode` (enum: company_contact_deal/contact_deal/deal_only), `conversion_error_message`.

### Lead Convert Dialog

The convert dialog at `src/components/leads/lead-convert-dialog.tsx` is a tabbed UX with Company / Contact / Deal tabs shown by mode.

- Each tab renders `FieldMappingRow` (`src/components/leads/field-mapping-row.tsx`) — left chip shows the lead source value (muted), right input/select holds the editable target value pre-filled from source.
- Required fields render a red asterisk; auto-match looks up lead enum values (industry, company_size, lead_source, lead_type) in target enums by name.
- Reuse vs Create banner: when duplicate search returns matches on Company or Contact tab, an amber banner appears at the top with "Yeni oluştur / Mevcut kullan" toggle, the candidate list below it, and the editable form fields are hidden under a short note when reuse is selected.
- "+ Alan ekle" popover at the top of each tab fetches target datasource fields, hides system slugs, and lets users add or remove dialog-only fields that get spread into the create payload.
- Validation focus and added-field reveal both scroll the row into view and ring-highlight it.
- Precheck step icon turns amber (`warn` state) if any duplicate is found; its tooltip renders a structured 3-column summary (Şirket / Kişi / Fırsat) with per-target status (clean / öneri / tam eşleşme), counts, and the example matching name.

### Convert Flow

`runConversion` runs precheck → organization → contact → deal → activity → lead, gated by three checks before the work starts.

- Gate 1: duplicate search runs against organization, contact, and deal (`source_lead = lead.id`) — keyword is sanitized to strip tsquery-breaking characters.
- Gate 2: `findMissingField` scans every visible field, switches the offending tab and rings the first empty one.
- Gate 3: `findChangedFromLead` opens an AlertDialog whenever any target value differs from the lead source; confirming calls `runConversion({ skipChangeCheck: true })` to bypass closure-stale state.
- Each step writes outputs (`converted_*`) back to the lead immediately so any failure leaves a resumable partial state.
- Open `base.task` and `base.event` records pointing to the lead get migrated to also reference the new organization, contact, and deal — the lead link is preserved as provenance.
- The deal payload writes `description` from `lead.contact_message` to keep the original inquiry.

### Failed vs Partial State

A failed attempt and a partial conversion are distinguished by whether any canonical record was actually created.

- Failed (`conversion_state = failed`, all `converted_*` null): short alert, all steps pending, no pre-marked failures — fresh start.
- Partial (any `converted_*` filled): dialog initialises with completed steps marked done with "Mevcut: <name>" tooltip detail, the next pending step pre-marked failed with the captured error.
- The lead detail primary action becomes "Dönüşüme devam et" when partial; stays "Convert" otherwise.

### Provenance & Read-only Enforcement

Every record created during convert is tagged with `source_lead = lead.id` (organization, contact, deal).

- `isLeadConvertedRecord` (`src/lib/lead-conversion.ts`) returns true when `converted_deal` is set or `conversion_state = completed`.
- The lead form, kanban drag, command palette, and detail edit flows derive read-only behavior from this single helper.
- Step state, tooltip details, the "+ field" popover, the mode selector, and the form all check the same flag.

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
