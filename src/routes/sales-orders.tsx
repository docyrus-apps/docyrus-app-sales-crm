import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import { FileText, Pencil, Trash2, Upload } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import type { BaseCrmSalesOrderEntity } from '@/collections/base_crm-sales_order.collection'
import { useBaseCrmSalesOrderCollection } from '@/collections/base_crm-sales_order.collection'
import {
  DataGrid,
  DataGridRowActions,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridActionsColumn,
  type RowChange,
} from '@/components/docyrus/data-grid'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ViewSwitcher, type ViewType } from '@/components/view-switcher'
import { useUpdateSalesOrder } from '@/hooks/use-sales-orders'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { useDocyrusDataGrid } from '@/hooks/use-docyrus-data-grid'
import { useSeedDefaultViews } from '@/hooks/use-seed-default-views'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import { saveGridChanges } from '@/lib/data-grid-record-utils'
import { createSystemViews } from '@/lib/crm-system-views'
import { useDateFormat } from '@/lib/use-date-format'

const APP_SLUG = 'base_crm'
const DATA_SOURCE_SLUG = 'sales_order'

const SALES_ORDER_GRID_COLUMN_OVERRIDES: Record<
  string,
  Partial<ColumnDef<BaseCrmSalesOrderEntity>>
> = {
  organization: { size: 220 },
  status: { size: 150 },
  sub_total: { size: 140 },
  tax_total: { size: 140 },
  grand_total: { size: 150 },
  created_on: { size: 150 },
}

const SALES_ORDER_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(SALES_ORDER_GRID_COLUMN_OVERRIDES),
)

const SALES_ORDER_GRID_COLUMNS = Object.keys(SALES_ORDER_GRID_COLUMN_OVERRIDES)

const SALES_ORDER_GRID_SYSTEM_VIEWS = createSystemViews(
  'base-crm-sales-order',
  [
    {
      id: 'all',
      name: 'All',
      columns: SALES_ORDER_GRID_COLUMNS,
      sorting: [{ id: 'created_on', desc: true }],
    },
  ],
)

export function SalesOrders() {
  const client = useDocyrusClient()

  if (!client) return null

  return <SalesOrdersPageInner client={client} />
}

function SalesOrdersPageInner({
  client,
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const collection = useBaseCrmSalesOrderCollection()
  const updateOrder = useUpdateSalesOrder()
  const { formatDate, formatDateTime } = useDateFormat()

  useSeedDefaultViews({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    templates: SALES_ORDER_GRID_SYSTEM_VIEWS,
    pruneUnlisted: true,
  })

  const [pendingDelete, setPendingDelete] =
    useState<BaseCrmSalesOrderEntity | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('list')

  const onView = useCallback(
    (order: BaseCrmSalesOrderEntity) => {
      if (!order.id) return

      void navigate({
        to: '/quotes/$quoteId',
        params: { quoteId: order.id },
      })
    },
    [navigate],
  )

  const onBuild = useCallback(
    (order: BaseCrmSalesOrderEntity) => {
      if (!order.id) return

      void navigate({
        to: '/quotes/$quoteId/build',
        params: { quoteId: order.id },
      })
    },
    [navigate],
  )

  const onDelete = useCallback((order: BaseCrmSalesOrderEntity) => {
    if (!order.id) return

    setPendingDelete(order)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseCrmSalesOrderEntity>>(
    () =>
      getDataGridActionsColumn<BaseCrmSalesOrderEntity>({
        actionCount: 2,
        cell: ({ row }) => (
          <DataGridRowActions
            row={row.original}
            openPageLabel={t('salesOrders.viewOrder', 'View order')}
            actionsLabel={t('common.actions', 'Actions')}
            onOpenPage={onView}
            actions={[
              {
                key: 'build',
                label: t('quotes.openBuilder', 'Open builder'),
                icon: <Pencil className="size-4" />,
                onSelect: onBuild,
              },
              {
                key: 'open',
                label: t('common.openPage', 'Open page'),
                icon: <DocyrusIcon icon="huge sidebar-right-01" size="sm" />,
                onSelect: onView,
              },
              {
                key: 'delete',
                label: t('common.delete', 'Delete'),
                icon: <Trash2 className="size-4" />,
                destructive: true,
                onSelect: onDelete,
              },
            ]}
          />
        ),
      }),
    [onBuild, onDelete, onView, t],
  )

  const onChangesSave = useCallback(
    async (
      changes: Array<RowChange>,
      gridData: Array<BaseCrmSalesOrderEntity>,
    ) => {
      await saveGridChanges(changes, gridData, (id, data) =>
        updateOrder.mutateAsync({ orderId: id, data }),
      )
    },
    [updateOrder],
  )

  const openWizardRef = useRef<() => void>(() => {})

  const importToolbarButton = useMemo(
    () => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => openWizardRef.current()}
      >
        <Upload className="size-4" />
        {t('common.import', 'Import')}
      </Button>
    ),
    [t],
  )

  const {
    table,
    gridProps,
    pagingMode,
    toolbar,
    items: orders,
    reload,
    dataSource,
    isLoading,
    error,
  } = useDocyrusDataGrid<BaseCrmSalesOrderEntity>({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    collection,
    actionsColumn,
    formatDate,
    formatDateTime,
    readOnly: false,
    trackChanges: true,
    onSaveChanges: onChangesSave,
    bulkActions: ['delete'],
    enableServerExportMenu: true,
    searchPlaceholder: t('common.search', 'Search...'),
    toolbarEndContent: importToolbarButton,
    getRowLabel: (row) => row.id || t('salesOrders.title'),
    mapColumn: (field, defaultColumn) => {
      if (!SALES_ORDER_GRID_VISIBLE_FIELDS.has(field.slug)) return null

      return {
        ...defaultColumn,
        ...SALES_ORDER_GRID_COLUMN_OVERRIDES[field.slug],
      }
    },
  })

  const { openWizard, wizard } = useDocyrusDataImportWizard({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    fields: dataSource?.fields,
    onImported: reload,
  })

  openWizardRef.current = openWizard

  const onConfirmDelete = useCallback(async () => {
    if (!pendingDelete?.id) return

    setIsDeleting(true)

    try {
      await collection.delete(pendingDelete.id)
      setPendingDelete(null)
      reload()
    } finally {
      setIsDeleting(false)
    }
  }, [collection, pendingDelete, reload])

  return (
    <>
      <PageHeader
        title={t('quotes.title')}
        icon={<FileText className="h-4 w-4 text-red-500" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => navigate({ to: '/quotes/new', search: {} })}
            >
              <FileText className="size-4" />
              {t('quotes.newQuote', 'New quote')}
            </Button>
            <ViewSwitcher
              value={viewType}
              onValueChange={setViewType}
              options={['card', 'list']}
            />
          </div>
        }
      />
      <PageContainer>
        {isLoading && viewType === 'card' && (
          <div className="space-y-4">
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
          </div>
        )}

        {isLoading && viewType === 'list' && (
          <DataGridSkeleton>
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        )}

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t('salesOrders.failedToLoad', 'Unable to load sales orders')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && orders.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">
                {t('salesOrders.emptyTitle')}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('salesOrders.emptyDescription')}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && orders.length > 0 && viewType === 'card' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to="/quotes/$quoteId"
                params={{ quoteId: order.id! }}
              >
                <Card className="cursor-pointer transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {order.id || t('salesOrders.title')}
                        </CardTitle>
                        {order.status && (
                          <Badge variant="secondary" className="mt-1">
                            {typeof order.status === 'object'
                              ? order.status.name
                              : String(order.status)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {order.organization && (
                      <p className="text-xs text-muted-foreground">
                        {typeof order.organization === 'object'
                          ? order.organization.name
                          : order.organization}
                      </p>
                    )}
                    {typeof order.sub_total === 'number' && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('salesOrders.columns.subtotal')}: {order.sub_total}
                      </p>
                    )}
                    {typeof order.tax_total === 'number' && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('salesOrders.columns.tax')}: {order.tax_total}
                      </p>
                    )}
                    {typeof order.grand_total === 'number' && (
                      <p className="mt-1 text-xs font-medium text-foreground">
                        {t('salesOrders.columns.grandTotal')}:{' '}
                        {order.grand_total}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && !error && orders.length > 0 && viewType === 'list' && (
          <div className="space-y-4">
            {toolbar}
            <DataGrid
              table={table}
              {...gridProps}
              pagingMode={pagingMode}
              height={600}
            />
          </div>
        )}

        <RecordDeleteConfirmDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setPendingDelete(null)
          }}
          recordCount={pendingDelete ? 1 : 0}
          onConfirm={onConfirmDelete}
          isPending={isDeleting}
        />

        {wizard}
      </PageContainer>
    </>
  )
}
