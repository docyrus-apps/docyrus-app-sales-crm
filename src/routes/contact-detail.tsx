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
  User,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useContact } from '@/hooks/use-contacts'
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog'
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

export function ContactDetail() {
  const { t } = useTranslation()
  const { contactId } = useParams({ strict: false })
  const { tab } = useSearch({ from: '/contacts/$contactId' })
  const navigate = useNavigate({ from: '/contacts/$contactId' })
  const { data: contact, isLoading, error } = useContact(contactId)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleTabChange = (value: string) => {
    void navigate({ search: { tab: value }, replace: true })
  }

  const fields = useMemo<Array<RecordDetailField>>(
    () => [
      { field: makeField('name', t('contacts.name')), readOnly: true },
      { field: makeField('job_title', t('contacts.jobTitle')), readOnly: true },
      {
        field: makeField('email', t('contacts.email'), 'field-email'),
        readOnly: true,
      },
      {
        field: makeField('mobile', t('contacts.mobile'), 'field-phone'),
        readOnly: true,
      },
      {
        field: makeField('organization', t('contacts.organization')),
        readOnly: true,
      },
    ],
    [t],
  )

  const record = useMemo(() => {
    if (!contact) return {}
    return {
      name: contact.name ?? '',
      job_title: contact.job_title ?? '',
      email: contact.email ?? '',
      mobile: contact.mobile ?? '',
      organization: extractName(contact.organization) ?? '',
    }
  }, [contact])

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    )
  }

  if (error || !contact) {
    return (
      <PageContainer>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t('common.error')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('contacts.failedToLoad')}</p>
            <Link to="/contacts">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('contacts.backToContacts')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/contacts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('contacts.backToContacts')}
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{contact.name}</h1>
            {contact.job_title && (
              <p className="text-sm text-muted-foreground">
                {contact.job_title}
              </p>
            )}
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
            <User className="h-4 w-4" />
            {t('contacts.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4" />
            {t('contacts.tabs.activity')}
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4" />
            {t('contacts.tabs.comments')}
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="h-4 w-4" />
            {t('contacts.tabs.files')}
          </TabsTrigger>
        </TabsList>

        <TabsContents>
          <TabsContent value="details" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <EditableRecordDetail fields={fields} record={record} readOnly>
                  <div className="space-y-3">
                    <EditableRecordDetailField slug="name" />
                    <EditableRecordDetailField slug="job_title" />
                    <EditableRecordDetailField slug="email" />
                    <EditableRecordDetailField slug="mobile" />
                    <EditableRecordDetailField slug="organization" />
                  </div>
                </EditableRecordDetail>

                {contact.organization &&
                  typeof contact.organization === 'object' && (
                    <div className="mt-4 pt-4 border-t">
                      <Link
                        to="/companies/$companyId"
                        params={{
                          companyId: (contact.organization as { id: string })
                            .id,
                        }}
                        search={{ tab: 'details' }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {t('contacts.viewOrganization', {
                          defaultValue: 'View Organization',
                        })}{' '}
                        &rarr;
                      </Link>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ContactActivityPanel
              activities={[]}
              contactName={contact.name}
              isLoading={false}
            />
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsPanel
              appSlug="base"
              dataSource="contact"
              recordId={contactId!}
            />
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <FileAttachments
              appSlug="base"
              dataSource="contact"
              recordId={contactId!}
            />
          </TabsContent>
        </TabsContents>
      </Tabs>

      <ContactFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        contact={contact}
        mode="edit"
      />
    </PageContainer>
  )
}
