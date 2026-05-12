## Defensive Relation Rendering

Relation and enum fields can resolve to `null`. UI code must guard for both object shape and nullability before reading nested `.name` properties, especially in dashboard cards and summary lists.

## Root Runtime Tooling

The React root mounts Docyrus auth, TanStack Query, Docyrus Devtools, and the shared app shell without the Agentation overlay.

Keep `DocyrusDevtools` inside the auth/query provider tree, register auth-managed clients through `DocyrusDevtoolsClientRegistration`, pass the shared query client, and use `/openapi.json` as the local spec path when available. Keep optional developer aids out of `src/App.tsx`.

The OAuth callback is configured as a path (`VITE_OAUTH2_REDIRECT_PATH`) and the runtime redirect URI is always built from `window.location.origin` plus that path; keep the TanStack callback route and `DocyrusAuthProvider.callbackPath` aligned with the same value.

## Editor Dependency Alignment

The editor currently builds cleanly on PlateJS 53.x. Upgrade `platejs` and the `@platejs/*` packages together to avoid missing-export mismatches between core and plugin packages.

## Field Sales Runtime Shape

Field sales settings live in tenant app config under `fieldSales` for `base_crm`. Shared helpers cover ranges, enum IDs, and status normalization. A header-level location action handles nearby visits plus the active check-in or check-out sheets.

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
5. ~~Extract conversion orchestration into `useConversionSteps` only after the above is stable.~~ Done — `use-lead-convert-conversion.tsx` owns `runConversion`, the conversion-write enum fetches (`leadStatusOptions`, `conversionStateOptions`, `conversionModeOptions`) plus `requireEnumValue`/`conversionStateValue`/`conversionModeValue`, and the four async helpers `updateLead`, `migrateLinkedWork`, `fetchLatestLeadConversion`, `findExistingRecordFromLead`. Step state, gate functions (`findMissingField`, `findChangedFromLead`), focus/scroll helpers, and the change-confirm dialog stay in the dialog and are passed in as callbacks/snapshots so the dialog still owns the validation, focus, and change-confirm UI. Behavior is preserved verbatim: partial resume via the `fetchLatestLeadConversion` round-trip and `isLeadConvertedRecord` / `latestHasAnyCreated` checks, idempotent `source_lead = lead.id` reuse for organization/contact/deal, linked task/event migration with field-presence guards (`hasAllFields`), eager `updateLead` writes between each step for resumable partial state, the failure classification (`partial` vs `failed`), and all `queryClient.invalidateQueries` keys (`leads`, `deals`, `contacts`, `companies`, `tasks`, `events`). The success toast still renders its three navigation buttons via the hook's `.tsx` file. This extraction intentionally did NOT introduce a step registry — that is step 6.
6. ~~Convert `runConversion` to a step registry as the final refactor.~~ Done — inside `use-lead-convert-conversion.tsx`, `runConversion` now builds a `steps: Array<StepDefinition>` registry with one entry per phase (precheck, organization, contact, deal, activity, lead). Each `StepDefinition` exposes `key`, `shouldRun`, optional `onSkip`, and `run` (which owns its writes, step details, and `setStep(key, 'done' | 'warn' | 'skipped')` call). A single `for` loop iterates the registry: when `shouldRun()` returns false it invokes `onSkip` (used by the organization/contact skip branches to set the "skipped" step detail), otherwise it sets `activeStep` and `setStep(key, 'running')` before awaiting `step.run()`. Cross-step values (`organizationId`, `contactId`, `dealId`, `me`, `convertedLeadStatusValue`, `linkedWork`) live on a shared mutable `state` object the steps read and write. Gates (`duplicatesChecked`, `findMissingField`, `findChangedFromLead`), the latest-lead reconciliation, the post-success block (`invalidateQueries`, success log, success toast with navigation buttons, `onClose`, deal navigation), and the catch/finally block (failure classification, `setStep(activeStep, 'failed')`, partial-vs-failed `updateLead`, `setIsWorking(false)`) all remain at the outer try/catch around the loop — they are not steps because they cross-cut all phases. Behavior is preserved: step ordering, payload shapes, Docyrus columns/limits/filters, the eager `updateLead` writes between steps, the activity step's `warn`/`done`/`skipped` classification, partial-resume reads from `fetchLatestLeadConversion`, and the `[LeadConvert]` console events are unchanged.

Risk notes:

- Do not combine UI extraction, hook extraction, and step-registry changes in one commit.
- After every step, run `pnpm build`, `pnpm test`, `git diff --check`, and `docyrus knowledge check`.
- If a step touches Docyrus API calls, apply the Docyrus API Doctor checklist: columns must stay explicit, limits must remain positive, and mutation/invalidation/error handling must remain intact.
- The most fragile behaviors are validation focus, change-confirm restore, duplicate exact-match auto-selection, partial resume, linked task/event migration warnings, and converted-lead read-only enforcement.

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
