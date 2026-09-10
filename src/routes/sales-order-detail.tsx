import { useMemo } from 'react'

import { type ILineItem } from '@/components/docyrus/pricing-engine-panel'

import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PricingEnginePanel } from '@/components/docyrus/pricing-engine-panel'
import {
  bankersRound,
  buildLineItemRows,
  calculateTotals
} from '@/components/docyrus/pricing-engine-panel/lib/calculations'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSalesOrder } from '@/hooks/use-sales-orders'
import { useSalesOrderItems } from '@/hooks/use-sales-order-items'
import { useUiLocale } from '@/hooks/use-ui-locale'
import { useSetDetailBreadcrumbTitle } from '@/lib/detail-breadcrumb'

function getRelationName(
  value?: { name?: string } | string | null
): string | undefined {
  if (!value) return undefined
  if (typeof value === 'object') return value.name

  return value
}

function getRelationId(value?: { id?: string } | string | null): string | null {
  if (!value || typeof value !== 'object') return null

  return value.id ?? null
}

export function SalesOrderDetail() {
  const { t } = useTranslation()
  const { orderId } = useParams({ strict: false })
  const { data: order, isLoading, error } = useSalesOrder(orderId)

  const { data: lineItems, isLoading: itemsLoading } = useSalesOrderItems(
    orderId
      ? {
          columns: [
            'id',
            'product(id,name)',
            'category',
            'qty',
            'unit_price',
            'discount',
            'tax_rate',
            'total',
            'gross_total',
            'net_total'
          ],
          filters: {
            rules: [
              {
                field: 'related_sales_order',
                operator: '=',
                value: orderId
              }
            ]
          },
          orderBy: 'created_on asc'
        }
      : undefined
  )

  const locale = useUiLocale()

  const pricingDocument = useMemo(() => {
    const pricingLineItems: Array<ILineItem> = (lineItems ?? []).map(
      (item: any, index) => ({
        id: item.id,
        position: index,
        productId: getRelationId(item.product),
        categoryId: getRelationId(item.category),
        name: getRelationName(item.product) || t('common.na'),
        category: getRelationName(item.category) || '',
        quantity: Number(item.qty ?? 0),
        unitPrice: Number(item.unit_price ?? 0),
        vatRate: Number(item.tax_rate ?? 0),
        discountPercent: Number(item.discount ?? 0)
      })
    )

    const enableVat =
      pricingLineItems.some(item => item.vatRate > 0) ||
      Number(order?.tax_total ?? 0) > 0

    const vatRates = Array.from(
      new Set(
        pricingLineItems
          .map(item => item.vatRate)
          .filter(rate => Number.isFinite(rate))
      )
    ).sort((left, right) => left - right)

    if (vatRates.length === 0) {
      vatRates.push(0)
    }

    const config = {
      showVatColumn: enableVat,
      showDiscountColumn: pricingLineItems.some(
        item => item.discountPercent > 0
      ),
      showGrossColumn: true,
      showCategoryColumn: pricingLineItems.some(
        item => item.category.length > 0
      ),
      discountBeforeVat: true,
      enableVat,
      enableLineDiscount: true,
      enableGlobalDiscount: false,
      enableAdjustment: false,
      defaultVatRate: vatRates[vatRates.length - 1] ?? 0,
      vatRates,
      viewMode: 'net' as const
    }

    const calculatedTotals = calculateTotals(
      buildLineItemRows(pricingLineItems, config),
      0,
      0,
      config
    )

    const adjustment = bankersRound(
      Number(order?.grand_total ?? 0) - calculatedTotals.grandTotal
    )

    const hasAdjustment = adjustment !== 0

    return {
      lineItems: pricingLineItems,
      globalDiscountPercent: 0,
      adjustment,
      currency: {
        code: 'USD',
        secondaryCurrencyCode: null,
        exchangeRate: 1
      },
      config: {
        ...config,
        enableAdjustment: hasAdjustment
      },
      description: '',
      termsAndConditions: '',
      status: 'saved' as const,
      totals: {
        ...calculatedTotals,
        adjustment,
        grandTotal: bankersRound(calculatedTotals.grandTotal + adjustment)
      }
    }
  }, [
lineItems,
order?.grand_total,
order?.tax_total,
t
])

  useSetDetailBreadcrumbTitle(
    order ? t('salesOrders.salesOrderTitle', { id: order.id }) : null
  )

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    )
  }

  if (error || !order) {
    return (
      <PageContainer>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t('common.error')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('salesOrders.failedToLoad')}</p>
            <Link to="/sales-orders">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('salesOrders.backToOrders')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link to="/sales-orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('salesOrders.backToSalesOrders')}
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {t('salesOrders.salesOrderTitle', { id: order.id })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {order.organization && typeof order.organization === 'object' && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('salesOrders.organization')}
                  </div>
                  <div className="mt-1 font-medium">
                    {(order.organization as any).name || t('common.na')}
                  </div>
                </div>
              )}

              {order.status && typeof order.status === 'object' && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('salesOrders.status')}
                  </div>
                  <div className="mt-1">
                    {order.status.name || t('common.na')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('salesOrders.lineItems')}</CardTitle>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <Skeleton className="h-[32rem] w-full" />
            ) : (
              <PricingEnginePanel
                value={pricingDocument}
                defaultValue={pricingDocument}
                title={t('salesOrders.salesOrderTitle', { id: order.id })}
                locale={locale}
                readOnly
                showActions={false}
                showDescription={false}
                showTerms={false}
                showVatColumn={pricingDocument.config.showVatColumn}
                showDiscountColumn={pricingDocument.config.showDiscountColumn}
                showGrossColumn={pricingDocument.config.showGrossColumn}
                showCategoryColumn={pricingDocument.config.showCategoryColumn}
                discountBeforeVat={pricingDocument.config.discountBeforeVat}
                enableVat={pricingDocument.config.enableVat}
                enableLineDiscount={pricingDocument.config.enableLineDiscount}
                enableGlobalDiscount={pricingDocument.config.enableGlobalDiscount}
                enableAdjustment={pricingDocument.config.enableAdjustment}
                defaultVatRate={pricingDocument.config.defaultVatRate}
                vatRates={pricingDocument.config.vatRates}
                defaultCurrency={pricingDocument.currency.code}
                viewMode={pricingDocument.config.viewMode}
                size="full"
                variant="bordered" />
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
