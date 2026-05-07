import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import {
  Copy,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import type { BaseCrmProductEntity } from '@/collections/base_crm-product.collection'
import { useBaseCrmProductCollection } from '@/collections/base_crm-product.collection'
import { Button as MotionButton } from '@/components/animate-ui/components/buttons/button'
import { ProductFormDialog } from '@/components/products/product-form-dialog'
import {
  DataGrid,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ViewSwitcher, type ViewType } from '@/components/view-switcher'
import { useUpdateProduct } from '@/hooks/use-products'
import { useDocyrusDataGrid } from '@/hooks/use-docyrus-data-grid'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'
import { useDateFormat } from '@/lib/use-date-format'

const APP_SLUG = 'base_crm'
const DATA_SOURCE_SLUG = 'product'

type ProductFormMode = 'create' | 'edit'

type ProductFormRecord = BaseCrmProductEntity | Record<string, unknown>

interface ProductDialogState {
  mode: ProductFormMode
  product: ProductFormRecord | null
}

const PRODUCT_GRID_COLUMN_OVERRIDES: Record<
  string,
  Partial<ColumnDef<BaseCrmProductEntity>>
> = {
  product_code: { size: 180 },
  category: { size: 180 },
  Unit: { size: 130 },
  unit_price: { size: 140 },
  tax: { size: 110 },
}

const PRODUCT_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(PRODUCT_GRID_COLUMN_OVERRIDES),
)

export function Products() {
  const client = useDocyrusClient()

  if (!client) return null

  return <ProductsPageInner client={client} />
}

function ProductsPageInner({
  client,
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>
}) {
  const { t } = useTranslation()
  const collection = useBaseCrmProductCollection()
  const updateProduct = useUpdateProduct()
  const { formatDate, formatDateTime } = useDateFormat()

  const [dialog, setDialog] = useState<ProductDialogState | null>(null)
  const [pendingDelete, setPendingDelete] =
    useState<BaseCrmProductEntity | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('list')

  const onOpenCreate = useCallback(() => {
    setDialog({ mode: 'create', product: null })
  }, [])

  const onOpenEdit = useCallback((product: BaseCrmProductEntity) => {
    setDialog({ mode: 'edit', product })
  }, [])

  const onDuplicate = useCallback((product: BaseCrmProductEntity) => {
    setDialog({
      mode: 'create',
      product: buildDuplicatePayload(product as Record<string, unknown>),
    })
  }, [])

  const onCloseDialog = useCallback(() => {
    setDialog(null)
  }, [])

  const onDelete = useCallback((product: BaseCrmProductEntity) => {
    if (!product.id) return

    setPendingDelete(product)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseCrmProductEntity>>(
    () =>
      getDataGridActionsColumn<BaseCrmProductEntity>({
        actionCount: 2,
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5 px-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onOpenEdit(row.original)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">
                {t('products.editProduct', 'Edit product')}
              </span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">
                    {t('common.actions', 'Actions')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenEdit(row.original)}>
                  <Pencil className="size-4" />
                  {t('common.edit', 'Edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(row.original)}>
                  <Copy className="size-4" />
                  {t('common.duplicate', 'Duplicate')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(row.original)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" />
                  {t('common.delete', 'Delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }),
    [onDelete, onDuplicate, onOpenEdit, t],
  )

  const onChangesSave = useCallback(
    async (
      changes: Array<RowChange>,
      gridData: Array<BaseCrmProductEntity>,
    ) => {
      await saveGridChanges(changes, gridData, (id, data) =>
        updateProduct.mutateAsync({ productId: id, data }),
      )
    },
    [updateProduct],
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
    toolbar,
    items: products,
    reload,
    dataSource,
    isLoading,
    error,
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
    getRowLabel: (row) => row.product_code || row.id || t('products.title'),
    mapColumn: (field, defaultColumn) => {
      if (!PRODUCT_GRID_VISIBLE_FIELDS.has(field.slug)) return null

      return {
        ...defaultColumn,
        ...PRODUCT_GRID_COLUMN_OVERRIDES[field.slug],
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
        title={t('products.title')}
        icon={<Package className="h-4 w-4 text-lime-600" />}
        actions={
          <>
            <ViewSwitcher
              value={viewType}
              onValueChange={setViewType}
              options={['card', 'list']}
            />
            <MotionButton size="sm" onClick={onOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('products.newProduct')}
            </MotionButton>
          </>
        }
      />
      <PageContainer>
        {dialog && (
          <ProductFormDialog
            open
            onOpenChange={(open) => {
              if (!open) onCloseDialog()
            }}
            mode={dialog.mode}
            product={dialog.product ?? undefined}
            onSubmitSuccess={reload}
          />
        )}

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
                {t('products.errorLoading', 'Unable to load products')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && products.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">{t('products.emptyTitle')}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('products.emptyDescription')}
              </p>
              <MotionButton className="mt-4" onClick={onOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('products.createProduct')}
              </MotionButton>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && products.length > 0 && viewType === 'card' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => onOpenEdit(product)}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {product.product_code || t('products.title')}
                      </CardTitle>
                      {product.category && (
                        <Badge variant="secondary" className="mt-1">
                          {typeof product.category === 'object'
                            ? product.category.name
                            : product.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {product.Unit && (
                    <p className="text-xs text-muted-foreground">
                      {t('products.columns.unit')}:{' '}
                      {typeof product.Unit === 'object'
                        ? product.Unit.name
                        : String(product.Unit)}
                    </p>
                  )}
                  {typeof product.unit_price === 'number' && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('products.columns.unitPrice')}: {product.unit_price}
                    </p>
                  )}
                  {typeof product.tax === 'number' && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('products.columns.tax')}: %{product.tax}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !error && products.length > 0 && viewType === 'list' && (
          <div className="space-y-4">
            {toolbar}
            <DataGrid table={table} {...gridProps} height={600} />
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
