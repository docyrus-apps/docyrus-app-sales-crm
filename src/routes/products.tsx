import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal, Package, Pencil, Plus, Trash } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useDeleteProduct, useProducts } from '@/hooks/use-products'
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
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('products.columns.productCode')}
          />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('product_code')}</div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('products.columns.name')}
          />
        ),
        cell: ({ row }) => {
          const id = row.getValue('id')
          return <div>{id}</div>
        },
        enableSorting: true,
      },
      {
        accessorKey: 'category',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('products.columns.category')}
          />
        ),
        cell: ({ row }) => {
          const category = row.getValue('category')
          return (
            <div>
              {typeof category === 'object' && category?.name
                ? category.name
                : category || '-'}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'Unit',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('products.columns.unit')}
          />
        ),
        cell: ({ row }) => {
          const unit = row.getValue('Unit')
          return (
            <div>
              {typeof unit === 'object' && unit?.name ? unit.name : unit || '-'}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'unit_price',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('products.columns.unitPrice')}
          />
        ),
        cell: ({ row }) => {
          const price = row.getValue('unit_price')
          return (
            <div className="font-medium">
              {price ? `$${price.toLocaleString()}` : '-'}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'tax',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('products.columns.tax')}
          />
        ),
        cell: ({ row }) => {
          const tax = row.getValue('tax')
          return <div>{tax ? `${tax}%` : '-'}</div>
        },
        enableSorting: true,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const product = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t('common.openMenu')}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingProduct(product)
                    setIsFormOpen(true)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(t('products.confirmDelete'))) {
                      deleteProduct.mutate(product.id)
                    }
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [deleteProduct, t],
  )

  const { table } = useDataTable({
    data: products || [],
    columns,
    pageCount: -1,
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

        {isLoading && <DataTableSkeleton columnCount={7} rowCount={10} />}

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
          <DataTable table={table} />
        )}
      </PageContainer>
    </>
  )
}
