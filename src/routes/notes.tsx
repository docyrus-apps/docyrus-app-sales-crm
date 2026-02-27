import { useMemo, useState } from 'react'
import { NotepadText, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useNotes } from '@/hooks/use-notes'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'
import { useDataTable } from '@/hooks/use-data-table'
import { Card, CardContent } from '@/components/ui/card'

const priorityVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
}

export function Notes() {
  const { t } = useTranslation()
  const { data: notes, isLoading } = useNotes()

  const columns = useMemo<Array<ColumnDef<any>>>(
    () => [
      {
        accessorKey: 'done',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('notes.columns.done')}
          />
        ),
        cell: ({ row }) => (
          <Checkbox checked={!!row.getValue('done')} disabled />
        ),
        enableSorting: true,
        size: 60,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('notes.columns.title')}
          />
        ),
        cell: ({ row }) => {
          const done = row.getValue('done')
          return (
            <div
              className={`font-medium max-w-md truncate ${done ? 'line-through text-muted-foreground' : ''}`}
            >
              {row.getValue('title') || '-'}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('notes.columns.priority')}
          />
        ),
        cell: ({ row }) => {
          const priority = row.getValue('priority')
          if (!priority) return <span>-</span>
          return (
            <Badge variant={priorityVariant[priority] || 'outline'}>
              {priority}
            </Badge>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'due_date',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('notes.columns.dueDate')}
          />
        ),
        cell: ({ row }) => {
          const date = row.getValue('due_date')
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
    ],
    [t],
  )

  const { table } = useDataTable({
    data: notes || [],
    columns,
    pageCount: -1,
  })

  return (
    <>
      <PageHeader title={t('notes.title')} />
      <PageContainer>
        {isLoading && <DataTableSkeleton columnCount={4} rowCount={10} />}

        {!isLoading && notes && notes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <NotepadText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t('notes.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('notes.emptyDescription')}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && notes && notes.length > 0 && <DataTable table={table} />}
      </PageContainer>
    </>
  )
}
