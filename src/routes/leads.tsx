import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import { toast } from 'sonner'
import {
  Columns3,
  Copy,
  Eye,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
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
import { LeadConvertDialog } from '@/components/leads/lead-convert-dialog'
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
import { isLeadConvertedRecord } from '@/lib/lead-conversion'
import { useDateFormat } from '@/lib/use-date-format'

type LeadsView = 'board' | 'list'

type LeadFormMode = 'create' | 'edit'

type LeadFormRecord = BaseCrmLeadsEntity | Record<string, unknown>

interface LeadDialogState {
  mode: LeadFormMode
  lead: LeadFormRecord | null
}

function isLeadConverted(lead: BaseCrmLeadsEntity | Record<string, unknown>) {
  return isLeadConvertedRecord(lead)
}

const APP_SLUG = 'base_crm'
const DATA_SOURCE_SLUG = 'leads'

const LEAD_GRID_COLUMN_OVERRIDES: Record<
  string,
  Partial<ColumnDef<BaseCrmLeadsEntity>>
> = {
  title: { size: 240 },
  company_name_text: { size: 200 },
  lead_status: { size: 150 },
  lead_source: { size: 160 },
  email: { size: 220 },
  phone: { size: 170 },
  created_on: { size: 180 },
}

const LEAD_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(LEAD_GRID_COLUMN_OVERRIDES),
)

const LEAD_GRID_LIST_COLUMNS = [
  'id',
  'title',
  'company_name_text',
  'lead_status(id,name)',
  'lead_source(id,name)',
  'email',
  'phone',
  'created_on',
  'converted_deal(id,name)',
  'conversion_state(id,name)',
  'converted_on',
].join(', ')

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
  const [convertLead, setConvertLead] = useState<BaseCrmLeadsEntity | null>(
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

  const onOpenEdit = useCallback(
    (lead: BaseCrmLeadsEntity) => {
      if (isLeadConverted(lead)) {
        toast.error(t('leads.convert.readOnlyDescription'))
        return
      }

      setDialog({ mode: 'edit', lead })
    },
    [t],
  )

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

  const onDelete = useCallback(
    (lead: BaseCrmLeadsEntity) => {
      if (!lead.id) return
      if (isLeadConverted(lead)) {
        toast.error(t('leads.convert.readOnlyDescription'))
        return
      }

      setPendingDelete(lead)
    },
    [t],
  )

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
                {!isLeadConverted(row.original) && (
                  <DropdownMenuItem onClick={() => onOpenEdit(row.original)}>
                    <Pencil className="size-4" />
                    {t('common.edit', 'Edit')}
                  </DropdownMenuItem>
                )}
                {!isLeadConverted(row.original) && (
                  <DropdownMenuItem
                    onClick={() => setConvertLead(row.original)}
                  >
                    <RefreshCw className="size-4" />
                    {t('leads.convert.convertButton')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDuplicate(row.original)}>
                  <Copy className="size-4" />
                  {t('common.duplicate', 'Duplicate')}
                </DropdownMenuItem>
                {!isLeadConverted(row.original) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(row.original)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      {t('common.delete', 'Delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }),
    [onDelete, onDuplicate, onOpenEdit, onView, t],
  )

  const openWizardRef = useRef<() => void>(() => {})
  const listLeadsRef = useRef<Array<BaseCrmLeadsEntity>>([])
  const reloadListRef = useRef<() => void>(() => {})
  const reloadBoardRef = useRef<() => void>(() => {})

  const onChangesSave = useCallback(
    async (changes: Array<RowChange>, gridData: Array<BaseCrmLeadsEntity>) => {
      const allowedChanges = changes.filter((change) => {
        const currentRow = gridData[change.rowIndex]
        const originalRow =
          listLeadsRef.current.find((row) => row.id === change.rowId) ??
          currentRow

        return (
          Boolean(currentRow) &&
          !isLeadConverted(originalRow) &&
          !isLeadConverted(currentRow)
        )
      })
      const blockedCount = changes.length - allowedChanges.length

      if (blockedCount > 0) {
        toast.error(t('leads.convert.readOnlyDescription'))
      }

      if (allowedChanges.length === 0) {
        reloadListRef.current()
        reloadBoardRef.current()
        return
      }

      await saveGridChanges(allowedChanges, gridData, (id, data) =>
        updateLead.mutateAsync({ leadId: id, data }),
      )

      if (blockedCount > 0) {
        reloadListRef.current()
        reloadBoardRef.current()
      }
    },
    [t, updateLead],
  )

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
    listParams: {
      columns: LEAD_GRID_LIST_COLUMNS,
    },
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
    titleColumn: 'name',
    descriptionColumn: 'email',
    avatarColumn: 'lead_source',
    userColumn: 'record_owner',
    cardContent: ({ row }) => {
      const companyName = row.company_name_text
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
    cardMenuItems: (row, defaults) =>
      isLeadConverted(row)
        ? defaults.filter((item) => item.key === 'open')
        : defaults,
    onCardDelete: async (row) => {
      if (!row.id) return
      if (isLeadConverted(row)) {
        toast.error(t('leads.convert.readOnlyDescription'))
        reloadList()
        reloadBoardRef.current()
        return
      }

      await deleteLead.mutateAsync(row.id)
      reloadList()
      reloadBoardRef.current()
    },
    onItemMoveCommit: async ({ row, payload }) => {
      if (!row.id) return
      if (isLeadConverted(row)) {
        toast.error(t('leads.convert.readOnlyDescription'))
        reloadList()
        reloadBoardRef.current()
        return
      }

      await updateLead.mutateAsync({ leadId: row.id, data: payload })
      reloadList()
      reloadBoardRef.current()
    },
    enableItemsQuery: viewType === 'board',
    listParams: {
      columns:
        'id, name, phone, email, website, company_name_text, company_email, company_phone, company_industry, company_size, lead_source(id,name), lead_status(id,name), lead_type(id,name), countries(id,name), record_owner, deal_value, converted_deal(id,name), converted_organization(id,name), converted_contact(id,name), conversion_state(id,name), converted_on, created_on, last_modified_on, created_by, last_modified_by',
      orderBy: 'created_on DESC',
      limit: 200,
    },
    searchPlaceholder: t('common.search', 'Search...'),
    toolbarEndContent: importToolbarButton,
  })

  listLeadsRef.current = listLeads
  reloadListRef.current = reloadList
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
    if (isLeadConverted(pendingDelete)) {
      toast.error(t('leads.convert.readOnlyDescription'))
      setPendingDelete(null)
      return
    }

    setIsDeleting(true)

    try {
      await deleteLead.mutateAsync(pendingDelete.id)
      setPendingDelete(null)
      reload()
    } finally {
      setIsDeleting(false)
    }
  }, [deleteLead, pendingDelete, reload, t])

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

        {convertLead && (
          <LeadConvertDialog
            open
            onOpenChange={(open) => {
              if (!open) {
                setConvertLead(null)
                reload()
              }
            }}
            lead={convertLead}
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
