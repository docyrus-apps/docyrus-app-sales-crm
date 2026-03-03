import { useMemo } from 'react'
import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  useDataGrid,
} from '@/components/docyrus/data-grid'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { useDeleteSalesOrder, useSalesOrders } from '@/hooks/use-sales-orders'
import { Card, CardContent } from '@/components/ui/card'

export function SalesOrders() {
  const { t } = useTranslation()
  const { data: orders, isLoading } = useSalesOrders()
  const deleteOrder = useDeleteSalesOrder()

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'id',
        header: t('salesOrders.columns.orderNumber'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 140,
      },
      {
        id: 'organization',
        accessorFn: (row) =>
          typeof row.organization === 'object'
            ? (row.organization?.name ?? '')
            : (row.organization ?? ''),
        header: t('salesOrders.columns.organization'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 200,
      },
      {
        id: 'status',
        accessorFn: (row) =>
          typeof row.status === 'object'
            ? (row.status?.name ?? '')
            : (row.status ?? ''),
        header: t('salesOrders.columns.status'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 130,
      },
      {
        accessorKey: 'sub_total',
        header: t('salesOrders.columns.subtotal'),
        meta: { cell: { variant: 'currency' } },
        enableSorting: true,
        size: 130,
      },
      {
        accessorKey: 'tax_total',
        header: t('salesOrders.columns.tax'),
        meta: { cell: { variant: 'currency' } },
        enableSorting: true,
        size: 120,
      },
      {
        accessorKey: 'grand_total',
        header: t('salesOrders.columns.grandTotal'),
        meta: { cell: { variant: 'currency' } },
        enableSorting: true,
        size: 140,
      },
      {
        accessorKey: 'created_on',
        header: t('salesOrders.columns.created'),
        meta: { cell: { variant: 'date' } },
        enableSorting: true,
        size: 130,
      },
    ],
    [t],
  )

  const { table, ...dataGridProps } = useDataGrid({
    data: orders || [],
    columns,
    getRowId: (row: any) => row.id,
    readOnly: true,
    actions: [
      {
        label: t('common.delete'),
        variant: 'destructive',
        onAction: (rows) => {
          if (confirm(t('salesOrders.confirmDelete'))) {
            rows.forEach((row: any) => deleteOrder.mutate(row.id))
          }
        },
      },
    ],
  })

  return (
    <>
      <PageHeader title={t('salesOrders.title')} />
      <PageContainer>
        {isLoading && (
          <DataGridSkeleton>
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        )}

        {!isLoading && orders && orders.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {t('salesOrders.emptyTitle')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('salesOrders.emptyDescription')}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && orders && orders.length > 0 && (
          <DataGrid table={table} {...dataGridProps} height={600} />
        )}
      </PageContainer>
    </>
  )
}
