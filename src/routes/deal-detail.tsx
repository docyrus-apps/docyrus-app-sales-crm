import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Pencil } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
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

export function DealDetail() {
  const { dealId } = useParams({ strict: false })
  const { data: deal, isLoading, error } = useDeal(dealId)
  const [isEditOpen, setIsEditOpen] = useState(false)

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
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load deal details</p>
            <Link to="/deals">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Deals
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
            Back to Pipeline
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel - Deal Summary */}
        <div className="space-y-4">
          <Card className="group">
            <CardHeader>
              <CardTitle>Deal Details</CardTitle>
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
                  Deal ID
                </div>
                <div className="mt-1">{deal.id}</div>
              </div>

              {deal.stage && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Stage
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
                    Deal Value
                  </div>
                  <div className="mt-1 text-2xl font-bold">
                    ${deal.deal_value.toLocaleString()}
                  </div>
                </div>
              )}

              {deal.close_probability !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Close Probability
                  </div>
                  <div className="mt-1">{deal.close_probability}%</div>
                </div>
              )}

              {deal.expected_closing_date && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Expected Close
                  </div>
                  <div className="mt-1">
                    {new Date(deal.expected_closing_date).toLocaleDateString()}
                  </div>
                </div>
              )}

              {deal.hot_prospect && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2">
                  <span className="text-sm font-medium text-destructive">
                    🔥 Hot Prospect
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {deal.organizations && typeof deal.organizations === 'object' && (
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {(deal.organizations as any).name || 'N/A'}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Deal Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Customer Type
                      </div>
                      <div className="mt-1">
                        {deal.customer_type
                          ? typeof deal.customer_type === 'object'
                            ? deal.customer_type.name
                            : deal.customer_type
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Lead Source
                      </div>
                      <div className="mt-1">
                        {deal.lead_source
                          ? typeof deal.lead_source === 'object'
                            ? deal.lead_source.name
                            : deal.lead_source
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Expected Revenue
                      </div>
                      <div className="mt-1">
                        ${deal.expected_revenue?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Owner
                      </div>
                      <div className="mt-1">
                        {deal.record_owner
                          ? typeof deal.record_owner === 'object'
                            ? deal.record_owner.id
                            : deal.record_owner
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Deal Products</CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : !dealProducts?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No products added yet
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
                                : item.product || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {item.qty} &times; $
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
                                Tax: {item.tax_rate}%
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
                  <CardTitle>Related Sales Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : !salesOrders?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No orders yet
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
                                Order #{order.id}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {typeof order.status === 'object'
                                  ? order.status.name
                                  : order.status || 'N/A'}
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
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No activity yet
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Comments feature coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    File attachments coming soon
                  </p>
                </CardContent>
              </Card>
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
