import { useCallback, useMemo, useRef, useState } from 'react'

import { type ColumnDef } from '@tanstack/react-table'

import type { CellUserOption, RowChange } from '@/components/docyrus/data-grid'

import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import { CheckSquare, Pencil, Plus, Trash2, Upload } from 'lucide-react'

import { type BaseTaskEntity } from '@/collections/base-task.collection'

import { useBaseTaskCollection } from '@/collections/base-task.collection'
import { Button as MotionButton } from '@/components/animate-ui/components/buttons/button'
import {
  DataGrid,
  DataGridRowActions,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridActionsColumn
} from '@/components/docyrus/data-grid'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { TaskFormSheet } from '@/components/tasks/task-form-sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { useDocyrusDataGrid } from '@/hooks/docyrus/use-docyrus-data-grid'
import { useSeedDefaultViews } from '@/hooks/use-seed-default-views'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import { useDeleteTask, useUpdateTask } from '@/hooks/use-tasks'
import { useUsers } from '@/hooks/use-users'
import { saveGridChanges } from '@/lib/data-grid-record-utils'
import { useEnumEntities } from '@/hooks/use-enums'
import {
  createSystemViews,
  dateShortcutFilter,
  equalsFilter,
  findEnumIdByName
} from '@/lib/crm-system-views'
import { useDateFormat } from '@/lib/use-date-format'

const APP_SLUG = 'base'
const DATA_SOURCE_SLUG = 'task'

const TASK_GRID_COLUMNS = [
  'subject',
  'status',
  'start_date',
  'end_date',
  'organization',
  'record_owner'
]

type TaskFormMode = 'create' | 'edit'

type TaskFormRecord = BaseTaskEntity | Record<string, unknown>

interface TaskDialogState {
  mode: TaskFormMode;
  task: TaskFormRecord | null;
}

export function Tasks() {
  const client = useDocyrusClient()

  if (!client) return null

  return <TasksPageInner client={client} />
}

function TasksPageInner({
  client
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>;
}) {
  const { t } = useTranslation()
  const collection = useBaseTaskCollection()
  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()
  const { data: users = [] } = useUsers()
  const { formatDate, formatDateTime } = useDateFormat()
  const { data: taskStatuses = [], isLoading: areTaskStatusesLoading } =
    useEnumEntities('status', {
      appSlug: APP_SLUG,
      dataSourceSlug: DATA_SOURCE_SLUG
    })

  const taskGridViews = useMemo(() => {
    const openStatusId = findEnumIdByName(taskStatuses, [
      'Open',
      'To Do',
      'Todo',
      'In Progress'
    ])

    return createSystemViews('base-task', [
      {
        id: 'all',
        name: 'All',
        columns: TASK_GRID_COLUMNS,
        sorting: [{ id: 'start_date', desc: false }]
      },
      {
        id: 'open',
        name: 'Open',
        columns: TASK_GRID_COLUMNS,
        sorting: [{ id: 'start_date', desc: false }],
        filterQuery: equalsFilter('status', openStatusId)
      },
      {
        id: 'due-soon',
        name: 'Due Soon',
        columns: TASK_GRID_COLUMNS,
        sorting: [{ id: 'end_date', desc: false }],
        filterQuery: dateShortcutFilter('end_date', 'next_7_days')
      }
    ])
  }, [taskStatuses])

  useSeedDefaultViews({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    templates: taskGridViews,
    enabled: !areTaskStatusesLoading,
    pruneUnlisted: true
  })

  const [dialog, setDialog] = useState<TaskDialogState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<BaseTaskEntity | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const taskUserOptions = useMemo<Array<CellUserOption>>(
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
    setDialog({ mode: 'create', task: null })
  }, [])

  const onOpenEdit = useCallback((task: BaseTaskEntity) => {
    setDialog({ mode: 'edit', task })
  }, [])

  const onCloseDialog = useCallback(() => {
    setDialog(null)
  }, [])

  const onDelete = useCallback((task: BaseTaskEntity) => {
    if (!task.id) return

    setPendingDelete(task)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseTaskEntity>>(
    () => getDataGridActionsColumn<BaseTaskEntity>({
        actionCount: 2,
        cell: ({ row }) => (
          <DataGridRowActions
            row={row.original}
            openPageLabel={t('tasks.viewTask', 'View task')}
            actionsLabel={t('common.actions', 'Actions')}
            onOpenPage={onOpenEdit}
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
                onSelect: onOpenEdit
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
    [onDelete, onOpenEdit, t]
  )

  const onChangesSave = useCallback(
    async (changes: Array<RowChange>, gridData: Array<BaseTaskEntity>) => {
      await saveGridChanges(changes, gridData, (id, data) => updateTask.mutateAsync({ taskId: id, data }))
    },
    [updateTask]
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

  const columnOverrides = useMemo<
    Record<string, Partial<ColumnDef<BaseTaskEntity>>>
  >(
    () => ({
      subject: {
        header: t('tasks.columns.subject'),
        size: 250
      },
      status: {
        header: t('tasks.columns.status'),
        size: 140
      },
      start_date: {
        header: t('tasks.columns.startDate'),
        size: 140
      },
      end_date: {
        header: t('tasks.columns.dueDate'),
        size: 140
      },
      organization: {
        header: t('tasks.columns.organization'),
        size: 190
      },
      record_owner: {
        header: t('tasks.columns.owner'),
        size: 170
      }
    }),
    [t]
  )

  const visibleFields = useMemo(
    () => new Set(Object.keys(columnOverrides)),
    [columnOverrides]
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
  } = useDocyrusDataGrid<BaseTaskEntity>({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    collection,
    actionsColumn,
    users: taskUserOptions,
    formatDate,
    formatDateTime,
    readOnly: false,
    trackChanges: true,
    onSaveChanges: onChangesSave,
    bulkActions: ['delete'],
    enableServerExportMenu: true,
    searchPlaceholder: t('common.search', 'Search...'),
    toolbarEndContent: importToolbarButton,
    getRowLabel: row => row.subject || row.id || t('tasks.title'),
    mapColumn: (field, defaultColumn) => {
      if (!visibleFields.has(field.slug)) return null

      return {
        ...defaultColumn,
        ...columnOverrides[field.slug]
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
      await deleteTask.mutateAsync(pendingDelete.id)
      setPendingDelete(null)
      reload()
    } finally {
      setIsDeleting(false)
    }
  }, [deleteTask, pendingDelete, reload])

  return (
    <>
      <PageHeader
        title={t('tasks.title')}
        icon={<CheckSquare className="h-4 w-4 text-emerald-500" />}
        actions={
          <MotionButton size="sm" onClick={onOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('tasks.newTask')}
          </MotionButton>
        } />
      <PageContainer className="flex min-h-0 flex-1 max-w-full flex-col overflow-hidden pb-0">
        {dialog && (
          <TaskFormSheet
            open
            onOpenChange={(open) => {
              if (!open) onCloseDialog()
            }}
            mode={dialog.mode}
            task={dialog.task ?? undefined}
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
                {t('tasks.errorLoading', 'Unable to load tasks')}
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
