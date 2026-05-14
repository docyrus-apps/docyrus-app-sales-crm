# Project Plan

This file is derived from `docyrus/project-plan/project-plan.json`.

## Features

### Runtime, Auth & Developer Tooling

- Feature ID: `feature-runtime-auth-v1`
- Version: 1
- Feature Group: `feature-runtime-auth`
- Status: `in_progress`
- Slug: `runtime-auth-developer-tooling`
- Summary: The shared app shell, Docyrus authentication, query runtime, command infrastructure, and developer tooling at the root of the SPA.
- Tasks: 7

#### Stabilize root runtime, auth boot, and shared provider wiring

- Task ID: `task-runtime-stabilize`
- Phase: `phase-foundation`
- Type: `work`
- Assignee: `agent`
- Status: `done`
- Summary: Audit root providers, auth loading states, Docyrus client registration, and shared runtime assumptions so the SPA boots consistently in dev and production.
- Acceptance Criteria:
- Root providers are ordered consistently for auth, query, i18n, dialogs, and routing.
- Authenticated and unauthenticated boot states avoid dead screens or premature data calls.
- Shared runtime concerns are documented in repo knowledge or plan context.

#### Add targeted verification for critical CRM flows

- Task ID: `task-verification-suite`
- Phase: `phase-quality-release`
- Type: `api-test`
- Assignee: `agent`
- Status: `planned`
- Summary: Introduce or document repeatable verification for the highest-risk flows across auth, data loading, and core record mutations.
- Acceptance Criteria:
- Critical flows have a repeatable verification path.
- API-facing hooks or workflows with elevated risk are covered by targeted checks.
- Verification guidance is captured in repo docs or knowledge.

#### Sweep relation and enum rendering for null-safe UI access

- Task ID: `task-null-safety-sweep`
- Phase: `phase-foundation`
- Type: `bug-fix`
- Assignee: `agent`
- Status: `planned`
- Summary: Review list cards, dashboards, and detail summaries for unsafe `.name` access on nullable relation or enum values and fix the high-risk call sites.
- Acceptance Criteria:
- UI code does not assume nullable relation objects are always present.
- Known `.name` crashes in dashboard and detail surfaces are eliminated.
- Changes are verified by targeted build or type checks.

#### Run browser smoke coverage on primary user journeys

- Task ID: `task-browser-smoke`
- Phase: `phase-quality-release`
- Type: `browser-automation-test`
- Assignee: `agent`
- Status: `planned`
- Summary: Validate navigation and high-value CRM workflows in a browser to catch layout, routing, and runtime regressions before release.
- Acceptance Criteria:
- Primary navigation routes load in-browser without runtime crashes.
- At least the dashboard and one record workflow are smoke-tested end to end.
- Findings feed back into the plan before release.

#### Establish a clean build and typecheck baseline

- Task ID: `task-build-typecheck-baseline`
- Phase: `phase-foundation`
- Type: `work`
- Assignee: `agent`
- Status: `in_progress`
- Summary: Resolve current repo-level build and TypeScript blockers so future CRM feature work can be verified reliably.
- Acceptance Criteria:
- `pnpm build` succeeds consistently.
- TypeScript verification path is documented or repaired.
- Known toolchain warnings blocking routine validation are captured in the plan.

#### Prepare v0.1 release readiness checklist

- Task ID: `task-release-readiness`
- Phase: `phase-quality-release`
- Type: `work`
- Assignee: `agent`
- Status: `planned`
- Summary: Consolidate release blockers, validation status, and launch readiness items for the first tagged version of the app.
- Acceptance Criteria:
- Open blockers are visible in the project plan.
- Release validation steps are identified for code and product behavior.
- The app can be assessed against a clear v0.1 go or no-go checklist.

#### Fix OAuth redirect path configuration

- Task ID: `task-oauth-redirect-path`
- Phase: `phase-foundation`
- Type: `bug-fix`
- Assignee: `agent`
- Status: `done`
- Summary: Use the configured OAuth callback path with the current browser origin so sign-in requests match authorized redirect URIs.
- Acceptance Criteria:
- OAuth redirect URI is built from window.location.origin and VITE_OAUTH2_REDIRECT_PATH.
- The callback route remains aligned with the configured redirect path.
- Build verification passes after the auth configuration change.

### Executive Dashboard

- Feature ID: `feature-dashboard-v1`
- Version: 1
- Feature Group: `feature-dashboard`
- Status: `planned`
- Slug: `executive-dashboard`
- Summary: Home screen metrics and operational summaries for deals, leads, tasks, and recent pipeline activity.
- Tasks: 1

#### Productionize dashboard metrics and summary cards

- Task ID: `task-dashboard-productionize`
- Phase: `phase-crm-core`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `planned`
- Summary: Refine dashboard calculations, empty states, and summary panels so the landing page reflects trustworthy sales operations metrics.
- Acceptance Criteria:
- Dashboard cards use real operational data and stable fallback states.
- Recent deals, leads, and upcoming work lists render safely with partial records.
- The screen reads as a finished end-user dashboard rather than a prototype.

### Leads & Deals Pipeline

- Feature ID: `feature-deals-leads-v1`
- Version: 1
- Feature Group: `feature-deals-leads`
- Status: `in_progress`
- Slug: `leads-deals-pipeline`
- Summary: Pipeline views, detail flows, conversion paths, and related revenue records for opportunity management.
- Tasks: 2

#### Harden deals pipeline views and deal detail flows

- Task ID: `task-deals-pipeline`
- Phase: `phase-crm-core`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `in_progress`
- Summary: Bring deals list, kanban, detail panels, pricing, and related records into a cohesive opportunity-management workflow.
- Acceptance Criteria:
- Deals can be reviewed in both summary and detail contexts.
- Deal detail surfaces related products, orders, comments, and files consistently.
- Stage and organization rendering is reliable across list and detail views.

#### Complete lead qualification and conversion workflow

- Task ID: `task-leads-conversion`
- Phase: `phase-crm-core`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `in_progress`
- Summary: Tighten lead list, kanban, detail, and conversion flows so reps can move qualified leads into active deals without losing context.
- Acceptance Criteria:
- Lead status and source data render consistently across list, board, and detail pages.
- Conversion flows preserve key company and contact context.
- Lead empty states and actions feel complete for end users.

### Companies & Contacts Workspace

- Feature ID: `feature-accounts-contacts-v1`
- Version: 1
- Feature Group: `feature-accounts-contacts`
- Status: `in_progress`
- Slug: `companies-contacts-workspace`
- Summary: Company and contact directories with relationship-aware detail pages and cross-linked CRM context.
- Tasks: 1

#### Polish company and contact workspaces

- Task ID: `task-companies-contacts`
- Phase: `phase-crm-core`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `in_progress`
- Summary: Refine company and contact directories plus detail screens to improve relationship visibility across deals, leads, and communications.
- Acceptance Criteria:
- Company and contact detail pages show linked CRM records clearly.
- Directory cards and detail headers render consistent end-user labels and status chips.
- Navigation between account, contact, lead, and deal records is intuitive.

### Tasks, Activities & Calendar

- Feature ID: `feature-sales-execution-v1`
- Version: 1
- Feature Group: `feature-sales-execution`
- Status: `done`
- Slug: `tasks-activities-calendar`
- Summary: Execution workflows for follow-ups, meetings, and time-based coordination across the sales team.
- Tasks: 2

#### Strengthen task and activity management flows

- Task ID: `task-tasks-activities`
- Phase: `phase-sales-ops`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `done`
- Summary: Improve task lists, quick-create flows, activity handling, and status updates for real day-to-day follow-up work.
- Acceptance Criteria:
- Task creation and editing flows are reliable from both global and contextual entry points.
- Activity views expose clear next actions and status context.
- Mutations refresh the relevant cached lists and detail views.

#### Refine calendar scheduling experience

- Task ID: `task-calendar-operations`
- Phase: `phase-sales-ops`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `done`
- Summary: Improve the event calendar experience so meetings and time-based work render with stable labels, assignments, and defaults.
- Acceptance Criteria:
- Calendar events render with safe user or calendar labels.
- Time-based records map cleanly into the UI event model.
- Empty and loading states are usable for sales teams.

### Products & Sales Orders

- Feature ID: `feature-catalog-orders-v1`
- Version: 1
- Feature Group: `feature-catalog-orders`
- Status: `in_progress`
- Slug: `products-sales-orders`
- Summary: Catalog management and order-building workflows that connect products, pricing, and customer orders.
- Tasks: 1

#### Complete product and sales order workflows

- Task ID: `task-products-orders`
- Phase: `phase-sales-ops`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `in_progress`
- Summary: Tighten catalog forms, line-item pricing, and sales order detail views so quote-to-order handoff feels operationally complete.
- Acceptance Criteria:
- Products can be managed with correct category, unit, price, and tax metadata.
- Sales orders render organization, status, totals, and line items clearly.
- Pricing panels and order summaries remain consistent across create and detail flows.

### Inbox, Email & Notes

- Feature ID: `feature-communications-v1`
- Version: 1
- Feature Group: `feature-communications`
- Status: `planned`
- Slug: `inbox-email-notes`
- Summary: Communication views and lightweight note-taking that keep account context and follow-up history visible.
- Tasks: 1

#### Improve inbox, email, and notes usability

- Task ID: `task-inbox-email-notes`
- Phase: `phase-communications-insights`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `planned`
- Summary: Align communication surfaces with CRM context so reps can review threads, notes, and related records without leaving the workflow.
- Acceptance Criteria:
- Inbox and email screens expose meaningful CRM context for related records.
- Notes behave as a lightweight but usable personal workspace.
- Communication surfaces avoid dead ends and unfinished states.

### Reports & Analytics

- Feature ID: `feature-reporting-v1`
- Version: 1
- Feature Group: `feature-reporting`
- Status: `planned`
- Slug: `reports-analytics`
- Summary: Pipeline, lead, productivity, and order analytics used by managers and reps to track sales performance.
- Tasks: 1

#### Harden sales reports and analytics views

- Task ID: `task-reports-analytics`
- Phase: `phase-communications-insights`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `planned`
- Summary: Review chart queries, summaries, and empty states so reporting tabs provide trustworthy operational insights.
- Acceptance Criteria:
- Report tabs render accurate pipeline, lead, activity, and order summaries.
- Chart labels and aggregations match the underlying Docyrus data shape.
- Analytics views remain usable when source datasets are sparse.

## Phases

### Foundation Hardening

- Phase ID: `phase-foundation`
- Status: `in_progress`
- Tasks: 4

#### Stabilize root runtime, auth boot, and shared provider wiring

- Task ID: `task-runtime-stabilize`
- Feature: `feature-runtime-auth-v1`
- Type: `work`
- Assignee: `agent`
- Status: `done`
- Summary: Audit root providers, auth loading states, Docyrus client registration, and shared runtime assumptions so the SPA boots consistently in dev and production.
- Acceptance Criteria:
- Root providers are ordered consistently for auth, query, i18n, dialogs, and routing.
- Authenticated and unauthenticated boot states avoid dead screens or premature data calls.
- Shared runtime concerns are documented in repo knowledge or plan context.

#### Sweep relation and enum rendering for null-safe UI access

- Task ID: `task-null-safety-sweep`
- Feature: `feature-runtime-auth-v1`
- Type: `bug-fix`
- Assignee: `agent`
- Status: `planned`
- Summary: Review list cards, dashboards, and detail summaries for unsafe `.name` access on nullable relation or enum values and fix the high-risk call sites.
- Acceptance Criteria:
- UI code does not assume nullable relation objects are always present.
- Known `.name` crashes in dashboard and detail surfaces are eliminated.
- Changes are verified by targeted build or type checks.

#### Establish a clean build and typecheck baseline

- Task ID: `task-build-typecheck-baseline`
- Feature: `feature-runtime-auth-v1`
- Type: `work`
- Assignee: `agent`
- Status: `in_progress`
- Summary: Resolve current repo-level build and TypeScript blockers so future CRM feature work can be verified reliably.
- Acceptance Criteria:
- `pnpm build` succeeds consistently.
- TypeScript verification path is documented or repaired.
- Known toolchain warnings blocking routine validation are captured in the plan.

#### Fix OAuth redirect path configuration

- Task ID: `task-oauth-redirect-path`
- Feature: `feature-runtime-auth-v1`
- Type: `bug-fix`
- Assignee: `agent`
- Status: `done`
- Summary: Use the configured OAuth callback path with the current browser origin so sign-in requests match authorized redirect URIs.
- Acceptance Criteria:
- OAuth redirect URI is built from window.location.origin and VITE_OAUTH2_REDIRECT_PATH.
- The callback route remains aligned with the configured redirect path.
- Build verification passes after the auth configuration change.

### CRM Core Workflows

- Phase ID: `phase-crm-core`
- Status: `in_progress`
- Tasks: 4

#### Productionize dashboard metrics and summary cards

- Task ID: `task-dashboard-productionize`
- Feature: `feature-dashboard-v1`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `planned`
- Summary: Refine dashboard calculations, empty states, and summary panels so the landing page reflects trustworthy sales operations metrics.
- Acceptance Criteria:
- Dashboard cards use real operational data and stable fallback states.
- Recent deals, leads, and upcoming work lists render safely with partial records.
- The screen reads as a finished end-user dashboard rather than a prototype.

#### Harden deals pipeline views and deal detail flows

- Task ID: `task-deals-pipeline`
- Feature: `feature-deals-leads-v1`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `in_progress`
- Summary: Bring deals list, kanban, detail panels, pricing, and related records into a cohesive opportunity-management workflow.
- Acceptance Criteria:
- Deals can be reviewed in both summary and detail contexts.
- Deal detail surfaces related products, orders, comments, and files consistently.
- Stage and organization rendering is reliable across list and detail views.

#### Complete lead qualification and conversion workflow

- Task ID: `task-leads-conversion`
- Feature: `feature-deals-leads-v1`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `in_progress`
- Summary: Tighten lead list, kanban, detail, and conversion flows so reps can move qualified leads into active deals without losing context.
- Acceptance Criteria:
- Lead status and source data render consistently across list, board, and detail pages.
- Conversion flows preserve key company and contact context.
- Lead empty states and actions feel complete for end users.

#### Polish company and contact workspaces

- Task ID: `task-companies-contacts`
- Feature: `feature-accounts-contacts-v1`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `in_progress`
- Summary: Refine company and contact directories plus detail screens to improve relationship visibility across deals, leads, and communications.
- Acceptance Criteria:
- Company and contact detail pages show linked CRM records clearly.
- Directory cards and detail headers render consistent end-user labels and status chips.
- Navigation between account, contact, lead, and deal records is intuitive.

### Sales Operations

- Phase ID: `phase-sales-ops`
- Status: `in_progress`
- Tasks: 3

#### Strengthen task and activity management flows

- Task ID: `task-tasks-activities`
- Feature: `feature-sales-execution-v1`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `done`
- Summary: Improve task lists, quick-create flows, activity handling, and status updates for real day-to-day follow-up work.
- Acceptance Criteria:
- Task creation and editing flows are reliable from both global and contextual entry points.
- Activity views expose clear next actions and status context.
- Mutations refresh the relevant cached lists and detail views.

#### Refine calendar scheduling experience

- Task ID: `task-calendar-operations`
- Feature: `feature-sales-execution-v1`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `done`
- Summary: Improve the event calendar experience so meetings and time-based work render with stable labels, assignments, and defaults.
- Acceptance Criteria:
- Calendar events render with safe user or calendar labels.
- Time-based records map cleanly into the UI event model.
- Empty and loading states are usable for sales teams.

#### Complete product and sales order workflows

- Task ID: `task-products-orders`
- Feature: `feature-catalog-orders-v1`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `in_progress`
- Summary: Tighten catalog forms, line-item pricing, and sales order detail views so quote-to-order handoff feels operationally complete.
- Acceptance Criteria:
- Products can be managed with correct category, unit, price, and tax metadata.
- Sales orders render organization, status, totals, and line items clearly.
- Pricing panels and order summaries remain consistent across create and detail flows.

### Communications & Insights

- Phase ID: `phase-communications-insights`
- Status: `planned`
- Tasks: 2

#### Improve inbox, email, and notes usability

- Task ID: `task-inbox-email-notes`
- Feature: `feature-communications-v1`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `planned`
- Summary: Align communication surfaces with CRM context so reps can review threads, notes, and related records without leaving the workflow.
- Acceptance Criteria:
- Inbox and email screens expose meaningful CRM context for related records.
- Notes behave as a lightweight but usable personal workspace.
- Communication surfaces avoid dead ends and unfinished states.

#### Harden sales reports and analytics views

- Task ID: `task-reports-analytics`
- Feature: `feature-reporting-v1`
- Type: `new-implementation`
- Assignee: `agent`
- Status: `planned`
- Summary: Review chart queries, summaries, and empty states so reporting tabs provide trustworthy operational insights.
- Acceptance Criteria:
- Report tabs render accurate pipeline, lead, activity, and order summaries.
- Chart labels and aggregations match the underlying Docyrus data shape.
- Analytics views remain usable when source datasets are sparse.

### Quality & Release Readiness

- Phase ID: `phase-quality-release`
- Status: `planned`
- Tasks: 3

#### Add targeted verification for critical CRM flows

- Task ID: `task-verification-suite`
- Feature: `feature-runtime-auth-v1`
- Type: `api-test`
- Assignee: `agent`
- Status: `planned`
- Summary: Introduce or document repeatable verification for the highest-risk flows across auth, data loading, and core record mutations.
- Acceptance Criteria:
- Critical flows have a repeatable verification path.
- API-facing hooks or workflows with elevated risk are covered by targeted checks.
- Verification guidance is captured in repo docs or knowledge.

#### Run browser smoke coverage on primary user journeys

- Task ID: `task-browser-smoke`
- Feature: `feature-runtime-auth-v1`
- Type: `browser-automation-test`
- Assignee: `agent`
- Status: `planned`
- Summary: Validate navigation and high-value CRM workflows in a browser to catch layout, routing, and runtime regressions before release.
- Acceptance Criteria:
- Primary navigation routes load in-browser without runtime crashes.
- At least the dashboard and one record workflow are smoke-tested end to end.
- Findings feed back into the plan before release.

#### Prepare v0.1 release readiness checklist

- Task ID: `task-release-readiness`
- Feature: `feature-runtime-auth-v1`
- Type: `work`
- Assignee: `agent`
- Status: `planned`
- Summary: Consolidate release blockers, validation status, and launch readiness items for the first tagged version of the app.
- Acceptance Criteria:
- Open blockers are visible in the project plan.
- Release validation steps are identified for code and product behavior.
- The app can be assessed against a clear v0.1 go or no-go checklist.
