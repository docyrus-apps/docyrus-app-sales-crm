'use client'

import { type ColumnDef } from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'

interface GetDataTableSelectColumnOptions<TData> extends Omit<
  Partial<ColumnDef<TData>>,
  'id' | 'header' | 'cell'
> {
  enableRowNumbers?: boolean
}

export function getDataTableSelectColumn<TData>({
  size = 44,
  enableHiding = false,
  enableSorting = false,
  enableRowNumbers = false,
  ...props
}: GetDataTableSelectColumnOptions<TData> = {}): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row, table }) => {
      const isSelected = row.getIsSelected()

      if (enableRowNumbers && !isSelected) {
        const { rows } = table.getRowModel()
        const rowIndex = rows.findIndex((item) => item.id === row.id)

        return (
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded-sm text-xs tabular-nums text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Select row"
            onClick={() => row.toggleSelected(true)}
          >
            {rowIndex + 1}
          </button>
        )
      }

      return (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      )
    },
    size,
    minSize: size,
    enableHiding,
    enableSorting,
    ...props,
  }
}
