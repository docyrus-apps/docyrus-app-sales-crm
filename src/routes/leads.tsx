import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import {
  Columns3,
  Copy,
  Eye,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UserRoundSearch,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import type { BaseCrmLeadsEntity } from '@/collections/base_crm-leads.collection'
import { useBaseCrmLeadsCollection } from '@/collections/base_crm-leads.collection'
import { Button as MotionButton } from '@/components/animate-ui/components/buttons/button'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridActionsColumn,
  type RowChange,
} from '@/components/docyrus/data-grid'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { LeadFormDialog } from '@/components/leads/lead-form-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  mapEnumEntitiesToCellOptions,
  useEnumEntities,
} from '@/hooks/use-enums'
import { useDeleteLead, useUpdateLead } from '@/hooks/use-leads'
import { useDocyrusDataGrid } from '@/hooks/use-docyrus-data-grid'
import { useDocyrusKanban } from '@/hooks/use-docyrus-kanban'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'
import { useDateFormat } from '@/lib/use-date-format'

type LeadsView = 'board' | 'list'

type LeadFormMode = 'create' | 'edit'

type LeadFormRecord = BaseCrmLeadsEntity | Record<string, unknown>

interface LeadDialogState {
  mode: LeadFormMode
  lead: LeadFormRecord | null
}

const APP_SLUG = 'base_crm'
const DATA_SOURCE_SLUG = 'leads'

const LEAD_GRID_COLUMN_OVERRIDES: Record<
  string,
  Partial<ColumnDef<BaseCrmLeadsEntity>>
> = {
  title: { size: 240 },
  company_name: { size: 200 },
  lead_status: { size: 150 },
  lead_source: { size: 160 },
  email: { size: 220 },
  phone: { size: 170 },
  created_on: { size: 180 },
}

const LEAD_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(LEAD_GRID_COLUMN_OVERRIDES),
)

export function Leads() {
  const client = useDocyrusClient()

  if (!client) return null

  return <LeadsPageInner client={client} />
}

function LeadsPageInner({
  client,
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const collection = useBaseCrmLeadsCollection()
  const deleteLead = useDeleteLead()
  const updateLead = useUpdateLead()
  const { formatDate, formatDateTime } = useDateFormat()

  const [viewType, setViewType] = useState<LeadsView>('board')
  const [dialog, setDialog] = useState<LeadDialogState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<BaseCrmLeadsEntity | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: leadStatuses = [] } = useEnumEntities('lead_status', {
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
  })

  const leadStatusOptions = useMemo(
    () => mapEnumEntitiesToCellOptions(leadStatuses),
    [leadStatuses],
  )

  const onOpenCreate = useCallback(() => {
    setDialog({ mode: 'create', lead: null })
  }, [])

  const onOpenEdit = useCallback((lead: BaseCrmLeadsEntity) => {
    setDialog({ mode: 'edit', lead })
  }, [])

  const onDuplicate = useCallback((lead: BaseCrmLeadsEntity) => {
    setDialog({
      mode: 'create',
      lead: buildDuplicatePayload(lead as Record<string, unknown>),
    })
  }, [])

  const onCloseDialog = useCallback(() => {
    setDialog(null)
  }, [])

  const onView = useCallback(
    (lead: BaseCrmLeadsEntity) => {
      if (!lead.id) return

      void navigate({
        to: '/leads/$leadId',
        params: { leadId: lead.id },
        search: { tab: 'overview' },
      })
    },
    [navigate],
  )

  const onDelete = useCallback((lead: BaseCrmLeadsEntity) => {
    if (!lead.id) return

    setPendingDelete(lead)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseCrmLeadsEntity>>(
    () =>
      getDataGridActionsColumn<BaseCrmLeadsEntity>({
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
                {t('leads.viewLead', 'View lead')}
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
    async (changes: Array<RowChange>, gridData: Array<BaseCrmLeadsEntity>) => {
      await saveGridChanges(changes, gridData, (id, data) =>
        updateLead.mutateAsync({ leadId: id, data }),
      )
    },
    [updateLead],
  )

  const openWizardRef = useRef<() => void>(() => {})
  const reloadBoardRef = useRef<() => void>(() => {})

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
    items: listLeads,
    reload: reloadList,
    dataSource: listDataSource,
    isLoading: isListLoading,
    error: listError,
  } = useDocyrusDataGrid<BaseCrmLeadsEntity>({
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
    enableItemsQuery: viewType === 'list',
    enableServerExportMenu: true,
    searchPlaceholder: t('common.search', 'Search...'),
    toolbarEndContent: importToolbarButton,
    getRowLabel: (row) => row.title || row.id || t('leads.title'),
    mapColumn: (field, defaultColumn) => {
      if (!LEAD_GRID_VISIBLE_FIELDS.has(field.slug)) return null

      if (field.slug === 'lead_status') {
        return {
          ...defaultColumn,
          ...LEAD_GRID_COLUMN_OVERRIDES[field.slug],
          meta: {
            ...defaultColumn.meta,
            cell: {
              ...(defaultColumn.meta?.cell ?? {}),
              options: leadStatusOptions,
            },
          },
        }
      }

      return {
        ...defaultColumn,
        ...LEAD_GRID_COLUMN_OVERRIDES[field.slug],
      }
    },
  })

  const {
    toolbar: boardToolbar,
    board,
    reload: reloadBoard,
    dataSource: boardDataSource,
    isLoading: isBoardLoading,
    error: boardError,
  } = useDocyrusKanban<BaseCrmLeadsEntity>({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    collection: {
      list: (params) => collection.list(params),
    },
    groupByFieldSlug: 'lead_status',
    titleColumn: 'title',
    descriptionColumn: 'email',
    avatarColumn: 'lead_source',
    userColumn: 'record_owner',
    cardContent: ({ row }) => {
      const companyName =
        typeof row.company_name === 'object'
          ? row.company_name?.name
          : row.company_name
      const countryName =
        typeof row.countries === 'object' ? row.countries?.name : row.countries
      const websiteOrPhone = row.website || row.phone

      return (
        <div className="space-y-2">
          {companyName ? (
            <p className="text-xs font-medium text-foreground">{companyName}</p>
          ) : null}
          {websiteOrPhone ? (
            <p className="text-xs text-muted-foreground">{websiteOrPhone}</p>
          ) : null}
          {countryName ? (
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {countryName}
            </p>
          ) : null}
        </div>
      )
    },
    onCardOpen: onView,
    onCardEdit: onOpenEdit,
    onCardClick: onView,
    onCardDelete: async (row) => {
      if (!row.id) return

      await deleteLead.mutateAsync(row.id)
      reloadList()
      reloadBoardRef.current()
    },
    onItemMoveCommit: async ({ row, payload }) => {
      if (!row.id) return

      await updateLead.mutateAsync({ leadId: row.id, data: payload })
      reloadList()
      reloadBoardRef.current()
    },
    enableItemsQuery: viewType === 'board',
    listParams: {
      columns:
        'id, title, phone, email, website, lead_source, lead_status, lead_type, company_name(id,name,company_logo), countries(id,name), record_owner, created_on, last_modified_on, created_by, last_modified_by',
      orderBy: 'created_on DESC',
      limit: 200,
    },
    searchPlaceholder: t('common.search', 'Search...'),
    toolbarEndContent: importToolbarButton,
  })

  reloadBoardRef.current = reloadBoard

  const reload = useCallback(() => {
    reloadList()
    reloadBoard()
  }, [reloadBoard, reloadList])

  const { openWizard, wizard } = useDocyrusDataImportWizard({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    fields: listDataSource?.fields ?? boardDataSource?.fields,
    onImported: reload,
  })

  openWizardRef.current = openWizard

  const onConfirmDelete = useCallback(async () => {
    if (!pendingDelete?.id) return

    setIsDeleting(true)

    try {
      await deleteLead.mutateAsync(pendingDelete.id)
      setPendingDelete(null)
      reload()
    } finally {
      setIsDeleting(false)
    }
  }, [deleteLead, pendingDelete, reload])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={t('leads.title')}
        icon={<UserRoundSearch className="h-4 w-4 text-sky-500" />}
        titleSuffix={
          <Tabs
            value={viewType}
            onValueChange={(value) => setViewType(value as LeadsView)}
            className="w-full sm:w-auto"
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="board" className="gap-2 px-3">
                <Columns3 className="h-4 w-4" />
                <span>{t('viewSwitcher.board')}</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2 px-3">
                <List className="h-4 w-4" />
                <span>{t('viewSwitcher.list')}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
        actions={
          <MotionButton size="sm" onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('leads.newLead')}
          </MotionButton>
        }
      />
      <PageContainer
        className={
          viewType === 'board'
            ? 'flex min-h-0 flex-1 max-w-full flex-col overflow-hidden pb-0'
            : ''
        }
      >
        {dialog && (
          <LeadFormDialog
            open
            onOpenChange={(open) => {
              if (!open) onCloseDialog()
            }}
            lead={dialog.lead ?? undefined}
            mode={dialog.mode}
            onSubmitSuccess={reload}
          />
        )}

        {isListLoading && viewType === 'list' && (
          <DataGridSkeleton>
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        )}

        {isBoardLoading && viewType === 'board' && (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-96 w-80 shrink-0 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        )}

        {viewType === 'list' && listError && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t('leads.errorLoading')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{listError.message}</p>
            </CardContent>
          </Card>
        )}

        {viewType === 'board' && boardError && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t('leads.errorLoading')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{boardError.message}</p>
            </CardContent>
          </Card>
        )}

        {viewType === 'list' &&
          !isListLoading &&
          !listError &&
          listLeads.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-medium">{t('leads.emptyTitle')}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('leads.emptyDescription')}
                </p>
                <MotionButton className="mt-4" onClick={onOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('leads.createLead')}
                </MotionButton>
              </CardContent>
            </Card>
          )}

        {viewType === 'list' &&
          !isListLoading &&
          !listError &&
          listLeads.length > 0 && (
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

        {viewType === 'board' && !isBoardLoading && !boardError && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="mb-4 shrink-0">{boardToolbar}</div>
            <div className="min-h-0 flex-1 overflow-hidden">{board}</div>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
