'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type CSSProperties,
  isValidElement,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'

import { type VariantProps, cva } from 'class-variance-authority'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  type Column,
  type DataTableFilterActions,
  type FilterModel,
  type FilterStrategy,
  type FiltersState,
  type OptionBasedColumnDataType,
} from '@/components/docyrus/data-table-filter/core/types'
import { type Locale } from '@/components/docyrus/data-table-filter/lib/i18n'

import { SideFilterActiveChips } from './components/side-filter-active-chips'
import { SideFilterClear } from './components/side-filter-clear'
import { SideFilterSearch } from './components/side-filter-search'
import { SideFilterSection } from './components/side-filter-section'
import { SideFilterAsyncOptions } from './controllers/side-filter-async-options'
import { SideFilterBoolean } from './controllers/side-filter-boolean'
import { SideFilterCheckboxList } from './controllers/side-filter-checkbox-list'
import { SideFilterDateRange } from './controllers/side-filter-date-range'
import { SideFilterNumericRange } from './controllers/side-filter-numeric-range'
import { SideFilterOptionsDropdown } from './controllers/side-filter-options-dropdown'
import { SideFilterText } from './controllers/side-filter-text'
import {
  type SideFilterDefaults,
  type SideFilterSectionGroup,
} from './core/types'
import { resolveSideFilterRenderMode } from './lib/render-mode'
export interface DataTableSideFiltersProps<TData> extends VariantProps<
  typeof dataTableSideFiltersVariants
> {
  columns: Array<Column<TData>>
  filters: FiltersState
  actions: DataTableFilterActions
  strategy: FilterStrategy
  defaults?: SideFilterDefaults
  sections?: ReadonlyArray<SideFilterSectionGroup>
  locale?: Locale
  className?: string
  /** Inline style applied to the root container (panel or rail). */
  style?: CSSProperties
  /** Header title. Pass `null` to hide. */
  title?: ReactNode
  /** Show the active-filter chip strip below the header. Default true. */
  showActiveChips?: boolean
  /** Show "Clear all" button next to the title when any filter is active. Default true. */
  showClearAll?: boolean
  /**
   * When `true`, renders a search input above the sections that drives the
   * first `text`-typed column. Pass a column id to drive a specific one.
   */
  searchable?: boolean | string
  /** Optional override for "Clear all" text. */
  clearAllLabel?: string
  /** Optional override for per-section "Clear" text. */
  clearLabel?: string
  /**
   * When `true`, the panel can be toggled between expanded and collapsed.
   * In collapsed mode it renders a thin vertical rail with a 90°-rotated
   * label that re-expands the panel; the expanded state shows a panel-close
   * icon at the top right. Default `false`.
   */
  collapsible?: boolean
  /** Controlled expanded state. Pair with `onExpandedChange`. */
  expanded?: boolean
  /** Uncontrolled initial expanded state. Default `true`. */
  defaultExpanded?: boolean
  /** Called when the user toggles the collapse/expand control. */
  onExpandedChange?: (expanded: boolean) => void
  /** Width of the collapsed rail (number → px). Default `36`. */
  collapsedWidth?: number | string
  /** Label rendered (rotated 90°) on the collapsed rail. Defaults to `title`, then `'Filters'`. */
  expandLabel?: ReactNode
  /** Override for the collapse-button accessible label. Default `'Collapse filters'`. */
  collapseAriaLabel?: string
  /** Override for the expand-button accessible label. Default `'Expand filters'`. */
  expandAriaLabel?: string
}

interface RenderControllerArgs<TData> {
  column: Column<TData>
  filter: FilterModel | undefined
  actions: DataTableFilterActions
  defaults: SideFilterDefaults | undefined
  locale: Locale
}

function renderController<TData>({
  column,
  filter,
  actions,
  defaults,
  locale,
}: RenderControllerArgs<TData>): ReactNode {
  const columnDefaults = defaults?.[column.id]
  const mode = resolveSideFilterRenderMode(column, {
    defaults: columnDefaults,
  })

  switch (mode) {
    case 'text-input':
      return (
        <SideFilterText
          column={column as Column<TData, 'text'>}
          filter={filter as FilterModel<'text'> | undefined}
          actions={actions}
          locale={locale}
        />
      )

    case 'boolean':
      return (
        <SideFilterBoolean
          column={column as Column<TData, 'boolean'>}
          filter={filter as FilterModel<'boolean'> | undefined}
          actions={actions}
          locale={locale}
        />
      )

    case 'numeric-range':
      return (
        <SideFilterNumericRange
          column={column as Column<TData, 'number'>}
          filter={filter as FilterModel<'number'> | undefined}
          actions={actions}
          locale={locale}
        />
      )

    case 'date':

    case 'date-range':
      return (
        <SideFilterDateRange
          column={column as Column<TData, 'date'>}
          filter={filter as FilterModel<'date'> | undefined}
          actions={actions}
          locale={locale}
        />
      )

    case 'inline-checkbox':
      return (
        <SideFilterCheckboxList
          column={column as Column<TData, OptionBasedColumnDataType>}
          filter={filter as FilterModel<OptionBasedColumnDataType> | undefined}
          actions={actions}
          locale={locale}
          threshold={columnDefaults?.showMoreThreshold}
        />
      )

    case 'dropdown-chips': {
      const optColumn = column as Column<TData, OptionBasedColumnDataType>

      if (optColumn.asyncOptions) {
        return (
          <SideFilterAsyncOptions
            column={optColumn}
            filter={
              filter as FilterModel<OptionBasedColumnDataType> | undefined
            }
            actions={actions}
            locale={locale}
          />
        )
      }

      return (
        <SideFilterOptionsDropdown
          column={optColumn}
          filter={filter as FilterModel<OptionBasedColumnDataType> | undefined}
          actions={actions}
          locale={locale}
        />
      )
    }

    default:
      return null
  }
}

function activeCountFor(filter: FilterModel | undefined): number {
  if (!filter) return 0
  if (filter.values.length === 0) {
    return filter.operator === 'is empty' || filter.operator === 'is not empty'
      ? 1
      : 0
  }
  if (filter.type === 'option' || filter.type === 'multiOption') {
    return filter.values.length
  }

  return 1
}

interface BuiltSection<TData> {
  id: string
  title: ReactNode
  withDivider?: boolean
  columns: Array<Column<TData>>
}

function buildSections<TData>(
  columns: Array<Column<TData>>,
  defaults: SideFilterDefaults | undefined,
  sections: ReadonlyArray<SideFilterSectionGroup> | undefined,
): Array<BuiltSection<TData>> {
  const visible = columns.filter((c) => {
    const colDef = defaults?.[c.id]

    return !colDef?.hidden
  })

  const stickyIds = new Set(
    visible.filter((c) => defaults?.[c.id]?.sticky).map((c) => c.id),
  )

  if (!sections || sections.length === 0) {
    const sticky = visible.filter((c) => stickyIds.has(c.id))
    const rest = visible.filter((c) => !stickyIds.has(c.id))

    return [
      ...(sticky.length > 0
        ? [
            {
              id: '__sticky',
              title: null,
              columns: sticky,
              withDivider: false,
            } as BuiltSection<TData>,
          ]
        : []),
      { id: '__main', title: null, columns: rest },
    ]
  }

  const byId = new Map(visible.map((c) => [c.id, c]))
  const used = new Set<string>()
  const grouped: Array<BuiltSection<TData>> = []

  for (const group of sections) {
    const cols: Array<Column<TData>> = []

    for (const id of group.columnIds) {
      const col = byId.get(id)

      if (!col) continue
      cols.push(col)
      used.add(id)
    }

    if (cols.length === 0) continue
    grouped.push({
      id: group.id,
      title: group.title,
      columns: cols,
      withDivider: group.withDivider !== false,
    })
  }

  const leftovers = visible.filter((c) => !used.has(c.id))

  if (leftovers.length > 0) {
    grouped.push({ id: '__other', title: 'Other', columns: leftovers })
  }

  return grouped
}

export function DataTableSideFilters<TData>({
  columns,
  filters,
  actions,
  strategy: _strategy,
  defaults,
  sections,
  locale = 'en',
  className,
  style,
  variant,
  title = 'Filters',
  showActiveChips = true,
  showClearAll = true,
  searchable = false,
  clearAllLabel = 'Clear all',
  clearLabel = 'Clear',
  collapsible = false,
  expanded,
  defaultExpanded = true,
  onExpandedChange,
  collapsedWidth = 36,
  expandLabel,
  collapseAriaLabel = 'Collapse filters',
  expandAriaLabel = 'Expand filters',
}: DataTableSideFiltersProps<TData>) {
  const filterByColumn = useMemo(() => {
    const map = new Map<string, FilterModel>()

    for (const f of filters) map.set(f.columnId, f)

    return map
  }, [filters])

  const built = useMemo(
    () => buildSections(columns, defaults, sections),
    [columns, defaults, sections],
  )

  const searchColumnId = useMemo<string | null>(() => {
    if (!searchable) return null
    if (typeof searchable === 'string') return searchable

    return columns.find((c) => c.type === 'text')?.id ?? null
  }, [searchable, columns])

  const removeColumnFilter = useCallback(
    (columnId: string) => actions.removeFilter(columnId),
    [actions],
  )

  const activeFilterCount = filters.filter((f) => activeCountFor(f) > 0).length

  const [internalExpanded, setInternalExpanded] =
    useState<boolean>(defaultExpanded)
  const isControlled = expanded !== undefined
  const isExpanded = collapsible
    ? isControlled
      ? expanded
      : internalExpanded
    : true

  const setExpanded = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalExpanded(next)
      onExpandedChange?.(next)
    },
    [isControlled, onExpandedChange],
  )

  if (collapsible && !isExpanded) {
    const railWidth =
      typeof collapsedWidth === 'number'
        ? `${collapsedWidth}px`
        : collapsedWidth
    const railLabel =
      expandLabel ?? (typeof title === 'string' ? title : null) ?? 'Filters'

    return (
      <aside
        data-slot="docyrus-side-filters-rail"
        className={cn(
          'flex h-full flex-col items-center border-r bg-card',
          className,
        )}
        style={{ ...style, width: railWidth }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={expandAriaLabel}
          onClick={() => setExpanded(true)}
          className="mt-2 size-7 shrink-0"
        >
          <PanelLeftOpen className="size-4" />
        </Button>
        <button
          type="button"
          aria-label={expandAriaLabel}
          onClick={() => setExpanded(true)}
          className="mt-2 flex flex-1 items-center justify-center text-xs font-medium tracking-wide text-muted-foreground hover:text-foreground"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          <span className="px-1 py-2 select-none">
            {railLabel}
            {activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
          </span>
        </button>
      </aside>
    )
  }

  return (
    <aside
      className={cn(dataTableSideFiltersVariants({ variant }), className)}
      style={style}
    >
      {(title || (showClearAll && activeFilterCount > 0) || collapsible) && (
        <header className="mb-2 flex items-center justify-between gap-2">
          {title && (
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          )}
          <div className="flex items-center gap-1">
            {showClearAll && (
              <SideFilterClear
                count={activeFilterCount}
                onClick={actions.removeAllFilters}
                label={clearAllLabel}
              />
            )}
            {collapsible && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={collapseAriaLabel}
                onClick={() => setExpanded(false)}
                className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            )}
          </div>
        </header>
      )}

      {searchColumnId && (
        <div className="mb-3">
          <SideFilterSearch
            columnId={searchColumnId}
            columns={columns}
            filters={filters}
            actions={actions}
            locale={locale}
          />
        </div>
      )}

      {showActiveChips && activeFilterCount > 0 && (
        <div className="mb-3">
          <SideFilterActiveChips
            filters={filters}
            columns={columns}
            actions={actions}
            clearAllLabel={clearAllLabel}
          />
        </div>
      )}

      <div className="flex flex-col">
        {built.map((section) => (
          <div
            key={section.id}
            className={cn(
              section.title !== null &&
                section.withDivider !== false &&
                'mt-2 border-t border-border/60 pt-2',
            )}
          >
            {section.title !== null && (
              <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h4>
            )}
            {section.columns.map((column) => {
              if (column.id === searchColumnId) return null
              const colDef = defaults?.[column.id]
              const filter = filterByColumn.get(column.id)
              const Icon = column.icon
              const sectionTitle = colDef?.title ?? column.displayName
              const iconNode = Icon ? (
                isValidElement(Icon) ? (
                  Icon
                ) : (
                  <Icon className="size-4" />
                )
              ) : null

              return (
                <SideFilterSection
                  key={column.id}
                  id={column.id}
                  title={sectionTitle}
                  icon={iconNode}
                  activeCount={activeCountFor(filter)}
                  defaultCollapsed={colDef?.collapsed ?? false}
                  onClear={() => removeColumnFilter(column.id)}
                  clearLabel={clearLabel}
                >
                  {renderController({
                    column,
                    filter,
                    actions,
                    defaults,
                    locale,
                  })}
                </SideFilterSection>
              )
            })}
          </div>
        ))}
      </div>
    </aside>
  )
}

DataTableSideFilters.displayName = 'DataTableSideFilters'

export const dataTableSideFiltersVariants = cva(
  'flex w-full flex-col text-sm',
  {
    variants: {
      variant: {
        default: '',
        bordered: 'rounded-lg border bg-card p-4 shadow-sm',
        compact: 'gap-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)
