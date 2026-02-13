import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { DollarSign, Plus } from 'lucide-react'
import type { ViewType } from '@/components/view-switcher'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useDeals } from '@/hooks/use-deals'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DealFormDialog } from '@/components/deals/deal-form-dialog'
import { ViewSwitcher } from '@/components/view-switcher'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { useDataTable } from '@/hooks/use-data-table'
import { getDealsColumns } from '@/components/deals/deals-columns'
import { DealsKanbanView } from '@/components/deals/deals-kanban-view'

export function Deals() {
  const { data: deals, isLoading, error } = useDeals()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('list')

  const columns = useMemo(() => getDealsColumns(), [])
  const { table } = useDataTable({
    data: deals || [],
    columns,
    pageCount: -1,
  })

  return (
    <>
      <PageHeader
        title="Deals"
        icon={DollarSign}
        actions={
          <>
            <ViewSwitcher value={viewType} onValueChange={setViewType} />
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
          </>
        }
      />
      <PageContainer
        className={viewType === 'kanban' ? 'max-w-full overflow-x-auto' : ''}
      >
        <DealFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          mode="create"
        />

        {isLoading && viewType === 'card' && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {isLoading && viewType === 'list' && (
          <DataTableSkeleton columnCount={7} rowCount={10} />
        )}

        {isLoading && viewType === 'kanban' && (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-80 shrink-0" />
            ))}
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

        {deals && deals.length > 0 && viewType === 'card' && (
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

        {deals && deals.length > 0 && viewType === 'list' && (
          <DataTable table={table} />
        )}

        {deals && deals.length > 0 && viewType === 'kanban' && (
          <DealsKanbanView deals={deals} />
        )}
      </PageContainer>
    </>
  )
}
