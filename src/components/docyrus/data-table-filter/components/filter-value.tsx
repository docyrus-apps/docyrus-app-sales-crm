'use client'

// @ts-nocheck
/* eslint-disable */
import {
  Fragment,
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

function decodeOptionLabels<T extends { label: string }>(items: T[]): T[] {
  const txt = document.createElement('textarea')

  return items.map((item) => {
    txt.innerHTML = item.label

    return txt.value === item.label ? item : { ...item, label: txt.value }
  })
}

import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format as formatDate_fns,
  isEqual,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from 'date-fns'
import { Ellipsis } from 'lucide-react'

import { type DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

import { Checkbox } from '@/components/ui/checkbox'

import { Calendar } from '@/components/ui/calendar'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import {
  dateFilterOperators,
  isRelativeDateOperator,
  isXDaysRelativeOperator,
  numberFilterOperators,
} from '../core/operators'
import { useDebounceCallback } from '../hooks/use-debounce-callback'
import { take } from '../lib/array'
import { createNumberRange, isCompleteUuid } from '../lib/helpers'
import { t, type Locale } from '../lib/i18n'
import { DebouncedInput } from '../ui/debounced-input'

import {
  type Column,
  type ColumnDataType,
  type ColumnOption,
  type ColumnOptionExtended,
  type DataTableFilterActions,
  type FilterModel,
  type FilterOperators,
  type FilterStrategy,
} from '../core/types'

interface FilterValueProps<TData, TType extends ColumnDataType> {
  filter?: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
}

const FilterValueMemo = memo(FilterValueImpl) as typeof FilterValueImpl

export { FilterValueMemo as FilterValue }

function FilterValueImpl<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  strategy,
  locale,
}: FilterValueProps<TData, TType>) {
  const [open, setOpen] = useState(false)

  /*
   * When the user picks a value-less relative date operator (today,
   * lastWeek, …) from the operator dropdown, there's nothing to enter
   * — auto-close the value popover so the user can see the refreshed
   * grid instead of staring at a stuck popover. *XDays variants need
   * the numeric N input, so they stay open.
   */
  const prevOperatorRef = useRef(filter?.operator)

  useEffect(() => {
    const prev = prevOperatorRef.current
    const next = filter?.operator

    prevOperatorRef.current = next

    if (prev === next || !next) return

    if (
      column.type === 'date' &&
      isRelativeDateOperator(next as FilterOperators['date']) &&
      !isXDaysRelativeOperator(next as FilterOperators['date'])
    ) {
      queueMicrotask(() => setOpen(false))
    }
  }, [filter?.operator, column.type])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="m-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs"
        >
          <FilterValueDisplay
            filter={filter}
            column={column}
            actions={actions}
            locale={locale}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        <FilterValueControllerMemo
          filter={filter}
          column={column}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  )
}

interface FilterValueDisplayProps<TData, TType extends ColumnDataType> {
  filter?: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  locale?: Locale
}

export function FilterValueDisplay<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueDisplayProps<TData, TType>) {
  switch (column.type) {
    case 'option':
      return (
        <FilterValueOptionDisplay
          filter={filter as FilterModel<'option'>}
          column={column as Column<TData, 'option'>}
          actions={actions}
          locale={locale}
        />
      )

    case 'multiOption':
      return (
        <FilterValueMultiOptionDisplay
          filter={filter as FilterModel<'multiOption'>}
          column={column as Column<TData, 'multiOption'>}
          actions={actions}
          locale={locale}
        />
      )

    case 'date':
      return (
        <FilterValueDateDisplay
          filter={filter as FilterModel<'date'>}
          column={column as Column<TData, 'date'>}
          actions={actions}
          locale={locale}
        />
      )

    case 'text':
      return (
        <FilterValueTextDisplay
          filter={filter as FilterModel<'text'>}
          column={column as Column<TData, 'text'>}
          actions={actions}
          locale={locale}
        />
      )

    case 'uuid':
      return (
        <FilterValueUuidDisplay
          filter={filter as FilterModel<'uuid'>}
          column={column as Column<TData, 'uuid'>}
          actions={actions}
          locale={locale}
        />
      )

    case 'number':
      return (
        <FilterValueNumberDisplay
          filter={filter as FilterModel<'number'>}
          column={column as Column<TData, 'number'>}
          actions={actions}
          locale={locale}
        />
      )

    case 'boolean':
      return (
        <FilterValueBooleanDisplay
          filter={filter as FilterModel<'boolean'>}
          column={column as Column<TData, 'boolean'>}
          actions={actions}
          locale={locale}
        />
      )

    default:
      return null
  }
}

export function FilterValueBooleanDisplay<TData>({
  filter,
  column,
  actions: _actions,
  locale = 'en',
}: FilterValueDisplayProps<TData, 'boolean'>) {
  if (!filter) return null

  if (filter.operator === 'is empty' || filter.operator === 'is not empty') {
    return null
  }

  const value = filter.values[0]

  if (value === undefined || value === null) {
    return <Ellipsis className="size-4" />
  }

  const trueLabel = column.trueLabel ?? t('true', locale)
  const falseLabel = column.falseLabel ?? t('false', locale)

  return <span>{value ? trueLabel : falseLabel}</span>
}

export function FilterValueOptionDisplay<TData>({
  filter,
  column,
  actions: _actions,
  locale: _locale = 'en',
}: FilterValueDisplayProps<TData, 'option'>) {
  const options = useMemo(() => column.getOptions(), [column])
  const selected = options.filter((o) => filter?.values.includes(o.value))

  /*
   * Async-options columns return `[]` from `getOptions()` (the data source
   * for the option list lives on the server, not in the parent table's
   * rows). Mirror the fallback already in `FilterValueMultiOptionDisplay`
   * — when we can't resolve any selected option label locally, use the
   * raw filter values count so the chip at least reads "N organization"
   * instead of the misleading "0 organization".
   */
  if (!filter || filter.values.length === 0) {
    return <span className="text-muted-foreground">Select…</span>
  }

  if (
    column.asyncOptions &&
    selected.length === 0 &&
    filter.values.length > 0
  ) {
    const name = column.displayName.toLowerCase()

    return (
      <span>
        {filter.values.length} {name}
      </span>
    )
  }

  /*
   * We display the selected options based on how many are selected
   *
   * If there is only one option selected, we display its icon and label
   *
   * If there are multiple options selected, we display:
   * 1) up to 3 icons of the selected options
   * 2) the number of selected options
   */
  if (selected.length === 1) {
    const item = selected[0]

    if (!item) return null
    const { label, icon: Icon } = item
    const hasIcon = !!Icon

    return (
      <span className="inline-flex items-center gap-1">
        {hasIcon &&
          (isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon className="size-4 text-primary" />
          ))}
        <span>{label}</span>
      </span>
    )
  }
  const name = column.displayName.toLowerCase()
  const pluralName = name.endsWith('s') ? `${name}es` : `${name}s`

  const hasOptionIcons = !options?.some((o) => !o.icon)

  return (
    <div className="inline-flex items-center gap-0.5">
      {hasOptionIcons &&
        take(selected, 3).map(({ value, icon }) => {
          if (!icon) return null
          const Icon = icon

          return isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon key={value} className="size-4" />
          )
        })}
      <span className={cn(hasOptionIcons && 'ml-1.5')}>
        {selected.length} {pluralName}
      </span>
    </div>
  )
}

export function FilterValueMultiOptionDisplay<TData>({
  filter,
  column,
  actions: _actions,
  locale: _locale = 'en',
}: FilterValueDisplayProps<TData, 'multiOption'>) {
  const options = useMemo(() => column.getOptions(), [column])
  const selected = options.filter((o) => filter?.values.includes(o.value))

  /*
   * Async-options columns return `[]` from `getOptions()` (the data source
   * for the option list lives on the server, not in the parent table's
   * rows). That used to render the selected-values count as "0 record
   * owner" even when the user had a selection. Fall back to the raw
   * filter values count whenever we can't resolve any selected option
   * label locally — at least the chip reads as a faithful "N record
   * owner".
   */
  if (!filter || filter.values.length === 0) {
    return <span className="text-muted-foreground">Select…</span>
  }

  if (
    column.asyncOptions &&
    selected.length === 0 &&
    filter.values.length > 0
  ) {
    const name = column.displayName.toLowerCase()

    return (
      <span>
        {filter.values.length} {name}
      </span>
    )
  }

  if (selected.length === 1) {
    const item = selected[0]

    if (!item) return null
    const { label, icon: Icon } = item
    const hasIcon = !!Icon

    return (
      <span className="inline-flex items-center gap-1.5">
        {hasIcon &&
          (isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon className="size-4 text-primary" />
          ))}

        <span>{label}</span>
      </span>
    )
  }

  const name = column.displayName.toLowerCase()

  const hasOptionIcons = !options?.some((o) => !o.icon)

  return (
    <div className="inline-flex items-center gap-1.5">
      {hasOptionIcons && (
        <div key="icons" className="inline-flex items-center gap-0.5">
          {take(selected, 3).map(({ value, icon }) => {
            if (!icon) return null
            const Icon = icon

            return isValidElement(Icon) ? (
              <Fragment key={value}>{Icon}</Fragment>
            ) : (
              <Icon key={value} className="size-4" />
            )
          })}
        </div>
      )}
      <span>
        {selected.length} {name}
      </span>
    </div>
  )
}

export function FilterValueDateDisplay<TData>({
  filter,
  column,
  actions: _actions,
}: FilterValueDisplayProps<TData, 'date'>) {
  const includeTime = column.includeTime === true

  /*
   * Format chip text directly with date-fns instead of routing through
   * `useDateFormat()` — the app-wide provider may be configured to
   * render dates in UTC, which would silently shift the user's chip
   * 3 hours back from what they actually picked in the popover.
   * Filter values are always in the user's local wall-clock time, so
   * display them with the local TZ.
   */
  const formatLocal = (value: Date): string => {
    return formatDate_fns(
      value,
      includeTime ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd',
    )
  }

  if (!filter) return null

  /*
   * Relative operators carry no calendar value — the chip text already
   * comes from the operator label (e.g. "is last 7 days"), so we only
   * surface the value chip when there's a numeric N to show.
   */
  if (isRelativeDateOperator(filter.operator)) {
    if (!isXDaysRelativeOperator(filter.operator)) return null
    /*
     * `FilterValues<'date'>` is `Array<Date>`, but for the *XDays variants
     * the value is actually a number entered in the popover. Treat it as
     * unknown here so the display can render either type without a cast
     * tower elsewhere.
     */
    const raw: unknown = filter.values[0]

    if (raw === undefined || raw === null || raw === '') {
      return <Ellipsis className="size-4" />
    }

    return <span className="tabular-nums tracking-tight">{String(raw)}</span>
  }

  if (filter.values.length === 0) return <Ellipsis className="size-4" />
  if (filter.values.length === 1) {
    const value = filter.values[0] as Date

    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[filter-value] display single', {
        operator: filter.operator,
        value,
        valueIso: value.toISOString?.(),
        valueLocal: formatLocal(value),
      })
    }

    return <span>{formatLocal(value)}</span>
  }

  const from = filter.values[0] as Date
  const to = filter.values[1] as Date

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[filter-value] display range', {
      operator: filter.operator,
      from,
      to,
      fromIso: from.toISOString?.(),
      toIso: to.toISOString?.(),
      fromLocal: formatLocal(from),
      toLocal: formatLocal(to),
    })
  }

  return <span>{`${formatLocal(from)} - ${formatLocal(to)}`}</span>
}

export function FilterValueTextDisplay<TData>({
  filter,
  column: _column,
  actions: _actions,
  locale: _locale = 'en',
}: FilterValueDisplayProps<TData, 'text'>) {
  if (!filter) return null
  if (filter.values.length === 0 || filter.values[0]?.trim() === '')
    return <Ellipsis className="size-4" />

  const value = filter.values[0]

  return <span>{value}</span>
}

export function FilterValueUuidDisplay<TData>({
  filter,
  column: _column,
  actions: _actions,
  locale: _locale = 'en',
}: FilterValueDisplayProps<TData, 'uuid'>) {
  if (!filter) return null

  if (filter.operator === 'is empty' || filter.operator === 'is not empty') {
    return null
  }

  if (filter.values.length === 0 || filter.values[0]?.trim() === '')
    return <Ellipsis className="size-4" />

  const value = filter.values[0]

  return <span className="font-mono">{value}</span>
}

export function FilterValueNumberDisplay<TData>({
  filter,
  column: _column,
  actions: _actions,
  locale = 'en',
}: FilterValueDisplayProps<TData, 'number'>) {
  if (!filter || !filter.values || filter.values.length === 0) return null

  if (
    filter.operator === 'is between' ||
    filter.operator === 'is not between'
  ) {
    const minValue = filter.values[0]
    const maxValue = filter.values[1]

    return (
      <span className="tabular-nums tracking-tight">
        {minValue} {t('and', locale)} {maxValue}
      </span>
    )
  }

  const value = filter.values[0]

  return <span className="tabular-nums tracking-tight">{value}</span>
}

/** **** Property Filter Value Controller ******/

interface FilterValueControllerProps<TData, TType extends ColumnDataType> {
  filter?: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  strategy: FilterStrategy
  locale?: Locale
}

const FilterValueControllerMemo = memo(
  __FilterValueController,
) as typeof __FilterValueController

export { FilterValueControllerMemo as FilterValueController }

function __FilterValueController<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  strategy,
  locale = 'en',
}: FilterValueControllerProps<TData, TType>) {
  switch (column.type) {
    case 'option': {
      const optionColumn = column as Column<TData, 'option'>

      if (optionColumn.asyncOptions) {
        return (
          <FilterValueAsyncOptionController
            filter={filter as FilterModel<'option'>}
            column={optionColumn}
            actions={actions}
            strategy={strategy}
            locale={locale}
          />
        )
      }

      return (
        <FilterValueOptionController
          filter={filter as FilterModel<'option'>}
          column={optionColumn}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )
    }

    case 'multiOption': {
      const multiColumn = column as Column<TData, 'multiOption'>

      if (multiColumn.asyncOptions) {
        return (
          <FilterValueAsyncOptionController
            filter={filter as FilterModel<'multiOption'>}
            column={multiColumn}
            actions={actions}
            strategy={strategy}
            locale={locale}
          />
        )
      }

      return (
        <FilterValueMultiOptionController
          filter={filter as FilterModel<'multiOption'>}
          column={multiColumn}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )
    }

    case 'date':
      return (
        <FilterValueDateController
          filter={filter as FilterModel<'date'>}
          column={column as Column<TData, 'date'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )

    case 'text':
      return (
        <FilterValueTextController
          filter={filter as FilterModel<'text'>}
          column={column as Column<TData, 'text'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )

    case 'uuid':
      return (
        <FilterValueUuidController
          filter={filter as FilterModel<'uuid'>}
          column={column as Column<TData, 'uuid'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )

    case 'number':
      return (
        <FilterValueNumberController
          filter={filter as FilterModel<'number'>}
          column={column as Column<TData, 'number'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )

    case 'boolean':
      return (
        <FilterValueBooleanController
          filter={filter as FilterModel<'boolean'>}
          column={column as Column<TData, 'boolean'>}
          actions={actions}
          strategy={strategy}
          locale={locale}
        />
      )

    default:
      return null
  }
}

export function FilterValueBooleanController<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerProps<TData, 'boolean'>) {
  const { setFilterValue } = actions
  const isEmptyOperator =
    filter?.operator === 'is empty' || filter?.operator === 'is not empty'
  const currentValue = filter?.values[0]

  const onPick = useCallback(
    (value: boolean) => {
      setFilterValue(column, [value])
    },
    [column, setFilterValue],
  )

  if (isEmptyOperator) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">
        {t('booleanEmptyHint', locale)}
      </div>
    )
  }

  const trueLabel = column.trueLabel ?? t('true', locale)
  const falseLabel = column.falseLabel ?? t('false', locale)

  return (
    <div className="flex flex-col gap-1 p-2">
      <Tabs
        value={
          currentValue === true ? 'true' : currentValue === false ? 'false' : ''
        }
        onValueChange={(value) => onPick(value === 'true')}
      >
        <TabsList className="w-full *:text-xs">
          <TabsTrigger value="true">{trueLabel}</TabsTrigger>
          <TabsTrigger value="false">{falseLabel}</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

/*
 * Async option / multi-option controller. Replaces the static option list
 * with a debounced server-side search + paginated load when the column
 * has `asyncOptions` configured. Used by `useDocyrusDataGrid` for
 * relation- and user-backed filter columns where shipping the full
 * option set up front isn't practical.
 */
function FilterValueAsyncOptionController<
  TData,
  TType extends 'option' | 'multiOption',
>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerProps<TData, TType>) {
  const cfg = column.asyncOptions
  const pageSize = cfg?.pageSize ?? 25
  const debounceMs = cfg?.debounceMs ?? 300
  const isMulti = column.type === 'multiOption'
  const selectedValues = useMemo(() => {
    const values = filter?.values ?? []

    return new Set(values as Array<string>)
  }, [filter?.values])

  /*
   * Stash the latest `load` callback in a ref so the load effect's deps
   * stay stable across parent re-renders. Without this, a new `cfg`
   * reference on every render of the host (e.g. `DataGridFilterMenu`
   * rebuilding `columnsConfig` after a refetch) re-fires the effect and
   * triggers duplicate network requests.
   */
  const loadRef = useRef(cfg?.load)

  loadRef.current = cfg?.load

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [items, setItems] = useState<Array<ColumnOption>>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), debounceMs)

    return () => clearTimeout(timeout)
  }, [search, debounceMs])

  /*
   * Reset + first page on initial mount and any time the debounced
   * search query changes. The cancelled flag guards against races when
   * the user types quickly enough that two loads overlap.
   */
  useEffect(() => {
    const load = loadRef.current

    if (!load) return undefined

    const controller = new AbortController()

    queueMicrotask(() => {
      if (controller.signal.aborted) return
      setIsLoading(true)
      setPage(0)
    })
    load({
      search: debouncedSearch,
      page: 0,
      pageSize,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return
        setItems(decodeOptionLabels(result.items))
        setHasMore(result.hasMore ?? false)
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return
        throw error
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [debouncedSearch, pageSize])

  const onLoadMore = useCallback(() => {
    const load = loadRef.current

    if (!load) return

    const nextPage = page + 1

    setIsLoading(true)
    load({ search: debouncedSearch, page: nextPage, pageSize })
      .then((result) => {
        setItems((prev) => [...prev, ...decodeOptionLabels(result.items)])
        setPage(nextPage)
        setHasMore(result.hasMore ?? false)
      })
      .finally(() => setIsLoading(false))
  }, [page, debouncedSearch, pageSize])

  const handleToggle = useCallback(
    (value: string, checked: boolean) => {
      if (isMulti) {
        if (checked) {
          actions.addFilterValue(column as Column<TData, 'multiOption'>, [
            value,
          ])
        } else {
          actions.removeFilterValue(column as Column<TData, 'multiOption'>, [
            value,
          ])
        }

        return
      }

      if (checked) {
        actions.setFilterValue(column, [value] as FilterModel<TType>['values'])
      } else {
        actions.setFilterValue(column, [] as FilterModel<TType>['values'])
      }
    },
    [actions, column, isMulti],
  )

  if (!cfg) return null

  return (
    <Command shouldFilter={false}>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder={t('search', locale)}
      />
      <CommandList className="max-h-72">
        {!isLoading && items.length === 0 && (
          <CommandEmpty>{t('noresults', locale)}</CommandEmpty>
        )}
        <CommandGroup>
          {items.map((option) => {
            const isSelected = selectedValues.has(option.value)
            const Icon = option.icon
            const fallback = option.label.slice(0, 2).toUpperCase()

            return (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleToggle(option.value, !isSelected)}
                className="flex items-center gap-2"
              >
                <Checkbox
                  checked={isSelected}
                  className="opacity-0 data-[state=checked]:opacity-100 group-data-[selected=true]:opacity-100 dark:border-ring"
                />
                {option.imageUrl ? (
                  <Avatar className="size-6">
                    <AvatarImage src={option.imageUrl} alt={option.label} />
                    <AvatarFallback className="text-[10px]">
                      {fallback}
                    </AvatarFallback>
                  </Avatar>
                ) : Icon ? (
                  isValidElement(Icon) ? (
                    Icon
                  ) : (
                    <Icon className="size-6 text-muted-foreground" />
                  )
                ) : null}
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{option.label}</span>
                  {option.secondaryLabel && (
                    <span className="truncate text-xs text-muted-foreground">
                      {option.secondaryLabel}
                    </span>
                  )}
                </div>
              </CommandItem>
            )
          })}
        </CommandGroup>
        {hasMore && (
          <CommandGroup>
            <CommandItem
              disabled={isLoading}
              onSelect={onLoadMore}
              className="text-xs text-muted-foreground"
            >
              {isLoading ? t('loading', locale) : t('loadMore', locale)}
            </CommandItem>
          </CommandGroup>
        )}
        {isLoading && items.length > 0 && (
          <CommandGroup>
            <CommandItem disabled className="text-xs text-muted-foreground">
              {t('loading', locale)}
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}

interface OptionItemProps {
  option: ColumnOptionExtended & { initialSelected: boolean }
  onToggle: (value: string, checked: boolean) => void
}

const OptionItem = memo(({ option, onToggle }: OptionItemProps) => {
  const { value, label, icon: Icon, selected, count, color, imageUrl } = option
  const handleSelect = useCallback(() => {
    onToggle(value, !selected)
  }, [onToggle, value, selected])
  const fallback = label.slice(0, 2).toUpperCase()

  return (
    <CommandItem
      key={value}
      onSelect={handleSelect}
      className="group flex items-center justify-between gap-1.5"
    >
      <div className="flex items-center gap-1.5">
        <Checkbox
          checked={selected}
          className="opacity-0 data-[state=checked]:opacity-100 group-data-[selected=true]:opacity-100 dark:border-ring mr-1"
        />
        {imageUrl ? (
          <Avatar className="size-5">
            <AvatarImage src={imageUrl} alt={label} />
            <AvatarFallback className="text-[10px]">{fallback}</AvatarFallback>
          </Avatar>
        ) : Icon ? (
          isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon className="size-4 text-primary" />
          )
        ) : color ? (
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
        ) : null}
        <span>
          {label}
          <sup
            className={cn(
              count == null && 'hidden',
              'ml-0.5 tabular-nums tracking-tight text-muted-foreground',
              count === 0 && 'slashed-zero',
            )}
          >
            {typeof count === 'number' ? (count < 100 ? count : '100+') : ''}
          </sup>
        </span>
      </div>
    </CommandItem>
  )
})

export function FilterValueOptionController<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerProps<TData, 'option'>) {
  const initialOptions = useMemo(() => {
    const counts = column.getFacetedUniqueValues()

    return column.getOptions().map((o) => ({
      ...o,
      selected: filter?.values.includes(o.value) ?? false,
      initialSelected: filter?.values.includes(o.value) ?? false,
      ...(counts !== undefined && counts.size > 0
        ? { count: counts.get(o.value) ?? 0 }
        : {}),
    }))
  }, [column, filter?.values])

  const [options, setOptions] = useState(initialOptions)

  const prevFilterValuesRef = useRef(filter?.values)

  if (prevFilterValuesRef.current !== filter?.values) {
    prevFilterValuesRef.current = filter?.values
    setOptions((prev) =>
      prev.map((o) => ({
        ...o,
        selected: filter?.values.includes(o.value) ?? false,
      })),
    )
  }

  const handleToggle = useCallback(
    (value: string, checked: boolean) => {
      if (checked) actions.addFilterValue(column, [value])
      else actions.removeFilterValue(column, [value])
    },
    [actions, column],
  )

  const { selectedOptions, unselectedOptions } = useMemo(() => {
    const sel: typeof options = []
    const unsel: typeof options = []

    for (const o of options) {
      if (o.initialSelected) sel.push(o)
      else unsel.push(o)
    }

    return { selectedOptions: sel, unselectedOptions: unsel }
  }, [options])

  return (
    <Command loop>
      <CommandInput placeholder={t('search', locale)} />
      <CommandEmpty>{t('noresults', locale)}</CommandEmpty>
      <CommandList className="max-h-fit">
        <CommandGroup className={cn(selectedOptions.length === 0 && 'hidden')}>
          {selectedOptions.map((option) => (
            <OptionItem
              key={option.value}
              option={option}
              onToggle={handleToggle}
            />
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup
          className={cn(unselectedOptions.length === 0 && 'hidden')}
        >
          {unselectedOptions.map((option) => (
            <OptionItem
              key={option.value}
              option={option}
              onToggle={handleToggle}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function FilterValueMultiOptionController<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerProps<TData, 'multiOption'>) {
  const initialOptions = useMemo(() => {
    const counts = column.getFacetedUniqueValues()

    return column.getOptions().map((o) => {
      const selected = filter?.values.includes(o.value) ?? false

      return {
        ...o,
        selected,
        initialSelected: selected,
        ...(counts !== undefined && counts.size > 0
          ? { count: counts.get(o.value) ?? 0 }
          : {}),
      }
    })
  }, [column, filter?.values])

  const [options, setOptions] = useState(initialOptions)

  const prevFilterValuesRef = useRef(filter?.values)

  if (prevFilterValuesRef.current !== filter?.values) {
    prevFilterValuesRef.current = filter?.values
    setOptions((prev) =>
      prev.map((o) => ({
        ...o,
        selected: filter?.values.includes(o.value) ?? false,
      })),
    )
  }

  const handleToggle = useCallback(
    (value: string, checked: boolean) => {
      if (checked) actions.addFilterValue(column, [value])
      else actions.removeFilterValue(column, [value])
    },
    [actions, column],
  )

  const { selectedOptions, unselectedOptions } = useMemo(() => {
    const sel: typeof options = []
    const unsel: typeof options = []

    for (const o of options) {
      if (o.initialSelected) sel.push(o)
      else unsel.push(o)
    }

    return { selectedOptions: sel, unselectedOptions: unsel }
  }, [options])

  return (
    <Command loop>
      <CommandInput placeholder={t('search', locale)} />
      <CommandEmpty>{t('noresults', locale)}</CommandEmpty>
      <CommandList>
        <CommandGroup className={cn(selectedOptions.length === 0 && 'hidden')}>
          {selectedOptions.map((option) => (
            <OptionItem
              key={option.value}
              option={option}
              onToggle={handleToggle}
            />
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup
          className={cn(unselectedOptions.length === 0 && 'hidden')}
        >
          {unselectedOptions.map((option) => (
            <OptionItem
              key={option.value}
              option={option}
              onToggle={handleToggle}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

interface DatePreset {
  key: string
  label: string
  range: () => DateRange
}

function getDatePresets(locale: Locale): Array<DatePreset> {
  const today = startOfDay(new Date())
  const yesterday = subDays(today, 1)
  const weekOptions = { weekStartsOn: 1 } as const

  return [
    {
      key: 'today',
      label: t('datePresets.today', locale),
      range: () => ({ from: today, to: today }),
    },
    {
      key: 'yesterday',
      label: t('datePresets.yesterday', locale),
      range: () => ({ from: yesterday, to: yesterday }),
    },
    {
      key: 'last7Days',
      label: t('datePresets.last7Days', locale),
      range: () => ({ from: subDays(today, 6), to: today }),
    },
    {
      key: 'last30Days',
      label: t('datePresets.last30Days', locale),
      range: () => ({ from: subDays(today, 29), to: today }),
    },
    {
      key: 'thisWeek',
      label: t('datePresets.thisWeek', locale),
      range: () => ({
        from: startOfWeek(today, weekOptions),
        to: endOfWeek(today, weekOptions),
      }),
    },
    {
      key: 'thisMonth',
      label: t('datePresets.thisMonth', locale),
      range: () => ({ from: startOfMonth(today), to: endOfMonth(today) }),
    },
    {
      key: 'thisYear',
      label: t('datePresets.thisYear', locale),
      range: () => ({ from: startOfYear(today), to: endOfYear(today) }),
    },
  ]
}

function rangesEqual(a: DateRange | undefined, b: DateRange): boolean {
  if (!a?.from || !b.from) return false
  const aTo = a.to ?? a.from
  const bTo = b.to ?? b.from

  return isSameDay(a.from, b.from) && isSameDay(aTo, bTo)
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function getTimeString(date: unknown): string {
  /*
   * Date columns share one controller across calendar AND relative/X-days
   * operators. For X-days the filter value is a numeric N, not a Date, so
   * guard against non-Date inputs — calling `.getHours()` on a number threw
   * `date.getHours is not a function` at mount (issue #102).
   */
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '00:00'

  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function applyTimeToDate(date: Date, time: string): Date {
  const [hStr, mStr] = time.split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  const next = new Date(date)

  next.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0)

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[filter-value] applyTimeToDate', {
      inputDate: date,
      inputIso: date.toISOString?.(),
      time,
      output: next,
      outputIso: next.toISOString(),
      outputLocal: `${next.getFullYear()}-${pad2(next.getMonth() + 1)}-${pad2(next.getDate())} ${pad2(next.getHours())}:${pad2(next.getMinutes())}`,
    })
  }

  return next
}

export function FilterValueDateController<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerProps<TData, 'date'>) {
  const includeTime = column.includeTime === true

  /*
   * Don't seed `from` with today when no filter has been picked yet — that
   * causes the first calendar click to be interpreted as the *end* of the
   * range (today + clicked date), silently producing a range like
   * `<clicked> – today` instead of letting the user pick start then end.
   */
  const [date, setDate] = useState<DateRange | undefined>({
    /*
     * Only seed Date values — X-days operators store a numeric N here, which
     * must not leak into the calendar's DateRange (issue #102).
     */
    from: filter?.values[0] instanceof Date ? filter.values[0] : undefined,
    to: filter?.values[1] instanceof Date ? filter.values[1] : undefined,
  })

  const [fromTime, setFromTime] = useState<string>(() =>
    getTimeString(filter?.values[0]),
  )
  const [toTime, setToTime] = useState<string>(() =>
    getTimeString(filter?.values[1]),
  )

  const presets = useMemo(() => getDatePresets(locale), [locale])

  /*
   * Relative operators (today / lastWeek / xDaysAgo / …) — selected from
   * the operator dropdown. The popover then either auto-confirms (no
   * value needed) or renders a single numeric input for the *XDays
   * variants.
   */
  if (filter && isRelativeDateOperator(filter.operator)) {
    if (isXDaysRelativeOperator(filter.operator)) {
      const rawDays = filter.values[0]
      /*
       * Only echo a finite numeric N. The operator-pick commits `0` upfront
       * (see FilterOperatorDateController), so a stale calendar Date never
       * reaches the input — guard anyway so `Number(Date)` can't surface a
       * huge millisecond value (issue #102).
       */
      const daysValue =
        typeof rawDays === 'number' && Number.isFinite(rawDays) ? rawDays : 0
      const commitDays = (value: string | number) => {
        const n = Number(value)

        if (!Number.isFinite(n) || n < 0) return
        actions.setFilterValue(column, [n] as never)
      }

      return (
        <div className="flex flex-col gap-2 p-3 w-64">
          <span className="text-xs font-medium text-muted-foreground">
            {t('filters.date.daysLabel', locale)}
          </span>
          <DebouncedInput
            type="number"
            min={0}
            placeholder="0"
            value={daysValue}
            onChange={commitDays}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitDays((e.target as HTMLInputElement).value)
              }
            }}
          />
        </div>
      )
    }

    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">
        {t(dateFilterOperators[filter.operator].key, locale)}
      </div>
    )
  }

  function applyRange(range: DateRange) {
    let start: Date | undefined = range.from
    let end: Date | undefined =
      range.to && start && !isEqual(start, range.to) ? range.to : undefined

    if (includeTime) {
      if (start) start = applyTimeToDate(start, fromTime)
      if (end) end = applyTimeToDate(end, toTime)
    }

    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[filter-value] applyRange', {
        rangeFrom: range.from,
        rangeTo: range.to,
        includeTime,
        fromTime,
        toTime,
        finalStart: start,
        finalStartIso: start?.toISOString(),
        finalEnd: end,
        finalEndIso: end?.toISOString(),
      })
    }

    setDate({ from: start, to: end })

    if (!start) {
      actions.setFilterValue(column, [])

      return
    }

    const newValues: Array<Date> = end ? [start, end] : [start]

    actions.setFilterValue(column, newValues)
  }

  function changeDateRange(value: DateRange | undefined) {
    if (!value) {
      setDate(undefined)
      actions.setFilterValue(column, [])

      return
    }
    applyRange(value)
  }

  function changeFromTime(value: string) {
    setFromTime(value)

    if (date?.from) {
      const next = applyTimeToDate(date.from, value)
      const end = date.to

      setDate({ from: next, to: end })
      const newValues = end ? [next, end] : [next]

      actions.setFilterValue(column, newValues as never)
    }
  }

  function changeToTime(value: string) {
    setToTime(value)

    if (date?.to) {
      const next = applyTimeToDate(date.to, value)
      const start = date.from

      setDate({ from: start, to: next })

      if (start) {
        actions.setFilterValue(column, [start, next] as never)
      }
    }
  }

  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandGroup>
          <div className="flex items-stretch gap-2 p-2">
            <div className="flex w-32 flex-col gap-1">
              {presets.map((preset) => {
                const presetRange = preset.range()
                const isActive = rangesEqual(date, presetRange)

                return (
                  <Button
                    key={preset.key}
                    type="button"
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 justify-start px-2 text-xs"
                    onClick={() => applyRange(presetRange)}
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </div>
            <div className="flex flex-col gap-2">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={changeDateRange}
                numberOfMonths={1}
              />
              {includeTime && (
                <div className="flex items-center gap-2 px-1 pb-1">
                  <div className="flex flex-1 items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {t('filters.date.from', locale)}
                    </span>
                    <input
                      type="time"
                      value={fromTime}
                      onChange={(e) => changeFromTime(e.target.value)}
                      className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  {date?.to && (
                    <div className="flex flex-1 items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {t('filters.date.to', locale)}
                      </span>
                      <input
                        type="time"
                        value={toTime}
                        onChange={(e) => changeToTime(e.target.value)}
                        className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function FilterValueTextController<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerProps<TData, 'text'>) {
  const changeText = (value: string | number) => {
    actions.setFilterValue(column, [String(value)])
  }

  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandGroup>
          <CommandItem>
            <DebouncedInput
              placeholder={t('search', locale)}
              value={filter?.values[0] ?? ''}
              onChange={changeText}
            />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function FilterValueUuidController<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerProps<TData, 'uuid'>) {
  const isEmptyOperator =
    filter?.operator === 'is empty' || filter?.operator === 'is not empty'

  const changeText = (value: string | number) => {
    actions.setFilterValue(column, [String(value)])
  }

  if (isEmptyOperator) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">
        {t('booleanEmptyHint', locale)}
      </div>
    )
  }

  const current = filter?.values[0] ?? ''
  const showInvalidHint = current.trim() !== '' && !isCompleteUuid(current)

  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandGroup>
          <CommandItem>
            <DebouncedInput
              placeholder={t('filters.uuid.placeholder', locale)}
              value={current}
              onChange={changeText}
            />
          </CommandItem>
          {showInvalidHint && (
            <div className="px-2 pb-2 text-xs text-muted-foreground">
              {t('filters.uuid.invalidHint', locale)}
            </div>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function FilterValueNumberController<TData>({
  filter,
  column,
  actions,
  locale = 'en',
}: FilterValueControllerProps<TData, 'number'>) {
  const minMax = useMemo(() => column.getFacetedMinMaxValues(), [column])

  const [values, setValues] = useState(filter?.values ?? [0, 0])

  const prevFilterValuesNumRef = useRef(filter?.values)

  if (prevFilterValuesNumRef.current !== filter?.values) {
    prevFilterValuesNumRef.current = filter?.values

    if (
      filter?.values &&
      filter.values.length === values.length &&
      filter.values.every((v, i) => v === values[i])
    ) {
      setValues(filter.values)
    }
  }

  const isNumberRange =
    filter && numberFilterOperators[filter.operator].target === 'multiple'

  const setFilterOperatorDebounced = useDebounceCallback(
    actions.setFilterOperator,
    500,
  )
  const setFilterValueDebounced = useDebounceCallback(
    actions.setFilterValue,
    500,
  )

  const changeNumber = (value: Array<number>) => {
    setValues(value)
    setFilterValueDebounced(column as any, value)
  }

  const changeMinNumber = (value: number) => {
    const newValues = createNumberRange([value, values[1] ?? 0])

    setValues(newValues)
    setFilterValueDebounced(column as any, newValues)
  }

  const changeMaxNumber = (value: number) => {
    const newValues = createNumberRange([values[0] ?? 0, value])

    setValues(newValues)
    setFilterValueDebounced(column as any, newValues)
  }

  const changeType = useCallback(
    (type: 'single' | 'range') => {
      let newValues: Array<number> = []

      if (type === 'single') newValues = [values[0] ?? 0]
      else if (!minMax)
        newValues = createNumberRange([values[0] ?? 0, values[1] ?? 0])
      else {
        const value = values[0] ?? 0

        newValues =
          value - minMax[0] < minMax[1] - value
            ? createNumberRange([value, minMax[1]])
            : createNumberRange([minMax[0], value])
      }

      const newOperator = type === 'single' ? 'is' : 'is between'

      setValues(newValues)

      setFilterOperatorDebounced.cancel()
      setFilterValueDebounced.cancel()

      actions.setFilterOperator(column.id, newOperator)
      actions.setFilterValue(column, newValues)
    },
    [
      values,
      column,
      actions,
      minMax,
      setFilterOperatorDebounced,
      setFilterValueDebounced,
    ],
  )

  return (
    <Command>
      <CommandList className="w-75 p-2">
        <CommandGroup>
          <div className="flex flex-col w-full">
            <Tabs
              value={isNumberRange ? 'range' : 'single'}
              onValueChange={(v) => changeType(v as 'single' | 'range')}
            >
              <TabsList className="w-full *:text-xs">
                <TabsTrigger value="single">{t('single', locale)}</TabsTrigger>
                <TabsTrigger value="range">{t('range', locale)}</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {t('value', locale)}
                  </span>
                  <DebouncedInput
                    id="single"
                    type="number"
                    value={(values[0] ?? 0).toString()}
                    onChange={(v) => changeNumber([Number(v)])}
                  />
                </div>
              </TabsContent>
              <TabsContent value="range" className="flex flex-col gap-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {t('min', locale)}
                    </span>
                    <DebouncedInput
                      type="number"
                      value={values[0] ?? 0}
                      onChange={(v) => changeMinNumber(Number(v))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {t('max', locale)}
                    </span>
                    <DebouncedInput
                      type="number"
                      value={values[1] ?? 0}
                      onChange={(v) => changeMaxNumber(Number(v))}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
