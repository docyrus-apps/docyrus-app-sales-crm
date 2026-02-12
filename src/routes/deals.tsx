import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { DollarSign, Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useDeals } from '@/hooks/use-deals'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DealFormDialog } from '@/components/deals/deal-form-dialog'

export function Deals() {
  const { data: deals, isLoading, error } = useDeals()
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Deals"
        icon={DollarSign}
        actions={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        }
      />
      <PageContainer>
        <DealFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          mode="create"
        />

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                Error loading deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {deals && deals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">No deals yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first deal to get started
              </p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Deal
              </Button>
            </CardContent>
          </Card>
        )}

        {deals && deals.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal: any) => (
              <Link
                key={deal.id}
                to="/deals/$dealId"
                params={{ dealId: deal.id }}
              >
                <Card className="transition-all hover:shadow-md cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Deal #{deal.id.slice(0, 8)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {deal.stage && (
                      <p className="text-sm text-muted-foreground">
                        Stage:{' '}
                        {typeof deal.stage === 'object'
                          ? deal.stage.name
                          : deal.stage}
                      </p>
                    )}
                    <p className="text-sm font-medium mt-2">
                      $
                      {deal.deal_value?.toLocaleString() ||
                        deal.expected_revenue?.toLocaleString() ||
                        0}
                    </p>
                    {deal.organizations &&
                      typeof deal.organizations === 'object' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {deal.organizations.name}
                        </p>
                      )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  )
}
