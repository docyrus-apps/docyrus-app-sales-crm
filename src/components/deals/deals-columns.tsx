import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Badge } from '@/components/ui/badge'

export function getDealsColumns(): Array<ColumnDef<any>> {
  return [
    {
      accessorKey: 'stage',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Stage" />
      ),
      cell: ({ row }) => {
        const val = row.getValue('stage')
        const name =
          typeof val === 'object' && val?.name ? val.name : (val as string)
        return name ? <Badge variant="outline">{name}</Badge> : <span>-</span>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'deal_value',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Value" />
      ),
      cell: ({ row }) => {
        const value = row.getValue('deal_value')
        return (
          <div className="font-medium">
            {value != null ? `$${value.toLocaleString()}` : '-'}
          </div>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'expected_revenue',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Expected Revenue" />
      ),
      cell: ({ row }) => {
        const value = row.getValue('expected_revenue')
        return <div>{value != null ? `$${value.toLocaleString()}` : '-'}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'organizations',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Company" />
      ),
      cell: ({ row }) => {
        const val = row.getValue('organizations')
        const name =
          typeof val === 'object' && val?.name ? val.name : (val as string)
        return <div className="truncate max-w-xs">{name || '-'}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'contact_person',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Contact" />
      ),
      cell: ({ row }) => {
        const val = row.getValue('contact_person')
        const name =
          typeof val === 'object' && val?.name ? val.name : (val as string)
        return <div className="truncate max-w-xs">{name || '-'}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'close_probability',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Probability" />
      ),
      cell: ({ row }) => {
        const value = row.getValue('close_probability')
        return <div>{value != null ? `${value}%` : '-'}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'expected_closing_date',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Close Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('expected_closing_date')
        return (
          <div>
            {date
              ? new Date(date as string).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '-'}
          </div>
        )
      },
      enableSorting: true,
    },
  ]
}
