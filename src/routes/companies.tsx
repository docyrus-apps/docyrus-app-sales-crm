import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useCompanies } from '@/hooks/use-companies'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function Companies() {
  const { data: companies, isLoading } = useCompanies()

  return (
    <PageContainer>
      <PageHeader
        title="Companies"
        description="Manage your company directory"
        actions={
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Button>
        }
      />

      {isLoading && <Skeleton className="h-64 w-full" />}

      {companies && companies.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">No companies yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add your first company to get started
            </p>
          </CardContent>
        </Card>
      )}

      {companies && companies.length > 0 && (
        <div className="text-sm">Found {companies.length} companies</div>
      )}
    </PageContainer>
  )
}
