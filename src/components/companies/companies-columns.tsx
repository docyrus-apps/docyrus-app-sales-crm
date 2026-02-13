import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { Eye } from 'lucide-react'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function getCompaniesColumns(): Array<ColumnDef<any>> {
  return [
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <Link
          to="/companies/$companyId"
          params={{ companyId: row.original.id }}
        >
          <Button variant="ghost" size="icon" className="size-8">
            <Eye className="size-4" />
          </Button>
        </Link>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium max-w-xs truncate">
          {row.getValue('name') || '-'}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'industry',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Industry" />
      ),
      cell: ({ row }) => {
        const val = row.getValue('industry')
        const name =
          typeof val === 'object' && val?.name ? val.name : (val as string)
        return name ? <Badge variant="secondary">{name}</Badge> : <span>-</span>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" />
      ),
      cell: ({ row }) => {
        const val = row.getValue('status')
        const name =
          typeof val === 'object' && val?.name ? val.name : (val as string)
        return name ? <Badge variant="outline">{name}</Badge> : <span>-</span>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Email" />
      ),
      cell: ({ row }) => (
        <div className="truncate max-w-xs">{row.getValue('email') || '-'}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Phone" />
      ),
      cell: ({ row }) => <div>{row.getValue('phone') || '-'}</div>,
      enableSorting: true,
    },
    {
      accessorKey: 'city',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="City" />
      ),
      cell: ({ row }) => {
        const val = row.getValue('city')
        const name =
          typeof val === 'object' && val?.name ? val.name : (val as string)
        return <div>{name || '-'}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'created_on',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Created" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('created_on')
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
