// @ts-nocheck
/* eslint-disable */
/*
 * Converts a Docyrus saved-form `layout` (returned by
 * `GET /v1/apps/{app}/data-sources/{ds}/forms`) into the `layout` /
 * `fieldLayout` / `fieldSlugs` shape that `useDocyrusFormView` consumes.
 *
 * Bundled as a transitive file under `use-docyrus-form-view`; not a public
 * entry point. The hook calls `convertDocyrusFormLayout` after the schema
 * resolves so field bindings (stored as data-source field ids) map back to slugs.
 *
 * Two persisted formats are supported:
 *
 * 1. Build-studio (current) — a flat `fields` array, columns via `gridColumns`:
 *      {
 *        gridColumns: 3,
 *        fields: [
 *          { id, dataSourceFieldId: <slug|id>, fieldConfig: { slug, type, ... }, componentType, columnSpan? },
 *          { id, componentType: 'panel', fields: [ ...nested ] }       // sections (if present)
 *        ]
 *      }
 *
 * 2. Legacy `KvFormView` — a `children` tree, columns via `options.columnCount`:
 *      {
 *        type: 'KvFormView',
 *        options: { columnCount, tabView },
 *        children: [
 *          { id: <fieldId>, type: <fieldType>, options: { columnSpan, validations, hidden } },
 *          { id: 'panel_x', type: 'panel', options: { label, columnCount, tabView }, children: [...] }
 *        ]
 *      }
 *    Field nodes have no `children`; container nodes (`panel`) do.
 */

import {
  type FieldAction,
  type FormAction,
  type FormCustomValidationRule,
} from '@/components/docyrus/form-fields/types'

import {
  type DocyrusFormViewColSpan,
  type DocyrusFormViewFieldLayout,
  type DocyrusFormViewLayoutItem,
  type DocyrusFormViewTabSection,
} from '../use-docyrus-form-view'

interface RawFieldConfig {
  id?: string
  slug?: string
  type?: string
  readOnly?: boolean
  hidden?: boolean
  columnSpan?: unknown
  validations?: unknown
  fieldActions?: unknown
}

interface RawNode {
  id?: string
  type?: string
  componentType?: string
  dataSourceFieldId?: string
  hidden?: boolean | null
  columnSpan?: unknown
  label?: unknown
  title?: unknown
  options?: Record<string, unknown> | null
  fieldConfig?: RawFieldConfig | null
  children?: Array<RawNode> | null
  fields?: Array<RawNode> | null
  items?: Array<RawNode> | null
  gridColumns?: unknown
  columnCount?: unknown
  formActions?: unknown
  formCustomValidations?: unknown
}

export interface ConvertedDocyrusFormLayout {
  layout?: Array<DocyrusFormViewLayoutItem>
  fieldLayout?: Record<string, DocyrusFormViewFieldLayout>
  /** Slugs the form references — used as `fieldSlugs` so omitted fields aren't appended. */
  fieldSlugs?: Array<string>
  columns: 1 | 2 | 3 | 4
  /** Form-level lifecycle actions embedded in a build-studio form layout. */
  formActions?: Array<FormAction>
  /** Form-level submit validations embedded in a build-studio form layout. */
  formCustomValidations?: Array<FormCustomValidationRule>
}

interface ConvertContext {
  idToSlug: Map<string, string>
  validSlugs: Set<string>
  fieldLayout: Record<string, DocyrusFormViewFieldLayout>
  usedSlugs: Array<string>
}

function clampColumns(value: unknown): 1 | 2 | 3 | 4 {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1
  if (value <= 1) return 1
  if (value >= 4) return 4

  return Math.round(value) as 2 | 3
}

function toColSpan(
  span: unknown,
  columnCount: number,
): DocyrusFormViewColSpan | undefined {
  const value = Array.isArray(span) ? span[0] : span

  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  if (columnCount > 1 && value >= columnCount) return 'full'
  if (value <= 1) return 1
  if (value >= 4) return 4

  return Math.round(value) as 2 | 3
}

function resolveSlug(
  id: string | undefined,
  ctx: ConvertContext,
): string | null {
  if (!id) return null
  if (ctx.validSlugs.has(id)) return id

  return ctx.idToSlug.get(id) ?? null
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function nestedNodes(node: RawNode): Array<RawNode> | null {
  if (Array.isArray(node.fields)) return node.fields
  if (Array.isArray(node.children)) return node.children
  if (Array.isArray(node.items)) return node.items

  return null
}

function applyFieldOverrides(
  slug: string,
  options: {
    columnSpan?: unknown
    validations?: unknown
    fieldActions?: unknown
  },
  columnCount: number,
  ctx: ConvertContext,
): DocyrusFormViewLayoutItem {
  const fieldLayout: DocyrusFormViewFieldLayout = ctx.fieldLayout[slug] ?? {}
  const validations = Array.isArray(options.validations)
    ? options.validations
    : []

  if (validations.includes('required')) fieldLayout.required = true

  const colSpan = toColSpan(options.columnSpan, columnCount)

  if (colSpan) fieldLayout.colSpan = colSpan

  /*
   * Per-field onFieldChange actions defined in the build-studio field config.
   * Surfaced into `fieldLayout.fieldActions` so the hook's field-action
   * evaluator runs them automatically — no consumer wiring.
   */
  if (Array.isArray(options.fieldActions) && options.fieldActions.length > 0) {
    fieldLayout.fieldActions = options.fieldActions as Array<FieldAction>
  }

  if (Object.keys(fieldLayout).length > 0) ctx.fieldLayout[slug] = fieldLayout

  ctx.usedSlugs.push(slug)

  return colSpan ? { type: 'field', slug, colSpan } : slug
}

/* ---- Build-studio format (flat `fields` array) -------------------------- */

function resolveBuilderSlug(node: RawNode, ctx: ConvertContext): string | null {
  const cfgSlug = pickString(node.fieldConfig?.slug)

  if (cfgSlug && ctx.validSlugs.has(cfgSlug)) return cfgSlug

  const byDataSourceId = resolveSlug(node.dataSourceFieldId, ctx)

  if (byDataSourceId) return byDataSourceId

  return cfgSlug ?? resolveSlug(node.id, ctx)
}

function convertBuilderNodes(
  nodes: Array<RawNode>,
  columnCount: number,
  ctx: ConvertContext,
): Array<DocyrusFormViewLayoutItem> {
  const items: Array<DocyrusFormViewLayoutItem> = []

  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue

    const options = node.options ?? {}
    const hidden = node.hidden ?? node.fieldConfig?.hidden ?? options.hidden

    if (hidden === true) continue

    const nested = nestedNodes(node)

    if (nested && !node.dataSourceFieldId && !node.fieldConfig) {
      const sectionColumns = clampColumns(
        node.gridColumns ??
          node.columnCount ??
          options.columnCount ??
          columnCount,
      )
      const title =
        pickString(node.label) ??
        pickString(node.title) ??
        pickString(options.label)
      const colSpan = toColSpan(
        node.columnSpan ?? options.columnSpan,
        columnCount,
      )

      items.push({
        id: node.id ?? `section_${items.length}`,
        variant: 'fieldset',
        title,
        colSpan,
        items: convertBuilderNodes(nested, sectionColumns, ctx),
      })
      continue
    }

    const slug = resolveBuilderSlug(node, ctx)

    if (!slug) continue

    items.push(
      applyFieldOverrides(
        slug,
        {
          columnSpan:
            node.columnSpan ??
            node.fieldConfig?.columnSpan ??
            options.columnSpan,
          validations: node.fieldConfig?.validations ?? options.validations,
          fieldActions: node.fieldConfig?.fieldActions ?? options.fieldActions,
        },
        columnCount,
        ctx,
      ),
    )
  }

  return items
}

/* ---- Legacy KvFormView format (`children` tree) ------------------------- */

function convertLegacyNodes(
  nodes: Array<RawNode> | null | undefined,
  columnCount: number,
  ctx: ConvertContext,
): Array<DocyrusFormViewLayoutItem> {
  const items: Array<DocyrusFormViewLayoutItem> = []

  for (const node of nodes ?? []) {
    if (!node || typeof node !== 'object') continue

    const options = node.options ?? {}

    if (options.hidden === true) continue

    if (!Array.isArray(node.children)) {
      const slug = resolveSlug(node.id, ctx)

      if (!slug) continue

      items.push(
        applyFieldOverrides(
          slug,
          { columnSpan: options.columnSpan, validations: options.validations },
          columnCount,
          ctx,
        ),
      )
      continue
    }

    const sectionColumns = clampColumns(options.columnCount ?? columnCount)
    const title =
      options.hideLabel === true ? undefined : pickString(options.label)
    const colSpan = toColSpan(options.columnSpan, columnCount)
    const id = node.id ?? `section_${items.length}`

    if (options.tabView === true) {
      const tabs: Array<DocyrusFormViewTabSection> = []

      for (const child of node.children) {
        if (!child || typeof child !== 'object') continue

        const childOptions = child.options ?? {}
        const childTitle =
          childOptions.hideLabel === true
            ? undefined
            : pickString(childOptions.label)

        tabs.push({
          id: child.id ?? `tab_${tabs.length}`,
          variant: 'tab',
          title: childTitle,
          items: Array.isArray(child.children)
            ? convertLegacyNodes(
                child.children,
                clampColumns(childOptions.columnCount ?? sectionColumns),
                ctx,
              )
            : convertLegacyNodes([child], sectionColumns, ctx),
        })
      }

      if (tabs.length > 0) {
        items.push({
          id,
          variant: 'tabpanel',
          items: tabs,
          colSpan,
        })
      }
      continue
    }

    items.push({
      id,
      variant: 'fieldset',
      title,
      colSpan,
      items: convertLegacyNodes(node.children, sectionColumns, ctx),
    })
  }

  return items
}

/**
 * Translate a saved form `layout` payload into `useDocyrusFormView` props.
 *
 * @param formLayout - The `DataForm.layout` JSON (build-studio or `KvFormView`) or `null`.
 * @param fields - Data-source fields (`{ id, slug }`) used to resolve id → slug bindings.
 */
export function convertDocyrusFormLayout(
  formLayout: Record<string, unknown> | null | undefined,
  fields: Array<{ id?: string; slug?: string }>,
): ConvertedDocyrusFormLayout {
  const ctx: ConvertContext = {
    idToSlug: new Map(),
    validSlugs: new Set(),
    fieldLayout: {},
    usedSlugs: [],
  }

  for (const field of fields) {
    if (field.slug) ctx.validSlugs.add(field.slug)
    if (field.id && field.slug) ctx.idToSlug.set(field.id, field.slug)
  }

  const root = (formLayout ?? {}) as RawNode
  const rootOptions = root.options ?? {}
  const columns = clampColumns(rootOptions.columnCount ?? root.gridColumns)

  /*
   * Form-level lifecycle actions + submit validations live at the top of a
   * build-studio layout. Surfaced so the hook auto-runs them without the
   * consumer passing `formActions` / `formCustomValidations` props. Legacy
   * KvFormView layouts don't carry these (they yield `undefined`).
   */
  const formMeta: FormMeta = {
    formActions:
      Array.isArray(root.formActions) && root.formActions.length > 0
        ? (root.formActions as Array<FormAction>)
        : undefined,
    formCustomValidations:
      Array.isArray(root.formCustomValidations) &&
      root.formCustomValidations.length > 0
        ? (root.formCustomValidations as Array<FormCustomValidationRule>)
        : undefined,
  }

  if (Array.isArray(root.fields)) {
    const items = convertBuilderNodes(root.fields, columns, ctx)

    return packResult(items, ctx, columns, formMeta)
  }

  const children = Array.isArray(root.children) ? root.children : null

  if (!children || children.length === 0) {
    return { columns, ...formMeta }
  }

  const items =
    rootOptions.tabView === true
      ? convertLegacyNodes(
          [
            {
              id: '__root_tabs__',
              type: 'panel',
              options: { tabView: true, columnCount: columns },
              children,
            },
          ],
          columns,
          ctx,
        )
      : convertLegacyNodes(children, columns, ctx)

  return packResult(items, ctx, columns, formMeta)
}

interface FormMeta {
  formActions?: Array<FormAction>
  formCustomValidations?: Array<FormCustomValidationRule>
}

function packResult(
  items: Array<DocyrusFormViewLayoutItem>,
  ctx: ConvertContext,
  columns: 1 | 2 | 3 | 4,
  formMeta?: FormMeta,
): ConvertedDocyrusFormLayout {
  return {
    layout: items.length > 0 ? items : undefined,
    fieldLayout:
      Object.keys(ctx.fieldLayout).length > 0 ? ctx.fieldLayout : undefined,
    fieldSlugs: ctx.usedSlugs.length > 0 ? ctx.usedSlugs : undefined,
    columns,
    formActions: formMeta?.formActions,
    formCustomValidations: formMeta?.formCustomValidations,
  }
}

/** Merge a derived field-layout map with explicit per-field overrides (overrides win per key). */
export function mergeDocyrusFieldLayouts(
  base: Record<string, DocyrusFormViewFieldLayout> | undefined,
  override: Record<string, DocyrusFormViewFieldLayout> | undefined,
): Record<string, DocyrusFormViewFieldLayout> | undefined {
  if (!base) return override
  if (!override) return base

  const merged: Record<string, DocyrusFormViewFieldLayout> = { ...base }

  for (const [slug, layout] of Object.entries(override)) {
    merged[slug] = { ...merged[slug], ...layout }
  }

  return merged
}
