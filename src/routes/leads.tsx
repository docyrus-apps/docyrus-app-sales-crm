import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useLeads } from '@/hooks/use-leads'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LeadFormDialog } from '@/components/leads/lead-form-dialog'
import { ViewSwitcher, type ViewType } from '@/components/view-switcher'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { useDataTable } from '@/hooks/use-data-table'
import { getLeadsColumns } from '@/components/leads/leads-columns'
import { LeadsKanbanView } from '@/components/leads/leads-kanban-view'

export function Leads() {
  const { data: leads, isLoading, error } = useLeads()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('card')

  const columns = useMemo(() => getLeadsColumns(), [])
  const { table } = useDataTable({
    data: leads || [],
    columns,
    pageCount: -1,
  })

  return (
    <>
      <PageHeader
        title="Leads"
        icon={Users}
        center={
          <ViewSwitcher value={viewType} onValueChange={setViewType} />
        }
        actions={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        }
      />
      <PageContainer
        className={viewType === 'kanban' ? 'max-w-full overflow-x-auto' : ''}
      >
        <LeadFormDialog
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
                Error loading leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {leads && leads.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">No leads yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first lead to start tracking
              </p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Lead
              </Button>
            </CardContent>
          </Card>
        )}

        {leads && leads.length > 0 && viewType === 'card' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead: any) => (
              <Link
                key={lead.id}
                to="/leads/$leadId"
                params={{ leadId: lead.id }}
              >
                <Card className="transition-all hover:shadow-md cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {lead.title || `Lead #${lead.id.slice(0, 8)}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lead.company_name && (
                      <p className="text-sm font-medium">
                        {typeof lead.company_name === 'object'
                          ? lead.company_name.name
                          : lead.company_name}
                      </p>
                    )}
                    {lead.lead_status && (
                      <Badge variant="outline" className="mt-2">
                        {typeof lead.lead_status === 'object'
                          ? lead.lead_status.name
                          : lead.lead_status}
                      </Badge>
                    )}
                    {lead.lead_source && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Source:{' '}
                        {typeof lead.lead_source === 'object'
                          ? lead.lead_source.name
                          : lead.lead_source}
                      </p>
                    )}
                    {lead.email && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {lead.email}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {leads && leads.length > 0 && viewType === 'list' && (
          <DataTable table={table} />
        )}

        {leads && leads.length > 0 && viewType === 'kanban' && (
          <LeadsKanbanView leads={leads} />
        )}
      </PageContainer>
    </>
  )
}
