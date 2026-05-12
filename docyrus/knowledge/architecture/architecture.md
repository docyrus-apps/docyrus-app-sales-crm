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
