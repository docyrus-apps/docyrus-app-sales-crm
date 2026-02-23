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
import { useContact } from '@/hooks/use-contacts'
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'

export function ContactDetail() {
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
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load contact details</p>
            <Link to="/contacts">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Contacts
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
            Back to Contacts
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel */}
        <div className="space-y-4">
          <Card className="group">
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
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
                <div className="mt-1 font-medium">{contact.name || 'N/A'}</div>
              </div>

              {contact.job_title && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Job Title
                  </div>
                  <div className="mt-1">{contact.job_title}</div>
                </div>
              )}

              {contact.email && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Email
                  </div>
                  <div className="mt-1">{contact.email}</div>
                </div>
              )}

              {contact.mobile && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Mobile
                  </div>
                  <div className="mt-1">{contact.mobile}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {contact.organization && typeof contact.organization === 'object' && (
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
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
                    .name || 'N/A'}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Full Name
                      </div>
                      <div className="mt-1">{contact.name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Job Title
                      </div>
                      <div className="mt-1">{contact.job_title || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Email
                      </div>
                      <div className="mt-1">{contact.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Mobile
                      </div>
                      <div className="mt-1">{contact.mobile || 'N/A'}</div>
                    </div>
                  </div>

                  {contact.organization &&
                    typeof contact.organization === 'object' && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Organization
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
