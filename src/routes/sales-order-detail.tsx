import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSalesOrder } from '@/hooks/use-sales-orders'

export function SalesOrderDetail() {
  const { orderId } = useParams({ strict: false })
  const { data: order, isLoading, error } = useSalesOrder(orderId)

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
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load order details</p>
            <Link to="/sales-orders">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
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
            Back to Sales Orders
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Order #{order.id}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {order.organization && typeof order.organization === 'object' && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Organization
                  </div>
                  <div className="mt-1 font-medium">
                    {(order.organization as any).name || 'N/A'}
                  </div>
                </div>
              )}

              {order.status && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Status
                  </div>
                  <div className="mt-1">{order.status}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No line items yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                ${order.sub_total?.toLocaleString() || '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tax</span>
              <span className="font-medium">
                ${order.tax_total?.toLocaleString() || '0.00'}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Grand Total</span>
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
