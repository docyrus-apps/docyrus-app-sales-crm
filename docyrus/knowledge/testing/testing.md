<!-- docyrus-knowledge:auto:begin -->

# Testing

This file records the current test layout and the expected validation paths that should stay aligned with behavior changes in the repo.

## Test Layout

This section records the current test footprint detected from the repo.

- src/App.test.tsx
- src/lib/docyrus-filter-normalization.test.ts

## Saved View Filter Tests

`src/lib/docyrus-filter-normalization.test.ts` covers Query Builder saved-view filter normalization, including stripping UI-only rule/group keys, mapping `is one of` → `in`, mapping `is none of` → `not in`, nested groups, and empty filters.

## Verification Commands

This section lists the verification-oriented scripts currently exposed by the package manifest.

- dev
- start
- build
- build:check
- serve
- test
- lint
- format
- check
- generate-orm
- +1 more

<!-- docyrus-knowledge:auto:end -->
