import { useMemo } from 'react'

import { Loader2, PackagePlus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { BaseCrmProductEntity } from '@/collections/base_crm-product.collection'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox-simple'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useProducts } from '@/hooks/use-products'
import { useUpdateDeal } from '@/hooks/use-deals'
import { formatCurrency } from '@/lib/formatters'

type RelationDisplayValue =
  | {
      id?: string | null;
      name?: string | null;
      product_code?: string | null;
      category?: RelationDisplayValue;
      unit_price?: number | null;
      tax?: number | null;
      Unit?: RelationDisplayValue;
    }
    | string
    | null
    | undefined

interface DealProductsPanelProps {
  dealId?: string;
  selectedProducts?: Array<RelationDisplayValue> | null;
  currencySymbol?: string;
}

function getRelationId(value: RelationDisplayValue): string | null {
  if (!value) return null
  if (typeof value === 'string') return value

  return value.id ?? null
}

function getRelationName(value: RelationDisplayValue): string | null {
  if (!value || typeof value === 'string')
    return typeof value === 'string' ? value : null

  return value.name ?? value.product_code ?? null
}

function getProductLabel(
  product?: BaseCrmProductEntity | RelationDisplayValue,
  fallbackId?: string
) {
  if (!product) return fallbackId ?? ''
  if (typeof product === 'string') return product

  const record = product as {
    id?: string | null;
    name?: string | null;
    product_code?: string | null;
  }

  return record.name ?? record.product_code ?? fallbackId ?? record.id ?? ''
}

function getProductUnitPrice(
  product?: BaseCrmProductEntity | RelationDisplayValue
) {
  if (!product || typeof product === 'string') return null
  const record = product as { unit_price?: number | null }

  if (typeof record.unit_price !== 'number') return null

  return record.unit_price
}

function getProductTax(product?: BaseCrmProductEntity | RelationDisplayValue) {
  if (!product || typeof product === 'string') return null
  const record = product as { tax?: number | null }

  if (typeof record.tax !== 'number') return null

  return record.tax
}

function getProductCategory(
  product?: BaseCrmProductEntity | RelationDisplayValue
) {
  if (!product || typeof product === 'string') return null

  return getRelationName(
    (product as { category?: RelationDisplayValue }).category
  )
}

function getProductUnit(product?: BaseCrmProductEntity | RelationDisplayValue) {
  if (!product || typeof product === 'string') return null

  return getRelationName((product as { Unit?: RelationDisplayValue }).Unit)
}

function normalizeProductIds(
  value: Array<RelationDisplayValue> | null | undefined
) {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value.map(item => getRelationId(item)).filter(Boolean) as Array<string>
    )
  )
}

export function DealProductsPanel({
  dealId,
  selectedProducts,
  currencySymbol = '$'
}: DealProductsPanelProps) {
  const { t } = useTranslation()
  const updateDeal = useUpdateDeal()
  const { data: products = [], isLoading: productsLoading } = useProducts({
    columns: [
'id',
'product_code',
'category',
'unit_price',
'tax',
'Unit'
],
    orderBy: 'product_code ASC',
    limit: 500
  })

  const selectedProductIds = useMemo(
    () => normalizeProductIds(selectedProducts),
    [selectedProducts]
  )

  const selectedRelationById = useMemo(() => {
    const map = new Map<string, RelationDisplayValue>()

    for (const item of selectedProducts ?? []) {
      const id = getRelationId(item)

      if (id) map.set(id, item)
    }

    return map
  }, [selectedProducts])

  const productById = useMemo(() => {
    const map = new Map<string, BaseCrmProductEntity>()

    for (const product of products) {
      if (product.id) map.set(String(product.id), product)
    }

    return map
  }, [products])

  const selectedRows = useMemo(
    () => selectedProductIds.map((id) => {
        const catalogProduct = productById.get(id)
        const relationProduct = selectedRelationById.get(id)
        const product = catalogProduct ?? relationProduct

        return {
          id,
          name: getProductLabel(product, id),
          category: getProductCategory(product),
          unit: getProductUnit(product),
          unitPrice: getProductUnitPrice(product),
          tax: getProductTax(product)
        }
      }),
    [productById, selectedProductIds, selectedRelationById]
  )

  const productOptions = useMemo(
    () => products
        .filter(product => product.id)
        .map(product => ({
          value: String(product.id),
          label: getProductLabel(product, String(product.id))
        })),
    [products]
  )

  const isUpdating = updateDeal.isPending

  const saveProductIds = async (nextIds: Array<string>) => {
    if (!dealId) return

    await updateDeal.mutateAsync({
      dealId,
      data: { deals_products_tags: nextIds }
    })
  }

  const handleAddProduct = (productId: string) => {
    if (!productId || selectedProductIds.includes(productId)) return

    void saveProductIds([...selectedProductIds, productId])
  }

  const handleRemoveProduct = (productId: string) => {
    void saveProductIds(selectedProductIds.filter(id => id !== productId))
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto p-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <PackagePlus className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">
              {t('deals.products.interestedTitle', {
                defaultValue: 'Interested products'
              })}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('deals.products.count', {
                count: selectedRows.length,
                defaultValue: '{{count}} products'
              })}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-80">
          <Combobox
            options={productOptions}
            value=""
            onValueChange={handleAddProduct}
            disabled={productsLoading || isUpdating || !dealId}
            disabledValues={selectedProductIds}
            placeholder={t('deals.products.addPlaceholder', {
              defaultValue: 'Add product...'
            })}
            searchPlaceholder={t('deals.products.searchPlaceholder', {
              defaultValue: 'Search products...'
            })}
            emptyText={t('deals.products.emptySearch', {
              defaultValue: 'No products found'
            })}
            contentClassName="z-50" />
        </div>
      </div>

      {productsLoading ? (
        <div className="h-40 w-full animate-pulse rounded-lg bg-muted/40" />
      ) : selectedRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 px-6 py-10 text-center">
          <p className="text-sm font-medium">
            {t('deals.products.emptyTitle', {
              defaultValue: 'No products selected'
            })}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[42%]">
                  {t('deals.products.columns.product', {
                    defaultValue: 'Product'
                  })}
                </TableHead>
                <TableHead>
                  {t('deals.products.columns.category', {
                    defaultValue: 'Category'
                  })}
                </TableHead>
                <TableHead className="text-right">
                  {t('deals.products.columns.unitPrice', {
                    defaultValue: 'List price'
                  })}
                </TableHead>
                <TableHead className="text-right">
                  {t('deals.products.columns.tax', {
                    defaultValue: 'Tax'
                  })}
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedRows.map(row => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">{row.name}</span>
                      {row.unit && (
                        <span className="text-xs text-muted-foreground">
                          {row.unit}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.category ? (
                      <Badge variant="secondary" className="rounded-md">
                        {row.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.unitPrice != null
                      ? formatCurrency(row.unitPrice, currencySymbol)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.tax != null ? `%${row.tax}` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      disabled={isUpdating}
                      onClick={() => handleRemoveProduct(row.id)}
                      aria-label={t('deals.products.removeProduct', {
                        defaultValue: 'Remove product'
                      })}>
                      {isUpdating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
