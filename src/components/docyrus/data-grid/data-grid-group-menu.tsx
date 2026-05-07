'use client'

import { useCallback, useMemo, type ComponentProps } from 'react'

import { type Column, type Table } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { isColumnGroupable } from './lib/data-grid-grouping'

interface DataGridGroupMenuProps<TData> extends ComponentProps<
  typeof SelectContent
> {
  table: Table<TData>
  disabled?: boolean
  /**
   * Column id used as the default row-grouping column. When provided, the
   * matching option is annotated with a `Default` badge — matching the
   * editor's Row Grouping section. Forwarded by `useDocyrusDataGrid` from
   * the `defaultRowGroupingColumn` config that travels with the data view
   * select wiring.
   */
  defaultRowGroupingColumn?: string
}

function getColumnLabel<TData>(column: Column<TData, unknown>): string {
  const label = column.columnDef.meta?.label

  if (label) return label

  const { header } = column.columnDef

  if (typeof header === 'string') return header

  return column.id
}

export function DataGridGroupMenu<TData>({
  table,
  disabled,
  defaultRowGroupingColumn,
  ...props
}: DataGridGroupMenuProps<TData>) {
  const { t } = useUiTranslation()
  const { grouping } = table.getState()

  /*
   * Recompute on every render: `table` is a stable ref so a memo keyed on
   * `[table]` would cache an empty list when this menu mounts before the
   * data source's field columns are added. Filtering a small array is
   * cheap, so we just do it inline.
   */
  const groupableColumns = table.getAllLeafColumns().filter(isColumnGroupable)

  const groupedColumnId = grouping[0]
  const hasCurrentGrouping = groupableColumns.some(
    (column) => column.id === groupedColumnId,
  )
  const value = hasCurrentGrouping && groupedColumnId ? groupedColumnId : 'none'

  const selectedLabel = useMemo(() => {
    if (value === 'none') return t('ui.dataGrid.noGrouping', 'No grouping')
    const selectedColumn = groupableColumns.find(
      (column) => column.id === value,
    )

    return selectedColumn
      ? getColumnLabel(selectedColumn)
      : t('ui.dataGrid.noGrouping', 'No grouping')
  }, [groupableColumns, value, t])

  const onValueChange = useCallback(
    (nextValue: string) => {
      if (nextValue === 'none') {
        table.setGrouping([])
        table.setExpanded({})

        return
      }

      table.setGrouping([nextValue])
      table.setExpanded(true)
    },
    [table],
  )

  const isDisabled = disabled || groupableColumns.length === 0

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isDisabled}>
      <SelectTrigger size="sm" className="h-8 w-45 bg-background">
        <SelectValue placeholder={t('ui.dataGrid.groupRows', 'Group rows')}>
          {selectedLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent {...props}>
        <SelectItem value="none">
          {t('ui.dataGrid.noGrouping', 'No grouping')}
        </SelectItem>
        {groupableColumns.map((column) => {
          const isDefault = column.id === defaultRowGroupingColumn

          return (
            <SelectItem key={column.id} value={column.id}>
              <span className="flex items-center gap-2">
                <span>{getColumnLabel(column)}</span>
                {isDefault && (
                  <Badge variant="secondary" className="text-[10px]">
                    {t('ui.dataGrid.default', 'Default')}
                  </Badge>
                )}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
