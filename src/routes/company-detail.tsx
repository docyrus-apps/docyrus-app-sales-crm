/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Pencil,
  Building2,
  Users,
  Briefcase,
  ClipboardList,
} from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCompany } from '@/hooks/use-companies'
import { useContacts } from '@/hooks/use-contacts'
import { useDeals } from '@/hooks/use-deals'
import { useLeads } from '@/hooks/use-leads'
import { CompanyFormDialog } from '@/components/companies/company-form-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import {
  EditableRecordDetail,
  EditableRecordDetailField,
  type RecordDetailField,
} from '@/components/docyrus/editable-record-detail'
import type { IField } from '@/components/docyrus/form-fields/types'

function makeField(
  slug: string,
  name: string,
  type: IField['type'] = 'field-text',
): IField {
  return { id: slug, name, slug, type }
}

function extractName(value: unknown): unknown {
  if (value && typeof value === 'object' && 'name' in value)
    return (value as { name: string }).name
  return value
}

export function CompanyDetail() {
  const { t } = useTranslation()
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
            rules: [{ field: 'organization', operator: '=', value: companyId }],
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
            'name',
            'email',
            'phone',
            'lead_status',
            'lead_source',
          ],
          filters: {
            rules: [
              {
                field: 'converted_organization',
                operator: '=',
                value: companyId,
              },
            ],
          },
          orderBy: 'created_on desc',
        }
      : undefined,
  )

  const fields = useMemo<Array<RecordDetailField>>(
    () => [
      { field: makeField('name', t('companies.name')), readOnly: true },
      { field: makeField('industry', t('companies.industry')), readOnly: true },
      { field: makeField('type', t('companies.type')), readOnly: true },
      { field: makeField('status', t('companies.status')), readOnly: true },
      {
        field: makeField('email', t('companies.email'), 'field-email'),
        readOnly: true,
      },
      {
        field: makeField('phone', t('companies.phone'), 'field-phone'),
        readOnly: true,
      },
      { field: makeField('website', t('companies.website')), readOnly: true },
      { field: makeField('address', t('companies.address')), readOnly: true },
      {
        field: makeField(
          'country',
          t('companies.country', { defaultValue: 'Country' }),
        ),
        readOnly: true,
      },
      {
        field: makeField('city', t('companies.city', { defaultValue: 'City' })),
        readOnly: true,
      },
      { field: makeField('district', t('companies.district')), readOnly: true },
      {
        field: makeField('tax_number', t('companies.taxNumber')),
        readOnly: true,
      },
    ],
    [t],
  )

  const record = useMemo(() => {
    if (!company) return {}
    return {
      name: company.name ?? '',
      industry: extractName(company.industry) ?? '',
      type: extractName(company.type) ?? '',
      status: extractName(company.status) ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      website: company.website ?? '',
      address: company.address ?? '',
      country: extractName(company.country) ?? '',
      city: extractName(company.city) ?? '',
      district: company.district ?? '',
      tax_number: company.tax_number ?? '',
    }
  }, [company])

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
            <CardTitle className="text-destructive">
              {t('common.error')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('companies.failedToLoad')}</p>
            <Link to="/companies">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('companies.backToCompanies')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const statusName =
    company.status && typeof company.status === 'object'
      ? company.status.name
      : company.status

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/companies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('companies.backToCompanies')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{company.name}</h1>
            {statusName && <Badge variant="secondary">{statusName}</Badge>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          {t('common.editAll', { defaultValue: 'Edit All' })}
        </Button>
      </div>

      <Tabs
        value={tab || 'details'}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="details">
            <Building2 className="h-4 w-4" />
            {t('companies.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="h-4 w-4" />
            {t('companies.tabs.contacts')}
          </TabsTrigger>
          <TabsTrigger value="deals">
            <Briefcase className="h-4 w-4" />
            {t('companies.tabs.deals')}
          </TabsTrigger>
          <TabsTrigger value="leads">
            <ClipboardList className="h-4 w-4" />
            {t('companies.tabs.leads')}
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4" />
            {t('companies.tabs.comments')}
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="h-4 w-4" />
            {t('companies.tabs.files')}
          </TabsTrigger>
        </TabsList>

        <TabsContents>
          <TabsContent value="details" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <EditableRecordDetail fields={fields} record={record} readOnly>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    <EditableRecordDetailField slug="name" />
                    <EditableRecordDetailField slug="industry" />
                    <EditableRecordDetailField slug="type" />
                    <EditableRecordDetailField slug="status" />
                    <EditableRecordDetailField slug="email" />
                    <EditableRecordDetailField slug="phone" />
                    <EditableRecordDetailField slug="website" />
                    <EditableRecordDetailField slug="address" />
                    <EditableRecordDetailField slug="country" />
                    <EditableRecordDetailField slug="city" />
                    <EditableRecordDetailField slug="district" />
                    <EditableRecordDetailField slug="tax_number" />
                  </div>
                </EditableRecordDetail>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('companies.contacts.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {contactsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : !contacts?.length ? (
                  <p className="text-sm text-muted-foreground">
                    {t('companies.contacts.empty')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact: any) => (
                      <Link
                        key={contact.id}
                        to="/contacts/$contactId"
                        params={{ contactId: contact.id }}
                        search={{ tab: 'details' }}
                        className="block"
                      >
                        <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
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
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deals" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('companies.deals.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {dealsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : !deals?.length ? (
                  <p className="text-sm text-muted-foreground">
                    {t('companies.deals.empty')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {deals.map((deal: any) => (
                      <Link
                        key={deal.id}
                        to="/deals/$dealId"
                        params={{ dealId: deal.id }}
                        search={{ tab: 'details' }}
                        className="block"
                      >
                        <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">
                              {deal.stage && typeof deal.stage === 'object'
                                ? deal.stage.name
                                : deal.stage || t('common.na')}
                            </div>
                            {deal.expected_closing_date && (
                              <div className="text-sm text-muted-foreground">
                                {t('companies.expected')}:{' '}
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
                <CardTitle>{t('companies.leads.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : !leads?.length ? (
                  <p className="text-sm text-muted-foreground">
                    {t('companies.leads.empty')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {leads.map((lead: any) => (
                      <Link
                        key={lead.id}
                        to="/leads/$leadId"
                        params={{ leadId: lead.id }}
                        search={{ tab: 'details' }}
                        className="block"
                      >
                        <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">
                              {lead.name || t('leads.untitledLead')}
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
        </TabsContents>
      </Tabs>

      <CompanyFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        company={company}
        mode="edit"
      />
    </PageContainer>
  )
}
