'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo, type ComponentProps } from 'react'

import { type Table } from '@tanstack/react-table'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { DATA_GRID_PAGE_SIZE_OPTIONS } from './types'

interface DataGridPaginationFooterProps<TData> extends ComponentProps<'div'> {
  table: Table<TData>
  /** Override the page-size choices. Defaults to `DATA_GRID_PAGE_SIZE_OPTIONS`. */
  pageSizeOptions?: ReadonlyArray<number>
}

export function DataGridPaginationFooter<TData>({
  table,
  pageSizeOptions = DATA_GRID_PAGE_SIZE_OPTIONS,
  className,
  ...props
}: DataGridPaginationFooterProps<TData>) {
  const { t } = useUiTranslation()
  const { pagination } = table.getState()
  /*
   * `getRowCount()` honors `manualPagination + rowCount` (server-driven
   * total) and falls back to the source data length when paging is
   * client-side. Crucially this skips the grouped row model, so group
   * headers don't inflate the "X of N" total or push the page count up.
   */
  const totalRows = table.getRowCount()
  const pageCount = Math.max(1, table.getPageCount())

  const rangeStart = useMemo(() => {
    if (totalRows === 0) return 0

    return pagination.pageIndex * pagination.pageSize + 1
  }, [pagination.pageIndex, pagination.pageSize, totalRows])

  const rangeEnd = useMemo(() => {
    if (totalRows === 0) return 0

    return Math.min(totalRows, (pagination.pageIndex + 1) * pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize, totalRows])

  return (
    <div
      data-slot="grid-pagination"
      className={cn(
        /*
         * Rendered as a sibling of the rows container; carries `rounded-b-md`
         * + side/bottom borders so the grid + footer read as one continuous
         * card. The grid drops its own bottom rounding/border when this
         * footer is active (see `data-grid.tsx`).
         */
        'flex h-10 shrink-0 items-center justify-between gap-3 rounded-b-md border bg-muted px-3 text-xs',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground tabular-nums">
          {totalRows === 0
            ? t('ui.dataGrid.pagination.empty', '0 records')
            : t('ui.dataGrid.pagination.range', '{start}–{end} of {total}')
                .replace('{start}', String(rangeStart))
                .replace('{end}', String(rangeEnd))
                .replace('{total}', String(totalRows))}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {t('ui.dataGrid.pagination.pageSize', 'Page size')}
          </span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="h-7 w-20 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('ui.dataGrid.pagination.first', 'First page')}
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.firstPage()}
        >
          <ChevronsLeftIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('ui.dataGrid.pagination.prev', 'Previous page')}
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <span className="px-2 tabular-nums text-muted-foreground">
          {t('ui.dataGrid.pagination.pageOf', '{page} / {total}')
            .replace('{page}', String(pagination.pageIndex + 1))
            .replace('{total}', String(pageCount))}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('ui.dataGrid.pagination.next', 'Next page')}
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          <ChevronRightIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('ui.dataGrid.pagination.last', 'Last page')}
          disabled={!table.getCanNextPage()}
          onClick={() => table.lastPage()}
        >
          <ChevronsRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
