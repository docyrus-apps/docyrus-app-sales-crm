'use client'

import { isValidElement, useCallback, useMemo } from 'react'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  type Column,
  type ColumnOption,
  type DataTableFilterActions,
  type FilterModel,
  type OptionBasedColumnDataType,
} from '@/components/docyrus/data-table-filter/core/types'
import { type Locale, t } from '@/components/docyrus/data-table-filter/lib/i18n'

import { useShowMore } from '../hooks/use-show-more'
import { DEFAULT_SHOW_MORE_THRESHOLD } from '../lib/render-mode'

interface SideFilterCheckboxListProps<
  TData,
  TType extends OptionBasedColumnDataType,
> {
  column: Column<TData, TType>
  filter?: FilterModel<TType>
  actions: DataTableFilterActions
  locale?: Locale
  threshold?: number
}

interface DecoratedOption extends ColumnOption {
  selected: boolean
  count: number
}

export function SideFilterCheckboxList<
  TData,
  TType extends OptionBasedColumnDataType,
>({
  column,
  filter,
  actions,
  locale = 'en',
  threshold = DEFAULT_SHOW_MORE_THRESHOLD,
}: SideFilterCheckboxListProps<TData, TType>) {
  const decorated = useMemo<Array<DecoratedOption>>(() => {
    const counts = column.getFacetedUniqueValues()
    const options = column.getOptions()
    const selectedSet = new Set((filter?.values as Array<string>) ?? [])

    return options.map((o) => ({
      ...o,
      selected: selectedSet.has(o.value),
      count: counts?.get(o.value) ?? 0,
    }))
  }, [column, filter?.values])

  const { visible, hiddenCount, expanded, canExpand, toggle } = useShowMore({
    items: decorated,
    threshold,
    isPinned: (o) => o.selected,
  })

  const handleToggle = useCallback(
    (value: string, checked: boolean) => {
      if (checked) {
        actions.addFilterValue(column, [value] as FilterModel<TType>['values'])
      } else {
        actions.removeFilterValue(column, [
          value,
        ] as FilterModel<TType>['values'])
      }
    },
    [actions, column],
  )

  if (decorated.length === 0) {
    return (
      <p className="px-1 py-2 text-xs text-muted-foreground">
        {t('noresults', locale)}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {visible.map((option) => {
        const Icon = option.icon
        const fallback = option.label.slice(0, 2).toUpperCase()

        return (
          <label
            key={option.value}
            className={cn(
              'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
              'hover:bg-accent/60',
            )}
          >
            <Checkbox
              checked={option.selected}
              onCheckedChange={(c) => handleToggle(option.value, c === true)}
            />
            {option.imageUrl ? (
              <Avatar className="size-5">
                <AvatarImage src={option.imageUrl} alt={option.label} />
                <AvatarFallback className="text-[10px]">
                  {fallback}
                </AvatarFallback>
              </Avatar>
            ) : Icon ? (
              isValidElement(Icon) ? (
                Icon
              ) : (
                <Icon className="size-4 text-muted-foreground" />
              )
            ) : option.color ? (
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: option.color }}
              />
            ) : null}
            <span className="flex-1 truncate">{option.label}</span>
            {option.count > 0 && (
              <span className="tabular-nums text-xs text-muted-foreground">
                {option.count < 100 ? option.count : '100+'}
              </span>
            )}
          </label>
        )
      })}
      {canExpand && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="mt-1 h-7 justify-start px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded
            ? t('showLess', locale) === 'showLess'
              ? 'Show less'
              : t('showLess', locale)
            : `${t('showMore', locale) === 'showMore' ? 'Show more' : t('showMore', locale)}${hiddenCount > 0 ? ` (${hiddenCount})` : ''}`}
        </Button>
      )}
    </div>
  )
}
