'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  type Column,
  type DataTableFilterActions,
  type FilterModel,
  type FiltersState,
} from '@/components/docyrus/data-table-filter/core/types'
import { useDateFormat } from '@/hooks/docyrus/use-date-format'

interface SideFilterActiveChipsProps<TData> {
  filters: FiltersState
  columns: Array<Column<TData>>
  actions: DataTableFilterActions
  clearAllLabel?: string
}

export function SideFilterActiveChips<TData>({
  filters,
  columns,
  actions,
  clearAllLabel = 'Clear all',
}: SideFilterActiveChipsProps<TData>) {
  const { formatDate } = useDateFormat()

  const items = useMemo(() => {
    const byId = new Map(columns.map((c) => [c.id, c]))
    const out: Array<{ id: string; label: string }> = []

    for (const filter of filters) {
      const column = byId.get(filter.columnId)

      if (!column) continue
      const summary = describeFilter(filter, column, formatDate)

      if (!summary) continue
      out.push({
        id: filter.columnId,
        label: `${column.displayName}: ${summary}`,
      })
    }

    return out
  }, [filters, columns, formatDate])

  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1">
      {items.map((item) => (
        <Badge
          key={item.id}
          variant="secondary"
          className="gap-1 pr-1 pl-2 text-xs font-normal"
        >
          <span className="truncate max-w-44">{item.label}</span>
          <button
            type="button"
            aria-label={`Remove ${item.label}`}
            onClick={() => actions.removeFilter(item.id)}
            className="ml-0.5 rounded-sm p-0.5 transition-colors hover:bg-foreground/10"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={actions.removeAllFilters}
        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive"
      >
        {clearAllLabel}
      </Button>
    </div>
  )
}

function describeFilter<TData>(
  filter: FilterModel,
  column: Column<TData>,
  formatDate: (value: unknown) => string,
): string | null {
  if (filter.values.length === 0) {
    if (filter.operator === 'is empty' || filter.operator === 'is not empty') {
      return filter.operator
    }

    return null
  }

  switch (column.type) {
    case 'option':

    case 'multiOption': {
      const options = column.getOptions()
      const labels = (filter.values as Array<string>).map(
        (v) => options.find((o) => o.value === v)?.label ?? v,
      )

      if (labels.length === 1) return labels[0] ?? ''
      if (labels.length <= 2) return labels.join(', ')

      return `${labels.length} selected`
    }

    case 'number': {
      if (
        filter.operator === 'is between' ||
        filter.operator === 'is not between'
      ) {
        return `${filter.values[0]}–${filter.values[1]}`
      }

      return `${filter.operator} ${filter.values[0]}`
    }

    case 'date': {
      const [from, to] = filter.values as Array<Date>

      if (!from) return null
      if (!to) return formatDate(from)

      return `${formatDate(from)} – ${formatDate(to)}`
    }

    case 'boolean': {
      const v = filter.values[0]

      return v === true
        ? (column.trueLabel ?? 'true')
        : (column.falseLabel ?? 'false')
    }

    case 'text':

    default:
      return String(filter.values[0] ?? '')
  }
}
