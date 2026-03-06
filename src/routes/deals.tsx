import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Columns3, DollarSign, List, Plus, Trash2 } from 'lucide-react'
import type { RowChange } from '@/components/docyrus/data-grid'
import type { ICollectionListParams } from '@/collections/types'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import { useEnumEntities } from '@/hooks/use-enums'
import { useDeals, useDeleteDeal, useUpdateDeal } from '@/hooks/use-deals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DealFormDialog } from '@/components/deals/deal-form-dialog'
import { DataGridStandardToolbar } from '@/components/docyrus/data-grid-standard-toolbar'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { getDataGridRowActionsColumn } from '@/components/docyrus/data-grid-row-actions-column'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridSelectColumn,
  useDataGrid,
} from '@/components/docyrus/data-grid'
import { getDealsColumns } from '@/components/deals/deals-columns'
import { DealsKanbanView } from '@/components/deals/deals-kanban-view'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'

type DealsView = 'board' | 'list'

export function Deals() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [viewType, setViewType] = useState<DealsView>('list')
  const {
    data: deals,
    isLoading,
    error,
  } = useDeals(undefined, {
    enabled: viewType === 'list',
  })
  const deleteDeal = useDeleteDeal()
  const updateDeal = useUpdateDeal()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [activeDeal, setActiveDeal] = useState<any>(null)
  const [deleteTargets, setDeleteTargets] = useState<Array<any>>([])
  const {
    data: dealStages = [],
    isLoading: isDealStagesLoading,
    error: dealStagesError,
  } = useEnumEntities('stage', {
    appSlug: 'base_crm',
    dataSourceSlug: 'deals',
    enabled: viewType === 'board',
  })

  const finalDealStageIds = useMemo(
    () =>
      dealStages
        .filter((status) => status.isFinalOption)
        .map((status) => status.id),
    [dealStages],
  )
  const dealBoardParams = useMemo<ICollectionListParams | undefined>(() => {
    const params: ICollectionListParams = {
      columns: [
        'id',
        'record_owner',
        'expected_revenue',
        'deal_value',
        'stage',
        'organization(id,name,company_logo)',
        'contact_person(id,name)',
        'hot_prospect',
        'expected_closing_date',
        'close_probability',
        'customer_type',
        'lead_source',
        'created_on',
      ],
      orderBy: 'created_on DESC',
    }

    if (finalDealStageIds.length === 0) return params

    return {
      ...params,
      filters: {
        combinator: 'and',
        rules: [
          {
            field: 'stage',
            operator: 'not in',
            value: finalDealStageIds,
          },
        ],
      },
    }
  }, [finalDealStageIds])
  const {
    data: boardDeals,
    isLoading: isBoardLoading,
    error: boardError,
  } = useDeals(dealBoardParams, {
    enabled: viewType === 'board' && !isDealStagesLoading && !dealStagesError,
  })

  const onOpenCreate = useCallback(() => {
    setFormMode('create')
    setActiveDeal(null)
    setIsFormOpen(true)
  }, [])

  const onOpenEdit = useCallback((deal: any) => {
    setFormMode('edit')
    setActiveDeal(deal)
    setIsFormOpen(true)
  }, [])

  const onDuplicate = useCallback((deal: any) => {
    setFormMode('create')
    setActiveDeal(buildDuplicatePayload(deal))
    setIsFormOpen(true)
  }, [])

  const onView = useCallback(
    (deal: any) => {
      if (!deal?.id) return

      void navigate({
        to: '/deals/$dealId',
        params: { dealId: deal.id },
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

    await Promise.all(ids.map((id) => deleteDeal.mutateAsync(id)))
    setDeleteTargets([])
  }, [deleteDeal, deleteTargets])

  const onDeleteDialogOpenChange = useCallback((open: boolean) => {
    if (!open) setDeleteTargets([])
  }, [])

  const baseColumns = useMemo(() => getDealsColumns(), [])
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
        updateDeal.mutateAsync({ dealId: id, data }),
      )
    },
    [updateDeal],
  )
  const onDealStageChange = useCallback(
    (deal: any, stageId: string) => {
      if (!deal?.id) return Promise.resolve()

      return updateDeal.mutateAsync({
        dealId: deal.id,
        data: { stage: stageId },
      })
    },
    [updateDeal],
  )

  const { table, ...dataGridProps } = useDataGrid({
    data: deals || [],
    columns,
    getRowId: (row: any) => row.id,
    readOnly: false,
    enableGrouping: true,
    enableChangeTracking: true,
    onChangesSave,
  })
  const activeError =
    viewType === 'board' ? (dealStagesError ?? boardError) : error
  const isBoardPending =
    viewType === 'board' && (isDealStagesLoading || isBoardLoading)

  return (
    <>
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
          <Button size="sm" onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('deals.newDeal')}
          </Button>
        }
      />
      <PageContainer
        className={viewType === 'board' ? 'max-w-full overflow-x-auto' : ''}
      >
        <DealFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)

            if (!open) {
              setActiveDeal(null)
              setFormMode('create')
            }
          }}
          deal={activeDeal ?? undefined}
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
                {t('deals.errorLoading')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{activeError.message}</p>
            </CardContent>
          </Card>
        )}

        {viewType === 'list' && deals && deals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">{t('deals.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('deals.emptyDescription')}
              </p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('deals.createDeal')}
              </Button>
            </CardContent>
          </Card>
        )}

        {deals && deals.length > 0 && viewType === 'list' && (
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
          isPending={deleteDeal.isPending}
        />

        {viewType === 'board' && dealStages.length > 0 && !activeError && (
          <DealsKanbanView
            deals={boardDeals ?? []}
            statuses={dealStages}
            onStageChange={onDealStageChange}
          />
        )}
      </PageContainer>
    </>
  )
}
