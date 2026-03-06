import { useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useContact } from '@/hooks/use-contacts'
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'
import { ContactActivityPanel } from '@/components/docyrus/contact-activity-panel'

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
      <div className="mb-6">
        <Link to="/contacts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('contacts.backToContacts')}
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel */}
        <div className="space-y-4">
          <Card className="group">
            <CardHeader>
              <CardTitle>{t('contacts.contactDetails')}</CardTitle>
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
                  {t('contacts.name')}
                </div>
                <div className="mt-1 font-medium">
                  {contact.name || t('common.na')}
                </div>
              </div>

              {contact.job_title && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('contacts.jobTitle')}
                  </div>
                  <div className="mt-1">{contact.job_title}</div>
                </div>
              )}

              {contact.email && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('contacts.email')}
                  </div>
                  <div className="mt-1">{contact.email}</div>
                </div>
              )}

              {contact.mobile && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('contacts.mobile')}
                  </div>
                  <div className="mt-1">{contact.mobile}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {contact.organization && typeof contact.organization === 'object' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('contacts.organization')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  to="/companies/$companyId"
                  params={{
                    companyId: (contact.organization as { id: string }).id,
                  }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {(contact.organization as { id: string; name: string })
                    .name || t('common.na')}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                {t('contacts.tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value="activity">
                {t('contacts.tabs.activity')}
              </TabsTrigger>
              <TabsTrigger value="comments">
                {t('contacts.tabs.comments')}
              </TabsTrigger>
              <TabsTrigger value="files">
                {t('contacts.tabs.files')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('contacts.contactInformation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('contacts.fullName')}
                      </div>
                      <div className="mt-1">
                        {contact.name || t('common.na')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('contacts.jobTitle')}
                      </div>
                      <div className="mt-1">
                        {contact.job_title || t('common.na')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('contacts.email')}
                      </div>
                      <div className="mt-1">
                        {contact.email || t('common.na')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('contacts.mobile')}
                      </div>
                      <div className="mt-1">
                        {contact.mobile || t('common.na')}
                      </div>
                    </div>
                  </div>

                  {contact.organization &&
                    typeof contact.organization === 'object' && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {t('contacts.organization')}
                        </div>
                        <div className="mt-1">
                          <Link
                            to="/companies/$companyId"
                            params={{
                              companyId: (
                                contact.organization as { id: string }
                              ).id,
                            }}
                            className="text-primary hover:underline"
                          >
                            {
                              (
                                contact.organization as {
                                  id: string
                                  name: string
                                }
                              ).name
                            }
                          </Link>
                        </div>
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
          </Tabs>
        </div>
      </div>
      <ContactFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        contact={contact}
        mode="edit"
      />
    </PageContainer>
  )
}
