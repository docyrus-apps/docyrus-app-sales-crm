import { useMemo, useState } from 'react'
import {
  CheckSquare,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDeleteTask, useTasks } from '@/hooks/use-tasks'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { useDataTable } from '@/hooks/use-data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TaskFormSheet } from '@/components/tasks/task-form-sheet'
import { Card, CardContent } from '@/components/ui/card'

export function Tasks() {
  const { data: tasks, isLoading } = useTasks()
  const deleteTask = useDeleteTask()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [viewingTask, setViewingTask] = useState<any>(null)

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'subject',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Subject" />
        ),
        cell: ({ row }) => (
          <div className="font-medium max-w-md truncate">
            {row.getValue('subject') || '-'}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue('status')
          const statusName =
            typeof status === 'object' && status?.name ? status.name : status
          return statusName ? (
            <Badge variant="outline">{statusName}</Badge>
          ) : (
            <span>-</span>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'start_date',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Start Date" />
        ),
        cell: ({ row }) => {
          const date = row.getValue('start_date')
          return (
            <div>
              {date
                ? new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '-'}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'end_date',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Due Date" />
        ),
        cell: ({ row }) => {
          const date = row.getValue('end_date')
          return (
            <div>
              {date
                ? new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '-'}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'organization',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Organization" />
        ),
        cell: ({ row }) => {
          const org = row.getValue('organization')
          return (
            <div>
              {typeof org === 'object' && org?.name ? org.name : org || '-'}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'record_owner',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Owner" />
        ),
        cell: ({ row }) => {
          const owner = row.getValue('record_owner')
          if (!owner) return <div>-</div>

          if (typeof owner === 'object') {
            const name = [owner.firstname, owner.lastname]
              .filter(Boolean)
              .join(' ')
            return (
              <div>{name || owner.email || owner.id?.slice(0, 8) || '-'}</div>
            )
          }

          return <div>{owner}</div>
        },
        enableSorting: true,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const task = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    setViewingTask(task)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingTask(task)
                    setIsFormOpen(true)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this task?')) {
                      deleteTask.mutate(task.id)
                    }
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [deleteTask],
  )

  const { table } = useDataTable({
    data: tasks || [],
    columns,
    pageCount: -1,
  })

  return (
    <>
      <PageHeader
        title="Tasks"
        icon={CheckSquare}
        actions={
          <Button
            onClick={() => {
              setEditingTask(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Task
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

        {isLoading && <DataTableSkeleton columnCount={7} rowCount={10} />}

        {!isLoading && tasks && tasks.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No tasks yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first task
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingTask(null)
                  setIsFormOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && tasks && tasks.length > 0 && <DataTable table={table} />}
      </PageContainer>
    </>
  )
}
