import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckSquare, Plus, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { RowChange } from '@/components/docyrus/data-grid'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridSelectColumn,
  useDataGrid,
} from '@/components/docyrus/data-grid'
import { DataGridStandardToolbar } from '@/components/docyrus/data-grid-standard-toolbar'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { getDataGridRowActionsColumn } from '@/components/docyrus/data-grid-row-actions-column'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { useDeleteTask, useTasks, useUpdateTask } from '@/hooks/use-tasks'
import { TaskFormSheet } from '@/components/tasks/task-form-sheet'
import { Card, CardContent } from '@/components/ui/card'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'

export function Tasks() {
  const { t } = useTranslation()
  const { data: tasks, isLoading } = useTasks()
  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [activeTask, setActiveTask] = useState<any>(null)
  const [deleteTargets, setDeleteTargets] = useState<Array<any>>([])

  const onOpenCreate = () => {
    setFormMode('create')
    setActiveTask(null)
    setIsFormOpen(true)
  }

  const onOpenEdit = (task: any) => {
    setFormMode('edit')
    setActiveTask(task)
    setIsFormOpen(true)
  }

  const onDuplicate = (task: any) => {
    setFormMode('create')
    setActiveTask(buildDuplicatePayload(task))
    setIsFormOpen(true)
  }

  const onDeleteRequest = (rows: Array<any>) => {
    if (rows.length === 0) return

    setDeleteTargets(rows)
  }

  const onDeleteConfirm = async () => {
    const ids = deleteTargets
      .map((row) => row?.id)
      .filter(Boolean) as Array<string>

    await Promise.all(ids.map((id) => deleteTask.mutateAsync(id)))
    setDeleteTargets([])
  }

  const onChangesSave = async (
    changes: Array<RowChange>,
    gridData: Array<any>,
  ) => {
    await saveGridChanges(changes, gridData, (id, data) =>
      updateTask.mutateAsync({ taskId: id, data }),
    )
  }

  const columns = useMemo<Array<ColumnDef<any>>>(() => {
    const baseColumns: Array<ColumnDef<any>> = [
      {
        accessorKey: 'subject',
        header: t('tasks.columns.subject'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 250,
      },
      {
        id: 'status',
        accessorFn: (row) =>
          typeof row.status === 'object'
            ? (row.status?.name ?? '')
            : (row.status ?? ''),
        header: t('tasks.columns.status'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 130,
      },
      {
        accessorKey: 'start_date',
        header: t('tasks.columns.startDate'),
        meta: { cell: { variant: 'date' } },
        enableSorting: true,
        size: 130,
      },
      {
        accessorKey: 'end_date',
        header: t('tasks.columns.dueDate'),
        meta: { cell: { variant: 'date' } },
        enableSorting: true,
        size: 130,
      },
      {
        id: 'organization',
        accessorFn: (row) =>
          typeof row.organization === 'object'
            ? (row.organization?.name ?? '')
            : (row.organization ?? ''),
        header: t('tasks.columns.organization'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 180,
      },
      {
        id: 'record_owner',
        accessorFn: (row) => {
          const owner = row.record_owner
          if (!owner) return ''
          if (typeof owner === 'object') {
            return (
              [owner.firstname, owner.lastname].filter(Boolean).join(' ') ||
              owner.email ||
              ''
            )
          }
          return String(owner)
        },
        header: t('tasks.columns.owner'),
        meta: { cell: { variant: 'short-text' } },
        enableSorting: true,
        size: 160,
      },
    ]

    return [
      getDataGridSelectColumn<any>(),
      getDataGridRowActionsColumn<any>({
        onView: onOpenEdit,
        onEdit: onOpenEdit,
        onDuplicate,
        onDelete: (row) => onDeleteRequest([row]),
      }),
      ...baseColumns,
    ]
  }, [t])

  const { table, ...dataGridProps } = useDataGrid({
    data: tasks || [],
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
        title={t('tasks.title')}
        icon={<CheckSquare className="h-4 w-4 text-emerald-500" />}
        actions={
          <Button size="sm" onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('tasks.newTask')}
          </Button>
        }
      />
      <PageContainer>
        <TaskFormSheet
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)
            if (!open) {
              setActiveTask(null)
              setFormMode('create')
            }
          }}
          mode={formMode}
          task={activeTask ?? undefined}
        />

        {isLoading && (
          <DataGridSkeleton>
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        )}

        {!isLoading && tasks && tasks.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t('tasks.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('tasks.emptyDescription')}
              </p>
              <Button className="mt-4" onClick={onOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('tasks.createTask')}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && tasks && tasks.length > 0 && (
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
          onOpenChange={(open) => {
            if (!open) setDeleteTargets([])
          }}
          recordCount={deleteTargets.length}
          onConfirm={onDeleteConfirm}
          isPending={deleteTask.isPending}
        />
      </PageContainer>
    </>
  )
}
