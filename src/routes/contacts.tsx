import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import {
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import type { BaseContactEntity } from '@/collections/base-contact.collection'
import { useBaseContactCollection } from '@/collections/base-contact.collection'
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridActionsColumn,
  type RowChange,
} from '@/components/docyrus/data-grid'
import { Button as MotionButton } from '@/components/animate-ui/components/buttons/button'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ViewSwitcher, type ViewType } from '@/components/view-switcher'
import { useUpdateContact } from '@/hooks/use-contacts'
import { useDocyrusDataGrid } from '@/hooks/use-docyrus-data-grid'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'
import { useDateFormat } from '@/lib/use-date-format'

const APP_SLUG = 'base'
const DATA_SOURCE_SLUG = 'contact'

type ContactFormMode = 'create' | 'edit'

type ContactFormRecord = BaseContactEntity | Record<string, unknown>

interface ContactDialogState {
  mode: ContactFormMode
  contact: ContactFormRecord | null
}

const CONTACT_GRID_COLUMN_OVERRIDES: Record<
  string,
  Partial<ColumnDef<BaseContactEntity>>
> = {
  name: { size: 220 },
  job_title: { size: 190 },
  organization: { size: 200 },
  email: { size: 220 },
  mobile: { size: 170 },
  created_on: { size: 150 },
}

const CONTACT_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(CONTACT_GRID_COLUMN_OVERRIDES),
)

export function Contacts() {
  const client = useDocyrusClient()

  if (!client) return null

  return <ContactsPageInner client={client} />
}

function ContactsPageInner({
  client,
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const collection = useBaseContactCollection()
  const updateContact = useUpdateContact()
  const { formatDate, formatDateTime } = useDateFormat()

  const [dialog, setDialog] = useState<ContactDialogState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<BaseContactEntity | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('list')

  const onOpenCreate = useCallback(() => {
    setDialog({ mode: 'create', contact: null })
  }, [])

  const onOpenEdit = useCallback((contact: BaseContactEntity) => {
    setDialog({ mode: 'edit', contact })
  }, [])

  const onDuplicate = useCallback((contact: BaseContactEntity) => {
    setDialog({
      mode: 'create',
      contact: buildDuplicatePayload(contact as Record<string, unknown>),
    })
  }, [])

  const onCloseDialog = useCallback(() => {
    setDialog(null)
  }, [])

  const onView = useCallback(
    (contact: BaseContactEntity) => {
      if (!contact.id) return

      void navigate({
        to: '/contacts/$contactId',
        params: { contactId: contact.id },
        search: { tab: 'overview' },
      })
    },
    [navigate],
  )

  const onDelete = useCallback((contact: BaseContactEntity) => {
    if (!contact.id) return

    setPendingDelete(contact)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseContactEntity>>(
    () =>
      getDataGridActionsColumn<BaseContactEntity>({
        actionCount: 2,
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5 px-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onView(row.original)}
            >
              <Eye className="size-4" />
              <span className="sr-only">
                {t('contacts.viewContact', 'View contact')}
              </span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">
                    {t('common.actions', 'Actions')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpenEdit(row.original)}>
                  <Pencil className="size-4" />
                  {t('common.edit', 'Edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(row.original)}>
                  <Copy className="size-4" />
                  {t('common.duplicate', 'Duplicate')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(row.original)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" />
                  {t('common.delete', 'Delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }),
    [onDelete, onDuplicate, onOpenEdit, onView, t],
  )

  const onChangesSave = useCallback(
    async (changes: Array<RowChange>, gridData: Array<BaseContactEntity>) => {
      await saveGridChanges(changes, gridData, (id, data) =>
        updateContact.mutateAsync({ contactId: id, data }),
      )
    },
    [updateContact],
  )

  const openWizardRef = useRef<() => void>(() => {})

  const importToolbarButton = useMemo(
    () => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => openWizardRef.current()}
      >
        <Upload className="size-4" />
        {t('common.import', 'Import')}
      </Button>
    ),
    [t],
  )

  const {
    table,
    gridProps,
    toolbar,
    items: contacts,
    reload,
    dataSource,
    isLoading,
    error,
  } = useDocyrusDataGrid<BaseContactEntity>({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    collection,
    actionsColumn,
    formatDate,
    formatDateTime,
    readOnly: false,
    trackChanges: true,
    onSaveChanges: onChangesSave,
    bulkActions: ['delete'],
    enableServerExportMenu: true,
    searchPlaceholder: t('common.search', 'Search...'),
    toolbarEndContent: importToolbarButton,
    getRowLabel: (row) => row.name || row.id || t('contacts.title'),
    mapColumn: (field, defaultColumn) => {
      if (!CONTACT_GRID_VISIBLE_FIELDS.has(field.slug)) return null

      return {
        ...defaultColumn,
        ...CONTACT_GRID_COLUMN_OVERRIDES[field.slug],
      }
    },
  })

  const { openWizard, wizard } = useDocyrusDataImportWizard({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    fields: dataSource?.fields,
    onImported: reload,
  })

  openWizardRef.current = openWizard

  const onConfirmDelete = useCallback(async () => {
    if (!pendingDelete?.id) return

    setIsDeleting(true)

    try {
      await collection.delete(pendingDelete.id)
      setPendingDelete(null)
      reload()
    } finally {
      setIsDeleting(false)
    }
  }, [collection, pendingDelete, reload])

  return (
    <>
      <PageHeader
        title={t('contacts.title')}
        icon={<User className="h-4 w-4 text-pink-500" />}
        actions={
          <>
            <ViewSwitcher
              value={viewType}
              onValueChange={setViewType}
              options={['card', 'list']}
            />
            <MotionButton size="sm" onClick={onOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('contacts.newContact')}
            </MotionButton>
          </>
        }
      />
      <PageContainer>
        {dialog && (
          <ContactFormDialog
            open
            onOpenChange={(open) => {
              if (!open) onCloseDialog()
            }}
            contact={dialog.contact ?? undefined}
            mode={dialog.mode}
            onSubmitSuccess={reload}
          />
        )}

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

        {!isLoading && !error && contacts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">{t('contacts.emptyTitle')}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('contacts.emptyDescription')}
              </p>
              <MotionButton className="mt-4" onClick={onOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('contacts.createContact')}
              </MotionButton>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && contacts.length > 0 && viewType === 'card' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => (
              <Link
                key={contact.id}
                to="/contacts/$contactId"
                params={{ contactId: contact.id! }}
                search={{ tab: 'overview' }}
              >
                <Card className="cursor-pointer transition-all hover:shadow-md">
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
                          <p className="mt-0.5 text-sm text-muted-foreground">
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

        {!isLoading && !error && contacts.length > 0 && viewType === 'list' && (
          <div className="space-y-4">
            {toolbar}
            <DataGrid table={table} {...gridProps} height={600} />
          </div>
        )}

        <RecordDeleteConfirmDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setPendingDelete(null)
          }}
          recordCount={pendingDelete ? 1 : 0}
          onConfirm={onConfirmDelete}
          isPending={isDeleting}
        />

        {wizard}
      </PageContainer>
    </>
  )
}
