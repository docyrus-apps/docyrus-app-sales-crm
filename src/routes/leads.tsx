import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useLeads } from '@/hooks/use-leads'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function Leads() {
  const { data: leads, isLoading } = useLeads()

  return (
    <PageContainer>
      <PageHeader
        title="Leads"
        description="Manage your sales leads"
        actions={
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        }
      />

      {isLoading && <Skeleton className="h-64 w-full" />}

      {leads && leads.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">No leads yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add your first lead to start tracking
            </p>
          </CardContent>
        </Card>
      )}

      {leads && leads.length > 0 && (
        <div className="text-sm">Found {leads.length} leads</div>
      )}
    </PageContainer>
  )
}
