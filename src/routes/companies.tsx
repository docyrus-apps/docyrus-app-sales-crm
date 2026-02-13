import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Building2, Plus } from 'lucide-react'
import type { ViewType } from '@/components/view-switcher'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useCompanies } from '@/hooks/use-companies'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CompanyFormDialog } from '@/components/companies/company-form-dialog'
import { ViewSwitcher } from '@/components/view-switcher'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { useDataTable } from '@/hooks/use-data-table'
import { getCompaniesColumns } from '@/components/companies/companies-columns'
import { CompaniesKanbanView } from '@/components/companies/companies-kanban-view'

export function Companies() {
  const { data: companies, isLoading, error } = useCompanies()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('list')

  const columns = useMemo(() => getCompaniesColumns(), [])
  const { table } = useDataTable({
    data: companies || [],
    columns,
    pageCount: -1,
  })

  return (
    <>
      <PageHeader
        title="Companies"
        section="Records"
        actions={
          <>
            <ViewSwitcher value={viewType} onValueChange={setViewType} />
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Company
            </Button>
          </>
        }
      />
      <PageContainer
        className={viewType === 'kanban' ? 'max-w-full overflow-x-auto' : ''}
      >
        <CompanyFormDialog
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
                Error loading companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {companies && companies.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">No companies yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first company to get started
              </p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Company
              </Button>
            </CardContent>
          </Card>
        )}

        {companies && companies.length > 0 && viewType === 'card' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company: any) => (
              <Link
                key={company.id}
                to="/companies/$companyId"
                params={{ companyId: company.id }}
              >
                <Card className="transition-all hover:shadow-md cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {company.name}
                        </CardTitle>
                        {company.industry && (
                          <Badge variant="secondary" className="mt-1">
                            {typeof company.industry === 'object'
                              ? company.industry.name
                              : company.industry}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {company.status && (
                      <Badge variant="outline" className="mb-2">
                        {typeof company.status === 'object'
                          ? company.status.name
                          : company.status}
                      </Badge>
                    )}
                    {company.email && (
                      <p className="text-xs text-muted-foreground">
                        {company.email}
                      </p>
                    )}
                    {company.phone && (
                      <p className="text-xs text-muted-foreground">
                        {company.phone}
                      </p>
                    )}
                    {company.city && typeof company.city === 'object' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {company.city.name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {companies && companies.length > 0 && viewType === 'list' && (
          <DataTable table={table} />
        )}

        {companies && companies.length > 0 && viewType === 'kanban' && (
          <CompaniesKanbanView companies={companies} />
        )}
      </PageContainer>
    </>
  )
}
