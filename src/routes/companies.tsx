import { useCallback, useMemo, useRef, useState } from 'react'

import { type ColumnDef } from '@tanstack/react-table'

import type { CellUserOption, RowChange } from '@/components/docyrus/data-grid'

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useDocyrusClient } from '@docyrus/signin'
import { Building2, Pencil, Plus, Trash2, Upload } from 'lucide-react'

import { type BaseOrganizationEntity } from '@/collections/base-organization.collection'

import { useBaseOrganizationCollection } from '@/collections/base-organization.collection'
import { CompanyFormDialog } from '@/components/companies/company-form-dialog'
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
import { useUpdateCompany } from '@/hooks/use-companies'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { useDocyrusDataGrid } from '@/hooks/docyrus/use-docyrus-data-grid'
import { useSeedDefaultViews } from '@/hooks/use-seed-default-views'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import { useEnumEntities } from '@/hooks/use-enums'
import { useUsers } from '@/hooks/use-users'
import { saveGridChanges } from '@/lib/data-grid-record-utils'
import {
  createSystemViews,
  equalsFilter,
  findEnumIdByName
} from '@/lib/crm-system-views'
import { useDateFormat } from '@/lib/use-date-format'

const APP_SLUG = 'base'
const DATA_SOURCE_SLUG = 'organization'

type CompanyFormMode = 'create' | 'edit'

type CompanyFormRecord = BaseOrganizationEntity | Record<string, unknown>

interface CompanyDialogState {
  mode: CompanyFormMode;
  company: CompanyFormRecord | null;
}

const COMPANY_GRID_COLUMN_OVERRIDES: Record<
  string,
  Partial<ColumnDef<BaseOrganizationEntity>>
> = {
  name: { size: 240 },
  industry: { size: 180 },
  status: { size: 140 },
  email: { size: 220 },
  phone: { size: 160 },
  city: { size: 160 },
  created_on: { size: 150 }
}

const COMPANY_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(COMPANY_GRID_COLUMN_OVERRIDES)
)

const COMPANY_GRID_COLUMNS = Object.keys(COMPANY_GRID_COLUMN_OVERRIDES)

export function Companies() {
  const client = useDocyrusClient()

  if (!client) return null

  return <CompaniesPageInner client={client} />
}

function CompaniesPageInner({
  client
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>;
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const collection = useBaseOrganizationCollection()
  const updateCompany = useUpdateCompany()
  const { data: users = [] } = useUsers()
  const { formatDate, formatDateTime } = useDateFormat()
  const { data: companyStatuses = [], isLoading: areCompanyStatusesLoading } =
    useEnumEntities('status', {
      appSlug: APP_SLUG,
      dataSourceSlug: DATA_SOURCE_SLUG
    })
  const companyGridViews = useMemo(() => {
    const activeStatusId = findEnumIdByName(companyStatuses, ['Active'])
    const inactiveStatusId = findEnumIdByName(companyStatuses, ['Inactive', 'Passive', 'Archived'])

    return createSystemViews('base-organization', [
      {
        id: 'all',
        name: 'All',
        columns: COMPANY_GRID_COLUMNS,
        sorting: [{ id: 'created_on', desc: true }]
      },
      {
        id: 'active',
        name: 'Active',
        columns: COMPANY_GRID_COLUMNS,
        sorting: [{ id: 'name', desc: false }],
        filterQuery: equalsFilter('status', activeStatusId)
      },
      {
        id: 'inactive',
        name: 'Inactive',
        columns: COMPANY_GRID_COLUMNS,
        sorting: [{ id: 'last_modified_on', desc: true }],
        filterQuery: equalsFilter('status', inactiveStatusId)
      }
    ])
  }, [companyStatuses])

  useSeedDefaultViews({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    templates: companyGridViews,
    enabled: !areCompanyStatusesLoading,
    pruneUnlisted: true
  })

  const [dialog, setDialog] = useState<CompanyDialogState | null>(null)
  const [pendingDelete, setPendingDelete] =
    useState<BaseOrganizationEntity | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const companyUserOptions = useMemo<Array<CellUserOption>>(
    () => users
        .map((user) => {
          const value = user.id || user.email

          if (!value) return null

          const label =
            [user.firstname, user.lastname].filter(Boolean).join(' ').trim() ||
            user.name ||
            user.email

          if (!label) return null

          const initials =
            [user.firstname, user.lastname]
              .map(part => part?.charAt(0) || '')
              .join('')
              .slice(0, 2)
              .toUpperCase() || label.slice(0, 2).toUpperCase()

          return {
            value,
            label,
            initials
          }
        })
        .filter((option): option is CellUserOption => option !== null),
    [users]
  )

  const onOpenCreate = useCallback(() => {
    setDialog({ mode: 'create', company: null })
  }, [])

  const onOpenEdit = useCallback((company: BaseOrganizationEntity) => {
    setDialog({ mode: 'edit', company })
  }, [])

  const onCloseDialog = useCallback(() => {
    setDialog(null)
  }, [])

  const onView = useCallback(
    (company: BaseOrganizationEntity) => {
      if (!company.id) return

      void navigate({
        to: '/companies/$companyId',
        params: { companyId: company.id },
        search: { tab: 'overview' }
      })
    },
    [navigate]
  )

  const onDelete = useCallback((company: BaseOrganizationEntity) => {
    if (!company.id) return

    setPendingDelete(company)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseOrganizationEntity>>(
    () => getDataGridActionsColumn<BaseOrganizationEntity>({
        actionCount: 2,
        cell: ({ row }) => (
          <DataGridRowActions
            row={row.original}
            openPageLabel={t('companies.viewCompany', 'View company')}
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
    async (
      changes: Array<RowChange>,
      gridData: Array<BaseOrganizationEntity>
    ) => {
      await saveGridChanges(changes, gridData, (id, data) => updateCompany.mutateAsync({ companyId: id, data }))
    },
    [updateCompany]
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
  } = useDocyrusDataGrid<BaseOrganizationEntity>({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    collection,
    actionsColumn,
    users: companyUserOptions,
    formatDate,
    formatDateTime,
    readOnly: false,
    trackChanges: true,
    onSaveChanges: onChangesSave,
    bulkActions: ['delete'],
    enableServerExportMenu: true,
    searchPlaceholder: t('common.search', 'Search...'),
    toolbarEndContent: importToolbarButton,
    getRowLabel: row => row.name || row.id || t('companies.title'),
    mapColumn: (field, defaultColumn) => {
      if (!COMPANY_GRID_VISIBLE_FIELDS.has(field.slug)) return null

      return {
        ...defaultColumn,
        ...COMPANY_GRID_COLUMN_OVERRIDES[field.slug]
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
        title={t('companies.title')}
        icon={<Building2 className="h-4 w-4 text-teal-500" />}
        actions={
          <MotionButton size="sm" onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('companies.newCompany')}
          </MotionButton>
        } />
      <PageContainer className="flex min-h-0 flex-1 max-w-full flex-col overflow-hidden pb-0">
        {dialog && (
          <CompanyFormDialog
            open
            onOpenChange={(open) => {
              if (!open) onCloseDialog()
            }}
            company={dialog.company ?? undefined}
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
                {t('companies.errorLoading')}
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
