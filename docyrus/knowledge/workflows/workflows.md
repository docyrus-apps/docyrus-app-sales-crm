<!-- docyrus-knowledge:auto:begin -->

# Workflows

This file documents the repo-level working agreements, supporting docs, and commit-time expectations that agents and humans should follow while changing the codebase.

## Important Docs

This section lists the docs that should stay aligned with repo-level workflow changes.

- docs/docyrus-api-query-guide.md
- docs/form-implementation-guide.md
- docs/preferred-components.md
- README.md

## Commit And Review Expectations

Use the knowledge graph before broad source exploration, keep it in sync with behavior changes, and treat commit-time knowledge checks as part of the normal review loop.

<!-- docyrus-knowledge:auto:end -->

## Lead Conversion Schema Workflow

When changing convert-time behavior, work top-down from the datasource through the readers and finish with a real smoke test.

- Datasource edits go through `docyrus studio` CLI; only CUSTOM fields are deletable, APP/SYSTEM ones must be detached at the manifest level first.
- Code sync: `src/schemas/lead-schema.ts`, `src/hooks/use-leads.ts` column lists, `src/routes/leads.tsx` `titleColumn` and column string, then `lead-convert-dialog.tsx`, `lead-form-dialog.tsx`, and any list/detail/kanban readers.
- Build with `pnpm build` (lint may fail with a missing `@docyrus/rules` package — pre-existing local issue).
- Smoke-test through a real lead and inspect the created org/contact/deal via `docyrus ds list` to confirm relations and provenance.
- Confirm CLI auth before bulk operations — sessions expire and a partial flow can leave the schema half-updated.
