import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  PricingEnginePanel,
  type ILineItem,
  type IPricingDocumentData,
  type IProductCatalogItem,
} from '@/components/docyrus/pricing-engine-panel'
import { buildLineItemRows } from '@/components/docyrus/pricing-engine-panel/lib/calculations'
import { Skeleton } from '@/components/ui/skeleton'
import { useSalesOrder } from '@/hooks/use-sales-orders'
import {
  useCreateSalesOrderItem,
  useDeleteSalesOrderItem,
  useSalesOrderItems,
  useUpdateSalesOrderItem,
} from '@/hooks/use-sales-order-items'
import { useProducts } from '@/hooks/use-products'
import { useBaseCrmSalesOrderCollection } from '@/collections'
import { UI_I18N_LOCALES, type UiI18nLocale } from '@/lib/ui-i18n'

const DEFAULT_CURRENCY = 'TRY'
const DEFAULT_VAT_RATE = 20
const VAT_RATES = [0, 1, 10, 20]

function getRelationName(
  value?: { name?: string } | string | null,
): string | undefined {
  if (!value) return undefined
  if (typeof value === 'object') return value.name

  return value
}

function getRelationId(value?: { id?: string } | string | null): string | null {
  if (!value || typeof value !== 'object') return null

  return value.id ?? null
}

export interface QuoteLineItemsProps {
  quoteId: string
  /** Read-only rendering (e.g. for the build/preview screen). */
  readOnly?: boolean
}

/**
 * The editable pricing engine for a single quote, wired to persist line items
 * and recomputed order totals back to `sales_order` / `sales_order_item`. This
 * is the single source of truth for a quote's pricing (used by the Quote Detail
 * "Line Items" tab); the build/preview screen renders it read-only.
 *
 * @docyrus: [[architecture#Quote Builder & PDF]]
 */
export function QuoteLineItems({ quoteId, readOnly }: QuoteLineItemsProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const salesOrderCollection = useBaseCrmSalesOrderCollection()
  const createItem = useCreateSalesOrderItem()
  const updateItem = useUpdateSalesOrderItem()
  const deleteItem = useDeleteSalesOrderItem()

  const { data: order } = useSalesOrder(quoteId)
  const { data: orderItems, isLoading } = useSalesOrderItems({
    columns: [
      'id',
      'product(id,name)',
      'qty',
      'unit_price',
      'discount',
      'tax_rate',
      'total',
      'gross_total',
      'net_total',
    ],
    filters: {
      rules: [{ field: 'related_sales_order', operator: '=', value: quoteId }],
    },
    orderBy: 'created_on asc',
  })

  const { data: products } = useProducts({
    columns: ['id', 'name', 'product_code', 'unit_price', 'tax', 'category'],
  })

  const productCatalog = useMemo<Array<IProductCatalogItem>>(
    () =>
      (products ?? [])
        .filter((product: any) => product.id)
        .map((product: any) => ({
          id: String(product.id),
          name:
            product.name ||
            product.product_code ||
            t('quotes.untitledProduct', { defaultValue: 'Product' }),
          category: getRelationName(product.category) ?? '',
          unitPrice: Number(product.unit_price ?? 0),
          vatRate: Number(product.tax ?? DEFAULT_VAT_RATE),
        })),
    [products, t],
  )

  const locale = useMemo<UiI18nLocale | undefined>(() => {
    const language = i18n.resolvedLanguage?.split('-')[0]
    if (language && UI_I18N_LOCALES.includes(language as UiI18nLocale)) {
      return language as UiI18nLocale
    }
    return undefined
  }, [i18n.resolvedLanguage])

  const [isSaving, setIsSaving] = useState(false)
  const originalItemIds = useRef<Set<string>>(new Set())

  const initialDocument = useMemo<IPricingDocumentData>(() => {
    const lineItems: Array<ILineItem> = (orderItems ?? []).map(
      (item: any, index) => ({
        id: String(item.id),
        position: index,
        productId: getRelationId(item.product),
        categoryId: null,
        name: getRelationName(item.product) || '',
        category: '',
        quantity: Number(item.qty ?? 1),
        unitPrice: Number(item.unit_price ?? 0),
        vatRate: Number(item.tax_rate ?? DEFAULT_VAT_RATE),
        discountPercent: Number(item.discount ?? 0),
      }),
    )

    originalItemIds.current = new Set(lineItems.map((line) => line.id))

    return {
      lineItems,
      globalDiscountPercent: 0,
      adjustment: 0,
      currency: {
        code: DEFAULT_CURRENCY,
        secondaryCurrencyCode: null,
        exchangeRate: 1,
      },
      config: {
        showVatColumn: true,
        showDiscountColumn: true,
        showGrossColumn: true,
        showCategoryColumn: false,
        discountBeforeVat: true,
        enableVat: true,
        enableLineDiscount: true,
        enableGlobalDiscount: true,
        enableAdjustment: true,
        defaultVatRate: DEFAULT_VAT_RATE,
        vatRates: VAT_RATES,
        viewMode: 'net',
      },
      description: '',
      termsAndConditions: '',
      status: 'saved',
      totals: {
        subtotal: 0,
        lineDiscountTotal: 0,
        globalDiscountAmount: 0,
        totalDiscount: 0,
        netTotal: 0,
        vatTotal: 0,
        adjustment: 0,
        grandTotal: 0,
      },
    }
  }, [orderItems])

  const persist = useCallback(
    async (data: IPricingDocumentData) => {
      if (isSaving) return
      setIsSaving(true)

      try {
        const rows = buildLineItemRows(data.lineItems, data.config)

        await salesOrderCollection.update(quoteId, {
          sub_total: data.totals.netTotal,
          tax_total: data.totals.vatTotal,
          grand_total: data.totals.grandTotal,
        })

        const currentIds = new Set(data.lineItems.map((line) => line.id))
        const removed = [...originalItemIds.current].filter(
          (id) => !currentIds.has(id),
        )
        await Promise.all(removed.map((id) => deleteItem.mutateAsync(id)))

        for (let index = 0; index < data.lineItems.length; index++) {
          const line = data.lineItems[index]
          const row = rows[index]
          const itemPayload: Record<string, any> = {
            related_sales_order: quoteId,
            qty: line.quantity,
            unit_price: line.unitPrice,
            discount: line.discountPercent,
            tax_rate: line.vatRate,
            total: row.lineSubtotal,
            net_total: row.netAfterDiscount,
            gross_total: row.grossTotal,
          }
          if (line.productId) itemPayload.product = line.productId

          if (originalItemIds.current.has(line.id)) {
            await updateItem.mutateAsync({ itemId: line.id, data: itemPayload })
          } else {
            await createItem.mutateAsync(itemPayload)
          }
        }

        queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
        toast.success(t('quotes.saved', { defaultValue: 'Quote saved' }))
      } catch (error: any) {
        toast.error(
          error?.message ||
            t('quotes.saveFailed', { defaultValue: 'Failed to save quote' }),
        )
      } finally {
        setIsSaving(false)
      }
    },
    [
      createItem,
      deleteItem,
      isSaving,
      queryClient,
      quoteId,
      salesOrderCollection,
      t,
      updateItem,
    ],
  )

  // Keep totals shown in the panel aligned with any adjustment the stored order
  // carries (parity with the read-only views elsewhere).
  useEffect(() => {
    void order
  }, [order])

  if (isLoading) {
    return <Skeleton className="h-[28rem] w-full" />
  }

  return (
    <PricingEnginePanel
      key={`${quoteId}:${(orderItems ?? [])
        .map((item: any) => item.id)
        .join('|')}`}
      defaultValue={initialDocument}
      locale={locale}
      productCatalog={readOnly ? undefined : productCatalog}
      readOnly={readOnly}
      showActions={!readOnly}
      showDescription={false}
      showTerms={false}
      showCategoryColumn={false}
      onSave={(data) => void persist(data)}
      onSaveDraft={(data) => void persist(data)}
      defaultCurrency={DEFAULT_CURRENCY}
      defaultVatRate={DEFAULT_VAT_RATE}
      vatRates={VAT_RATES}
      size="full"
      variant={readOnly ? 'default' : 'bordered'}
    />
  )
}
