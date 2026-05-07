import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'
import {
  Copy,
  Eye,
  MoreHorizontal,
  Plus,
  Trash2,
  Upload,
  CheckSquare,
  Pencil,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import type { BaseTaskEntity } from '@/collections/base-task.collection'
import { useBaseTaskCollection } from '@/collections/base-task.collection'
import { Button as MotionButton } from '@/components/animate-ui/components/buttons/button'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridActionsColumn,
  type CellUserOption,
  type RowChange,
} from '@/components/docyrus/data-grid'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { TaskFormSheet } from '@/components/tasks/task-form-sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDocyrusDataGrid } from '@/hooks/use-docyrus-data-grid'
import { useDocyrusDataImportWizard } from '@/hooks/use-docyrus-data-import-wizard'
import { useDeleteTask, useUpdateTask } from '@/hooks/use-tasks'
import { useUsers } from '@/hooks/use-users'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'
import { useDateFormat } from '@/lib/use-date-format'

const APP_SLUG = 'base'
const DATA_SOURCE_SLUG = 'task'

type TaskFormMode = 'create' | 'edit'

type TaskFormRecord = BaseTaskEntity | Record<string, unknown>

interface TaskDialogState {
  mode: TaskFormMode
  task: TaskFormRecord | null
}

export function Tasks() {
  const client = useDocyrusClient()

  if (!client) return null

  return <TasksPageInner client={client} />
}

function TasksPageInner({
  client,
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>
}) {
  const { t } = useTranslation()
  const collection = useBaseTaskCollection()
  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()
  const { data: users = [] } = useUsers()
  const { formatDate, formatDateTime } = useDateFormat()

  const [dialog, setDialog] = useState<TaskDialogState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<BaseTaskEntity | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const taskUserOptions = useMemo<Array<CellUserOption>>(
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
    setDialog({ mode: 'create', task: null })
  }, [])

  const onOpenEdit = useCallback((task: BaseTaskEntity) => {
    setDialog({ mode: 'edit', task })
  }, [])

  const onDuplicate = useCallback((task: BaseTaskEntity) => {
    setDialog({
      mode: 'create',
      task: buildDuplicatePayload(task as Record<string, unknown>),
    })
  }, [])

  const onCloseDialog = useCallback(() => {
    setDialog(null)
  }, [])

  const onDelete = useCallback((task: BaseTaskEntity) => {
    if (!task.id) return

    setPendingDelete(task)
  }, [])

  const actionsColumn = useMemo<ColumnDef<BaseTaskEntity>>(
    () =>
      getDataGridActionsColumn<BaseTaskEntity>({
        actionCount: 2,
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5 px-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onOpenEdit(row.original)}
            >
              <Eye className="size-4" />
              <span className="sr-only">
                {t('tasks.viewTask', 'View task')}
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
    [onDelete, onDuplicate, onOpenEdit, t],
  )

  const onChangesSave = useCallback(
    async (changes: Array<RowChange>, gridData: Array<BaseTaskEntity>) => {
      await saveGridChanges(changes, gridData, (id, data) =>
        updateTask.mutateAsync({ taskId: id, data }),
      )
    },
    [updateTask],
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

  const columnOverrides = useMemo<
    Record<string, Partial<ColumnDef<BaseTaskEntity>>>
  >(
    () => ({
      subject: {
        header: t('tasks.columns.subject'),
        size: 250,
      },
      status: {
        header: t('tasks.columns.status'),
        size: 140,
      },
      start_date: {
        header: t('tasks.columns.startDate'),
        size: 140,
      },
      end_date: {
        header: t('tasks.columns.dueDate'),
        size: 140,
      },
      organization: {
        header: t('tasks.columns.organization'),
        size: 190,
      },
      record_owner: {
        header: t('tasks.columns.owner'),
        size: 170,
      },
    }),
    [t],
  )

  const visibleFields = useMemo(
    () => new Set(Object.keys(columnOverrides)),
    [columnOverrides],
  )

  const {
    table,
    gridProps,
    toolbar,
    items: tasks,
    reload,
    dataSource,
    isLoading,
    error,
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
    getRowLabel: (row) => row.subject || row.id || t('tasks.title'),
    mapColumn: (field, defaultColumn) => {
      if (!visibleFields.has(field.slug)) return null

      return {
        ...defaultColumn,
        ...columnOverrides[field.slug],
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
        }
      />
      <PageContainer>
        {dialog && (
          <TaskFormSheet
            open
            onOpenChange={(open) => {
              if (!open) onCloseDialog()
            }}
            mode={dialog.mode}
            task={dialog.task ?? undefined}
            onSubmitSuccess={reload}
          />
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

        {!isLoading && !error && tasks.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckSquare className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">{t('tasks.emptyTitle')}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('tasks.emptyDescription')}
              </p>
              <MotionButton className="mt-4" onClick={onOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('tasks.createTask')}
              </MotionButton>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && tasks.length > 0 && (
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
      </PageContainer>
    </>
  )
}
