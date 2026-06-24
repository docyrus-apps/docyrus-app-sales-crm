import { useCallback, useMemo, useRef, useState } from 'react'

import type { ColumnDef } from '@tanstack/react-table'

import { type RowChange } from '@/components/docyrus/data-grid'

import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import { Pencil, Plus, Trash2, Upload, User } from 'lucide-react'

import type { BaseContactEntity } from '@/collections/base-contact.collection'

import { useBaseContactCollection } from '@/collections/base-contact.collection'
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog'
import {
  DataGrid,
  DataGridRowActions,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridActionsColumn
} from '@/components/docyrus/data-grid'
import { Button as MotionButton } from '@/components/animate-ui/components/buttons/button'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUpdateContact } from '@/hooks/use-contacts'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { useDocyrusDataGrid } from '@/hooks/docyrus/use-docyrus-data-grid'
import { useSeedDefaultViews } from '@/hooks/use-seed-default-views'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import { useEnumEntities } from '@/hooks/use-enums'
import { saveGridChanges } from '@/lib/data-grid-record-utils'
import {
  createSystemViews,
  equalsFilter,
  findEnumIdByName
} from '@/lib/crm-system-views'
import { useDateFormat } from '@/lib/use-date-format'

const APP_SLUG = 'base'
const DATA_SOURCE_SLUG = 'contact'

type ContactFormMode = 'create' | 'edit'

type ContactFormRecord = BaseContactEntity | Record<string, unknown>

interface ContactDialogState {
  mode: ContactFormMode;
  contact: ContactFormRecord | null;
}

const CONTACT_GRID_COLUMN_OVERRIDES: Record<
  string,
  Partial<ColumnDef<BaseContactEntity>>
> = {
  name: { size: 220 },
  job_title: { size: 190 },
  organization: { size: 200 },
  contact_status: { size: 150 },
  email: { size: 220 },
  mobile: { size: 170 },
  created_on: { size: 150 }
}

const CONTACT_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(CONTACT_GRID_COLUMN_OVERRIDES)
)

const CONTACT_GRID_COLUMNS = Object.keys(CONTACT_GRID_COLUMN_OVERRIDES)

export function Contacts() {
  const client = useDocyrusClient()

  if (!client) return null

  return <ContactsPageInner client={client} />
}

function ContactsPageInner({
  client
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>;
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const collection = useBaseContactCollection()
  const updateContact = useUpdateContact()
  const { formatDate, formatDateTime } = useDateFormat()
  const { data: contactStatuses = [], isLoading: areContactStatusesLoading } =
    useEnumEntities('contact_status', {
      appSlug: APP_SLUG,
      dataSourceSlug: DATA_SOURCE_SLUG
    })
  const contactGridViews = useMemo(() => {
    const activeStatusId = findEnumIdByName(contactStatuses, ['Active'])
    const doNotContactStatusId = findEnumIdByName(contactStatuses, ['Do Not Contact'])

    return createSystemViews('base-contact', [
      {
        id: 'all',
        name: 'All',
        columns: CONTACT_GRID_COLUMNS,
        sorting: [{ id: 'created_on', desc: true }]
      },
      {
        id: 'active',
        name: 'Active',
        columns: CONTACT_GRID_COLUMNS,
        sorting: [{ id: 'name', desc: false }],
        filterQuery: equalsFilter('contact_status', activeStatusId)
      },
      {
        id: 'do-not-contact',
        name: 'Do Not Contact',
        columns: CONTACT_GRID_COLUMNS,
        sorting: [{ id: 'last_modified_on', desc: true }],
        filterQuery: equalsFilter('contact_status', doNotContactStatusId)
      }
    ])
  }, [contactStatuses])

  useSeedDefaultViews({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    templates: contactGridViews,
    enabled: !areContactStatusesLoading,
    pruneUnlisted: true
  })

  const [dialog, setDialog] = useState<ContactDialogState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<BaseContactEntity | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const onOpenCreate = useCallback(() => {
    setDialog({ mode: 'create', contact: null })
  }, [])

  const onOpenEdit = useCallback((contact: BaseContactEntity) => {
    setDialog({ mode: 'edit', contact })
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
        search: { tab: 'overview' }
      })
    },
    [navigate]
  )

  const onDelete = useCallback((contact: BaseContactEntity) => {
    if (!contact.id) return

    setPendingDelete(contact)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseContactEntity>>(
    () => getDataGridActionsColumn<BaseContactEntity>({
        actionCount: 2,
        cell: ({ row }) => (
          <DataGridRowActions
            row={row.original}
            openPageLabel={t('contacts.viewContact', 'View contact')}
            actionsLabel={t('common.actions', 'Actions')}
            onOpenPage={onView}
            actions={[
              {
                key: 'edit',
                label: t('common.edit', 'Edit'),
                icon: <Pencil className="size-4" />,
                onSelect: onOpenEdit
              },
              {
                key: 'open',
                label: t('common.openPage', 'Open page'),
                icon: <DocyrusIcon icon="huge sidebar-right-01" size="sm" />,
                onSelect: onView
              },
              {
                key: 'delete',
                label: t('common.delete', 'Delete'),
                icon: <Trash2 className="size-4" />,
                destructive: true,
                onSelect: onDelete
              }
            ]} />
        )
      }),
    [
onDelete,
onOpenEdit,
onView,
t
]
  )

  const onChangesSave = useCallback(
    async (changes: Array<RowChange>, gridData: Array<BaseContactEntity>) => {
      await saveGridChanges(changes, gridData, (id, data) => updateContact.mutateAsync({ contactId: id, data }))
    },
    [updateContact]
  )

  const openWizardRef = useRef<() => void>(() => {})

  const importToolbarButton = useMemo(
    () => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => openWizardRef.current()}>
        <Upload className="size-4" />
        {t('common.import', 'Import')}
      </Button>
    ),
    [t]
  )

  const {
    table,
    gridProps,
    pagingMode,
    toolbar,
    reload,
    dataSource,
    isLoading,
    error
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
    getRowLabel: row => row.name || row.id || t('contacts.title'),
    mapColumn: (field, defaultColumn) => {
      if (!CONTACT_GRID_VISIBLE_FIELDS.has(field.slug)) return null

      return {
        ...defaultColumn,
        ...CONTACT_GRID_COLUMN_OVERRIDES[field.slug]
      }
    }
  })

  const { openWizard, wizard } = useDocyrusDataImportWizard({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    fields: dataSource?.fields,
    onImported: reload
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
          <MotionButton size="sm" onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('contacts.newContact')}
          </MotionButton>
        } />
      <PageContainer className="flex min-h-0 flex-1 max-w-full flex-col overflow-hidden pb-0">
        {dialog && (
          <ContactFormDialog
            open
            onOpenChange={(open) => {
              if (!open) onCloseDialog()
            }}
            contact={dialog.contact ?? undefined}
            mode={dialog.mode}
            onSubmitSuccess={reload} />
        )}

        {isLoading && (
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

        {!isLoading && !error && (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="shrink-0">{toolbar}</div>
            <div className="min-h-0 flex-1">
              <DataGrid
                table={table}
                {...gridProps}
                pagingMode={pagingMode}
                height="auto" />
            </div>
          </div>
        )}

        <RecordDeleteConfirmDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setPendingDelete(null)
          }}
          recordCount={pendingDelete ? 1 : 0}
          onConfirm={onConfirmDelete}
          isPending={isDeleting} />

        {wizard}
      </PageContainer>
    </>
  )
}
