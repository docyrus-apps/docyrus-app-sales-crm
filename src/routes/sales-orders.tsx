import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FileText, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { RowChange } from '@/components/docyrus/data-grid'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridSelectColumn,
  useDataGrid,
} from '@/components/docyrus/data-grid'
import { DataGridStandardToolbar } from '@/components/docyrus/data-grid-standard-toolbar'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { getDataGridRowActionsColumn } from '@/components/docyrus/data-grid-row-actions-column'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import {
  useCreateSalesOrder,
  useDeleteSalesOrder,
  useSalesOrders,
  useUpdateSalesOrder,
} from '@/hooks/use-sales-orders'
import { Card, CardContent } from '@/components/ui/card'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'

export function SalesOrders() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: orders, isLoading } = useSalesOrders()
  const createOrder = useCreateSalesOrder()
  const deleteOrder = useDeleteSalesOrder()
  const updateOrder = useUpdateSalesOrder()
  const [deleteTargets, setDeleteTargets] = useState<Array<any>>([])

  const onView = (order: any) => {
    if (!order?.id) return

    void navigate({
      to: '/sales-orders/$orderId',
      params: { orderId: order.id },
    })
  }

  const onDuplicate = async (order: any) => {
    const payload = buildDuplicatePayload(order)
    await createOrder.mutateAsync(payload)
  }

  const onDeleteRequest = (rows: Array<any>) => {
    if (rows.length === 0) return

    setDeleteTargets(rows)
  }

  const onDeleteConfirm = async () => {
    const ids = deleteTargets
      .map((row) => row?.id)
      .filter(Boolean) as Array<string>

    await Promise.all(ids.map((id) => deleteOrder.mutateAsync(id)))
    setDeleteTargets([])
  }

  const onChangesSave = async (
    changes: Array<RowChange>,
    gridData: Array<any>,
  ) => {
    await saveGridChanges(changes, gridData, (id, data) =>
      updateOrder.mutateAsync({ orderId: id, data }),
    )
  }

  const columns = useMemo<Array<ColumnDef<any>>>(() => {
    const baseColumns: Array<ColumnDef<any>> = [
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
    ]

    return [
      getDataGridSelectColumn<any>(),
      getDataGridRowActionsColumn<any>({
        onView,
        onEdit: onView,
        onDuplicate,
        onDelete: (row) => onDeleteRequest([row]),
      }),
      ...baseColumns,
    ]
  }, [t])

  const { table, ...dataGridProps } = useDataGrid({
    data: orders || [],
    columns,
    getRowId: (row: any) => row.id,
    readOnly: false,
    enableGrouping: true,
    enableChangeTracking: true,
    onChangesSave,
  })

  return (
    <>
      <PageHeader
        title={t('salesOrders.title')}
        icon={<FileText className="h-4 w-4 text-red-500" />}
      />
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
          <>
            <DataGridStandardToolbar
              table={table}
              searchPlaceholder={t('common.search', 'Search...')}
            />
            <DataGrid
              table={table}
              {...dataGridProps}
              height={600}
              actions={[
                {
                  label: t('common.delete'),
                  icon: <Trash2 className="size-4" />,
                  variant: 'destructive',
                  onAction: onDeleteRequest,
                },
              ]}
            />
          </>
        )}

        <RecordDeleteConfirmDialog
          open={deleteTargets.length > 0}
          onOpenChange={(open) => {
            if (!open) setDeleteTargets([])
          }}
          recordCount={deleteTargets.length}
          onConfirm={onDeleteConfirm}
          isPending={deleteOrder.isPending}
        />
      </PageContainer>
    </>
  )
}
