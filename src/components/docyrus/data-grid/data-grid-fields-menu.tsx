'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo, useState } from 'react'

import { type Table } from '@tanstack/react-table'
import { ListChecks, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { getColumnLabel, getManagedColumns } from './lib/view-utils'

interface DataGridFieldsMenuProps<TData> {
  table: Table<TData>
  disabled?: boolean
}

/**
 * Toggle which columns/fields are visible. In table view this hides
 * columns; in gallery view this also drops the field from each card body
 * (the gallery's `bodyFields` defaults to `visibleColumnIds`). One state
 * drives both surfaces so the user doesn't have to maintain a parallel
 * "card fields" preference next to "column visibility".
 */
export function DataGridFieldsMenu<TData>({
  table,
  disabled,
}: DataGridFieldsMenuProps<TData>) {
  const { t } = useUiTranslation()
  const [query, setQuery] = useState('')

  /*
   * Read columns fresh on every render — `useMemo([table])` locks in the
   * first render's value because TanStack returns a stable `table`
   * reference across `dataSource.fields` updates. Without this the menu
   * would stay "0/0" even after schema loads. `column.getCanHide()` is
   * dropped: the default is `true` and Docyrus columns never opt out,
   * so checking it gives the same answer at noticeable runtime cost
   * (one method call per column per render).
   */
  const columns = getManagedColumns(table)

  const filteredColumns = useMemo(() => {
    const trimmed = query.trim().toLowerCase()

    if (!trimmed) return columns

    return columns.filter((column) =>
      getColumnLabel(column).toLowerCase().includes(trimmed),
    )
  }, [columns, query])

  const visibleCount = columns.filter((column) => column.getIsVisible()).length
  const totalCount = columns.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
          aria-label={t('ui.dataGrid.fields', 'Fields')}
        >
          <ListChecks className="size-4" />
          <span>{t('ui.dataGrid.fields', 'Fields')}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {visibleCount}/{totalCount}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-72 p-2"
        data-grid-popover
      >
        <header className="mb-2 px-1">
          <h4 className="text-sm font-semibold text-foreground">
            {t('ui.dataGrid.fieldsTitle', 'Visible fields')}
          </h4>
          <p className="text-xs text-muted-foreground">
            {t(
              'ui.dataGrid.fieldsDescription',
              'Toggle which fields appear in the table and on each card.',
            )}
          </p>
        </header>

        <div className="relative mb-2">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(
              'ui.dataGrid.fieldsSearchPlaceholder',
              'Search fields…',
            )}
            className="h-8 pl-7"
            type="search"
          />
        </div>

        <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
          {filteredColumns.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              {t('ui.dataGrid.fieldsEmpty', 'No matching fields')}
            </p>
          ) : (
            filteredColumns.map((column) => {
              const isVisible = column.getIsVisible()
              const label = getColumnLabel(column)

              return (
                <Label
                  key={column.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={isVisible}
                    onCheckedChange={() => column.toggleVisibility()}
                  />
                  <span className="min-w-0 flex-1 truncate font-normal">
                    {label}
                  </span>
                </Label>
              )
            })
          )}
        </div>

        {columns.length > 0 && (
          <footer className="mt-2 flex items-center justify-between border-t pt-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                for (const column of columns) {
                  if (!column.getIsVisible()) column.toggleVisibility()
                }
              }}
            >
              {t('ui.dataGrid.fieldsShowAll', 'Show all')}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                for (const column of columns) {
                  if (column.getIsVisible()) column.toggleVisibility()
                }
              }}
            >
              {t('ui.dataGrid.fieldsHideAll', 'Hide all')}
            </Button>
          </footer>
        )}
      </PopoverContent>
    </Popover>
  )
}
