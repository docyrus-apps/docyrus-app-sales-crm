## Defensive Relation Rendering

Relation and enum fields can resolve to `null`. UI code must guard for both object shape and nullability before reading nested `.name` properties, especially in dashboard cards and summary lists.

## Theme System

The app uses `@docyrus/theme-provider` (`ThemeProvider` + `useTheme`) as the single source of truth for both dark/light/system mode and color preset themes.

`ThemeProvider` wraps the entire React root in `src/main.tsx` (outermost provider, before auth). Configuration:

- `modeStorageKey="app-theme"` — localStorage key for light/dark/system mode
- `colorThemeStorageKey="app-color-theme"` — localStorage key for color preset
- `defaultColorTheme="docyrus-default"`
- `disableTransitionOnChange`

Consumer hooks:

- `src/hooks/use-theme.ts` — re-exports `useTheme` from `@docyrus/theme-provider` (returns `theme`, `setTheme`, `resolvedTheme`, `colorTheme`, `setColorTheme`, `availableThemes`)
- `src/hooks/use-color-theme.ts` — thin wrapper exposing `{ colorTheme, setColorTheme }` for components that only need color preset
- `src/lib/theme.tsx` — `useDocyTheme()` adapter for components needing `isDark` (e.g. code editor)

`ThemeSelector` (`src/components/theme-selector.tsx`) reads `availableThemes` from the hook so the theme list is always driven by the provider (including any presets the shell app injects). `ModeToggle` and `ThemeToggle` use `useTheme` via `@/hooks/use-theme`.

Cross-app sharing: because all Docyrus apps use the same storage keys (`app-theme`, `app-color-theme`), the shell app writing to these keys causes the embedded app to pick up the shared theme on next mount. For live (postMessage) sync, the shell app must additionally send a message that triggers `setTheme`/`setColorTheme` in the iframe.

## Iframe Host Bridge

The app runs as an embedded iframe inside a Docyrus super-app shell and uses three postMessage bridges provided by `@docyrus/signin` (≥ 0.12.0).

Notifications arrive as real-time toasts via the bridge — polling (`refetchInterval`) is removed, the header bell icon and sidebar unread badge are gone; `/inbox` remains for history.

1. **Route → Host sync** (`syncRouteToHost` on `DocyrusAuthProvider` in `src/main.tsx`) — patches `history.pushState`/`replaceState` and listens to `popstate`/`hashchange` to post a `route-change` message to the host on every navigation, keeping the shell address bar in sync for bookmarking and sharing.

2. **Host → App navigation** (`useDocyrusHostNavigation`) — the host can push an absolute URL or relative path. The handler in `useHostBridge` resolves it via `new URL(url, window.location.origin)` and calls `router.history.push(pathname + search + hash)`; falls back to pushing the raw value on parse errors.

3. **Host → App notifications** (`useDocyrusHostNotification`) — the host can push `DocyrusNotification` payloads. The handler fires a sonner `toast(notification.subject, { description: notification.message })`.

All three bridges are wired in `src/hooks/use-host-bridge.ts` (`useHostBridge`). The hook is called **unconditionally** near the top of the `App` component (before any auth/loading early returns) so the listeners are always mounted. All hooks are no-ops when the app runs outside iframe mode.

## Root Runtime Tooling

The React root mounts Docyrus auth, TanStack Query, Docyrus Devtools, and the shared app shell without the Agentation overlay.

Keep `DocyrusDevtools` inside the auth/query provider tree, register auth-managed clients through `DocyrusDevtoolsClientRegistration`, pass the shared query client, and use `/openapi.json` as the local spec path when available. Keep optional developer aids out of `src/App.tsx`.

The OAuth callback is configured as a path (`VITE_OAUTH2_REDIRECT_PATH`) and the runtime redirect URI is always built from `window.location.origin` plus that path; keep the TanStack callback route and `DocyrusAuthProvider.callbackPath` aligned with the same value.

The Vite dev server sends a `Content-Security-Policy` header with a `frame-ancestors` allowlist. Keep `https://build.docyrus.app` in that allowlist so hosted Docyrus preview surfaces can embed the local preview during development.

## Editor Dependency Alignment

The editor currently builds cleanly on PlateJS 53.x. Upgrade `platejs` and the `@platejs/*` packages together to avoid missing-export mismatches between core and plugin packages.

## Field Sales Runtime Shape

Field sales settings live in tenant app config under `fieldSales` for `base_crm`. Shared helpers cover ranges, enum IDs, and status normalization. A header-level location action handles nearby visits plus the active check-in or check-out sheets.

The field sales plan runtime now reads and writes plan records through `base.event`, translating the field-sales view model (`status`, `event_type`, `weekly_plan`) onto the event schema (`plan_status`, `plan_type`, `plan_approval`). This keeps field planning inside the shared event infrastructure while preserving the existing field-sales UI flow.

## App Module Configuration

Tenant-level module switches live in the same app config record as the field-sales settings (app id `FIELD_SALES_APP_ID`, slug `base_crm`), under a separate `data.modules` key alongside `data.fieldSales` — see [[architecture#Field Sales Runtime Shape]].

`src/lib/app-config.ts` defines `AppModulesConfig` (`fieldSales`, `webphone`), the defaults (`fieldSales: true`, `webphone: false`), and `isModuleEnabled`. `src/hooks/use-app-config.ts` exposes `useAppModules()` (reads `data.modules` via `createAppConfigClient`) and `useUpdateAppModules()` (merges `modules` back onto the existing `data` blob so the `fieldSales` settings are never clobbered).

Consumers:

- `app-sidebar.tsx` hides the whole "Saha Satış" nav group when `fieldSales` is off. The always-visible "Uygulama Ayarları" (`/app-config`) entry sits in its own admin nav group, deliberately outside any toggleable group, so a disabled module can always be re-enabled.
- `app-header-actions.tsx` renders the field-sales location action only when `fieldSales` is on.
- `ModuleGuard` (`src/components/shared/module-guard.tsx`) wraps the field-sales routes plus `/settings` in `main.tsx`: it shows a spinner while the config resolves and redirects to `/` when the module is off, so deep links into a turned-off module never render their page.

`/app-config` (`src/routes/app-config.tsx`) is the tenant-level toggle screen; field-sales' own detail settings stay at `/settings` under the Saha Satış group. The webphone toggle is scaffolded (persists to `data.modules.webphone`, shown with a "coming soon" badge) ahead of the call-center / webphone feature that will consume the flag.

Backlink: `// @docyrus: [[architecture#App Module Configuration]]`.

## Lead Convert Refactor Checkpoint

Current checkpoint:

- `src/components/leads/lead-convert-dialog.tsx` still owns lead conversion state, form state, duplicate/precheck orchestration, conversion writes, partial/failure handling, query invalidation, navigation, and toast/logging side effects.
- The safest presentational sections have already been split out:
  - `lead-convert-mode-selector.tsx`
  - `lead-convert-progress.tsx`
  - `lead-convert-precheck-tooltip.tsx`
  - `lead-convert-reuse-banner.tsx`
  - `lead-convert-change-confirm-dialog.tsx`
  - `lead-convert-tabs.tsx` (Company/Contact/Deal tab JSX plus the add-field popover; receives form, extraFields, candidates, enum ids, and all handlers as props from the dialog)
- These extracted components should remain presentational. Do not move API calls, conversion writes, query invalidation, or lead mutation side effects into them.
- Build and tests passed after the presentational split. `pnpm check` still stops at `eslint: command not found` in the local environment after Prettier completes.

Recommended next order:

1. ~~Extract `LeadConvertTabs` / tab section rendering only.~~ Done — tab rendering and the add-field popover now live in `lead-convert-tabs.tsx`. Form state, handlers, and reuse ids stayed owned by `lead-convert-dialog.tsx` and are passed explicitly as props. Shared types (`LeadConvertForm`, `LeadConvertExtraFieldsState`, `LeadConvertTarget`, `LeadConvertConversionMode`, `LeadConvertEntityCandidate`) are exported from `lead-convert-tabs.tsx` for downstream extractions.
2. ~~Extract enum mapping into a helper/hook.~~ Done — `use-lead-convert-enum-mappings.ts` owns the deal-stage / lead-source / customer-type / industry / company-size `useEnumEntities` calls and exposes their raw arrays, the derived `SelectOption` lists, the `lead*Name` source labels, the `mapped*Id` fallbacks, and the `effective*Id` values combining form input with the mapped fallback. Pure utilities (`optionByName`, `mapLeadTypeToCustomerType`) are also exported so `requireEnumValue` in the dialog can keep reusing them on the conversion-write path. Conversion-write enums (`conversionStateOptions`, `conversionModeOptions`, `leadStatusOptions`) intentionally stay in the dialog.
3. ~~Extract form/prefill logic into `useLeadConvertForm`.~~ Done — `use-lead-convert-form.ts` owns the `form` state, initial-value computation from the lead, the `updateForm` setter, the `SEARCH_RELEVANT_FIELDS` set, and `sourceDealName`. The duplicates-checked reset stays on the dialog side via an `onSearchRelevantChange` callback. `findChangedFromLead` stays in `lead-convert-dialog.tsx` because it spans form, enum mapping, selected-reuse ids, mode, and i18n; moving it now would have pulled too much cross-domain state into the hook and conflicted with the "one concern per commit" risk note. It still reads the same `form` and `updateForm` from the hook, so change-confirm comparisons and restore callbacks behave identically.
4. ~~Extract duplicate/precheck logic into `useDuplicateCheck`.~~ Done — `use-lead-convert-duplicates.ts` owns `companyCandidates`, `contactCandidates`, `dealCandidates`, `exactCompanyId`, `exactContactId`, `precheckSummary`, `duplicatesChecked`, the `AbortController`/request-id ref, the on-unmount cleanup effect, and the `findDuplicates` function (called as `findDuplicates({ form, mode })`). Race protection (request-id guard + signal abort), exact-match auto-selection via `onExactCompanyMatch`/`onExactContactMatch` callbacks, precheck summary classification (`clean`/`matches`/`exact`), step detail composition, and the Docyrus query payloads (columns + `limit: 8` + `filterKeyword`/`source_lead` filters) are preserved byte-for-byte. Shared helpers (`normalize`, `sanitizeKeyword`, `normalizePhone`, `normalizeDomain`, `unwrapItems`, `firstItem`, `isAbortLikeError`, `getErrorMessage`, `logLeadConvertEvent`) and shared types (`LeadConvertStepDetail`, `LeadConvertDetailTone`, `LeadConvertStepState`, `LeadConvertPrecheckTargetSummary`, `makeStepDetail`) moved into `lead-convert-utils.ts` so the dialog and the hook can both reuse them without duplication; the dialog kept thin local type aliases (`StepState`, `DetailTone`, `StepDetail`, `PrecheckTargetSummary`) so existing call sites and the local `detail()` helper still compile unchanged.
5. ~~Extract conversion orchestration into `useConversionSteps` only after the above is stable.~~ Done — `use-lead-convert-conversion.tsx` owns `runConversion`, the conversion-write enum fetches (`leadStatusOptions`, `conversionStateOptions`, `conversionModeOptions`) plus `requireEnumValue`/`conversionStateValue`/`conversionModeValue`, and the four async helpers `updateLead`, `migrateLinkedWork`, `fetchLatestLeadConversion`, `findExistingRecordFromLead`. Step state, gate functions (`findMissingField`, `findChangedFromLead`), focus/scroll helpers, and the change-confirm dialog stay in the dialog and are passed in as callbacks/snapshots so the dialog still owns the validation, focus, and change-confirm UI. Since the latest UX pass, the hook also mirrors edited lead-backed convert values back onto the lead at the final lead step and the UI now exposes only `company_contact_deal` / `contact_deal` modes. Partial resume via the `fetchLatestLeadConversion` round-trip and `isLeadConvertedRecord` / `latestHasAnyCreated` checks, idempotent `source_lead = lead.id` reuse for organization/contact/deal, linked task/event migration with field-presence guards (`hasAllFields`), eager `updateLead` writes between each step for resumable partial state, the failure classification (`partial` vs `failed`), and all `queryClient.invalidateQueries` keys (`leads`, `deals`, `contacts`, `companies`, `tasks`, `events`) remain in place. The success toast still renders its three navigation buttons via the hook's `.tsx` file. This extraction intentionally did NOT introduce a step registry — that is step 6.
6. ~~Convert `runConversion` to a step registry as the final refactor.~~ Done — inside `use-lead-convert-conversion.tsx`, `runConversion` now builds a `steps: Array<StepDefinition>` registry with one entry per phase (precheck, organization, contact, deal, activity, lead). Each `StepDefinition` exposes `key`, `shouldRun`, optional `onSkip`, and `run` (which owns its writes, step details, and `setStep(key, 'done' | 'warn' | 'skipped')` call). A single `for` loop iterates the registry: when `shouldRun()` returns false it invokes `onSkip` (used by the organization/contact skip branches to set the "skipped" step detail), otherwise it sets `activeStep` and `setStep(key, 'running')` before awaiting `step.run()`. Cross-step values (`organizationId`, `contactId`, `dealId`, `me`, `convertedLeadStatusValue`, `linkedWork`) live on a shared mutable `state` object the steps read and write. Gates (`duplicatesChecked`, `findMissingField`, `findChangedFromLead`), the latest-lead reconciliation, the post-success block (`invalidateQueries`, success log, success toast with navigation buttons, `onClose`, deal navigation), and the catch/finally block (failure classification, `setStep(activeStep, 'failed')`, partial-vs-failed `updateLead`, `setIsWorking(false)`) all remain at the outer try/catch around the loop — they are not steps because they cross-cut all phases. Behavior is preserved: step ordering, payload shapes, Docyrus columns/limits/filters, the eager `updateLead` writes between steps, the activity step's `warn`/`done`/`skipped` classification, partial-resume reads from `fetchLatestLeadConversion`, and the `[LeadConvert]` console events are unchanged.

Risk notes:

- Do not combine UI extraction, hook extraction, and step-registry changes in one commit.
- After every step, run `pnpm build`, `pnpm test`, `git diff --check`, and `docyrus knowledge check`.
- If a step touches Docyrus API calls, apply the Docyrus API Doctor checklist: columns must stay explicit, limits must remain positive, and mutation/invalidation/error handling must remain intact.
- The most fragile behaviors are validation focus, change-confirm restore, duplicate exact-match auto-selection, partial resume, linked task/event migration warnings, and converted-lead read-only enforcement.

## Shared Record Detail Layout

`RecordDetailLayout` (`src/components/crm/record-detail-layout.tsx`) is the single skeleton every CRM detail route renders ([[features#Record Detail Redesign (Attio-style)]]).

It owns the bordered card, the draggable left/right divider (width 280–560px), the resizable attribute pane, the pill `Tabs`, and the dialer column.

- The left pane is an internal `RecordAttributePanel` driven by `EditableRecordDetail`/`EditableRecordDetailField` (`src/components/docyrus/editable-record-detail.tsx`). Inline fields pass `editHint="progressive"` + `size="sm"`; a scoped `<style>` block clamps the in-edit input height so click-to-edit rows don't grow. The pencil opens a second `EditableRecordDetail` inside a `Dialog` ("edit all"). Both surfaces call the page's `onInlineSave(changes, values)`.
- `useRecordVersion(record)` bumps a counter on record-reference change (refetch) and keys the inline editor so it remounts with fresh values without disrupting mid-typing.
- Page contract props: `detailFields: RecordDetailField[]`, ordered `fieldSlugs: string[]`, a flattened `record` (relation/enum fields flattened to scalar id for editable fields, or to display name for read-only ones), `onInlineSave`, `tabs: RecordDetailTab[]`, controlled `activeTab`/`onTabChange`, optional `readOnly`, `attributeActions`, and `dialerTrigger`. Exports `RecordKpiCard` and `RecordTabPlaceholder` for tab bodies.
- The dialer is a global context (`DialerProvider`/`useDialer`/`DialerPanel`, `src/components/dialer/dialer-widget.tsx`) wrapped once in `App.tsx`; the panel renders inside the layout as a width-animated column (mock telephony only).

Backlink: `// @docyrus: [[architecture#Shared Record Detail Layout]]`.

## Per-record Activity Source

Per-record activity history comes from `base.event`, not `base.activity` — see [[features#Record Detail Redesign (Attio-style)]].

`base.activity` has no relation field pointing back to a record, whereas `base.event` carries `contact` / `organization` / `lead` / `deal` relations plus `subject` / `start_date` / `record_owner`. `useRecordEvents(relation, recordId)` (`src/hooks/use-events.ts`) lists events filtered by the chosen relation field and feeds `RecordActivityTimeline` (Overview recap capped at 2 + the full Activity tab).

<!-- docyrus-knowledge:auto:begin -->

# Architecture

This file captures the repo's technical structure, build stack, and the places where cross-cutting behavior is most likely to change.

## Stack

This section records the main framework and tooling signals detected from the current repo state.

- Package manager: pnpm
- React
- Vite
- TanStack Router
- @docyrus/api-client
- @docyrus/signin
- Vitest
- Vite config
- TypeScript config
- ESLint
- npm script: dev
- npm script: build
- npm script: test
- +1 more

## Entry Points

This section lists the most visible runtime entry points and high-signal docs in the repo.

- src/routes/activities.tsx
- src/routes/calendar.tsx
- src/routes/companies.tsx
- src/routes/company-detail.tsx
- src/routes/contact-detail.tsx
- src/routes/contacts.tsx
- src/routes/dashboard.tsx
- src/routes/deal-detail.tsx
- +12 more

## Notable Modules

This section highlights the source areas most likely to own cross-cutting behavior.

- src/App.test.tsx
- src/App.tsx
- src/collections
- src/components
- src/config
- src/hooks
- src/i18n
- src/index.ts
- +4 more

<!-- docyrus-knowledge:auto:end -->
