import { Link } from '@tanstack/react-router'
import { Eye } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function getContactsColumns(): Array<ColumnDef<any>> {
  return [
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <Link to="/contacts/$contactId" params={{ contactId: row.original.id }}>
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
      accessorKey: 'job_title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Job Title" />
      ),
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue('job_title') || '-'}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'organization',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Organization" />
      ),
      cell: ({ row }) => {
        const val = row.getValue('organization')
        const name =
          typeof val === 'object' && val?.name ? val.name : (val as string)
        return name ? <Badge variant="secondary">{name}</Badge> : <span>-</span>
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
      accessorKey: 'mobile',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Mobile" />
      ),
      cell: ({ row }) => <div>{row.getValue('mobile') || '-'}</div>,
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
