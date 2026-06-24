import type { SortingState } from '@tanstack/react-table'
import type { RuleGroupType } from 'react-querybuilder'

import type { SavedDataGridView } from '@/components/docyrus/data-grid'

import { DATA_GRID_DEFAULT_PAGE_SIZE } from '@/components/docyrus/data-grid/types'

/*
 * CRM default-view templates.
 *
 * These are NOT locked "system views". They are seed templates: on first load
 * `useSeedDefaultViews` creates any of these that don't already exist as REAL
 * backend data-views (matched by name), so they end up fully editable —
 * Configure / filter persistence / Delete all work like any user view.
 *
 * Standard pagination is enabled on every template so seeded views show the
 * classic paged footer (page size + page navigation) out of the box.
 */

interface SystemViewDefinition {
  id: string;
  name: string;
  description?: string;
  columns: Array<string>;
  sorting?: SortingState;
  filterQuery?: RuleGroupType;
  /** Override the standard-paging page size (defaults to the grid default). */
  pageSize?: number;
}

export function andFilter(rules: RuleGroupType['rules']): RuleGroupType {
  return { combinator: 'and', rules }
}

export function orFilter(rules: RuleGroupType['rules']): RuleGroupType {
  return { combinator: 'or', rules }
}

interface EnumOptionLike {
  id?: string | null;
  name?: string | null;
}

function normalizeEnumName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
}

function containsNormalizedPhrase(value: string, phrase: string): boolean {
  return ` ${value} `.includes(` ${phrase} `)
}

export function findEnumIdByName(
  options: ReadonlyArray<EnumOptionLike>,
  names: ReadonlyArray<string>
): string | undefined {
  const normalizedNames = names.map(normalizeEnumName)

  for (const name of normalizedNames) {
    const exact = options.find(
      option => option.id && normalizeEnumName(option.name ?? '') === name
    )

    if (exact?.id) return exact.id
  }

  for (const name of normalizedNames) {
    const partial = options.find((option) => {
      if (!option.id) return false

      const optionName = normalizeEnumName(option.name ?? '')

      return (
        containsNormalizedPhrase(optionName, name) ||
        containsNormalizedPhrase(name, optionName)
      )
    })

    if (partial?.id) return partial.id
  }

  return undefined
}

export function equalsFilter(
  field: string,
  value: string | undefined
): RuleGroupType | undefined {
  if (!value) return undefined

  return andFilter([{ field, operator: '=', value }])
}

export function inFilter(
  field: string,
  values: ReadonlyArray<string | undefined>
): RuleGroupType | undefined {
  const resolved = values.filter((value): value is string => Boolean(value))

  if (resolved.length === 0) return undefined

  return andFilter([{ field, operator: 'in', value: resolved }])
}

export function numberGreaterThanFilter(
  field: string,
  value: number
): RuleGroupType {
  return andFilter([{ field, operator: '>', value }])
}

export function dateShortcutFilter(
  field: string,
  operator: string
): RuleGroupType {
  return andFilter([{ field, operator }])
}

export function createSystemViews(
  prefix: string,
  views: Array<SystemViewDefinition>
): Array<SavedDataGridView> {
  return views.map((view, index) => ({
    id: `${prefix}:${view.id}`,
    name: view.name,
    description: view.description,
    columnVisibility: Object.fromEntries(
      view.columns.map(column => [column, true])
    ),
    columnOrder: view.columns,
    columnPinning: { left: [], right: [] },
    sorting: view.sorting,
    filterQuery: view.filterQuery,
    /*
     * Standard pagination on by default. `isSystem` is intentionally NOT set
     * so the seeded backend copies stay editable/deletable.
     */
    pagingEnabled: true,
    pagingMode: 'standard',
    pageSize: view.pageSize ?? DATA_GRID_DEFAULT_PAGE_SIZE,
    isDefault: index === 0
  }))
}
