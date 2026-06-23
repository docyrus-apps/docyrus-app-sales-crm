## Companies & Contacts Workspace

The companies and contacts routes now use the Docyrus data-grid runtime for list views with saved views, Docyrus-backed search/filtering, inline change saving, and toolbar import/export actions. Alternate layouts remain where implemented.

List grid toolbars render saved views above the search/filter/tool row, and every datasource ships system views: All plus two query-backed filtered views that merge through `filterQuery` rather than toolbar quick-filter state.

Saved data views are normalized to standard paging (`pagingEnabled: true`, `pagingMode: standard`) so the pagination footer is visible when the active list view loads. In standard paging mode, the shared DataGrid treats the configured `height` as the total grid area including the pagination footer, preventing large pages from pushing the footer below the viewport.

Saved view filter queries are normalized into backend filter syntax before list/board requests are sent: Query Builder-only fields are stripped and display operators like `is one of` are mapped to `in`, matching toolbar-generated filters. See [[architecture#Saved View Filter Normalization]].

## CRM Status & Type Taxonomy

Status/type fields are tenant-enum picklists (`tenant.enum`, scoped per `tenant_field_id`), rendered in `sortOrder` order. Enum config is edited via `docyrus studio update-enums` (id-based upsert).

When `sortOrder` is null the UI (`src/hooks/use-enums.ts`) falls back to creation order (`autonumber_id`), so pipeline/funnel fields must carry an explicit `sortOrder`. Sending a subset of options to `update-enums` patches only those ids; the rest are untouched.

Canonical ordered options (`sortOrder` in steps of 10, `*` = `isFinalOption`):

- Deal `stage`: New → Demo → Budget → Proposal → Negotiation → Follow-Up → Won\* → Lost\* → Cancelled\*.
- Lead `lead_status`: New → Contacted → Qualified → Proposal Sent → Trial Started → Current Customer → Converted\* → Disqualified\* (Proposal Sent/Trial Started/Current Customer added for parity at `sortOrder` 32/34/36, slotted between Qualified and the final states). Conversion sets both `lead_status="Converted"` and `conversion_state="completed"` together; `isLeadConvertedRecord` keys off `conversion_state`/`converted_deal`, not the picklist value.
- Organization `status`: Active → Inactive\* → Review (the legacy "Deneme" test option was renamed to "Review" and is in active use, so it is kept rather than deleted).
- Organization `type`: Customer → Prospect → Partner → Vendor. The former "Lead" option was renamed in place to "Prospect" (existing records reclassified without data migration, since "Lead" is its own entity); the stray "Deneme" test value is gone.
- Contact carries `contact_type` (role: Decision Maker, Champion, Influencer, Technical, Billing, User, Legal, Blocker, Other) and `contact_status` (Active, Inactive\*, Do Not Contact\*). User/Legal/Blocker were appended for parity with the sibling CRM's `buying_role`. The bare slugs `type`/`status` are reserved system field slugs, hence the `contact_` prefix; both fields are CUSTOM-owned additions on the shared `base.contact` datasource.

Paired cross-datasource picklists now share identical option names: Deal `customer_type` and Lead `lead_type` = {New Business, Existing Business}; Deal `reason_for_lost` and Lead `lost_reason` = one canonical list (Competition, Price, Feature Gap, Expectation Mismatch, Lack of Response, Missed Follow Ups, Unqualified, Wrong Target, Future Interest, Other); `lead_source`, `company_size`, and `industry`/`company_industry` match across leads/deal/organization — `industry`/`company_industry` is now 10 options (Automotive, Consumer Services, Energy, Entertainment, Finance, HR, Healthcare, Manufacturing, Software, Technology).

**Parity fields added (2026-06-19, mirroring the sibling `crm` CRM).** Created via `docyrus studio create-field` + `create-enums`, mirrored by hand into the generated collection `.ts` and the detail field configs (`flatRecord` stores the option/relation id; values load via the detail GET column lists):
- Deal `deal_type` (field-select): New Business · Renewal · Expansion · Upsell · Partner · Pilot — separate from `customer_type`.
- Organization `lifecycle_stage` (field-select): Prospect · Engaged · Customer · Expansion · Churned — kept alongside `type` (we did NOT adopt their separate `account_type`). `commercial_title` (field-text) also added. Both on the shared `base.organization`.
- Lead `lead_category` (field-select): Lead · Partner · Investor · Other. `contact_person` (field-relation → `base/contact`, edited as a select over the contacts list) added; the lead name stays a single `name` field (not split into firstname/lastname). We did NOT adopt their `contact_consent`/`kvkk_consent`. Contact `related_product` and Org `account_type`/`parent_organization`/`referring_partner` were also intentionally skipped.

These shared concepts are deliberately kept as separate per-field enum definitions (NOT consolidated into a shared `tenant_enum_set_id`): the CLI has no `create-enum-set` and enums can only be created against a field, so a true shared set would need field-repointing plus record migration with unverified merge semantics on the shared `base` app. Instead, paired fields are kept name-identical, and lead convert maps them by normalized name (`optionByName` / `mapEnumBetweenDataSources` in `use-lead-convert-enum-mappings.ts`). Keep paired option names in sync when editing either side.

## Products & Sales Orders

The products and sales orders routes now follow the shared Docyrus grid pattern with saved views, card/list browsing, inline change saving, and toolbar import/export actions so catalog workflows behave consistently with the CRM workspaces.

Their list grids use the same row action pattern as the CRM workspaces: an inline open-page button plus an overflow menu for Edit, Open page, and Delete.

## Quotes (Teklif)

The Quote (Teklif) feature is detail-centric: a quote opens in an Attio-style detail screen, line items are authored in a dedicated tab, and a separate build/compose screen produces the PDF. See [[architecture#Quote Builder & PDF]] for storage.

Quotes reuse `sales_order` + `sales_order_item` (no separate entity). Data vs document is separated on purpose: line items are the single source of truth, edited ONLY in the Detail "Line Items" tab; the build screen renders pricing read-only and composes presentation.

- **Teklifler list** — the single CRM nav item "Teklifler" (`quotes.title`) → the `sales_order` list (`src/routes/sales-orders.tsx`). A row's normal open and "Yeni Teklif" go to Detail/create; the three-dot menu adds "Open builder" → the build screen. The separate "Teklif Oluştur" nav item is retired.
- **Create + Build** — `/quotes/new` AND `/quotes/$quoteId/build` both render `QuoteBuild` (`src/routes/quote-build.tsx`). New mode: customer picker (required) + doc fields; the header "Create quote" button creates the `sales_order` (saving→success effect, then label becomes "Update") and routes to `/quotes/$id/build`. Line items are editable only after creation (the modal needs a quote id). The old pricing-engine create (`quote-builder.tsx`) is removed.
- **Quote Detail** — `/quotes/$quoteId` (`src/routes/quote-detail.tsx`) uses the shared `RecordDetailLayout` (same as contact/deal). Attributes: organization (editable select), status (editable enum via `useEnumEntities('status', …)`), deal (read-only), sub/tax/grand totals (read-only); inline edits persist via `useUpdateSalesOrder`. CTAs (`attributeActions`): a right-aligned icon row — Edit (→ build) · Preview (→ build) · Mail (opens the `QuoteEmailDialog` sidebar). Tabs: Overview · **Line Items** · Comments · Files (no Activity — `base.event` has no `sales_order` relation).
- **Line Items tab** — `src/components/quotes/quote-line-items.tsx` hosts the editable `PricingEnginePanel` (productCatalog from `useProducts`); on save it reconciles `sales_order_item` rows and rewrites order totals. Source of truth for pricing.
- **Build / Compose layout** — `QuoteBuild` split screen. Header: template picker (built-in presets in `src/components/quotes/quote-templates.ts` — no runtime template endpoint, so presets are local) + Create/Update button (saving→success effect) + Mail icon (opens `QuoteEmailDialog`, enabled once the quote exists). LEFT cards top→bottom: Customer picker · Line items (button → **near-full-page modal** with `QuoteLineItems` — note shadcn `DialogContent` defaults to `sm:max-w-lg`, so the modal must override at the same breakpoint, e.g. `w-[96vw] sm:max-w-[1400px] h-[92vh]`) · Quote details (title/valid-until/billing) · Content (intro/terms). RIGHT = the Docyrus `HtmlTemplateEditor` (Plate + Handlebars). Left fields + saved quote compose the editor's JSON `data` **live** (the editor syncs its `data` prop, html-template-editor.tsx ~L758). Tabs visual/code/data/preview/**PDF** — PDF is client-side via the editor's own `lib/html-to-pdf` (the standalone `quote-pdf.ts` was removed). Doc fields + template persist per-quote in `localStorage` (server persistence pending). See [[architecture#Quote Builder & PDF]].
- **Email** — `QuoteEmailDialog` (`src/components/quotes/quote-email-dialog.tsx`) opens as a **right-side `Sheet` (sidebar), not a modal**, wrapping the Docyrus `EmailComposer` driven by `useDocyrusEmailComposer` (`src/hooks/docyrus/use-docyrus-email-composer.tsx`): accounts `GET /v1/messaging/email/accounts`, send `…/{accountId}/send`. Used by the build header mail icon + the Detail mail CTA. Backend/account gaps surface inside the composer.
- **Display title (no UUID)** — `sales_order` has no `autonumber_id`, so the quote's shown title is the user's document title (`docTitle` from localStorage) → customer name → "Teklif"; never the raw UUID. The breadcrumb skips the `quoteId` segment (added to `entityId` in `app-layout.tsx`) and labels `quotes`/`build` segments.
- **Related tabs** — Company and Deal detail each have a "Teklifler" tab (`RelatedQuotesTable`, `src/components/crm/related-quotes-table.tsx`): company filters `sales_order` by `organization`, deal by `deal`; rows open Detail. "New quote" prefills via `/quotes/new` search params (`organization`, `organizationName`, `deal`).

## Leads & Deals Pipeline

The deals route uses the shared Docyrus grid runtime for its list tab and the Docyrus kanban hook for its board tab, with saved views, inline updates, and toolbar import/export actions.

The leads route is list-only: the board/list view switcher and the `useDocyrusKanban` board were removed, so `/leads` opens directly on the data-grid list (no `viewType` state, no kanban hook).

Their list views use system saved views (All plus two query-backed filtered views), so list filtering and sorting come from the active view query rather than local toolbar filter chips. Where a board/kanban view exists (deals), saved data views stay hidden and DataView controls are only rendered for the list grid.

### Lead Datasource (Pure Lead Model)

`base_crm.leads` follows a pure lead model: no contact/organization/deal record exists before convert — the lead carries the pre-conversion raw data itself.

- Contact display name lives in the system `name` field; the legacy `title` field is unused.
- Company info is raw: `company_name_text`, `company_email`, `company_phone`, `company_industry`, `company_size`, `website`, `address`, `city`. The old `company_name` relation has been removed.
- Qualification fields: `lead_status`, `lead_source`, `lead_type`, `lead_form`, `lost_reason`, `contact_message`.
- Only deal-seed field kept: `deal_value` (UI label "Tahmini Değer / Estimated Value"). `expected_revenue`, `close_probability`, `expected_closing_date`, `deal_name` were removed; users add them dialog-only via "+ Alan ekle" during convert.
- Conversion tracking: `converted_organization`, `converted_contact`, `converted_deal`, `converted_on`, `converted_by`, `conversion_state` (enum: in_progress/completed/partial/failed), `conversion_mode` (active UI modes: company_contact_deal/contact_deal), `conversion_error_message`.

### Lead Convert Dialog

The convert dialog at `src/components/leads/lead-convert-dialog.tsx` is a tabbed UX with Company / Contact / Deal tabs shown by mode.

- The dialog keeps orchestration/state in `lead-convert-dialog.tsx` while presentational sections are split into focused components: `lead-convert-mode-selector.tsx`, `lead-convert-progress.tsx`, `lead-convert-precheck-tooltip.tsx`, `lead-convert-reuse-banner.tsx`, `lead-convert-change-confirm-dialog.tsx`, and `lead-convert-tabs.tsx` (Company/Contact/Deal tab rendering plus the add-field popover, receiving form, extraFields, candidates, enum ids, and all handlers from the dialog).
- Each tab renders a single mapping header for source (`Lead`) and the active target (`Company` / `Contact` / `Deal`), then `FieldMappingRow` rows below it. Rows keep the human field label at the top, while the left chip shows only the lead source value and the right input/select holds the editable target value pre-filled from source; repeated per-row `Lead: field` / `Target: field` labels are intentionally hidden. Source and target columns stay equal width, with a small center bridge between them. Rows without a lead source value keep the left side visible with a soft "no matching lead value" placeholder instead of letting the target panel span the whole row; narrow screens stack source and target fields.
- Required fields render a visible soft red required badge and subtle row emphasis; auto-match looks up lead enum values (industry, company_size, lead_source, lead_type) in target enums by name. If a source enum has no target enum match, conversion is blocked before writes instead of sending the raw source label.
- Conversion mode is selected with a segmented control instead of a compact dropdown so company/contact/deal scope is visible before users start editing fields. The current UI exposes only two modes: company + contact + deal, or contact + deal.
- Reuse vs Create banner: when duplicate search returns matches on Company or Contact tab, an amber banner appears at the top with "Yeni oluştur / Mevcut kullan" toggle, the candidate list below it, and the editable form fields are hidden under a short note when reuse is selected. Candidate lists are height-limited and scroll when many suggestions are returned. The create/reuse toggle exposes pressed state for assistive technology.
- "+ Alan ekle" popover at the top of each tab fetches target datasource fields, hides system slugs, and lets users add or remove dialog-only fields that get spread into the create payload. Tab labels and add-field buttons show a `+N` count for fields added to that tab.
- Validation focus and added-field reveal both scroll the row into view and highlight it. Missing required fields are treated as a warning on the precheck step, not as a conversion error: the dialog switches to the owning tab, scrolls to the row, and applies a short soft blink to the exact field row.
- Precheck step icon turns amber (`warn` state) if any duplicate is found; its keyboard-focusable tooltip renders a structured responsive summary (Şirket / Kişi / Fırsat) with per-target status (clean / öneri / tam eşleşme), counts, and the example matching name. The progress UI is a compact stepper only: it hides internal activity/lead-record phases, hides the company step in contact+deal mode, removes the separate percentage progress bar, and exposes the visible sequence as a list with `aria-current="step"` on the active/warned step.

### Convert Flow

`runConversion` (in `src/components/leads/use-lead-convert-conversion.tsx`) runs precheck → organization → contact → deal → activity → lead, gated by three checks before the work starts.

- The phases are expressed as a step registry: a `steps` array of `{ key, shouldRun, onSkip?, run }` entries that a single `for` loop iterates, setting `activeStep` and the `running` state before each `await step.run()` so a failure anywhere in the loop classifies the failed step correctly. Gates, latest-lead reconciliation, post-success invalidations/toast/navigation, and the partial-vs-failed catch block stay around the loop because they cross-cut all phases.

- Gate 1: duplicate search runs against organization, contact, and deal (`source_lead = lead.id`) — keyword is sanitized to strip tsquery-breaking characters.
- Duplicate/precheck requests use an `AbortController` plus a request id guard, so a newer precheck cancels older network work and stale responses cannot overwrite candidate or step state. The race protection, candidate state, exact-match auto-selection, and precheck summary live in the `useLeadConvertDuplicates` hook (`src/components/leads/use-lead-convert-duplicates.ts`); the dialog wires step-machine setters and selected-reuse-id setters as callbacks so the hook can drive them without owning conversion state.
- Gate 2: `findMissingField` checks only conversion-required values: created company/contact names, deal name/stage, and source enum values that could not be mapped. Hidden reused records and optional fields do not block conversion.
- Gate 3: `findChangedFromLead` opens an AlertDialog whenever any lead-backed target value differs from the lead source; each row can be restored to the lead value, and confirming calls `runConversion({ skipChangeCheck: true })` to bypass closure-stale state.
- Before writing, the dialog refetches the latest lead conversion fields. If another session completed the lead, it opens the existing result; if the lead is already `in_progress` with no created target records, it aborts with a concurrent-session message.
- Before creating organization, contact, or deal, each step checks for an existing target record with `source_lead = lead.id` and reuses it when found. This keeps client-side retries and double-click/race scenarios idempotent without backend locks.
- Each step writes outputs (`converted_*`) back to the lead immediately so any failure leaves a resumable partial state.
- On successful completion, lead-backed fields edited inside convert are also synced back onto the lead record so the source lead and converted records do not diverge after in-dialog corrections.
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
- The leads list and board fetch hidden conversion marker fields (`converted_deal`, `conversion_state`) and enforce read-only behavior from route-level callbacks and save handlers, leaving Docyrus grid/kanban component implementations untouched. Converted lead grid rows expose only the open-page action; editable/convert/delete actions remain unavailable. `lead_status = Converted` alone is not treated as a real conversion lock.
- Step state, tooltip details, the "+ field" popover, the mode selector, and the form all check the same flag.

## Tasks, Activities & Calendar

The tasks route now uses the shared Docyrus grid runtime with saved views, inline updates, and toolbar import/export actions so task management behaves consistently with the other CRM workspaces.

Non-list detail grids use `DataGridStandardToolbar` without `DataGridViewSelect`, so saved DataView controls do not appear inside record-detail tabs.

Its system views are query-backed (`All`, `My Tasks`, `Due Soon`) and keep the toolbar quick filter visually untouched.

## Field Sales Planning & Approvals

The app now includes a field sales workspace with persisted settings, a drag-and-drop planning board, a manager approval screen, a monthly field calendar, and a global location action for nearby visits plus check-in or check-out flows.

Field sales plans are stored in `base.event` instead of a dedicated CRM plan datasource. Plan-specific behavior hangs off custom event fields: `plan_status`, `plan_type`, `plan_approval`, `require_approval`, visit timing fields, and visit location. The separate `base_crm.plan_approval` datasource remains the approval container, while each plan event links back to its approval window through `plan_approval`.

## Record Detail Redesign (Attio-style)

Every CRM detail route is rebuilt on one shared skeleton, `RecordDetailLayout`, replacing the old header + stacked `Tabs`/`Card` layout. See [[architecture#Shared Record Detail Layout]] for the contract.

This covers [[features#Companies & Contacts Workspace]] (`company-detail.tsx`, `contact-detail.tsx`) and [[features#Leads & Deals Pipeline]] (`deal-detail.tsx`, `lead-detail.tsx`).

- **One bordered card** (`rounded-xl`) split by a single draggable divider: left = inline click-to-edit attribute panel (record logo + title, quick-action row, "Search attributes…", first 4 fields then "Show N more", pencil → "edit all" modal); right = pill tabs. Inline fields use `EditableRecordDetailField editHint="progressive" size="sm"`; the pencil modal and inline edits feed the same `onInlineSave` and stay in sync via a remount key when the record refetches. Detail routes drop the `PageContainer` top/bottom padding (`pt-0 pb-0`) so the card sits tight under the header; the tab bar and relation-table toolbars use `px-4` so controls (dialer button, "New Contact") clear the card's rounded corner.
- **Company logo upload** — the company-detail header avatar is `CompanyLogoAvatar` (`src/components/companies/company-logo-avatar.tsx`): renders `company_logo.signed_url` (or initials) with a hover/focus camera overlay. Picking an image (≤5MB) calls `useUploadCompanyLogo` (`src/hooks/use-companies.ts`), which POSTs to `…/data-sources/organization/files/upload` and writes the returned file ref into the record's `company_logo` field, then invalidates the company queries. The `company_logo` column is requested in `useCompany`'s get.
- **Inline editing is live** (per-page `useUpdate*` mutations). Scalar fields (text/email/phone/url/textarea) are editable everywhere. Enum and relation/user fields are now wired editable across **all four** detail routes via `useEnumEntities` + company/contact/user/country option lists — the old "Lead fields stay read-only" and "`country`/`city` read-only" carve-outs are gone:
  - **Enum fields** load options and store the option `id` as the value; each falls back to a read-only text display only when its enum entities fail to load (no value regression). Lead wires `lead_status` (status), `lead_source`, `lead_type`, `lead_category`, `company_industry`, `company_size`; Company wires `status`/`type`/`industry`/`lifecycle_stage` plus `country` (and plain-text `commercial_title`); Deal wires `stage`/`customer_type`/`deal_type`/`lead_source`/`reason_for_lost` plus `country`; Contact adds `contact_type` (select) and `contact_status` (status) — both also added to `useContact`'s query columns. New parity fields (`deal_type`, `lifecycle_stage`, `commercial_title`, `lead_category`, `contact_person`) are likewise added to the detail GET column lists in `use-deals`/`use-companies`/`use-leads` so they load.
  - **`country` is per-page typed**: in Lead it is the plural `countries` field, a relation to the `base/country` collection. In **Company**, `country` + `city` are consolidated into one **Location** attribute (`LocationField`) — country is a **server-side searchable** picker over the seeded `base/country` datasource (250 countries: `useBaseCountryCollection().list({ columns: ['id','name'], filterKeyword, limit: 50, orderBy })` — `columns` is required or names come back empty), saved as the `base/country` relation id; city is plain text. `useCompany` already requests `country(id,name,currency_symbol)` so the current value renders. (`useEnumEntities('country')` is empty in this tenant — NOT used for country.) Deal keeps `country` as an enum select.
  - **Owner / relations**: Lead `record_owner` is an editable user select (`useUsers`) and Lead `contact_person` is an editable contact select (`useContacts`, relation → `base/contact`); Deal already wires `record_owner`/`organization`/`contact_person`; Contact `organization` is an editable company select.
  - **Helper for value mapping**: each page's `flatRecord` stores the relation/enum `id` (via `getRelationId`/`fieldId`/`getFieldValue`) when the field is editable, and the display name otherwise.
- **Attribute click-to-edit** — in display mode `EditableValue` neutralizes interactive children (`[&_a]:pointer-events-none`) for editable fields, so clicking an email/phone attribute enters edit mode instead of firing the `mailto:`/`tel:` link. Read-only fields keep their links clickable.
- **Searchable selects + page-specific editors** — every non-status single-select (`field-select`/`field-enum`/`field-systemEnum`) now renders as a searchable cmdk combobox (`EnumComboboxField`), matching relation fields; status keeps its chip ([[architecture#Shared Record Detail Layout]]). `RecordDetailLayout`'s `fieldRenderers` prop swaps the default inline editor for a custom one per slug: Contact `name` → `ContactNameField` (First/Last split → joined `name`), Company `location` → `LocationField` (searchable country + city).
- **Tabs** are config-driven (`RecordDetailTab[]`): Overview (3 `RecordKpiCard` highlights + a framed "recent activity" list capped at 2) · Activity · entity-specific relation tabs (Company Team/Deals/Leads, Contact Deals, Deal Contacts/Products/Orders) · **Comments** (`CommentsPanel`, value `comments`) · **Notes** (placeholder, value `notes`) · **Tasks** (`RecordTasksPanel`, value `tasks`) · Files (`FileAttachments`) · "not available yet" placeholders for Emails/Calls.
  - **Comments/Notes/Tasks** (all four detail routes): the former Notes tab (which rendered `CommentsPanel`) became a dedicated **Comments** tab; **Notes** stays a `RecordTabPlaceholder` "coming soon". **Tasks is now live** — `RecordTasksPanel` (`src/components/crm/record-tasks-panel.tsx`) lists the record's `base.task` rows filtered by a `parentField` relation: contact→`contact`, lead→`lead`, company→`organization`, deal→**`deal`** (this CRM's task schema uses `deal`, NOT `crm_deal`). It reuses the `use-tasks` hooks (`src/hooks/use-tasks.ts`) + `TaskFormSheet` for editing, renders the status chip via `DynamicValue` with `useEnumEntities('status', { appSlug: 'base', dataSourceSlug: 'task' })`, flags past-due `end_date` as overdue, supports search + sortable headers, and quick-adds `{ subject, [parentField]: parentId }`. Editing via `TaskFormSheet` preserves the parent relation (its form omits contact/lead/deal and `undefined`s drop from the PATCH). The attribute-panel "Note" quick-action still targets `notes`. i18n keys: `<entity>.tabs.notes` / `<entity>.tabs.tasks`, `tasks.panel.*`, `common.notesComingSoon`.
- **Tab overflow** — the tab bar no longer scrolls horizontally. `RecordDetailTabBar` (in `record-detail-layout.tsx`) measures intrinsic tab widths from a hidden mirror row and, via a `ResizeObserver`, shows the tabs that fit inline and collapses the rest into a **"+N more"** dropdown; the active tab being hidden highlights the More trigger. The phone/dialer button stays pinned on the right of the same row. To make the dropdown switch tabs in both controlled and uncontrolled modes, the layout now unifies tab state internally (`currentTab`/`changeTab`) and drives `<Tabs>` as controlled.
- **Activity timeline** is the record's audit change-history via `useRecordActivities` → `RecordActivityPanel` (Overview recap = first 2; Activity tab = full, `filterable` with a Created/Updated/Status/Comments/Files/Deleted/Other category filter) — see [[architecture#Per-record Activity Source]]. The earlier `base.event` calendar feed (`useRecordEvents` + `RecordActivityTimeline`) is no longer wired into the detail pages.
- **Dialer** is a mock-UI global context (`DialerProvider`/`useDialer`, `src/components/dialer/dialer-widget.tsx`, wrapped in `App.tsx`). Person-like records (Contact, Lead) open it directly with their number; container records (Company, Deal) show a contact-picker dropdown. The panel renders as a column that narrows the tab content rather than overlaying.
- **Quick actions** (attribute panel): only **Note** keeps the full icon+label button (left-aligned); **Email** (`mailto:`), **SMS** (`sms:`) and **Call** (dialer / `WebphoneCallButton size="icon"`) are icon-only buttons grouped right-aligned via an `ml-auto` wrapper. The shared actions container in `record-detail-layout.tsx` is a plain `flex` (the old horizontal-scroll/mask was removed). Lead additionally shows Convert / View deal as full buttons and becomes fully read-only once `isLeadConvertedRecord` is true ([[features#Provenance & Read-only Enforcement]]). Deal has only the Note action (it calls via the tab-bar dialer dropdown). Deal preserves its Products (`PricingEnginePanel`) and Orders (`DataGrid`) tabs.

The shared tables `RelatedContactsTable` and `RelatedDealsTable` (`src/components/crm/`) back the relation tabs and `RecordTasksPanel` (`src/components/crm/`) backs the Tasks tab on all four routes; `RecordActivityPanel` (`src/components/docyrus/record-activity-panel/`) renders both the Overview recap (first 2) and the full, filterable Activity tab. The `getActivityTypeConfig` lookup in `contact-activity-panel/activity-type-config.ts` now falls back to `DEFAULT_ACTIVITY_TYPE_CONFIG` for unmapped types to avoid runtime crashes.

The planning, approval, and field calendar screens now adapt for mobile use: navigation actions wrap safely, large calendar grids scroll horizontally when needed, and the planning board switches to a tap-friendly mobile flow where users can choose a record and assign or move it into a day and slot without desktop drag-and-drop. The planning sidebar also includes in-list search, filtering, and alphabetical sorting for companies or contacts so reps can narrow source records before assigning visits. Planned visits can now also be removed directly from the planning board with a confirmation step while the plan remains editable, and the approval submission action is rendered inside the planning board itself instead of the page header. The active period summary and previous/next range navigation now also live inside the planning board header instead of a separate summary card above the board. After a weekly or monthly submission is triggered, the current range immediately reflects a waiting state in the board action area so the button label switches to the pending copy without requiring a visible manual refresh. Each day header in the planning board now also exposes a map action that opens the day route on a map, shows all available company/contact locations for that day, numbers markers in plan order, supports an alternate suggested route ordering, and can hand the active route off to Google Maps. The planning route renders again after avoiding a local `Map` name collision in the schedule board that previously crashed the page before the board could mount. Approval queue cards and approval detail summaries now render period dates in a formatted day-month-year display instead of raw backend timestamps. The approval detail action panel now changes with the current status so revision-requested items no longer present a conflicting approve CTA while approved items show a closed state. When a manager requests revision, the planning board remains editable for that period and the resubmission action re-links the current range plans back onto the approval before returning the item to the waiting state. Current-period approval detection now normalizes date-only and timestamped approval records so the planning page keeps showing the pending state after route changes and reloads.

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
