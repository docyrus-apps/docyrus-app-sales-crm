import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Columns3, List, Plus, Trash2, UserRoundSearch } from 'lucide-react'
import type {
  RowChange,
  SavedDataGridView,
} from '@/components/docyrus/data-grid'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import { SearchInput } from '@/components/docyrus/search-input'
import { DataGridToolbar } from '@/components/docyrus/data-grid/data-grid-toolbar'
import { DataGridViewSelect } from '@/components/docyrus/data-grid-view-select'
import type { ICollectionListParams } from '@/collections/types'
import {
  parseConfigDataViews,
  useConfigDataViews,
} from '@/hooks/use-config-data-views'
import { mapEnumEntitiesToCellOptions, useEnumEntities } from '@/hooks/use-enums'
import { useDeleteLead, useLeads, useUpdateLead } from '@/hooks/use-leads'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeadFormDialog } from '@/components/leads/lead-form-dialog'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { getDataGridRowActionsColumn } from '@/components/docyrus/data-grid-row-actions-column'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  applyViewToTable,
  captureViewSnapshot,
  getDataGridSelectColumn,
  useDataGrid,
} from '@/components/docyrus/data-grid'
import { getLeadsColumns } from '@/components/leads/leads-columns'
import { LeadsKanbanView } from '@/components/leads/leads-kanban-view'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'

type LeadsView = 'board' | 'list'

const LEADS_APP_ID = '019c4b95-bd68-768f-b0d9-b5f9ad0a91d7'
const LEADS_DATA_SOURCE_ID = '019c48d0-5c6f-77aa-ba5a-3a3065c46036'

const LEAD_STATUS_LABEL_BY_ID = {
  '019c48d0-68ac-7b9e-bfc6-c3828e37e886': 'New Leads',
  '019c48d0-6907-7a10-9f4f-f1cfb1d3f94c': 'Converted',
  '019c48d0-68e4-7f1f-bdcf-54b210ec43d1': 'Disqualified',
} as const

const PINNED_START_COLUMN_IDS = ['select', 'actions'] as const
const PINNED_START_COLUMN_ID_SET = new Set<string>(PINNED_START_COLUMN_IDS)

function ensurePinnedStartColumns(view: SavedDataGridView): SavedDataGridView {
  return {
    ...view,
    columnOrder: [
      ...PINNED_START_COLUMN_IDS,
      ...view.columnOrder.filter(
        (columnId) => !PINNED_START_COLUMN_ID_SET.has(columnId),
      ),
    ],
    columnPinning: {
      left: [
        ...PINNED_START_COLUMN_IDS,
        ...(view.columnPinning.left ?? []).filter(
          (columnId) => !PINNED_START_COLUMN_ID_SET.has(columnId),
        ),
      ],
      right: (view.columnPinning.right ?? []).filter(
        (columnId) => !PINNED_START_COLUMN_ID_SET.has(columnId),
      ),
    },
  }
}

export function Leads() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [viewType, setViewType] = useState<LeadsView>('board')
  const {
    data: leads,
    isLoading,
    error,
  } = useLeads(undefined, {
    enabled: viewType === 'list',
  })
  const { data: configDataViews } = useConfigDataViews(
    LEADS_APP_ID,
    LEADS_DATA_SOURCE_ID,
  )
  const deleteLead = useDeleteLead()
  const updateLead = useUpdateLead()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [activeLead, setActiveLead] = useState<any>(null)
  const [deleteTargets, setDeleteTargets] = useState<Array<any>>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeViewId, setActiveViewId] = useState('')
  const {
    data: leadStatuses = [],
    isLoading: isLeadStatusesLoading,
    error: leadStatusesError,
  } = useEnumEntities('lead_status', {
    appSlug: 'base_crm',
    dataSourceSlug: 'leads',
  })
  const { data: leadSources = [] } = useEnumEntities('lead_source', {
    appSlug: 'base_crm',
    dataSourceSlug: 'leads',
  })

  const finalLeadStatusIds = useMemo(
    () =>
      leadStatuses
        .filter((status) => status.isFinalOption)
        .map((status) => status.id),
    [leadStatuses],
  )
  const leadBoardParams = useMemo<ICollectionListParams | undefined>(() => {
    const params: ICollectionListParams = {
      columns: [
        'id',
        'title',
        'phone',
        'email',
        'website',
        'lead_source',
        'lead_status',
        'lead_type',
        'company_name(id,name,company_logo)',
        'countries(id,name)',
        'record_owner',
        'created_on',
      ],
      orderBy: 'created_on DESC',
    }

    if (finalLeadStatusIds.length === 0) return params

    return {
      ...params,
      filters: {
        combinator: 'and',
        rules: [
          {
            field: 'lead_status',
            operator: 'not in',
            value: finalLeadStatusIds,
          },
        ],
      },
    }
  }, [finalLeadStatusIds])
  const {
    data: boardLeads,
    isLoading: isBoardLoading,
    error: boardError,
  } = useLeads(leadBoardParams, {
    enabled:
      viewType === 'board' && !isLeadStatusesLoading && !leadStatusesError,
  })

  const onOpenCreate = useCallback(() => {
    setFormMode('create')
    setActiveLead(null)
    setIsFormOpen(true)
  }, [])

  const onOpenEdit = useCallback((lead: any) => {
    setFormMode('edit')
    setActiveLead(lead)
    setIsFormOpen(true)
  }, [])

  const onDuplicate = useCallback((lead: any) => {
    setFormMode('create')
    setActiveLead(buildDuplicatePayload(lead))
    setIsFormOpen(true)
  }, [])

  const onView = useCallback(
    (lead: any) => {
      if (!lead?.id) return

      void navigate({
        to: '/leads/$leadId',
        params: { leadId: lead.id },
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

    await Promise.all(ids.map((id) => deleteLead.mutateAsync(id)))
    setDeleteTargets([])
  }, [deleteLead, deleteTargets])

  const onDeleteDialogOpenChange = useCallback((open: boolean) => {
    if (!open) setDeleteTargets([])
  }, [])

  const leadStatusOptions = useMemo(
    () => mapEnumEntitiesToCellOptions(leadStatuses),
    [leadStatuses],
  )
  const leadSourceOptions = useMemo(
    () => mapEnumEntitiesToCellOptions(leadSources),
    [leadSources],
  )
  const baseColumns = useMemo(
    () =>
      getLeadsColumns({
        leadStatusOptions,
        leadSourceOptions,
      }),
    [leadSourceOptions, leadStatusOptions],
  )
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
        updateLead.mutateAsync({ leadId: id, data }),
      )
    },
    [updateLead],
  )

  const { table, ...dataGridProps } = useDataGrid({
    data: leads || [],
    columns,
    getRowId: (row: any) => row.id,
    readOnly: false,
    enableGrouping: true,
    enableChangeTracking: true,
    onChangesSave,
  })

  const fallbackView = useMemo(
    () => ({
      id: 'default-view',
      name: 'All',
      ...captureViewSnapshot(table),
    }),
    [table],
  )

  const gridViews = useMemo(() => {
    if (!configDataViews || configDataViews.length === 0) {
      return [ensurePinnedStartColumns(fallbackView)]
    }

    return parseConfigDataViews(configDataViews, {
      statusLabelById: LEAD_STATUS_LABEL_BY_ID,
    }).map(ensurePinnedStartColumns)
  }, [configDataViews, fallbackView])

  useEffect(() => {
    const activeExists = gridViews.some((view) => view.id === activeViewId)

    if (activeExists) return

    const nextDefault =
      gridViews.find((view) => view.name === 'All') ?? gridViews[0]

    if (!nextDefault) return

    setActiveViewId(nextDefault.id)
  }, [activeViewId, gridViews])

  useEffect(() => {
    const activeView = gridViews.find((view) => view.id === activeViewId)

    if (!activeView) return

    applyViewToTable(table, activeView)
  }, [activeViewId, gridViews, table])

  const onSearch = useCallback(
    (value: string) => {
      const nextValue = value.trim()
      table.setGlobalFilter(nextValue.length > 0 ? nextValue : undefined)
    },
    [table],
  )
  const onLeadStatusChange = useCallback(
    (lead: any, statusId: string) => {
      if (!lead?.id) return Promise.resolve()

      return updateLead.mutateAsync({
        leadId: lead.id,
        data: { lead_status: statusId },
      })
    },
    [updateLead],
  )
  const activeError =
    viewType === 'board' ? (leadStatusesError ?? boardError) : error
  const isBoardPending =
    viewType === 'board' && (isLeadStatusesLoading || isBoardLoading)

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
          <Button size="sm" onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('leads.newLead')}
          </Button>
        }
      />
      <PageContainer
        className={
          viewType === 'board'
            ? 'flex min-h-0 flex-1 max-w-full flex-col overflow-hidden pb-0'
            : ''
        }
      >
        <LeadFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)

            if (!open) {
              setActiveLead(null)
              setFormMode('create')
            }
          }}
          lead={activeLead ?? undefined}
          mode={formMode}
        />

        {isLoading && viewType === 'list' && (
          <DataGridSkeleton>
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        )}

        {isBoardPending && (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-96 w-80 shrink-0 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        )}

        {activeError && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t('leads.errorLoading')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{activeError.message}</p>
            </CardContent>
          </Card>
        )}

        {viewType === 'list' && leads && leads.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">{t('leads.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('leads.emptyDescription')}
              </p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('leads.createLead')}
              </Button>
            </CardContent>
          </Card>
        )}

        {leads && leads.length > 0 && viewType === 'list' && (
          <>
            <DataGridToolbar
              table={table}
              enableView={false}
              enableDisplayMode
              enableGroup
              startContent={
                <>
                  <DataGridViewSelect
                    table={table}
                    variant="horizontal-tabs"
                    views={gridViews}
                    activeViewId={activeViewId}
                    onViewChange={(view) => setActiveViewId(view.id)}
                  />
                  <SearchInput
                    value={searchKeyword}
                    onValueChange={setSearchKeyword}
                    onSearch={onSearch}
                    placeholder={t('common.search', 'Search...')}
                    size="sm"
                    className="w-56 min-w-40"
                  />
                </>
              }
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
          isPending={deleteLead.isPending}
        />

        {viewType === 'board' && leadStatuses.length > 0 && !activeError && (
          <LeadsKanbanView
            leads={boardLeads ?? []}
            statuses={leadStatuses}
            onStatusChange={onLeadStatusChange}
          />
        )}
      </PageContainer>
    </div>
  )
}
