import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Package, Plus, Trash2 } from 'lucide-react'
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
import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from '@/hooks/use-products'
import { ProductFormDialog } from '@/components/products/product-form-dialog'
import { Card, CardContent } from '@/components/ui/card'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'

export function Products() {
  const { t } = useTranslation()
  const { data: products, isLoading } = useProducts()
  const deleteProduct = useDeleteProduct()
  const updateProduct = useUpdateProduct()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [activeProduct, setActiveProduct] = useState<any>(null)
  const [deleteTargets, setDeleteTargets] = useState<Array<any>>([])

  const onOpenCreate = () => {
    setFormMode('create')
    setActiveProduct(null)
    setIsFormOpen(true)
  }

  const onOpenEdit = (product: any) => {
    setFormMode('edit')
    setActiveProduct(product)
    setIsFormOpen(true)
  }

  const onDuplicate = (product: any) => {
    setFormMode('create')
    setActiveProduct(buildDuplicatePayload(product))
    setIsFormOpen(true)
  }

  const onDeleteRequest = (rows: Array<any>) => {
    if (rows.length === 0) return

    setDeleteTargets(rows)
  }

  const onDeleteConfirm = async () => {
    const ids = deleteTargets
      .map((row) => row?.id)
      .filter(Boolean) as Array<string>

    await Promise.all(ids.map((id) => deleteProduct.mutateAsync(id)))
    setDeleteTargets([])
  }

  const onChangesSave = async (
    changes: Array<RowChange>,
    gridData: Array<any>,
  ) => {
    await saveGridChanges(changes, gridData, (id, data) =>
      updateProduct.mutateAsync({ productId: id, data }),
    )
  }

  const columns = useMemo<Array<ColumnDef<any>>>(() => {
    const baseColumns: Array<ColumnDef<any>> = [
      {
        accessorKey: 'product_code',
        header: t('products.columns.productCode'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 140,
      },
      {
        accessorKey: 'id',
        header: t('products.columns.name'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 180,
      },
      {
        id: 'category',
        accessorFn: (row) =>
          typeof row.category === 'object'
            ? (row.category?.name ?? '')
            : (row.category ?? ''),
        header: t('products.columns.category'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 150,
      },
      {
        id: 'Unit',
        accessorFn: (row) =>
          typeof row.Unit === 'object'
            ? (row.Unit?.name ?? '')
            : (row.Unit ?? ''),
        header: t('products.columns.unit'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 100,
      },
      {
        accessorKey: 'unit_price',
        header: t('products.columns.unitPrice'),
        meta: { cell: { variant: 'currency' } },
        enableSorting: true,
        size: 130,
      },
      {
        accessorKey: 'tax',
        header: t('products.columns.tax'),
        meta: { cell: { variant: 'percent' } },
        enableSorting: true,
        size: 100,
      },
    ]

    return [
      getDataGridSelectColumn<any>(),
      getDataGridRowActionsColumn<any>({
        onView: onOpenEdit,
        onEdit: onOpenEdit,
        onDuplicate,
        onDelete: (row) => onDeleteRequest([row]),
      }),
      ...baseColumns,
    ]
  }, [t])

  const { table, ...dataGridProps } = useDataGrid({
    data: products || [],
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
        title={t('products.title')}
        icon={<Package className="h-4 w-4 text-lime-600" />}
        actions={
          <Button size="sm" onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('products.newProduct')}
          </Button>
        }
      />
      <PageContainer>
        <ProductFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)
            if (!open) {
              setActiveProduct(null)
              setFormMode('create')
            }
          }}
          mode={formMode}
          product={activeProduct ?? undefined}
        />

        {isLoading && (
          <DataGridSkeleton>
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        )}

        {!isLoading && products && products.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t('products.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('products.emptyDescription')}
              </p>
              <Button className="mt-4" onClick={onOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('products.createProduct')}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && products && products.length > 0 && (
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
          isPending={deleteProduct.isPending}
        />
      </PageContainer>
    </>
  )
}
