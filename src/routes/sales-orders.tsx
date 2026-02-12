import { useMemo } from 'react'
import { Eye, FileText, MoreHorizontal, Trash } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDeleteSalesOrder, useSalesOrders } from '@/hooks/use-sales-orders'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { useDataTable } from '@/hooks/use-data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'

export function SalesOrders() {
  const { data: orders, isLoading } = useSalesOrders()
  const deleteOrder = useDeleteSalesOrder()

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Order #" />
        ),
        cell: ({ row }) => {
          const id = row.getValue('id')
          return (
            <Link
              to="/sales-orders/$orderId"
              params={{ orderId: id }}
              className="font-medium hover:underline"
            >
              #{id.slice(0, 8)}
            </Link>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'organization',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Organization" />
        ),
        cell: ({ row }) => {
          const org = row.getValue('organization')
          return (
            <div>
              {typeof org === 'object' && org?.name ? org.name : org || '-'}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue('status')
          const statusName =
            typeof status === 'object' && status?.name ? status.name : status
          return statusName ? (
            <Badge variant="outline">{statusName}</Badge>
          ) : (
            <span>-</span>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'sub_total',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Subtotal" />
        ),
        cell: ({ row }) => {
          const amount = row.getValue('sub_total')
          return <div>{amount ? `$${amount.toLocaleString()}` : '-'}</div>
        },
        enableSorting: true,
      },
      {
        accessorKey: 'tax_total',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Tax" />
        ),
        cell: ({ row }) => {
          const amount = row.getValue('tax_total')
          return <div>{amount ? `$${amount.toLocaleString()}` : '-'}</div>
        },
        enableSorting: true,
      },
      {
        accessorKey: 'grand_total',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Grand Total" />
        ),
        cell: ({ row }) => {
          const amount = row.getValue('grand_total')
          return (
            <div className="font-medium">
              {amount ? `$${amount.toLocaleString()}` : '-'}
            </div>
          )
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
                ? new Date(date).toLocaleDateString('en-US', {
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
      {
        id: 'actions',
        cell: ({ row }) => {
          const order = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    to="/sales-orders/$orderId"
                    params={{ orderId: order.id }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (
                      confirm(
                        'Are you sure you want to delete this sales order?',
                      )
                    ) {
                      deleteOrder.mutate(order.id)
                    }
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [deleteOrder],
  )

  const { table } = useDataTable({
    data: orders || [],
    columns,
    pageCount: -1,
  })

  return (
    <>
      <PageHeader title="Sales Orders" icon={FileText} />
      <PageContainer>
        {isLoading && <DataTableSkeleton columnCount={8} rowCount={10} />}

        {!isLoading && orders && orders.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No sales orders yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Sales orders will appear here
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && orders && orders.length > 0 && (
          <DataTable table={table} />
        )}
      </PageContainer>
    </>
  )
}
