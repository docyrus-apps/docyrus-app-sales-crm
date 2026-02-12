import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useLeads } from '@/hooks/use-leads'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function Leads() {
  const { data: leads, isLoading, error } = useLeads()

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
            <Button className="mt-4" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Create Lead
            </Button>
          </CardContent>
        </Card>
      )}

      {leads && leads.length > 0 && (
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
    </PageContainer>
  )
}
