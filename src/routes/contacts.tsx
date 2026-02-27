import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, User } from 'lucide-react'
import type { ViewType } from '@/components/view-switcher'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { useContacts } from '@/hooks/use-contacts'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog'
import { ViewSwitcher } from '@/components/view-switcher'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { useDataTable } from '@/hooks/use-data-table'
import { getContactsColumns } from '@/components/contacts/contacts-columns'

export function Contacts() {
  const { t } = useTranslation()
  const { data: contacts, isLoading, error } = useContacts()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('list')

  const columns = useMemo(() => getContactsColumns(), [])
  const { table } = useDataTable({
    data: contacts || [],
    columns,
    pageCount: -1,
  })

  return (
    <>
      <PageHeader
        title={t('contacts.title')}
        actions={
          <>
            <ViewSwitcher value={viewType} onValueChange={setViewType} />
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('contacts.newContact')}
            </Button>
          </>
        }
      />
      <PageContainer>
        <ContactFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          mode="create"
        />

        {isLoading && viewType === 'card' && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {isLoading && viewType === 'list' && (
          <DataTableSkeleton columnCount={7} rowCount={10} />
        )}

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t('contacts.errorLoading')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {contacts && contacts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">{t('contacts.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('contacts.emptyDescription')}
              </p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('contacts.createContact')}
              </Button>
            </CardContent>
          </Card>
        )}

        {contacts && contacts.length > 0 && viewType === 'card' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact: any) => (
              <Link
                key={contact.id}
                to="/contacts/$contactId"
                params={{ contactId: contact.id }}
              >
                <Card className="transition-all hover:shadow-md cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {contact.name}
                        </CardTitle>
                        {contact.job_title && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {contact.job_title}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {contact.organization &&
                      typeof contact.organization === 'object' && (
                        <Badge variant="secondary" className="mb-2">
                          {contact.organization.name}
                        </Badge>
                      )}
                    {contact.email && (
                      <p className="text-xs text-muted-foreground">
                        {contact.email}
                      </p>
                    )}
                    {contact.mobile && (
                      <p className="text-xs text-muted-foreground">
                        {contact.mobile}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {contacts && contacts.length > 0 && viewType === 'list' && (
          <DataTable table={table} />
        )}
      </PageContainer>
    </>
  )
}
