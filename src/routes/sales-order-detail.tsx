import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSalesOrder } from '@/hooks/use-sales-orders'
import { useSalesOrderItems } from '@/hooks/use-sales-order-items'

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
            'net_total',
          ],
          filters: {
            rules: [
              {
                field: 'related_sales_order',
                operator: '=',
                value: orderId,
              },
            ],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
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
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !lineItems?.length ? (
              <p className="text-sm text-muted-foreground">
                {t('salesOrders.noLineItems')}
              </p>
            ) : (
              <div className="space-y-3">
                {lineItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {typeof item.product === 'object'
                          ? item.product.name
                          : item.product || t('common.na')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {typeof item.category === 'object'
                          ? item.category.name
                          : item.category || ''}
                        {item.category ? ' · ' : ''}
                        {t('salesOrders.qty')}: {item.qty} &times; $
                        {item.unit_price?.toLocaleString()}
                        {item.discount ? ` (-${item.discount}%)` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        $
                        {item.net_total?.toLocaleString() ??
                          item.total?.toLocaleString() ??
                          '0'}
                      </div>
                      {item.tax_rate != null && (
                        <div className="text-sm text-muted-foreground">
                          {t('salesOrders.tax')}: {item.tax_rate}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('salesOrders.orderTotals')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                {t('salesOrders.subtotal')}
              </span>
              <span className="font-medium">
                ${order.sub_total?.toLocaleString() || '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                {t('salesOrders.taxTotal')}
              </span>
              <span className="font-medium">
                ${order.tax_total?.toLocaleString() || '0.00'}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">
                {t('salesOrders.grandTotal')}
              </span>
              <span className="text-lg font-bold">
                ${order.grand_total?.toLocaleString() || '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
