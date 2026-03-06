/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Pencil,
  Activity,
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
import { useLead } from '@/hooks/use-leads'
import { LeadFormDialog } from '@/components/leads/lead-form-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import { ContactActivityPanel } from '@/components/docyrus/contact-activity-panel'
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

export function LeadDetail() {
  const { t } = useTranslation()
  const { leadId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/leads/$leadId' })
  const navigate = useNavigate({ from: '/leads/$leadId' })
  const { data: lead, isLoading, error } = useLead(leadId)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const fields = useMemo<Array<RecordDetailField>>(
    () => [
      { field: makeField('title', t('leads.titleLabel')), readOnly: true },
      {
        field: makeField('lead_status', t('leads.status')),
        readOnly: true,
      },
      {
        field: makeField('email', t('leads.email'), 'field-email'),
        readOnly: true,
      },
      {
        field: makeField('phone', t('leads.phone'), 'field-phone'),
        readOnly: true,
      },
      { field: makeField('website', t('leads.website')), readOnly: true },
      {
        field: makeField('lead_source', t('leads.source')),
        readOnly: true,
      },
      {
        field: makeField('lead_type', t('leads.leadType')),
        readOnly: true,
      },
      {
        field: makeField('company_name', t('leads.company')),
        readOnly: true,
      },
      { field: makeField('address', t('leads.address')), readOnly: true },
      {
        field: makeField('city', t('leads.city', { defaultValue: 'City' })),
        readOnly: true,
      },
      {
        field: makeField('state', t('leads.state', { defaultValue: 'State' })),
        readOnly: true,
      },
      {
        field: makeField(
          'country',
          t('leads.country', { defaultValue: 'Country' }),
        ),
        readOnly: true,
      },
      {
        field: makeField(
          'record_owner',
          t('leads.owner', { defaultValue: 'Owner' }),
        ),
        readOnly: true,
      },
      {
        field: makeField(
          'contact_message',
          t('leads.message'),
          'field-textarea',
        ),
        readOnly: true,
      },
    ],
    [t],
  )

  const record = useMemo(() => {
    if (!lead) return {}
    return {
      title: lead.title ?? '',
      lead_status: extractName(lead.lead_status) ?? '',
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      website: lead.website ?? '',
      lead_source: extractName(lead.lead_source) ?? '',
      lead_type: extractName(lead.lead_type) ?? '',
      company_name: extractName(lead.company_name) ?? '',
      address: lead.address ?? '',
      city: extractName(lead.city) ?? '',
      state: extractName(lead.state) ?? '',
      country: extractName(lead.countries) ?? '',
      record_owner: extractName(lead.record_owner) ?? '',
      contact_message: lead.contact_message ?? '',
    }
  }, [lead])

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
            <CardTitle className="text-destructive">
              {t('common.error')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('leads.failedToLoad')}</p>
            <Link to="/leads">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('leads.backToLeads')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const statusName =
    lead.lead_status && typeof lead.lead_status === 'object'
      ? lead.lead_status.name
      : lead.lead_status

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/leads">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('leads.backToLeads')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">
              {lead.title ||
                t('leads.untitledLead', { defaultValue: 'Untitled Lead' })}
            </h1>
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
            <ClipboardList className="h-4 w-4" />
            {t('leads.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4" />
            {t('leads.tabs.activity')}
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4" />
            {t('leads.tabs.comments')}
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="h-4 w-4" />
            {t('leads.tabs.files')}
          </TabsTrigger>
        </TabsList>

        <TabsContents>
          <TabsContent value="details" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <EditableRecordDetail fields={fields} record={record} readOnly>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    <EditableRecordDetailField slug="title" />
                    <EditableRecordDetailField slug="lead_status" />
                    <EditableRecordDetailField slug="email" />
                    <EditableRecordDetailField slug="phone" />
                    <EditableRecordDetailField slug="website" />
                    <EditableRecordDetailField slug="lead_source" />
                    <EditableRecordDetailField slug="lead_type" />
                    <EditableRecordDetailField slug="company_name" />
                    <EditableRecordDetailField slug="address" />
                    <EditableRecordDetailField slug="city" />
                    <EditableRecordDetailField slug="state" />
                    <EditableRecordDetailField slug="country" />
                    <EditableRecordDetailField slug="record_owner" />
                  </div>
                  {record.contact_message && (
                    <div className="mt-4 pt-4 border-t">
                      <EditableRecordDetailField slug="contact_message" />
                    </div>
                  )}
                </EditableRecordDetail>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ContactActivityPanel
              activities={[]}
              contactName={lead.title}
              isLoading={false}
            />
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsPanel
              appSlug="base_crm"
              dataSource="leads"
              recordId={leadId!}
            />
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <FileAttachments
              appSlug="base_crm"
              dataSource="leads"
              recordId={leadId!}
            />
          </TabsContent>
        </TabsContents>
      </Tabs>

      <LeadFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        lead={lead}
        mode="edit"
      />
    </PageContainer>
  )
}
