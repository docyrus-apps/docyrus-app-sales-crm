// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

import { type RuleGroupType } from 'react-querybuilder'

import {
  type ColumnConfig,
  type ColumnDataType,
  type FilterModel,
  type FiltersState,
} from '@/components/docyrus/data-table-filter/core/types'

/**
 * How a single column's filter is rendered in the side panel. Resolved per
 * column via `lib/render-mode.ts`. `auto` lets the resolver pick.
 */
export type SideFilterRenderMode =
  | 'auto'
  | 'text-input'
  | 'inline-checkbox'
  | 'dropdown-chips'
  | 'date'
  | 'date-range'
  | 'numeric-range'
  | 'boolean'

export interface SideFilterColumnDefaults {
  mode?: SideFilterRenderMode
  /** Threshold above which inline-checkbox lists collapse behind a "Show more" button. */
  showMoreThreshold?: number
  /** Section starts collapsed when true. */
  collapsed?: boolean
  /** Pin the section above all unpinned sections. */
  sticky?: boolean
  /** Override the section title. Defaults to `column.displayName`. */
  title?: ReactNode
  /** Hide this column from the side panel completely. */
  hidden?: boolean
}

export type SideFilterDefaults = Record<string, SideFilterColumnDefaults>

/**
 * Optional grouping. When supplied, sections are rendered grouped under
 * named headings; columns not listed here fall under an "Other" group at
 * the bottom.
 */
export interface SideFilterSectionGroup {
  id: string
  title: ReactNode
  columnIds: ReadonlyArray<string>
  /** Render the group with a divider above its title. Default true. */
  withDivider?: boolean
}

export type SideFilterCombinator = 'and' | 'or'

/**
 * Maps DataTableFilter operator strings to whatever operator vocabulary
 * the consumer's QueryBuilder rules speak. The default map produces
 * conventional `react-querybuilder` operators (`=`, `!=`, `<`, `>`,
 * `between`, `in`, etc.); pass a custom one to keep DTF strings verbatim
 * or to align with a back-end-specific dialect.
 */
export type SideFilterOperatorMap = {
  [T in ColumnDataType]: Partial<Record<FilterModel<T>['operator'], string>>
}

export interface SideFilterTranslatorContext {
  combinator: SideFilterCombinator
  operatorMap: SideFilterOperatorMap
}

export type {
  ColumnConfig,
  ColumnDataType,
  FilterModel,
  FiltersState,
  RuleGroupType,
}
