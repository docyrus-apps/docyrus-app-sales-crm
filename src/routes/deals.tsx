import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import {
  Columns3,
  DollarSign,
  List,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import type { BaseCrmDealsEntity } from '@/collections/base_crm-deals.collection'
import { useBaseCrmDealsCollection } from '@/collections/base_crm-deals.collection'
import { Button as MotionButton } from '@/components/animate-ui/components/buttons/button'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import {
  DataGrid,
  DataGridRowActions,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridActionsColumn,
  type RowChange,
} from '@/components/docyrus/data-grid'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { DealFormDialog } from '@/components/deals/deal-form-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  mapEnumEntitiesToCellOptions,
  useEnumEntities,
} from '@/hooks/use-enums'
import { useDeleteDeal, useUpdateDeal } from '@/hooks/use-deals'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { useDocyrusDataGrid } from '@/hooks/use-docyrus-data-grid'
import { useSeedDefaultViews } from '@/hooks/use-seed-default-views'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import { useDocyrusKanban } from '@/hooks/use-docyrus-kanban'
import { saveGridChanges } from '@/lib/data-grid-record-utils'
import { createSystemViews } from '@/lib/crm-system-views'
import { useDateFormat } from '@/lib/use-date-format'

type DealsView = 'board' | 'list'

type DealFormMode = 'create' | 'edit'

type DealFormRecord = BaseCrmDealsEntity | Record<string, unknown>

interface DealDialogState {
  mode: DealFormMode
  deal: DealFormRecord | null
}

const APP_SLUG = 'base_crm'
const DATA_SOURCE_SLUG = 'deal'

const DEAL_GRID_COLUMN_OVERRIDES: Record<
  string,
  Partial<ColumnDef<BaseCrmDealsEntity>>
> = {
  stage: { size: 160 },
  deal_value: { size: 140 },
  expected_revenue: { size: 180 },
  organization: { size: 180 },
  contact_person: { size: 160 },
  close_probability: { size: 120 },
  expected_closing_date: { size: 140 },
}

const DEAL_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(DEAL_GRID_COLUMN_OVERRIDES),
)

const DEAL_GRID_COLUMNS = Object.keys(DEAL_GRID_COLUMN_OVERRIDES)

const DEAL_GRID_SYSTEM_VIEWS = createSystemViews('base-crm-deal', [
  {
    id: 'all',
    name: 'All',
    columns: DEAL_GRID_COLUMNS,
    sorting: [{ id: 'created_on', desc: true }],
  },
])

export function Deals() {
  const client = useDocyrusClient()

  if (!client) return null

  return <DealsPageInner client={client} />
}

function DealsPageInner({
  client,
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const collection = useBaseCrmDealsCollection()
  const deleteDeal = useDeleteDeal()
  const updateDeal = useUpdateDeal()
  const { formatDate, formatDateTime } = useDateFormat()

  useSeedDefaultViews({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    templates: DEAL_GRID_SYSTEM_VIEWS,
    pruneUnlisted: true,
  })

  const [viewType, setViewType] = useState<DealsView>('board')
  const [dialog, setDialog] = useState<DealDialogState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<BaseCrmDealsEntity | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: dealStages = [] } = useEnumEntities('stage', {
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
  })

  const stageOptions = useMemo(
    () => mapEnumEntitiesToCellOptions(dealStages),
    [dealStages],
  )

  const onOpenCreate = useCallback(() => {
    setDialog({ mode: 'create', deal: null })
  }, [])

  const onOpenEdit = useCallback((deal: BaseCrmDealsEntity) => {
    setDialog({ mode: 'edit', deal })
  }, [])

  const onCloseDialog = useCallback(() => {
    setDialog(null)
  }, [])

  const onView = useCallback(
    (deal: BaseCrmDealsEntity) => {
      if (!deal.id) return

      void navigate({
        to: '/deals/$dealId',
        params: { dealId: deal.id },
        search: { tab: 'activity' },
      })
    },
    [navigate],
  )

  const onDelete = useCallback((deal: BaseCrmDealsEntity) => {
    if (!deal.id) return

    setPendingDelete(deal)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseCrmDealsEntity>>(
    () =>
      getDataGridActionsColumn<BaseCrmDealsEntity>({
        actionCount: 2,
        cell: ({ row }) => (
          <DataGridRowActions
            row={row.original}
            openPageLabel={t('deals.viewDeal', 'View deal')}
            actionsLabel={t('common.actions', 'Actions')}
            onOpenPage={onView}
            actions={[
              {
                key: 'edit',
                label: t('common.edit', 'Edit'),
                icon: <Pencil className="size-4" />,
                onSelect: onOpenEdit,
              },
              {
                key: 'open',
                label: t('common.openPage', 'Open page'),
                icon: <DocyrusIcon icon="huge sidebar-right-01" size="sm" />,
                onSelect: onView,
              },
              {
                key: 'delete',
                label: t('common.delete', 'Delete'),
                icon: <Trash2 className="size-4" />,
                destructive: true,
                onSelect: onDelete,
              },
            ]}
          />
        ),
      }),
    [onDelete, onOpenEdit, onView, t],
  )

  const onChangesSave = useCallback(
    async (changes: Array<RowChange>, gridData: Array<BaseCrmDealsEntity>) => {
      await saveGridChanges(changes, gridData, (id, data) =>
        updateDeal.mutateAsync({ dealId: id, data }),
      )
    },
    [updateDeal],
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
    pagingMode,
    toolbar,
    items: listDeals,
    reload: reloadList,
    dataSource: listDataSource,
    isLoading: isListLoading,
    error: listError,
  } = useDocyrusDataGrid<BaseCrmDealsEntity>({
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
    getRowLabel: (row) =>
      row.name ||
      (row.autonumber_id != null ? String(row.autonumber_id) : undefined) ||
      row.id ||
      t('deals.title'),
    mapColumn: (field, defaultColumn) => {
      if (!DEAL_GRID_VISIBLE_FIELDS.has(field.slug)) return null

      if (field.slug === 'stage') {
        return {
          ...defaultColumn,
          ...DEAL_GRID_COLUMN_OVERRIDES[field.slug],
          meta: {
            ...defaultColumn.meta,
            cell: {
              ...(defaultColumn.meta?.cell ?? {}),
              options: stageOptions,
            },
          },
        }
      }

      return {
        ...defaultColumn,
        ...DEAL_GRID_COLUMN_OVERRIDES[field.slug],
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
  } = useDocyrusKanban<BaseCrmDealsEntity>({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    collection: {
      list: (params) => collection.list(params),
    },
    groupByFieldSlug: 'stage',
    avatarColumn: 'stage',
    titleColumn: 'autonumber_id',
    descriptionColumn: 'name',
    userColumn: 'record_owner',
    cardContent: ({ row }) => {
      const organizationName =
        typeof row.organization === 'object'
          ? row.organization?.name
          : row.organization
      const contactName =
        typeof row.contact_person === 'object'
          ? row.contact_person?.name
          : row.contact_person
      const dealValue = row.deal_value ?? row.expected_revenue ?? 0
      const closeDate = row.expected_closing_date
        ? new Date(row.expected_closing_date)
        : null
      const closeDateLabel =
        closeDate && !Number.isNaN(closeDate.getTime())
          ? closeDate.toLocaleDateString()
          : t('deals.noCloseDate', 'No close date')

      return (
        <div className="space-y-2">
          {organizationName ? (
            <p className="text-xs font-medium text-foreground">
              {organizationName}
            </p>
          ) : null}
          {contactName ? (
            <p className="text-xs text-muted-foreground">{contactName}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span>
              {t('deals.columns.value', 'Value')}: {dealValue}
            </span>
            <span>
              {t('deals.columns.probability', 'Probability')}:{' '}
              {row.close_probability ?? 0}%
            </span>
          </div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {closeDateLabel}
          </p>
          {row.hot_prospect ? (
            <Badge variant="secondary" className="w-fit">
              {t('deals.hotProspect', 'Hot prospect')}
            </Badge>
          ) : null}
        </div>
      )
    },
    onCardOpen: onView,
    onCardEdit: onOpenEdit,
    onCardClick: onView,
    cardMenuItems: (_row, defaults) => {
      const openItem = defaults.find((item) => item.key === 'open')
      const editItem = defaults.find((item) => item.key === 'edit')
      const deleteItem = defaults.find((item) => item.key === 'delete')

      return [
        ...(editItem
          ? [
              {
                ...editItem,
                icon: <Pencil className="size-4" />,
              },
            ]
          : []),
        ...(openItem
          ? [
              {
                ...openItem,
                label: t('common.openPage', 'Open page'),
                icon: <DocyrusIcon icon="huge sidebar-right-01" size="sm" />,
              },
            ]
          : []),
        ...(deleteItem
          ? [
              {
                ...deleteItem,
                icon: <Trash2 className="size-4" />,
              },
            ]
          : []),
      ]
    },
    onCardDelete: async (row) => {
      if (!row.id) return

      await deleteDeal.mutateAsync(row.id)
      reloadList()
      reloadBoardRef.current()
    },
    onItemMoveCommit: async ({ row, payload }) => {
      if (!row.id) return

      await updateDeal.mutateAsync({ dealId: row.id, data: payload })
      reloadList()
      reloadBoardRef.current()
    },
    enableItemsQuery: viewType === 'board',
    enableViewSelect: false,
    listParams: {
      columns:
        'id, name, autonumber_id, record_owner(id,firstname,lastname,email,photo), expected_revenue, deal_value, stage, organization(id,name,company_logo), contact_person(id,name), hot_prospect, expected_closing_date, close_probability, customer_type, lead_source, created_on, last_modified_on, created_by, last_modified_by',
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
      await deleteDeal.mutateAsync(pendingDelete.id)
      setPendingDelete(null)
      reload()
    } finally {
      setIsDeleting(false)
    }
  }, [deleteDeal, pendingDelete, reload])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={t('deals.title')}
        icon={<DollarSign className="h-4 w-4 text-amber-500" />}
        titleSuffix={
          <Tabs
            value={viewType}
            onValueChange={(value) => setViewType(value as DealsView)}
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
            {t('deals.newDeal')}
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
          <DealFormDialog
            open
            onOpenChange={(open) => {
              if (!open) onCloseDialog()
            }}
            deal={dialog.deal ?? undefined}
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
                {t('deals.errorLoading')}
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
                {t('deals.errorLoading')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{boardError.message}</p>
            </CardContent>
          </Card>
        )}

        {viewType === 'list' && !isListLoading && !listError && (
          <div className="space-y-4">
            {toolbar}
            {listDeals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-lg font-medium">{t('deals.emptyTitle')}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('deals.emptyDescription')}
                  </p>
                  <MotionButton className="mt-4" onClick={onOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('deals.createDeal')}
                  </MotionButton>
                </CardContent>
              </Card>
            ) : (
              <DataGrid
                table={table}
                {...gridProps}
                pagingMode={pagingMode}
                height={600}
              />
            )}
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
