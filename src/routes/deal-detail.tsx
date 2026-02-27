import { useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeal } from '@/hooks/use-deals'
import { useDealProducts } from '@/hooks/use-deal-products'
import { useSalesOrders } from '@/hooks/use-sales-orders'
import { DealFormDialog } from '@/components/deals/deal-form-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'

export function DealDetail() {
  const { t } = useTranslation()
  const { dealId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/deals/$dealId' })
  const navigate = useNavigate({ from: '/deals/$dealId' })
  const { data: deal, isLoading, error } = useDeal(dealId)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const orgId =
    deal?.organizations && typeof deal.organizations === 'object'
      ? deal.organizations.id
      : undefined

  const { data: dealProducts, isLoading: productsLoading } = useDealProducts(
    dealId
      ? {
          columns: [
            'id',
            'product(id,name)',
            'qty',
            'unit_price',
            'discount',
            'tax_rate',
            'total',
            'net_total',
          ],
          filters: {
            rules: [{ field: 'related_deal', operator: '=', value: dealId }],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const { data: salesOrders, isLoading: ordersLoading } = useSalesOrders(
    orgId
      ? {
          columns: ['id', 'status', 'sub_total', 'grand_total', 'created_on'],
          filters: {
            rules: [{ field: 'organization', operator: '=', value: orgId }],
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

  if (error || !deal) {
    return (
      <PageContainer>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t('common.error')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('deals.failedToLoad')}</p>
            <Link to="/deals">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('deals.backToDeals')}
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
        <Link to="/deals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('deals.backToPipeline')}
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel - Deal Summary */}
        <div className="space-y-4">
          <Card className="group">
            <CardHeader>
              <CardTitle>{t('deals.dealDetails')}</CardTitle>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  {t('deals.dealId')}
                </div>
                <div className="mt-1">{deal.id}</div>
              </div>

              {deal.stage && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('deals.stage')}
                  </div>
                  <div className="mt-1 font-medium">
                    {typeof deal.stage === 'object'
                      ? deal.stage.name
                      : deal.stage}
                  </div>
                </div>
              )}

              {deal.deal_value && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('deals.dealValue')}
                  </div>
                  <div className="mt-1 text-2xl font-bold">
                    ${deal.deal_value.toLocaleString()}
                  </div>
                </div>
              )}

              {deal.close_probability !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('deals.closeProbability')}
                  </div>
                  <div className="mt-1">{deal.close_probability}%</div>
                </div>
              )}

              {deal.expected_closing_date && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('deals.expectedClose')}
                  </div>
                  <div className="mt-1">
                    {new Date(deal.expected_closing_date).toLocaleDateString()}
                  </div>
                </div>
              )}

              {deal.hot_prospect && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2">
                  <span className="text-sm font-medium text-destructive">
                    {t('deals.hotProspect')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {deal.organizations && typeof deal.organizations === 'object' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('deals.organization')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {(deal.organizations as any).name || t('common.na')}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">
                {t('deals.tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value="products">
                {t('deals.tabs.products')}
              </TabsTrigger>
              <TabsTrigger value="orders">{t('deals.tabs.orders')}</TabsTrigger>
              <TabsTrigger value="activity">
                {t('deals.tabs.activity')}
              </TabsTrigger>
              <TabsTrigger value="comments">
                {t('deals.tabs.comments')}
              </TabsTrigger>
              <TabsTrigger value="files">{t('deals.tabs.files')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('deals.dealOverview')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('deals.customerType')}
                      </div>
                      <div className="mt-1">
                        {deal.customer_type
                          ? typeof deal.customer_type === 'object'
                            ? deal.customer_type.name
                            : deal.customer_type
                          : t('common.na')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('deals.leadSource')}
                      </div>
                      <div className="mt-1">
                        {deal.lead_source
                          ? typeof deal.lead_source === 'object'
                            ? deal.lead_source.name
                            : deal.lead_source
                          : t('common.na')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('deals.expectedRevenue')}
                      </div>
                      <div className="mt-1">
                        ${deal.expected_revenue?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('deals.owner')}
                      </div>
                      <div className="mt-1">
                        {deal.record_owner
                          ? typeof deal.record_owner === 'object'
                            ? (deal.record_owner as any).name ||
                              (deal.record_owner as any).id
                            : deal.record_owner
                          : t('common.na')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('deals.products.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : !dealProducts?.length ? (
                    <p className="text-sm text-muted-foreground">
                      {t('deals.products.empty')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dealProducts.map((item: any) => (
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
                              {t('deals.products.qty')}: {item.qty} &times; $
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
                                {t('deals.products.tax')}: {item.tax_rate}%
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('deals.orders.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : !salesOrders?.length ? (
                    <p className="text-sm text-muted-foreground">
                      {t('deals.orders.empty')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {salesOrders.map((order: any) => (
                        <Link
                          key={order.id}
                          to="/sales-orders/$orderId"
                          params={{ orderId: order.id }}
                          className="block"
                        >
                          <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">
                                {t('deals.orders.orderNumber', {
                                  id: order.id,
                                })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {typeof order.status === 'object'
                                  ? order.status.name
                                  : order.status || t('common.na')}
                                {order.created_on &&
                                  ` · ${new Date(order.created_on).toLocaleDateString()}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                ${order.grand_total?.toLocaleString() || '0'}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('deals.activity.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('deals.activity.empty')}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <CommentsPanel
                appSlug="base_crm"
                dataSource="deals"
                recordId={dealId!}
              />
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <FileAttachments
                appSlug="base_crm"
                dataSource="deals"
                recordId={dealId!}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <DealFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        deal={deal}
        mode="edit"
      />
    </PageContainer>
  )
}
