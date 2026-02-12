import { FileText, Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useSalesOrders } from '@/hooks/use-sales-orders'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function SalesOrders() {
  const { data: orders, isLoading } = useSalesOrders()

  return (
    <PageContainer>
      <PageHeader
        title="Sales Orders"
        icon={FileText}
        actions={
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        }
      />

      {isLoading && <Skeleton className="h-64 w-full" />}

      {orders && orders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">No sales orders yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first order
            </p>
          </CardContent>
        </Card>
      )}

      {orders && orders.length > 0 && (
        <div className="text-sm">Found {orders.length} orders</div>
      )}
    </PageContainer>
  )
}
