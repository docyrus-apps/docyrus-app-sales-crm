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
import { useLead } from '@/hooks/use-leads'
import { LeadFormDialog } from '@/components/leads/lead-form-dialog'
import { CommentsPanel } from '@/components/shared/comments-panel'
import { FileAttachments } from '@/components/shared/file-attachments'

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

  return (
    <PageContainer>
      <div className="mb-6">
        <Link to="/leads">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('leads.backToLeads')}
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel */}
        <div className="space-y-4">
          <Card className="group">
            <CardHeader>
              <CardTitle>{t('leads.leadDetails')}</CardTitle>
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
                  {t('leads.titleLabel')}
                </div>
                <div className="mt-1 font-medium">
                  {lead.title || t('common.na')}
                </div>
              </div>

              {lead.lead_status && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('leads.status')}
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
                    {t('leads.email')}
                  </div>
                  <div className="mt-1">{lead.email}</div>
                </div>
              )}

              {lead.phone && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('leads.phone')}
                  </div>
                  <div className="mt-1">{lead.phone}</div>
                </div>
              )}

              {lead.lead_source && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {t('leads.source')}
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
                <CardTitle>{t('leads.company')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {(lead.company_name as any).name || t('common.na')}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                {t('leads.tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value="activity">
                {t('leads.tabs.activity')}
              </TabsTrigger>
              <TabsTrigger value="comments">
                {t('leads.tabs.comments')}
              </TabsTrigger>
              <TabsTrigger value="files">{t('leads.tabs.files')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('leads.leadInformation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('leads.leadType')}
                      </div>
                      <div className="mt-1">
                        {lead.lead_type
                          ? typeof lead.lead_type === 'object'
                            ? lead.lead_type.name
                            : lead.lead_type
                          : t('common.na')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('leads.website')}
                      </div>
                      <div className="mt-1">
                        {lead.website || t('common.na')}
                      </div>
                    </div>
                  </div>

                  {lead.address && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('leads.address')}
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
                        {t('leads.message')}
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
                  <CardTitle>{t('leads.activity.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('leads.activity.empty')}
                  </p>
                </CardContent>
              </Card>
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
          </Tabs>
        </div>
      </div>
      <LeadFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        lead={lead}
        mode="edit"
      />
    </PageContainer>
  )
}
