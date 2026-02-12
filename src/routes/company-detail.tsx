import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useCompany } from '@/hooks/use-companies'

export function CompanyDetail() {
  const { companyId } = useParams({ strict: false })
  const { data: company, isLoading, error } = useCompany(companyId)

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    )
  }

  if (error || !company) {
    return (
      <PageContainer>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load company details</p>
            <Link to="/companies">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Companies
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
        <Link to="/companies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Name
                </div>
                <div className="mt-1 font-medium text-lg">{company.name}</div>
              </div>

              {company.industry && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Industry
                  </div>
                  <div className="mt-1">
                    {typeof company.industry === 'object'
                      ? company.industry.name
                      : company.industry}
                  </div>
                </div>
              )}

              {company.status && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Status
                  </div>
                  <div className="mt-1">
                    {typeof company.status === 'object'
                      ? company.status.name
                      : company.status}
                  </div>
                </div>
              )}

              {company.type && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Type
                  </div>
                  <div className="mt-1">
                    {typeof company.type === 'object'
                      ? company.type.name
                      : company.type}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.email && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Email
                  </div>
                  <div className="mt-1 text-sm">{company.email}</div>
                </div>
              )}

              {company.phone && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Phone
                  </div>
                  <div className="mt-1 text-sm">{company.phone}</div>
                </div>
              )}

              {company.website && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Website
                  </div>
                  <div className="mt-1 text-sm">{company.website}</div>
                </div>
              )}

              {company.address && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Address
                  </div>
                  <div className="mt-1 text-sm">{company.address}</div>
                  {company.city && typeof company.city === 'object' && (
                    <div className="text-sm">{(company.city as any).name}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="deals">Deals</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Company Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {company.tax_number && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Tax Number
                        </div>
                        <div className="mt-1">{company.tax_number}</div>
                      </div>
                    )}
                    {company.district && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          District
                        </div>
                        <div className="mt-1">{company.district}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No contacts yet
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deals" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Related Deals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No deals yet</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Related Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No leads yet</p>
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
