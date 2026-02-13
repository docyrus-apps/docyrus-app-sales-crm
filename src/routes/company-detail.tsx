import { useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { ArrowLeft, Pencil } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useCompany } from '@/hooks/use-companies'
import { useContacts } from '@/hooks/use-contacts'
import { useDeals } from '@/hooks/use-deals'
import { useLeads } from '@/hooks/use-leads'
import { CompanyFormDialog } from '@/components/companies/company-form-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'

export function CompanyDetail() {
  const { companyId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/companies/$companyId' })
  const navigate = useNavigate({ from: '/companies/$companyId' })
  const { data: company, isLoading, error } = useCompany(companyId)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const { data: contacts, isLoading: contactsLoading } = useContacts(
    companyId
      ? {
          columns: ['id', 'name', 'job_title', 'email', 'mobile'],
          filters: {
            rules: [{ field: 'organization', operator: '=', value: companyId }],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const { data: deals, isLoading: dealsLoading } = useDeals(
    companyId
      ? {
          columns: [
            'id',
            'deal_value',
            'stage',
            'expected_closing_date',
            'close_probability',
          ],
          filters: {
            rules: [
              { field: 'organizations', operator: '=', value: companyId },
            ],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const { data: leads, isLoading: leadsLoading } = useLeads(
    companyId
      ? {
          columns: [
            'id',
            'title',
            'email',
            'phone',
            'lead_status',
            'lead_source',
          ],
          filters: {
            rules: [{ field: 'company_name', operator: '=', value: companyId }],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

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
          <Card className="group">
            <CardHeader>
              <CardTitle>Company Info</CardTitle>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </CardAction>
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
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
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
                  {contactsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : !contacts?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No contacts yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {contacts.map((contact: any) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{contact.name}</div>
                            {contact.job_title && (
                              <div className="text-sm text-muted-foreground">
                                {contact.job_title}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            {contact.email && (
                              <div className="text-muted-foreground">
                                {contact.email}
                              </div>
                            )}
                            {contact.mobile && (
                              <div className="text-muted-foreground">
                                {contact.mobile}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deals" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Related Deals</CardTitle>
                </CardHeader>
                <CardContent>
                  {dealsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : !deals?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No deals yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {deals.map((deal: any) => (
                        <Link
                          key={deal.id}
                          to="/deals/$dealId"
                          params={{ dealId: deal.id }}
                          className="block"
                        >
                          <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">
                                {typeof deal.stage === 'object'
                                  ? deal.stage.name
                                  : deal.stage || 'N/A'}
                              </div>
                              {deal.expected_closing_date && (
                                <div className="text-sm text-muted-foreground">
                                  Expected:{' '}
                                  {new Date(
                                    deal.expected_closing_date,
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              {deal.deal_value != null && (
                                <div className="font-semibold">
                                  ${deal.deal_value.toLocaleString()}
                                </div>
                              )}
                              {deal.close_probability != null && (
                                <div className="text-sm text-muted-foreground">
                                  {deal.close_probability}%
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Related Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {leadsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : !leads?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No leads yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {leads.map((lead: any) => (
                        <Link
                          key={lead.id}
                          to="/leads/$leadId"
                          params={{ leadId: lead.id }}
                          className="block"
                        >
                          <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">
                                {lead.title || 'Untitled Lead'}
                              </div>
                              {lead.lead_status && (
                                <div className="text-sm text-muted-foreground">
                                  {typeof lead.lead_status === 'object'
                                    ? lead.lead_status.name
                                    : lead.lead_status}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-sm">
                              {lead.email && (
                                <div className="text-muted-foreground">
                                  {lead.email}
                                </div>
                              )}
                              {lead.phone && (
                                <div className="text-muted-foreground">
                                  {lead.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <CommentsPanel
                appSlug="base"
                dataSource="organization"
                recordId={companyId!}
              />
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <FileAttachments
                appSlug="base"
                dataSource="organization"
                recordId={companyId!}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <CompanyFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        company={company}
        mode="edit"
      />
    </PageContainer>
  )
}
