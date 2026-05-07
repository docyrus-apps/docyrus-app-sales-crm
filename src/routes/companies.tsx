import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from '@tanstack/react-router'
import { useDocyrusClient } from '@docyrus/signin'
import {
  Building2,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import type { BaseOrganizationEntity } from '@/collections/base-organization.collection'
import { useBaseOrganizationCollection } from '@/collections/base-organization.collection'
import { CompanyFormDialog } from '@/components/companies/company-form-dialog'
import { CompaniesKanbanView } from '@/components/companies/companies-kanban-view'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridActionsColumn,
  type CellUserOption,
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
import { useUpdateCompany } from '@/hooks/use-companies'
import { useDocyrusDataGrid } from '@/hooks/use-docyrus-data-grid'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import { useUsers } from '@/hooks/use-users'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'
import { useDateFormat } from '@/lib/use-date-format'

const APP_SLUG = 'base'
const DATA_SOURCE_SLUG = 'organization'

type CompanyFormMode = 'create' | 'edit'

type CompanyFormRecord = BaseOrganizationEntity | Record<string, unknown>

interface CompanyDialogState {
  mode: CompanyFormMode
  company: CompanyFormRecord | null
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
  created_on: { size: 150 },
}

const COMPANY_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(COMPANY_GRID_COLUMN_OVERRIDES),
)

export function Companies() {
  const client = useDocyrusClient()

  if (!client) return null

  return <CompaniesPageInner client={client} />
}

function CompaniesPageInner({
  client,
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const collection = useBaseOrganizationCollection()
  const updateCompany = useUpdateCompany()
  const { data: users = [] } = useUsers()
  const { formatDate, formatDateTime } = useDateFormat()

  const [dialog, setDialog] = useState<CompanyDialogState | null>(null)
  const [pendingDelete, setPendingDelete] =
    useState<BaseOrganizationEntity | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('list')

  const companyUserOptions = useMemo<Array<CellUserOption>>(
    () =>
      users
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
              .map((part) => part?.charAt(0) || '')
              .join('')
              .slice(0, 2)
              .toUpperCase() || label.slice(0, 2).toUpperCase()

          return {
            value,
            label,
            initials,
          }
        })
        .filter((option): option is CellUserOption => option !== null),
    [users],
  )

  const onOpenCreate = useCallback(() => {
    setDialog({ mode: 'create', company: null })
  }, [])

  const onOpenEdit = useCallback((company: BaseOrganizationEntity) => {
    setDialog({ mode: 'edit', company })
  }, [])

  const onDuplicate = useCallback((company: BaseOrganizationEntity) => {
    setDialog({
      mode: 'create',
      company: buildDuplicatePayload(company as Record<string, unknown>),
    })
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
        search: { tab: 'overview' },
      })
    },
    [navigate],
  )

  const onDelete = useCallback((company: BaseOrganizationEntity) => {
    if (!company.id) return

    setPendingDelete(company)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseOrganizationEntity>>(
    () =>
      getDataGridActionsColumn<BaseOrganizationEntity>({
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
                {t('companies.viewCompany', 'View company')}
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
    async (
      changes: Array<RowChange>,
      gridData: Array<BaseOrganizationEntity>,
    ) => {
      await saveGridChanges(changes, gridData, (id, data) =>
        updateCompany.mutateAsync({ companyId: id, data }),
      )
    },
    [updateCompany],
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
    items: companies,
    reload,
    dataSource,
    isLoading,
    error,
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
    getRowLabel: (row) => row.name || row.id || t('companies.title'),
    mapColumn: (field, defaultColumn) => {
      if (!COMPANY_GRID_VISIBLE_FIELDS.has(field.slug)) return null

      return {
        ...defaultColumn,
        ...COMPANY_GRID_COLUMN_OVERRIDES[field.slug],
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
        title={t('companies.title')}
        icon={<Building2 className="h-4 w-4 text-teal-500" />}
        actions={
          <>
            <ViewSwitcher value={viewType} onValueChange={setViewType} />
            <MotionButton size="sm" onClick={onOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('companies.newCompany')}
            </MotionButton>
          </>
        }
      />
      <PageContainer
        className={viewType === 'kanban' ? 'max-w-full overflow-x-auto' : ''}
      >
        {dialog && (
          <CompanyFormDialog
            open
            onOpenChange={(open) => {
              if (!open) onCloseDialog()
            }}
            company={dialog.company ?? undefined}
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

        {isLoading && viewType === 'kanban' && (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-96 w-80 shrink-0 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
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

        {!isLoading && !error && companies.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">{t('companies.emptyTitle')}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('companies.emptyDescription')}
              </p>
              <MotionButton className="mt-4" onClick={onOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('companies.createCompany')}
              </MotionButton>
            </CardContent>
          </Card>
        )}

        {!isLoading &&
          !error &&
          companies.length > 0 &&
          viewType === 'card' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  to="/companies/$companyId"
                  params={{ companyId: company.id! }}
                  search={{ tab: 'overview' }}
                >
                  <Card className="cursor-pointer transition-all hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {company.name}
                          </CardTitle>
                          {company.industry && (
                            <Badge variant="secondary" className="mt-1">
                              {typeof company.industry === 'object'
                                ? company.industry.name
                                : company.industry}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {company.status && (
                        <Badge variant="outline" className="mb-2">
                          {typeof company.status === 'object'
                            ? company.status.name
                            : company.status}
                        </Badge>
                      )}
                      {company.email && (
                        <p className="text-xs text-muted-foreground">
                          {company.email}
                        </p>
                      )}
                      {company.phone && (
                        <p className="text-xs text-muted-foreground">
                          {company.phone}
                        </p>
                      )}
                      {company.city && typeof company.city === 'object' && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {company.city.name}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

        {!isLoading &&
          !error &&
          companies.length > 0 &&
          viewType === 'list' && (
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

        {!isLoading &&
          !error &&
          companies.length > 0 &&
          viewType === 'kanban' && (
            <CompaniesKanbanView companies={companies} />
          )}
      </PageContainer>
    </>
  )
}
