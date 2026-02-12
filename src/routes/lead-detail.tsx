import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useLead } from '@/hooks/use-leads'

export function LeadDetail() {
  const { leadId } = useParams({ strict: false })
  const { data: lead, isLoading, error } = useLead(leadId)

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    )
  }

  if (error || !lead) {
    return (
      <PageContainer>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load lead details</p>
            <Link to="/leads">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Leads
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
        <Link to="/leads">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Title
                </div>
                <div className="mt-1 font-medium">{lead.title || 'N/A'}</div>
              </div>

              {lead.lead_status && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Status
                  </div>
                  <div className="mt-1">
                    {typeof lead.lead_status === 'object'
                      ? lead.lead_status.name
                      : lead.lead_status}
                  </div>
                </div>
              )}

              {lead.email && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Email
                  </div>
                  <div className="mt-1">{lead.email}</div>
                </div>
              )}

              {lead.phone && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Phone
                  </div>
                  <div className="mt-1">{lead.phone}</div>
                </div>
              )}

              {lead.lead_source && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Source
                  </div>
                  <div className="mt-1">
                    {typeof lead.lead_source === 'object'
                      ? lead.lead_source.name
                      : lead.lead_source}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {lead.company_name && typeof lead.company_name === 'object' && (
            <Card>
              <CardHeader>
                <CardTitle>Company</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {(lead.company_name as any).name || 'N/A'}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Lead Type
                      </div>
                      <div className="mt-1">
                        {lead.lead_type
                          ? typeof lead.lead_type === 'object'
                            ? lead.lead_type.name
                            : lead.lead_type
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Website
                      </div>
                      <div className="mt-1">{lead.website || 'N/A'}</div>
                    </div>
                  </div>

                  {lead.address && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Address
                      </div>
                      <div className="mt-1">{lead.address}</div>
                      {lead.city && (
                        <div className="text-sm">
                          {lead.city}, {lead.state}
                        </div>
                      )}
                    </div>
                  )}

                  {lead.contact_message && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Message
                      </div>
                      <div className="mt-1 text-sm">{lead.contact_message}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity</CardTitle>
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
                    Comments coming soon
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
                    Files coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageContainer>
  )
}
