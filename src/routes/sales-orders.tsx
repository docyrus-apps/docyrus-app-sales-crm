import { useCallback, useMemo, useRef, useState } from 'react'

import type { ColumnDef } from '@tanstack/react-table'

import { type RowChange } from '@/components/docyrus/data-grid'

import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import { FileText, Pencil, Trash2, Upload } from 'lucide-react'

import type { BaseCrmSalesOrderEntity } from '@/collections/base_crm-sales_order.collection'

import { useBaseCrmSalesOrderCollection } from '@/collections/base_crm-sales_order.collection'
import {
  DataGrid,
  DataGridRowActions,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridActionsColumn
} from '@/components/docyrus/data-grid'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUpdateSalesOrder } from '@/hooks/use-sales-orders'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { useDocyrusDataGrid } from '@/hooks/docyrus/use-docyrus-data-grid'
import { useSeedDefaultViews } from '@/hooks/use-seed-default-views'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import { useEnumEntities } from '@/hooks/use-enums'
import { saveGridChanges } from '@/lib/data-grid-record-utils'
import {
  createSystemViews,
  equalsFilter,
  findEnumIdByName
} from '@/lib/crm-system-views'
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
  created_on: { size: 150 }
}

const SALES_ORDER_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(SALES_ORDER_GRID_COLUMN_OVERRIDES)
)

const SALES_ORDER_GRID_COLUMNS = Object.keys(SALES_ORDER_GRID_COLUMN_OVERRIDES)

export function SalesOrders() {
  const client = useDocyrusClient()

  if (!client) return null

  return <SalesOrdersPageInner client={client} />
}

function SalesOrdersPageInner({
  client
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>;
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const collection = useBaseCrmSalesOrderCollection()
  const updateOrder = useUpdateSalesOrder()
  const { formatDate, formatDateTime } = useDateFormat()
  const {
    data: salesOrderStatuses = [],
    isLoading: areSalesOrderStatusesLoading
  } = useEnumEntities('status', {
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG
  })
  const salesOrderGridViews = useMemo(() => {
    const draftStatusId = findEnumIdByName(salesOrderStatuses, ['Draft'])
    const sentStatusId = findEnumIdByName(salesOrderStatuses, ['Sent', 'Approved', 'Accepted'])

    return createSystemViews('base-crm-sales-order', [
      {
        id: 'all',
        name: 'All',
        columns: SALES_ORDER_GRID_COLUMNS,
        sorting: [{ id: 'created_on', desc: true }]
      },
      {
        id: 'draft',
        name: 'Draft',
        columns: SALES_ORDER_GRID_COLUMNS,
        sorting: [{ id: 'created_on', desc: true }],
        filterQuery: equalsFilter('status', draftStatusId)
      },
      {
        id: 'sent',
        name: 'Sent',
        columns: SALES_ORDER_GRID_COLUMNS,
        sorting: [{ id: 'last_modified_on', desc: true }],
        filterQuery: equalsFilter('status', sentStatusId)
      }
    ])
  }, [salesOrderStatuses])

  useSeedDefaultViews({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    templates: salesOrderGridViews,
    enabled: !areSalesOrderStatusesLoading,
    pruneUnlisted: true
  })

  const [pendingDelete, setPendingDelete] =
    useState<BaseCrmSalesOrderEntity | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const onView = useCallback(
    (order: BaseCrmSalesOrderEntity) => {
      if (!order.id) return

      void navigate({
        to: '/quotes/$quoteId',
        params: { quoteId: order.id }
      })
    },
    [navigate]
  )

  const onBuild = useCallback(
    (order: BaseCrmSalesOrderEntity) => {
      if (!order.id) return

      void navigate({
        to: '/quotes/$quoteId/build',
        params: { quoteId: order.id }
      })
    },
    [navigate]
  )

  const onDelete = useCallback((order: BaseCrmSalesOrderEntity) => {
    if (!order.id) return

    setPendingDelete(order)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseCrmSalesOrderEntity>>(
    () => getDataGridActionsColumn<BaseCrmSalesOrderEntity>({
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
                onSelect: onBuild
              },
              {
                key: 'open',
                label: t('common.openPage', 'Open page'),
                icon: <DocyrusIcon icon="huge sidebar-right-01" size="sm" />,
                onSelect: onView
              },
              {
                key: 'delete',
                label: t('common.delete', 'Delete'),
                icon: <Trash2 className="size-4" />,
                destructive: true,
                onSelect: onDelete
              }
            ]} />
        )
      }),
    [
onBuild,
onDelete,
onView,
t
]
  )

  const onChangesSave = useCallback(
    async (
      changes: Array<RowChange>,
      gridData: Array<BaseCrmSalesOrderEntity>
    ) => {
      await saveGridChanges(changes, gridData, (id, data) => updateOrder.mutateAsync({ orderId: id, data }))
    },
    [updateOrder]
  )

  const openWizardRef = useRef<() => void>(() => {})

  const importToolbarButton = useMemo(
    () => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => openWizardRef.current()}>
        <Upload className="size-4" />
        {t('common.import', 'Import')}
      </Button>
    ),
    [t]
  )

  const {
    table,
    gridProps,
    pagingMode,
    toolbar,
    reload,
    dataSource,
    isLoading,
    error
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
    getRowLabel: row => row.id || t('salesOrders.title'),
    mapColumn: (field, defaultColumn) => {
      if (!SALES_ORDER_GRID_VISIBLE_FIELDS.has(field.slug)) return null

      return {
        ...defaultColumn,
        ...SALES_ORDER_GRID_COLUMN_OVERRIDES[field.slug]
      }
    }
  })

  const { openWizard, wizard } = useDocyrusDataImportWizard({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    fields: dataSource?.fields,
    onImported: reload
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
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => navigate({ to: '/quotes/new', search: {} })}>
            <FileText className="size-4" />
            {t('quotes.newQuote', 'New quote')}
          </Button>
        } />
      <PageContainer className="flex min-h-0 flex-1 max-w-full flex-col overflow-hidden pb-0">
        {isLoading && (
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

        {!isLoading && !error && (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="shrink-0">{toolbar}</div>
            <div className="min-h-0 flex-1">
              <DataGrid
                table={table}
                {...gridProps}
                pagingMode={pagingMode}
                height="auto" />
            </div>
          </div>
        )}

        <RecordDeleteConfirmDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setPendingDelete(null)
          }}
          recordCount={pendingDelete ? 1 : 0}
          onConfirm={onConfirmDelete}
          isPending={isDeleting} />

        {wizard}
      </PageContainer>
    </>
  )
}
