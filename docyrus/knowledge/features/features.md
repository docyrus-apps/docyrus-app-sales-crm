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

- The dialog keeps orchestration/state in `lead-convert-dialog.tsx` while presentational sections are split into focused components: `lead-convert-mode-selector.tsx`, `lead-convert-progress.tsx`, `lead-convert-precheck-tooltip.tsx`, `lead-convert-reuse-banner.tsx`, `lead-convert-change-confirm-dialog.tsx`, and `lead-convert-tabs.tsx` (Company/Contact/Deal tab rendering plus the add-field popover, receiving form, extraFields, candidates, enum ids, and all handlers from the dialog).
- Each tab renders `FieldMappingRow` (`src/components/leads/field-mapping-row.tsx`) — left chip shows the lead source value (muted), right input/select holds the editable target value pre-filled from source. Source chips can restore their original lead value back into the target input without manually retyping. Rows without a source value hide the source chip/arrow and use a simpler one-column layout; narrow screens stack source and target fields.
- Required fields render a visible required badge and subtle row emphasis; auto-match looks up lead enum values (industry, company_size, lead_source, lead_type) in target enums by name. If a source enum has no target enum match, conversion is blocked before writes instead of sending the raw source label.
- Conversion mode is selected with a segmented control instead of a compact dropdown so company/contact/deal scope is visible before users start editing fields. If the selected mode hides existing company/contact draft values, a small warning explains that those targets will be skipped and the values are preserved if the user switches back.
- Reuse vs Create banner: when duplicate search returns matches on Company or Contact tab, an amber banner appears at the top with "Yeni oluştur / Mevcut kullan" toggle, the candidate list below it, and the editable form fields are hidden under a short note when reuse is selected. Candidate lists are height-limited and scroll when many suggestions are returned. The create/reuse toggle exposes pressed state for assistive technology.
- "+ Alan ekle" popover at the top of each tab fetches target datasource fields, hides system slugs, and lets users add or remove dialog-only fields that get spread into the create payload. Tab labels and add-field buttons show a `+N` count for fields added to that tab.
- Validation focus and added-field reveal both scroll the row into view and ring-highlight it.
- Precheck step icon turns amber (`warn` state) if any duplicate is found; its keyboard-focusable tooltip renders a structured responsive summary (Şirket / Kişi / Fırsat) with per-target status (clean / öneri / tam eşleşme), counts, and the example matching name. The progress stepper is exposed as a list with `aria-current="step"` on the active/warned step.

### Convert Flow

`runConversion` runs precheck → organization → contact → deal → activity → lead, gated by three checks before the work starts.

- Gate 1: duplicate search runs against organization, contact, and deal (`source_lead = lead.id`) — keyword is sanitized to strip tsquery-breaking characters.
- Duplicate/precheck requests use an `AbortController` plus a request id guard, so a newer precheck cancels older network work and stale responses cannot overwrite candidate or step state.
- Gate 2: `findMissingField` checks only conversion-required values: created company/contact names, deal name/stage, and source enum values that could not be mapped. Hidden reused records and optional fields do not block conversion.
- Gate 3: `findChangedFromLead` opens an AlertDialog whenever any target value differs from the lead source; each row can be restored to the lead value, and confirming calls `runConversion({ skipChangeCheck: true })` to bypass closure-stale state.
- Before writing, the dialog refetches the latest lead conversion fields. If another session completed the lead, it opens the existing result; if the lead is already `in_progress` with no created target records, it aborts with a concurrent-session message.
- Before creating organization, contact, or deal, each step checks for an existing target record with `source_lead = lead.id` and reuses it when found. This keeps client-side retries and double-click/race scenarios idempotent without backend locks.
- Each step writes outputs (`converted_*`) back to the lead immediately so any failure leaves a resumable partial state.
- Open `base.task` and `base.event` records pointing to the lead get migrated to also reference the new organization, contact, and deal — the lead link is preserved as provenance. Migration metadata or patch failures mark the activity step as `warn` and show a manual-review warning instead of being presented as "no linked work".
- The deal payload writes `description` from `lead.contact_message` to keep the original inquiry.
- Precheck completion, linked-work warnings, conversion success, and conversion failure emit structured `[LeadConvert]` console events with lead id, mode, target ids, and relevant counts to make client-side troubleshooting less opaque.

### Failed vs Partial State

A failed attempt and a partial conversion are distinguished by whether any canonical record was actually created.

- Failed (`conversion_state = failed`, all `converted_*` null): short alert, all steps pending, no pre-marked failures — fresh start.
- Partial (any `converted_*` filled): dialog initialises with completed steps marked done with "Mevcut: <name>" tooltip detail, the next pending step pre-marked failed with the captured error.
- The lead detail primary action becomes "Dönüşüme devam et" when partial; stays "Convert" otherwise.

### Provenance & Read-only Enforcement

Every record created during convert is tagged with `source_lead = lead.id` (organization, contact, deal).

- `isLeadConvertedRecord` (`src/lib/lead-conversion.ts`) returns true when `converted_deal` is set or `conversion_state = completed`.
- The lead form, kanban drag, command palette, and detail edit flows derive read-only behavior from this single helper.
- The leads list and board fetch hidden conversion marker fields (`converted_deal`, `conversion_state`) and enforce read-only behavior from route-level callbacks and save handlers, leaving Docyrus grid/kanban component implementations untouched. `lead_status = Converted` alone is not treated as a real conversion lock.
- Step state, tooltip details, the "+ field" popover, the mode selector, and the form all check the same flag.

## Tasks, Activities & Calendar

The tasks route now uses the shared Docyrus grid runtime with saved views, inline updates, and toolbar import/export actions so task management behaves consistently with the other CRM workspaces.

## Field Sales Planning & Approvals

The app now includes a field sales workspace with persisted settings, a drag-and-drop planning board, a manager approval screen, a monthly field calendar, and a global location action for nearby visits plus check-in or check-out flows.

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
