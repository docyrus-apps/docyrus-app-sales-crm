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

Notifications arrive as real-time toasts via the bridge — polling (`refetchInterval`) is removed, the header bell icon and sidebar unread badge are gone. The standalone `/inbox` and `/notifications` history routes were removed in the sidebar restructure (the Inbox, Notes, and Emails pages were dropped), so notification history no longer has a dedicated page; the toast bridge and `notifications.collection` API remain.

1. **Route → Host sync** (`syncRouteToHost` on `DocyrusAuthProvider` in `src/main.tsx`) — patches `history.pushState`/`replaceState` and listens to `popstate`/`hashchange` to post a `route-change` message to the host on every navigation, keeping the shell address bar in sync for bookmarking and sharing.

2. **Host → App navigation** (`useDocyrusHostNavigation`) — the host can push an absolute URL or relative path. The handler in `useHostBridge` resolves it via `new URL(url, window.location.origin)` and calls `router.history.push(pathname + search + hash)`; falls back to pushing the raw value on parse errors.

3. **Host → App notifications** (`useDocyrusHostNotification`) — the host can push `DocyrusNotification` payloads. The handler fires a sonner `toast(notification.subject, { description: notification.message })`.

All three bridges are wired in `src/hooks/use-host-bridge.ts` (`useHostBridge`). The hook is called **unconditionally** near the top of the `App` component (before any auth/loading early returns) so the listeners are always mounted. All hooks are no-ops when the app runs outside iframe mode.

## Root Runtime Tooling

The React root mounts Docyrus auth, TanStack Query, Docyrus Devtools, and the shared app shell without the Agentation overlay.

Keep `DocyrusDevtools` inside the auth/query provider tree, register auth-managed clients through `DocyrusDevtoolsClientRegistration`, pass the shared query client, and use `/openapi.json` as the local spec path when available. Keep optional developer aids out of `src/App.tsx`.

The OAuth callback is configured as a path (`VITE_OAUTH2_REDIRECT_PATH`) and the runtime redirect URI is always built from `window.location.origin` plus that path; keep the TanStack callback route and `DocyrusAuthProvider.callbackPath` aligned with the same value.

The Vite dev server sends a `Content-Security-Policy` header with a `frame-ancestors` allowlist. Keep `https://build.docyrus.app` in that allowlist so hosted Docyrus preview surfaces can embed the local preview during development.

## Saved View Filter Normalization

Saved data-view filters created by `QueryBuilderDocyrus` are normalized before they are sent to Docyrus item queries.

`src/lib/docyrus-filter-normalization.ts` strips React Query Builder-only keys such as `id` and `valueSource`, keeps only backend filter fields, and maps display operators (`is one of` / `is none of`) to backend operators (`in` / `not in`).

Consumers: `useDocyrusDataGrid`, `useDocyrusDataTable`, and `useDocyrusKanban` must call this helper before assigning `params.filters`, so saved views behave the same as app-generated toolbar filters.

Backlink: `// @docyrus: [[architecture#Saved View Filter Normalization]]`.

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

## Webphone (Callcenter WebRTC) Module

A minimal Verimor WebRTC softphone integrated from `docs/callcenter-webrtc-integration-kit`. Gated by the `webphone` switch in [[architecture#App Module Configuration]] (`data.modules.webphone`); every surface is hidden/guarded when the module is off.

The backend is the existing `base_callcenter` collections (`call`, `agent_telephony_profile`, `call_activity`, `call_screen_note`, `callback`) plus `base.contact` for customer identity. A schema audit confirmed every required field and enum is present on the tenant, so the module needs no schema mutation and no enum-ID hardcoding. Two profile fields (`sip_password`, `display_name`) exist in the live schema but are missing from the generated entity type (openapi.json is stale for them); they are read via explicit `columns` and typed locally as `WebphoneAgentProfile` instead of regenerating all 114 collections.

Foundation (`src/lib/webphone/` + `src/hooks/use-webphone-*`):

- `types.ts` — runtime config, session snapshot, controller, agent-profile, and customer match/adapter contracts.
- `phone.ts` — digit-based phone normalization with a last-10 fallback (match / storage / dial forms).
- `runtime.ts` — Verimor/`bulutsantralim` defaults, `buildWebrtcRuntimeConfig` (settings + profile credentials), and the single `resolveWebphoneReadiness` that all dial gating reads. SIP credentials always come from the agent profile, never from tenant config or env. `getWebphoneRuntimeSettings` also pins four code-managed fields — register expiry, no-answer timeout, audio codec order, and ICE/STUN JSON — back to the `DEFAULT_VERIMOR_RUNTIME` value, so a stale `data.webrtc` entry can never override them; they are deliberately hidden from the settings form and changed only in code.
- `enum-resolver.ts` / `use-webphone-enums.ts` — slug/name normalized resolution of `base_callcenter` enums (`direction`, `state`, `call_type`, `device_type`, `outcome`, activity `disposition`); a field is omitted when its token cannot be resolved.
- `use-webphone-config.ts` — credential-free runtime settings stored under `data.webrtc` in the shared app config record (alongside `data.fieldSales` / `data.modules`).
- `use-webphone-profile.ts` — the current user's `agent_telephony_profile`, driving readiness and credentials.
- `use-webphone-customer-adapter.ts` — `base.contact` → `CustomerAdapter` (`findByPhone` digit match, customer card = `/contacts/$contactId`); the contact datasource is never mutated.

Runtime + UI (implemented; live SIP verification is manual):

- `use-webphone-sip.ts` — single JsSIP UA controller (register/call/answer/hangup/mute/hold/DTMF, mic permission, remote-audio wiring, 486-busy on a second call), emitting `ringing/answered/ended/missed/rejected` lifecycle events. `register()` tears down any existing UA before building a new one, accepts an explicit config override for post-save reconnects, guards delayed events from stopped UA instances so they cannot overwrite the active registration status, maps registration/transport failures to end-user-safe error codes, applies configured SIP extra headers, and plays a local outbound ringback tone on SIP `progress` until remote audio, answer, failure, or hangup stops it.
- `call-lifecycle.ts` + `use-webphone-call-log.ts` — one canonical `base_callcenter.call` record per `call_id` (create on ringing, update on answer/end, duration, relation-patch guard); a persistence failure never blocks the live call.
- `screen-pop.ts` — incoming caller → `findByPhone` → 0/1/N handling (single auto-opens the card and patches the relation; multi shows a picker; none = unknown caller).
- `webphone-context.tsx` (`WebphoneProvider` / `useWebphone`) — composes settings + profile + readiness + controller + call-log + adapter + screen-pop, auto-registers a ready agent, and tracks live notes + pending wrap-up. Mounted in `App.tsx`; a no-op when the module is off. Auto-connect honours the agent's last explicit presence choice: `connect`/`disconnect`/`requestConnect` persist `'online'`/`'offline'` per user via `presence.ts` (`localStorage`, keyed by user id — presence is browser/device-bound because the SIP socket and mic permission live here, not on the shared profile row). On reload the auto-register effect skips registration when the stored intent is `'offline'`, so a refresh after going Offline stays offline and does not re-prompt for the microphone; a null/`'online'` intent still auto-connects (the first-time default).
- `wrapup.ts` + `use-webphone-wrapup.ts` — wrap-up persistence (`call_activity` upsert + `call` patch with disposition→enum mapping) and pinned notes (`call_screen_note`); live notes prefill wrap-up notes; an activity-write failure keeps the form open.
- UI: `webphone-status-badge.tsx` (header chip; clicking opens a menu to go Online/Offline via `connect`/`disconnect`, shows a toast and dropdown hint when registration or transport fails instead of silently falling offline, plus an "Extension settings" item — `webphone-extension-dialog.tsx` — where the agent saves their own SIP username/password onto their `agent_telephony_profile`; Save & connect now passes a merged post-save profile snapshot into `requestConnect`, so registration uses the just-entered credentials immediately instead of racing the profile refetch. The SIP password is prefilled from the user's own stored profile (masked, with an eye reveal toggle) so the same user can re-confirm what they saved; on an existing profile, left blank it keeps the stored value. When the user has **no** profile yet, the dialog self-provisions one via `useCreateMyAgentTelephonyProfile` (the only profile-creation UI in the app) — sending `user` + `extension` (both backend-required) and forcing `enabled: true` + `webrtc_enabled: true`, because the schema default for `webrtc_enabled` is false and would otherwise fail readiness with `webrtc_disabled`) + `webphone-dialpad.tsx` (header; once ≥7 digits are typed it searches `base.contact` so a known customer can be dialled and linked in one click), `webphone-widget.tsx` (global incoming screen-pop / active-call / wrap-up surface), `webphone-call-button.tsx` + `webphone-customer-calls.tsx` (gated click-to-call/history surfaces — `WebphoneCallButton` direct-dials and still appears in the contact "calls" tab; the two primary detail call icons (above attributes + tab-rail) instead open the slide-out **call composer**, see [[architecture#Shared Record Detail Layout]], gathering the record's number(s): contact→mobile, lead→phone (+company line), deal→related contacts, company→main line + related contacts), `webphone-settings-form.tsx` + `WebphoneReadinessSummary` (tenant runtime settings, opened read-only from a gear button in an App Config modal — editing is unlocked behind an "authorized only" confirm; it shows only the endpoint fields — register expiry, no-answer timeout, audio codec order and ICE/STUN are code-managed and not displayed), and `calls.tsx` (`/calls`, the tenant-wide call log built on the shared DataGrid).

`calls.tsx` uses the shared `useDocyrusDataGrid` + `useSeedDefaultViews` with seeded All / Gelen / Giden saved views (read-only, standard paging at 25/page). Inbound/Giden filter on the `direction` enum **id** — the slug does not match server-side (verified), so the page resolves the inbound/outbound ids via the webphone enum resolver and only mounts the grid once they are known.

App Config (`/app-config`) renders each module as a row; once a module is toggled on the row shows a complete/incomplete status badge (hover explains what is missing) and a gear button that opens a settings modal — `WebphoneSettingsForm` for webphone, `FieldSalesSettingsForm` for field sales. The standalone `/settings` route was removed: field-sales settings are now reached only from this modal (`FieldSalesSettingsForm` is the shared form). `createSystemViews` gained an optional per-view `pageSize`. Surfaces are wired into `App.tsx` (provider + widget), the header actions (status menu + dialpad, with a soft divider before the field-sales location action; the former global "quick add" button was removed), `contact-detail.tsx` (Calls tab), the sidebar (a gated Webphone group → `/calls`), and `/app-config`. Outbound, inbound screen-pop, call logging, wrap-up, pinned notes, history, and the tenant call log are all functional; the remaining step is live SIP verification against a populated agent profile.

Backlink: `// @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]`.

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

- The left pane is an internal `RecordAttributePanel` driven by `EditableRecordDetail`/`EditableRecordDetailField` (`src/components/docyrus/editable-record-detail.tsx`). It is headed by a `Rows3` "Attributes" label. Inline fields pass `editHint="progressive"` + `size="sm"`; a scoped `.crm-attribute-panel <style>` normalizes every value renderer to a uniform **13px** (`[data-slot="editable-value"]` plus descendants `inherit`) so the key–value list reads consistently despite renderers' native `text-sm`/`text-xs` (renderers keep their native size elsewhere). The pencil opens a second `EditableRecordDetail` inside a `Dialog` ("edit all"). Both surfaces call the page's `onInlineSave(changes, values)`.
- **Attribute visual consistency**: labels wrap (`break-words` + `leading-tight`, not truncate); value-renderer roots carry `min-w-0 max-w-full` (icons `shrink-0`, single-line text `block truncate`) so long values truncate/shrink gracefully. `EditableValue` renders active edit controls through a `document.body` portal, anchored to the clicked value row with fixed positioning; wide compound editors (phone/money/duration/currency) get a readable minimum width without resizing the left pane. Popover/select contents use a higher shared z layer (`PopoverContent`/`SelectContent` at `z-[140]`) so dropdowns stay above the portal editor, the divider, dialogs, and pane overflow.
- **Searchable single-selects**: `field-select`/`field-enum`/`field-systemEnum` route to `EnumComboboxField` (`form-fields/enum-combobox-field.tsx` — a cmdk `Popover`+`Command` with local search) via both `FORM_FIELD_MAP` registries (`src/hooks/use-docyrus-field-component.tsx` and the vendored `src/hooks/docyrus/use-docyrus-field-component.tsx`), so detail attributes and bulk-update rendered fields use the same clean searchable combobox as `field-relation`; status keeps `StatusFormField`'s richer status popover. Enum/select dropdown rows and their triggers render with the same colored chip language as read-only values (`EnumOptionDisplay variant="chip"`; `shouldRenderEnumOptionChip` is true when an option has either an icon or a color). Detail routes merge the current record's `{id,name}` relation/enum object into option arrays through `mergeCurrentEnumOption` before passing them to `EditableRecordDetail`, so renderers and edit dropdowns can still show labels when the fetched option list is stale or missing that id. Data-grid cells are unaffected (separate `CELL_COMPONENT_MAP`).
- **`fieldRenderers?: Record<slug, (ctx) => ReactNode>`** replaces the default inline editor for specific slugs (Company + Lead `location` → `LocationField`, Contact `name` → `ContactNameField`). The renderer's `ctx.save(patch)` builds the `FieldChange[]` for the changed slugs and calls `onInlineSave`; `ctx.readOnly` lets a renderer go display-only (e.g. a converted Lead). `LocationField` accepts `countryField` (Lead uses `"countries"`) and `readOnly`. Honored in both the inline panel and the edit-all modal.
- `useRecordVersion(record)` bumps a counter on record-reference change (refetch) and keys the inline editor so it remounts with fresh values without disrupting mid-typing.
- Page contract props: `detailFields: RecordDetailField[]`, ordered `fieldSlugs: string[]`, a flattened `record` (relation/enum fields flattened to scalar id for editable fields, or to display name for read-only ones), `onInlineSave`, `tabs: RecordDetailTab[]`, controlled `activeTab`/`onTabChange`, optional `readOnly`, `attributeActions`, and `dialerTrigger`. Exports `RecordKpiCard` and `RecordTabPlaceholder` for tab bodies.
- The dialer is a global context (`DialerProvider`/`useDialer`/`DialerPanel`, `src/components/dialer/dialer-widget.tsx`) wrapped once in `App.tsx` (inside `WebphoneProvider`); the panel renders inside the layout as a width-animated column. It is a **real WebPhone pre-call composer** (no longer mock telephony): `dialer.open({ recordLabel, targets: DialTarget[] })` where each `DialTarget` is `{ label, sublabel?, number, contactId?, leadId? }`. The panel reads `useWebphone()`, shows a number picker when a record has >1 target, a "no number" / "offline" / "call-in-progress" inline warning otherwise, and on **Start Call** places a real `dial()` then closes — the live call is owned by the global bottom-right `webphone-widget`, so there is **no** duplicate in-call UI in the slide-out. The legacy mock call flow and the demo-contact default phone button were removed; pages only pass `dialerTrigger` (and render the attribute-panel call icon) when `useWebphone().enabled`, so when the webphone module is off no call affordance shows at all. When the module is off, related-contact table "call" buttons fall back to a `tel:` link.

Backlink: `// @docyrus: [[architecture#Shared Record Detail Layout]]`.

## Per-record Activity Source

The detail pages' Activity tab is the record's **audit change-history** — the item `activities` sub-resource, not `base.event`.

`useRecordActivities(appSlug, dataSourceSlug, id)` (`src/hooks/use-record-activities.ts`) → `GET /v1/apps/{app}/data-sources/{ds}/items/{id}/activities` → `RecordActivityPanel`. App/data-source per entity: contact `base`/`contact`, organization `base`/`organization`, lead `base_crm`/`leads`, deal `base_crm`/`deal`. The same panel feeds the Overview recap (`activities.slice(0, 2)`) and the full Activity tab (`filterable` — a `ListFilter` popover toggles categories reduced from raw operations: Created · Updated · Status · Comments · Files · Deleted · Other; client-side).

`useRecordEvents(relation, recordId)` (`src/hooks/use-events.ts`, over `base.event`) feeding `RecordActivityTimeline` still exists for calendar-style events but is **no longer wired into the detail pages** (which now show audit history). `base.activity` is unused for per-record history (no back-relation).

## Quote Builder & PDF

Quotes reuse the `base_crm.sales_order` + `sales_order_item` datasources — there is no dedicated quote entity, because the platform exposes no way to add data endpoints. A quote is a `sales_order` row plus its line items. See [[features#Quotes (Teklif)]].

Quote-level totals persist to `sales_order` (`sub_total` = net total, `tax_total`, `grand_total`); each priced line is a `sales_order_item` (required fields `related_sales_order`, `qty`, `unit_price`). Relations (`organization`, `deal`, `product`, `related_sales_order`) are written as plain id strings, matching the deal/lead create forms. On save, line items are reconciled (create new / update existing / delete removed) against the originally loaded set; the editable `PricingEnginePanel` is keyed on the loaded item-id signature so re-saves don't duplicate freshly created lines.

Screens separate data from document: `/quotes/$quoteId` (Quote Detail, shared `RecordDetailLayout`) authors attributes + the Line Items pricing tab; `/quotes/$quoteId/build` (compose) renders pricing read-only and composes the document; `/quotes/new` opens the create wizard. The list is the `sales_order` route surfaced as "Teklifler"; its "Yeni Teklif" button opens the same wide modal wizard in-place. The wizard (`src/components/quotes/quote-create-wizard.tsx`) collects customer/deal basics, temporary `PricingEnginePanel` line items, and a template choice from the seeded quote templates (`Quote Standard`, `Quote Executive`, `Quote Compact`), then creates the `sales_order`, persists `sales_order_item` rows, writes `quote_template_id` + `quote_doc_json` on the quote record, and navigates to Quote Detail. The editable pricing for an existing quote lives in `src/components/quotes/quote-line-items.tsx` (used editable in the Detail tab, read-only in the build preview).

Quote product catalogs read products through `useProducts` with explicit columns `id,product_code,category,unit_price,tax,Unit`. `base_crm/product.category` is an enum-backed select and resolves to `{ id, name }` in item queries, so `PricingEnginePanel` can show the category label and carry `categoryId` next to catalog products. `name` is intentionally not requested; product labels fall back to `product_code`.

Deal detail Products are an interested-product surface, not a quote/pricing surface. The tab renders `DealProductsPanel` (`src/components/deals/deal-products-panel.tsx`), reads selected products from `deal.deals_products_tags`, and patches that same multi-relation field when users add/remove products. The searchable product selector reads the catalog through `useProducts` with `id,product_code,category,unit_price,tax,Unit`; list price/category/tax are display hints only. Lead conversion copies `leads_products_tags` into `deals_products_tags`, so converted lead product interest appears on the deal without creating priced rows. `base_crm/deal_product` still exists with `product`, `qty`, `unit_price`, `discount`, `tax_rate`, `total`, `gross_total`, and `net_total` but no top-level `category`; if legacy code queries it, the safe category shape is `product(id,name,category)`.

PDF export is client-side raster (html2canvas-pro + pdf-lib) via the `HtmlTemplateEditor`'s own `lib/html-to-pdf` — text is not selectable, no backend round-trip. The **download is triggered from a header "PDF İndir" button** in `quote-build.tsx` (deep-imports `createEditorTemplateEngine` + `htmlTemplateToPdf`, compiles `template`+`data`, rasterizes, and clicks an `<a download>` blob named from the quote title); the editor's PDF tab is now just an in-app preview. The earlier standalone `src/lib/quote-pdf.ts` was removed; the current shared PDF helpers live at `src/components/quotes/quote-pdf.ts` (co-located with the quote components, a different file/purpose). The backend also supports document templates via the studio CLI — `docyrus studio create-html-template` (HTML/PDF/DOCX, bound to a data source) and `create-email-template`. Email sending **with the quote PDF attached** IS wired end-to-end: `useDocyrusEmailComposer` (`src/hooks/docyrus/use-docyrus-email-composer.tsx`) lists accounts via `GET /v1/messaging/email/accounts` and sends via `POST …/{accountId}/send` (its `send({ attachments })` overload posts `attachments: [{ filePath, fileName, mimeType }]`). The attachment plumbing follows the platform "upload a client-generated file, then email it" pattern: on **Send**, `QuoteEmailDialog` (1) compiles the quote to a PDF `File` (`compileQuotePdfFile`), (2) **uploads it to the `sales_order` record** via the record-scoped multipart endpoint `POST /v1/apps/base_crm/data-sources/sales_order/items/{recordId}/files/upload` — form field **must be `file`**, and **no `?isCore`/`?publicFile`** so the file lands in the emailable **`tenant` bucket** (`uploadRecordFile` in `quote-pdf.ts`) — then (3) passes the upload's returned **`file_name` (storage path, NOT the `signed_url`)** as the attachment `filePath`. Upload happens **on send** (not on dialog open) so abandoned composes don't litter the record with PDFs. The build screen feeds a live `getAttachment` thunk (current editor `template` + `quoteData`); Quote Detail (no live editor) feeds one via `useQuotePdf(quoteId)` (`src/hooks/use-quote-pdf.ts`), which loads order/items/company/selected-template-body and rebuilds the same data with `buildQuoteData` so the attached PDF matches the build-screen output. Email-attachment limits are stricter than upload limits (10 MB/file, 25 MB total, ≤10 attachments). Tenant email-account/provider setup is the backend dependency (account/scope gaps surface as a toast + inline error in the dialog, not as a blocker).

**Install note:** `@docyrus` UI components install via the **Docyrus CLI**, not plain shadcn — `pnpm dlx @docyrus/cli add @docyrus/ui-html-template-editor`. Plain `shadcn add @docyrus/...` fails because the registry URL (`https://ui.docy.app/r/{name}.json`) returns SPA HTML to a direct fetch ("Unexpected token '<' … not valid JSON"). The html-template-editor is now vendored at `src/components/docyrus/html-template-editor` (Plate + Handlebars; adds the `handlebars` dep; files are `@ts-nocheck`). It is self-contained — visual/code/data/preview/PDF tabs — and rasterizes PDF client-side via its `lib/html-to-pdf` (html2canvas + pdf-lib). `/quotes/$quoteId/build` drives it: `value`=the selected/local quote template HTML, `data`=quote JSON, `variables`/`extraHelpers` supplied by the route, and the selected template name is shown in the Templates trigger/popover while the Create/Update action lives in the fixed left-form footer. Install flags: pass `-o`/`--overwrite` for non-interactive installs (NOT `--yes`, which errors). Re-running `add @docyrus/ui-html-template-editor --overwrite` **re-resolves the component's whole dependency tree** — the editor embeds `EditorAgent`/`DocyrusAgent`/`AwesomeDialog` + 45 Plate/shadcn/ai-elements primitives — so a single overwrite rewrites **~177 files** under `components/{docyrus,editor,ui,ai-elements}`, `hooks/docyrus`, and `lib/docyrus` in the registry's own formatting (double-quotes/semicolons). That formatting churn is harmless: every one of those files is `@ts-nocheck` + `/* eslint-disable */`, so `pnpm build` (tsc) and `eslint` skip them and stay green; do NOT hand-reformat them back to repo style (it just diverges from upstream). Last refreshed to latest 2026-06-26. Hooks are SEPARATE registry items with a `hooks-` style name (not `@docyrus/use-…`) — e.g. the email composer hook is `pnpm dlx @docyrus/cli add hooks-use-docyrus-email-composer -o` (lands at `src/hooks/docyrus/`), while its component is `@docyrus/ui-email-composer`.

Quote templates are **READ from the backend at runtime** — `src/components/quotes/quote-templates-api.ts` (`listQuoteTemplates` / `getQuoteTemplate`) calls `GET /v1/apps/base_crm/data-sources/sales_order/templates` (metadata list, default first) and `…/templates/{id}` (full `body`/`styles`/header/footer). **No template bodies are embedded in the app** — `quote-templates.ts` now holds only `QUOTE_VARIABLES` (the merge-field catalog for the editor's insert-variable popover). Both `quote-build.tsx` and the create wizard fetch the list via `useQuery(['quote-templates'])`; the build screen also fetches the selected template's body (`['quote-template-detail', id]`) and loads it into the editor. Templates are authored/managed in **Studio** (`docyrus studio create-html-template`, bound to `sales_order`) — the app consumes them **read-only** (it never overwrites backend template content; a `curl PATCH` to do so is auto-blocked, and this build's `studio *-html-template` CLI flags are non-functional). `sales_order` persists `quote_template_id` (selected template UUID) and `quote_doc_json` (doc title/validity/billing notes + an optional per-quote edited body, which wins over the backend body when present). Default = the backend `is_default` row.

⚠️ **Faithful render = keep the Visual tab OUT of the quote editor.** The vendored editor is the stock upstream component. Its value-sync effect (`html-template-editor.tsx` ~L755-778) branches on whether `'visual'` is in the configured `visibleTabs`: when Visual is **present** it hydrates Plate via `loadTemplateIntoEditor` on mount (deserialize→re-serialize round-trip — lossy for rich designs, see below); when Visual is **absent** it sets the SSOT (`templateHtml`) **directly from `value`**, keeping the raw HTML **verbatim** so Code / Preview / PDF compile exactly what the backend authored. So `quote-build.tsx` passes **`visibleTabs={['preview','code','data','pdf']}`** (NO `'visual'`) — that one prop is what makes server-authored templates (gradients, `<div>` cards, flex, inline cell borders/widths, colored `{{variables}}`) render as-authored. Do NOT add `'visual'` back for the quote builder. (Editing still works: the left form feeds Handlebars `data`; the **Code** tab edits raw HTML/Handlebars verbatim. Earlier we instead patched the component's mount effect locally + embedded round-trip-safe templates — both gone; the overwrite restored stock upstream and the fix now lives entirely in the `visibleTabs` config.) For reference, the **upstream Visual round-trip** (only relevant if Visual is ever enabled) preserves vs. drops:

- ✅ survive (now better than before): `<h1>-<h3>` / `<p>` / `<hr>` / `<blockquote>` / tables, `{{#each}}`/`{{#if}}`/helpers, per-cell **`background-color` + per-side `border-*` + `width`** (`serialize.ts` reads these off the Plate cell node), `text-align`/`line-height`/indent on blocks, and — on text **including around `{{variables}}`** — inline `color` / `background-color` / `font-size` + bold/italic/underline (`inlineMarkStyles`).
- ❌ still dropped: block-level styling on an arbitrary `<div>` (gradients, border-radius, box-shadow, flex/padding) — Plate has no node for raw divs, so only column-group/column/callout survive and they re-emit **fixed** inline styles, not the author's. This is the structural reason we render verbatim instead.

The editor **host stylesheet** styles whatever body is rendered: `A4_PREVIEW_CSS` (`html-template-editor.tsx`, Preview) and `PDF_PAGE_CSS` (`lib/html-to-pdf.ts`, export) set the A4 page chrome + base type, and give `th,td` padding/alignment but **no forced border** (stock upstream — an earlier local edit that added `1px solid #e2e8f0` to every cell was overwritten by the 2026-06-26 refresh, and that's correct now: verbatim render means each template's own inline cell borders show through). The quote `data` is composed in `quote-build.tsx`: money via `formatCurrency v currency locale` (`documentLocale` = tr-TR default / en-US when UI=en), grand total spelled out via `numberToWordsTR` ("Yazıyla"), per-line amount = `net` (column sums to `totals.subtotal`). The header **PDF İndir** button and the email-attachment flow both compile the rendered body + data via `compileQuotePdfBytes` / `compileQuotePdfFile` in `src/components/quotes/quote-pdf.ts` (which wrap `createEditorTemplateEngine` + `lib/html-to-pdf`), rasterizing client-side (no overwrite, no server PDF). `buildQuoteData` (same module) is the single source of the template `data` object — `quote-build.tsx`'s editor `data` prop and both PDF paths use it, so the data tab, the download, and the emailed PDF stay identical. The `QuoteDocFields`/`normalizeQuoteDoc` shape lives in `src/components/quotes/quote-doc.ts`. `quote-templates.ts` imports `HandlebarsVariable` from `…/html-template-editor/types`, NOT the barrel `index` (the barrel pulls Plate + katex CSS and breaks Node imports).

## Localization (i18n)

The app UI uses **react-i18next**; the Docyrus UI component library uses a separate translation bridge. Two systems coexist.

App UI: `useTranslation()` → `t('namespace.key')`. Locale files at `src/i18n/locales/{en,tr,de,fr,it,es,nl,pt,sl,el,ar}.json` (init in `src/i18n/index.ts`), `fallbackLng: 'en'`, language from `localStorage('i18nextLng')` then navigator, switched via `LanguageSelector`. **en.json and tr.json are kept at full key parity** — add every key to BOTH (other languages fall back to en). The 2026-06-23 audit took en/tr to ~2004 keys each.

**Two i18n systems coexist.** Besides react-i18next, the **Docyrus UI component library** (data grid, form fields, value renderers, html-template-editor, email composer, agent panel, data-import-wizard) translates through a separate bridge: `useUiTranslation()` (two independent context copies — `src/hooks/docyrus/use-ui-translation.tsx` and `src/lib/use-ui-translation.tsx`) reads a `t` from a `UiTranslationProvider`; with no provider it returns the inline English `defaultValue`. Those components call `t('ui.<area>.<key>', 'English default')` — the `ui.*` namespace.

⚠️ Both `UiTranslationProvider`s were **unmounted**, so the entire Docyrus UI layer always rendered English regardless of app language. Fixed by mounting BOTH providers in `src/App.tsx` (each given a `translateForUi` adapter that bridges react-i18next's `TFunction` to the bridge's `(key, fallback) => string` shape), and adding the full `ui.*` namespace to en/tr.json. **When you add a new Docyrus UI component that uses `useUiTranslation`, add its `ui.*` keys to en+tr.json.** For Docyrus components that take a `locale` prop (`UiI18nLocale` for `tUi()`, or `DataTableFilterLocale`), derive it from the app language with `useUiLocale()` (`src/hooks/use-ui-locale.ts`) — this replaced three duplicated `i18n.resolvedLanguage` useMemo blocks in deal-detail/sales-order-detail/quote-line-items. The data-grid hook (`use-docyrus-data-grid.tsx`) now also translates its bulk-action labels (Update/Delete/Export/Reload) via react-i18next.

Intentionally NOT translated (no regression — would need component edits): ~16 `ui.dataImportWizard.*` keys whose default is a JS template literal (`${…}`, needs i18next `{{}}` params + component change) and ~26 data-table-filter bare keys (`all`, `operators`, `datePresets.*`…) which use their own `DataTableFilterLocale` object. The Field Sales module (routes + `src/components/field-sales/*` + `use-field-sales`) was fully migrated from hardcoded Turkish to `t('fieldSales.*')`.

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
