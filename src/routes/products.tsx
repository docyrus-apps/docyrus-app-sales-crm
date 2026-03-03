import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Package, Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  useDataGrid,
} from '@/components/docyrus/data-grid'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { useDeleteProduct, useProducts } from '@/hooks/use-products'
import { ProductFormDialog } from '@/components/products/product-form-dialog'
import { Card, CardContent } from '@/components/ui/card'

export function Products() {
  const { t } = useTranslation()
  const { data: products, isLoading } = useProducts()
  const deleteProduct = useDeleteProduct()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
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
    ],
    [t],
  )

  const { table, ...dataGridProps } = useDataGrid({
    data: products || [],
    columns,
    getRowId: (row: any) => row.id,
    readOnly: true,
    actions: [
      {
        label: t('common.edit'),
        onAction: (rows) => {
          if (rows.length === 1) {
            setEditingProduct(rows[0])
            setIsFormOpen(true)
          }
        },
      },
      {
        label: t('common.delete'),
        variant: 'destructive',
        onAction: (rows) => {
          if (confirm(t('products.confirmDelete'))) {
            rows.forEach((row: any) => deleteProduct.mutate(row.id))
          }
        },
      },
    ],
  })

  return (
    <>
      <PageHeader
        title={t('products.title')}
        actions={
          <Button
            onClick={() => {
              setEditingProduct(null)
              setIsFormOpen(true)
            }}
          >
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
            if (!open) setEditingProduct(null)
          }}
          mode={editingProduct ? 'edit' : 'create'}
          product={editingProduct}
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
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingProduct(null)
                  setIsFormOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('products.createProduct')}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && products && products.length > 0 && (
          <DataGrid table={table} {...dataGridProps} height={600} />
        )}
      </PageContainer>
    </>
  )
}
