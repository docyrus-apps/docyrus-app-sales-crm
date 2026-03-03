import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckSquare, Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  useDataGrid,
} from '@/components/docyrus/data-grid'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/animate-ui/components/buttons/button'
import { useDeleteTask, useTasks } from '@/hooks/use-tasks'
import { TaskFormSheet } from '@/components/tasks/task-form-sheet'
import { Card, CardContent } from '@/components/ui/card'

export function Tasks() {
  const { t } = useTranslation()
  const { data: tasks, isLoading } = useTasks()
  const deleteTask = useDeleteTask()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
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
    ],
    [t],
  )

  const { table, ...dataGridProps } = useDataGrid({
    data: tasks || [],
    columns,
    getRowId: (row: any) => row.id,
    readOnly: true,
    actions: [
      {
        label: t('common.edit'),
        onAction: (rows) => {
          if (rows.length === 1) {
            setEditingTask(rows[0])
            setIsFormOpen(true)
          }
        },
      },
      {
        label: t('common.delete'),
        variant: 'destructive',
        onAction: (rows) => {
          if (confirm(t('tasks.confirmDelete'))) {
            rows.forEach((row: any) => deleteTask.mutate(row.id))
          }
        },
      },
    ],
  })

  return (
    <>
      <PageHeader
        title={t('tasks.title')}
        actions={
          <Button
            onClick={() => {
              setEditingTask(null)
              setIsFormOpen(true)
            }}
          >
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
            if (!open) setEditingTask(null)
          }}
          mode={editingTask ? 'edit' : 'create'}
          task={editingTask}
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
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingTask(null)
                  setIsFormOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('tasks.createTask')}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && tasks && tasks.length > 0 && (
          <DataGrid table={table} {...dataGridProps} height={600} />
        )}
      </PageContainer>
    </>
  )
}
