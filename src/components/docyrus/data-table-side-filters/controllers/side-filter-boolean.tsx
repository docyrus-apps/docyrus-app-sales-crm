'use client'

import { useCallback } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  type Column,
  type DataTableFilterActions,
  type FilterModel,
} from '@/components/docyrus/data-table-filter/core/types'
import { type Locale, t } from '@/components/docyrus/data-table-filter/lib/i18n'

interface SideFilterBooleanProps<TData> {
  column: Column<TData, 'boolean'>
  filter?: FilterModel<'boolean'>
  actions: DataTableFilterActions
  locale?: Locale
}

type Pick = 'any' | 'true' | 'false'

export function SideFilterBoolean<TData>({
  column,
  filter,
  actions,
  locale = 'en',
}: SideFilterBooleanProps<TData>) {
  const current: Pick =
    filter?.values[0] === true
      ? 'true'
      : filter?.values[0] === false
        ? 'false'
        : 'any'

  const handle = useCallback(
    (pick: Pick) => {
      if (pick === 'any') {
        actions.removeFilter(column.id)

        return
      }
      actions.setFilterValue(column, [pick === 'true'])
    },
    [actions, column],
  )

  const trueLabel = column.trueLabel ?? t('true', locale)
  const falseLabel = column.falseLabel ?? t('false', locale)
  const anyLabel = t('all', locale) === 'all' ? 'Any' : t('all', locale)

  const items: Array<{ key: Pick; label: string }> = [
    { key: 'any', label: anyLabel },
    { key: 'true', label: trueLabel },
    { key: 'false', label: falseLabel },
  ]

  return (
    <div className="grid grid-cols-3 gap-1">
      {items.map((item) => (
        <Button
          key={item.key}
          type="button"
          variant={current === item.key ? 'secondary' : 'outline'}
          size="sm"
          className={cn(
            'h-8 text-xs',
            current === item.key && 'border-primary/30',
          )}
          onClick={() => handle(item.key)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}
