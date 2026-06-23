// @docyrus: [[features#Record Detail Redesign (Attio-style)]]
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CalendarClock,
  ChevronDown,
  EllipsisVertical,
  ListTodo,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { DynamicValue } from '@/components/docyrus/value-renderers/dynamic-value'
import type { EnumOption, IField } from '@/components/docyrus/form-fields/types'
import { TaskFormSheet } from '@/components/tasks/task-form-sheet'
import { useDeleteTask, useTasks } from '@/hooks/use-tasks'
import { useEnumEntities } from '@/hooks/use-enums'
import { useDateFormat } from '@/lib/use-date-format'

/**
 * Relation field on `base.task` that links a task to its parent record.
 * NOTE: this CRM's task schema uses `deal` (not `crm_deal`).
 */
export type TaskParentField = 'contact' | 'lead' | 'organization' | 'deal'

type OptionValue = { id?: string; name?: string } | string | null | undefined

interface RecordTask {
  id?: string
  subject?: string
  description?: string
  status?: OptionValue
  priority?: OptionValue
  start_date?: string | null
  end_date?: string | null
}

interface RecordTasksPanelProps {
  parentField: TaskParentField
  parentId: string | undefined
}

type SortKey = 'subject' | 'status' | 'priority' | 'end_date'

// Minimal field descriptor so the shared status renderer produces the same
// chip used across the attribute panels.
const STATUS_FIELD: IField = {
  id: 'status',
  slug: 'status',
  name: 'Status',
  type: 'field-status',
}

// Priority is a field-select on base.task whose options carry icon+color, so
// the status renderer produces the same chip treatment the guide asks for.
const PRIORITY_FIELD: IField = {
  id: 'priority',
  slug: 'priority',
  name: 'Priority',
  type: 'field-status',
}

function optionId(value: OptionValue): string | null {
  if (!value) return null
  if (typeof value === 'object') return value.id ?? null

  return value
}

function isOverdue(task: RecordTask): boolean {
  if (!task.end_date) return false

  const due = new Date(task.end_date).getTime()

  return !Number.isNaN(due) && due < Date.now()
}

export function RecordTasksPanel({
  parentField,
  parentId,
}: RecordTasksPanelProps) {
  const { t } = useTranslation()
  const { formatDate } = useDateFormat()

  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('end_date')
  const [sortDesc, setSortDesc] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTask, setEditTask] = useState<RecordTask | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const deleteTask = useDeleteTask()

  const { data: statusEntities = [] } = useEnumEntities('status', {
    appSlug: 'base',
    dataSourceSlug: 'task',
  })

  const statusOptions = useMemo<Array<EnumOption>>(
    () =>
      statusEntities.map((entity) => ({
        id: entity.id,
        name: entity.name,
        color: entity.color ?? undefined,
        icon: entity.icon ?? undefined,
      })),
    [statusEntities],
  )

  const { data: priorityEntities = [] } = useEnumEntities('priority', {
    appSlug: 'base',
    dataSourceSlug: 'task',
  })

  const priorityOptions = useMemo<Array<EnumOption>>(
    () =>
      priorityEntities.map((entity) => ({
        id: entity.id,
        name: entity.name,
        color: entity.color ?? undefined,
        icon: entity.icon ?? undefined,
      })),
    [priorityEntities],
  )

  // Rank by the enum's configured order so the Priority column sorts sensibly
  // (options come back already sorted by sortOrder).
  const priorityRank = useMemo(() => {
    const map = new Map<string, number>()
    priorityOptions.forEach((option, index) => map.set(option.id, index))

    return map
  }, [priorityOptions])

  const listParams = useMemo(
    () => ({
      columns: [
        'id',
        'subject',
        'description',
        'status',
        'priority',
        'start_date',
        'end_date',
        'organization(id,name)',
        'record_owner',
        'created_on',
      ],
      // Empty value never matches a real parent → safely returns nothing
      // until the record id is available.
      filters: {
        rules: [{ field: parentField, operator: '=', value: parentId ?? '' }],
      },
      orderBy: 'end_date DESC',
    }),
    [parentField, parentId],
  )

  const { data: tasksData = [], isLoading } = useTasks(listParams)
  const tasks = tasksData as Array<RecordTask>

  const statusName = useMemo(() => {
    const byId = new Map(
      statusOptions.map((option) => [option.id, option.name]),
    )

    return (task: RecordTask) => byId.get(optionId(task.status) ?? '') ?? ''
  }, [statusOptions])

  const priorityName = useMemo(() => {
    const byId = new Map(
      priorityOptions.map((option) => [option.id, option.name]),
    )

    return (task: RecordTask) => byId.get(optionId(task.priority) ?? '') ?? ''
  }, [priorityOptions])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()

    const filtered = q
      ? tasks.filter((task) => {
          const haystack = [task.subject, statusName(task), priorityName(task)]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return haystack.includes(q)
        })
      : tasks

    const rankOf = (task: RecordTask) =>
      priorityRank.get(optionId(task.priority) ?? '') ?? Number.MAX_SAFE_INTEGER

    return [...filtered].sort((a, b) => {
      let cmp = 0

      if (sortKey === 'subject') {
        cmp = (a.subject ?? '').localeCompare(b.subject ?? '')
      } else if (sortKey === 'status') {
        cmp = statusName(a).localeCompare(statusName(b))
      } else if (sortKey === 'priority') {
        cmp = rankOf(a) - rankOf(b)
      } else {
        const av = a.end_date ? new Date(a.end_date).getTime() : 0
        const bv = b.end_date ? new Date(b.end_date).getTime() : 0

        cmp = av - bv
      }

      return sortDesc ? -cmp : cmp
    })
  }, [tasks, query, sortKey, sortDesc, statusName, priorityName, priorityRank])

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDesc((value) => !value)
    } else {
      setSortKey(key)
      setSortDesc(key === 'end_date')
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    await deleteTask.mutateAsync(deleteId)
    setDeleteId(null)
  }

  // Mobile shows Subject · Status · actions; Priority and Due reveal at md.
  // The hidden cells use `display:none`, so they drop out of the grid flow and
  // the visible cells line up with the matching track count at each breakpoint.
  const GRID =
    'grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_1.75rem] md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_1.75rem] items-center gap-3'

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar: search + New Task */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('tasks.panel.search', {
              defaultValue: 'Search tasks…',
            })}
            className="h-8 border-none bg-muted/50 pl-8 text-[13px] shadow-none focus-visible:ring-1"
          />
        </div>
        <Button
          id={`new-task-${parentField}`}
          size="sm"
          className="h-8 shrink-0 gap-1.5"
          disabled={!parentId}
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-3.5" />
          {t('tasks.panel.newTask', { defaultValue: 'New Task' })}
        </Button>
      </div>

      {/* Header */}
      {tasks.length > 0 && (
        <div
          className={cn(
            GRID,
            'px-4 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70',
          )}
        >
          <SortHeader
            label={t('tasks.columns.subject', { defaultValue: 'Task' })}
            active={sortKey === 'subject'}
            desc={sortDesc}
            onClick={() => toggleSort('subject')}
          />
          <SortHeader
            label={t('tasks.columns.status', { defaultValue: 'Status' })}
            active={sortKey === 'status'}
            desc={sortDesc}
            onClick={() => toggleSort('status')}
          />
          <SortHeader
            label={t('tasks.columns.priority', { defaultValue: 'Priority' })}
            active={sortKey === 'priority'}
            desc={sortDesc}
            onClick={() => toggleSort('priority')}
            className="hidden md:inline-flex"
          />
          <SortHeader
            label={t('tasks.columns.dueDate', { defaultValue: 'Due' })}
            active={sortKey === 'end_date'}
            desc={sortDesc}
            onClick={() => toggleSort('end_date')}
            className="hidden md:inline-flex"
          />
          <span />
        </div>
      )}

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
        {isLoading ? (
          <div className="space-y-1 px-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-11 animate-pulse rounded-lg bg-muted/40"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ListTodo className="size-5" />
            </div>
            <p className="text-[13px] text-muted-foreground">
              {query
                ? t('tasks.panel.noMatch', {
                    defaultValue: 'No tasks match your search.',
                  })
                : t('tasks.panel.empty', {
                    defaultValue: 'No tasks yet',
                  })}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {visible.map((task) => {
              const overdue = isOverdue(task)
              const due = task.end_date ? formatDate(task.end_date) : '—'

              return (
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditTask(task)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') setEditTask(task)
                  }}
                  className={cn(
                    GRID,
                    'group cursor-pointer rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <ListTodo className="size-3.5" />
                    </span>
                    <span className="truncate font-medium">
                      {task.subject ?? '—'}
                    </span>
                  </div>

                  <span className="min-w-0 truncate">
                    {optionId(task.status) ? (
                      <DynamicValue
                        field={STATUS_FIELD}
                        value={optionId(task.status)}
                        enumOptions={statusOptions}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>

                  <span className="hidden min-w-0 truncate md:block">
                    {optionId(task.priority) ? (
                      <DynamicValue
                        field={PRIORITY_FIELD}
                        value={optionId(task.priority)}
                        enumOptions={priorityOptions}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>

                  <span
                    className={cn(
                      'hidden items-center gap-1 truncate text-muted-foreground md:flex',
                      overdue && 'font-medium text-destructive',
                    )}
                  >
                    {due !== '—' && (
                      <CalendarClock className="size-3.5 shrink-0" />
                    )}
                    {due}
                  </span>

                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="flex items-center justify-center"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={t('common.actions', {
                            defaultValue: 'Actions',
                          })}
                          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground/60 opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
                        >
                          <EllipsisVertical className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setEditTask(task)}>
                          <Pencil className="size-4" />
                          {t('common.edit', { defaultValue: 'Edit' })}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => task.id && setDeleteId(task.id)}
                        >
                          <Trash2 className="size-4" />
                          {t('common.delete', { defaultValue: 'Delete' })}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {createOpen && (
        <TaskFormSheet
          open
          mode="create"
          parentField={parentField}
          parentId={parentId}
          onOpenChange={(open) => {
            if (!open) setCreateOpen(false)
          }}
        />
      )}

      {editTask && (
        <TaskFormSheet
          key={editTask.id}
          open
          mode="edit"
          task={editTask}
          onOpenChange={(open) => {
            if (!open) setEditTask(null)
          }}
        />
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('tasks.panel.deleteTitle', { defaultValue: 'Delete task?' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.panel.deleteDescription', {
                defaultValue: 'This task will be permanently removed.',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void confirmDelete()
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteTask.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t('common.delete', { defaultValue: 'Delete' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SortHeader({
  label,
  active,
  desc,
  onClick,
  className,
}: {
  label: string
  active: boolean
  desc: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 text-left uppercase transition-colors hover:text-foreground',
        active && 'text-foreground',
        className,
      )}
    >
      {label}
      {active && (
        <ChevronDown
          className={cn('size-3 transition-transform', !desc && 'rotate-180')}
        />
      )}
    </button>
  )
}
