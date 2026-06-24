import { useCallback, useMemo, useRef, useState } from 'react'

import type { ColumnDef } from '@tanstack/react-table'

import { type RowChange } from '@/components/docyrus/data-grid'

import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import { Package, Pencil, Plus, Trash2, Upload } from 'lucide-react'

import type { BaseCrmProductEntity } from '@/collections/base_crm-product.collection'

import { useBaseCrmProductCollection } from '@/collections/base_crm-product.collection'
import { Button as MotionButton } from '@/components/animate-ui/components/buttons/button'
import { ProductFormDialog } from '@/components/products/product-form-dialog'
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
import { useUpdateProduct } from '@/hooks/use-products'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { useDocyrusDataGrid } from '@/hooks/docyrus/use-docyrus-data-grid'
import { useSeedDefaultViews } from '@/hooks/use-seed-default-views'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import { saveGridChanges } from '@/lib/data-grid-record-utils'
import {
  createSystemViews,
  numberGreaterThanFilter
} from '@/lib/crm-system-views'
import { useDateFormat } from '@/lib/use-date-format'

const APP_SLUG = 'base_crm'
const DATA_SOURCE_SLUG = 'product'

type ProductFormMode = 'create' | 'edit'

type ProductFormRecord = BaseCrmProductEntity | Record<string, unknown>

interface ProductDialogState {
  mode: ProductFormMode;
  product: ProductFormRecord | null;
}

const PRODUCT_GRID_COLUMN_OVERRIDES: Record<
  string,
  Partial<ColumnDef<BaseCrmProductEntity>>
> = {
  product_code: { size: 180 },
  category: { size: 180 },
  Unit: { size: 130 },
  unit_price: { size: 140 },
  tax: { size: 110 }
}

const PRODUCT_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(PRODUCT_GRID_COLUMN_OVERRIDES)
)

const PRODUCT_GRID_COLUMNS = Object.keys(PRODUCT_GRID_COLUMN_OVERRIDES)

const PRODUCT_GRID_SYSTEM_VIEWS = createSystemViews('base-crm-product', [
  {
    id: 'all',
    name: 'All',
    columns: PRODUCT_GRID_COLUMNS,
    sorting: [{ id: 'product_code', desc: false }]
  },
  {
    id: 'priced',
    name: 'Priced',
    columns: PRODUCT_GRID_COLUMNS,
    sorting: [{ id: 'unit_price', desc: true }],
    filterQuery: numberGreaterThanFilter('unit_price', 0)
  },
  {
    id: 'taxed',
    name: 'Taxed',
    columns: PRODUCT_GRID_COLUMNS,
    sorting: [{ id: 'tax', desc: true }],
    filterQuery: numberGreaterThanFilter('tax', 0)
  }
])

export function Products() {
  const client = useDocyrusClient()

  if (!client) return null

  return <ProductsPageInner client={client} />
}

function ProductsPageInner({
  client
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>;
}) {
  const { t } = useTranslation()
  const collection = useBaseCrmProductCollection()
  const updateProduct = useUpdateProduct()
  const { formatDate, formatDateTime } = useDateFormat()

  useSeedDefaultViews({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    templates: PRODUCT_GRID_SYSTEM_VIEWS,
    pruneUnlisted: true
  })

  const [dialog, setDialog] = useState<ProductDialogState | null>(null)
  const [pendingDelete, setPendingDelete] =
    useState<BaseCrmProductEntity | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const onOpenCreate = useCallback(() => {
    setDialog({ mode: 'create', product: null })
  }, [])

  const onOpenEdit = useCallback((product: BaseCrmProductEntity) => {
    setDialog({ mode: 'edit', product })
  }, [])

  const onCloseDialog = useCallback(() => {
    setDialog(null)
  }, [])

  const onDelete = useCallback((product: BaseCrmProductEntity) => {
    if (!product.id) return

    setPendingDelete(product)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseCrmProductEntity>>(
    () => getDataGridActionsColumn<BaseCrmProductEntity>({
        actionCount: 2,
        cell: ({ row }) => (
          <DataGridRowActions
            row={row.original}
            openPageLabel={t('products.openProduct', 'Open product')}
            actionsLabel={t('common.actions', 'Actions')}
            onOpenPage={onOpenEdit}
            actions={[
              {
                key: 'edit',
                label: t('common.edit', 'Edit'),
                icon: <Pencil className="size-4" />,
                onSelect: onOpenEdit
              },
              {
                key: 'open',
                label: t('common.openPage', 'Open page'),
                icon: <DocyrusIcon icon="huge sidebar-right-01" size="sm" />,
                onSelect: onOpenEdit
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
    [onDelete, onOpenEdit, t]
  )

  const onChangesSave = useCallback(
    async (
      changes: Array<RowChange>,
      gridData: Array<BaseCrmProductEntity>
    ) => {
      await saveGridChanges(changes, gridData, (id, data) => updateProduct.mutateAsync({ productId: id, data }))
    },
    [updateProduct]
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
  } = useDocyrusDataGrid<BaseCrmProductEntity>({
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
    getRowLabel: row => row.product_code || row.id || t('products.title'),
    mapColumn: (field, defaultColumn) => {
      if (!PRODUCT_GRID_VISIBLE_FIELDS.has(field.slug)) return null

      return {
        ...defaultColumn,
        ...PRODUCT_GRID_COLUMN_OVERRIDES[field.slug]
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
        title={t('products.title')}
        icon={<Package className="h-4 w-4 text-lime-600" />}
        actions={
          <MotionButton size="sm" onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('products.newProduct')}
          </MotionButton>
        } />
      <PageContainer className="flex min-h-0 flex-1 max-w-full flex-col overflow-hidden pb-0">
        {dialog && (
          <ProductFormDialog
            open
            onOpenChange={(open) => {
              if (!open) onCloseDialog()
            }}
            mode={dialog.mode}
            product={dialog.product ?? undefined}
            onSubmitSuccess={reload} />
        )}

        {isLoading && (
          <DataGridSkeleton>
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        )}

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t('products.errorLoading', 'Unable to load products')}
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
