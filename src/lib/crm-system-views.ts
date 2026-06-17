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
  id: string
  name: string
  description?: string
  columns: Array<string>
  sorting?: SortingState
  filterQuery?: RuleGroupType
}

export function andFilter(rules: RuleGroupType['rules']): RuleGroupType {
  return { combinator: 'and', rules }
}

export function orFilter(rules: RuleGroupType['rules']): RuleGroupType {
  return { combinator: 'or', rules }
}

export function createSystemViews(
  prefix: string,
  views: Array<SystemViewDefinition>,
): Array<SavedDataGridView> {
  return views.map((view, index) => ({
    id: `${prefix}:${view.id}`,
    name: view.name,
    description: view.description,
    columnVisibility: Object.fromEntries(
      view.columns.map((column) => [column, true]),
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
    pageSize: DATA_GRID_DEFAULT_PAGE_SIZE,
    isDefault: index === 0,
  }))
}
