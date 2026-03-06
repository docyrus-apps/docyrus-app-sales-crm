import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, User } from 'lucide-react'
import type { RowChange } from '@/components/docyrus/data-grid'
import type { ViewType } from '@/components/view-switcher'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  useContacts,
  useDeleteContact,
  useUpdateContact,
} from '@/hooks/use-contacts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog'
import { DataGridStandardToolbar } from '@/components/docyrus/data-grid-standard-toolbar'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { getDataGridRowActionsColumn } from '@/components/docyrus/data-grid-row-actions-column'
import { ViewSwitcher } from '@/components/view-switcher'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridSelectColumn,
  useDataGrid,
} from '@/components/docyrus/data-grid'
import { getContactsColumns } from '@/components/contacts/contacts-columns'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'

export function Contacts() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: contacts, isLoading, error } = useContacts()
  const deleteContact = useDeleteContact()
  const updateContact = useUpdateContact()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('list')
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [activeContact, setActiveContact] = useState<any>(null)
  const [deleteTargets, setDeleteTargets] = useState<Array<any>>([])

  const onOpenCreate = useCallback(() => {
    setFormMode('create')
    setActiveContact(null)
    setIsFormOpen(true)
  }, [])

  const onOpenEdit = useCallback((contact: any) => {
    setFormMode('edit')
    setActiveContact(contact)
    setIsFormOpen(true)
  }, [])

  const onDuplicate = useCallback((contact: any) => {
    setFormMode('create')
    setActiveContact(buildDuplicatePayload(contact))
    setIsFormOpen(true)
  }, [])

  const onView = useCallback(
    (contact: any) => {
      if (!contact?.id) return

      void navigate({
        to: '/contacts/$contactId',
        params: { contactId: contact.id },
        search: { tab: 'overview' },
      })
    },
    [navigate],
  )

  const onDeleteRequest = useCallback((rows: Array<any>) => {
    if (rows.length === 0) return

    setDeleteTargets(rows)
  }, [])

  const onDeleteConfirm = useCallback(async () => {
    const ids = deleteTargets
      .map((row) => row?.id)
      .filter(Boolean) as Array<string>

    await Promise.all(ids.map((id) => deleteContact.mutateAsync(id)))
    setDeleteTargets([])
  }, [deleteContact, deleteTargets])

  const onDeleteDialogOpenChange = useCallback((open: boolean) => {
    if (!open) setDeleteTargets([])
  }, [])

  const baseColumns = useMemo(() => getContactsColumns(), [])
  const columns = useMemo(
    () => [
      getDataGridSelectColumn<any>(),
      getDataGridRowActionsColumn<any>({
        onView,
        onEdit: onOpenEdit,
        onDuplicate,
        onDelete: (row) => onDeleteRequest([row]),
      }),
      ...baseColumns,
    ],
    [baseColumns, onDeleteRequest, onDuplicate, onOpenEdit, onView],
  )

  const onChangesSave = useCallback(
    async (changes: Array<RowChange>, gridData: Array<any>) => {
      await saveGridChanges(changes, gridData, (id, data) =>
        updateContact.mutateAsync({ contactId: id, data }),
      )
    },
    [updateContact],
  )

  const { table, ...dataGridProps } = useDataGrid({
    data: contacts || [],
    columns,
    getRowId: (row: any) => row.id,
    readOnly: false,
    enableGrouping: true,
    enableChangeTracking: true,
    onChangesSave,
  })

  return (
    <>
      <PageHeader
        title={t('contacts.title')}
        icon={<User className="h-4 w-4 text-pink-500" />}
        actions={
          <>
            <ViewSwitcher value={viewType} onValueChange={setViewType} />
            <Button size="sm" onClick={onOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('contacts.newContact')}
            </Button>
          </>
        }
      />
      <PageContainer>
        <ContactFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)

            if (!open) {
              setActiveContact(null)
              setFormMode('create')
            }
          }}
          contact={activeContact ?? undefined}
          mode={formMode}
        />

        {isLoading && viewType === 'card' && (
          <div className="space-y-4">
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
          </div>
        )}

        {isLoading && viewType === 'list' && (
          <DataGridSkeleton>
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
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
                search={{ tab: 'overview' }}
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
          <>
            <DataGridStandardToolbar
              table={table}
              searchPlaceholder={t('common.search', 'Search...')}
            />
            <DataGrid
              table={table}
              {...dataGridProps}
              height={600}
              actions={[
                {
                  label: t('common.delete'),
                  icon: <Trash2 className="size-4" />,
                  variant: 'destructive',
                  onAction: onDeleteRequest,
                },
              ]}
            />
          </>
        )}

        <RecordDeleteConfirmDialog
          open={deleteTargets.length > 0}
          onOpenChange={onDeleteDialogOpenChange}
          recordCount={deleteTargets.length}
          onConfirm={onDeleteConfirm}
          isPending={deleteContact.isPending}
        />
      </PageContainer>
    </>
  )
}
