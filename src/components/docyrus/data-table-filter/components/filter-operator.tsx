'use client'

// @ts-nocheck
/* eslint-disable */
import { useState } from 'react'

import { Button } from '@/components/ui/button'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  type Column,
  type ColumnDataType,
  type DataTableFilterActions,
  type FilterModel,
  type FilterOperators,
} from '../core/types'

import {
  booleanFilterOperators,
  dateFilterOperators,
  filterTypeOperatorDetails,
  isRelativeDateOperator,
  isXDaysRelativeOperator,
  multiOptionFilterOperators,
  numberFilterOperators,
  optionFilterOperators,
  textFilterOperators,
  uuidFilterOperators,
} from '../core/operators'
import { t, type Locale } from '../lib/i18n'

interface FilterOperatorProps<TData, TType extends ColumnDataType> {
  column: Column<TData, TType>
  filter: FilterModel<TType>
  actions: DataTableFilterActions
  locale?: Locale
}

/*
 * Renders the filter operator display and menu for a given column filter
 * The filter operator display is the label and icon for the filter operator
 * The filter operator menu is the dropdown menu for the filter operator
 */
export function FilterOperator<TData, TType extends ColumnDataType>({
  column,
  filter,
  actions,
  locale = 'en',
}: FilterOperatorProps<TData, TType>) {
  const [open, setOpen] = useState<boolean>(false)

  const close = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="m-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs"
        >
          <FilterOperatorDisplay
            filter={filter}
            columnType={column.type}
            locale={locale}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        <Command loop>
          <CommandInput placeholder={t('search', locale)} />
          <CommandEmpty>{t('noresults', locale)}</CommandEmpty>
          <CommandList className="max-h-[300px] overflow-y-auto">
            <FilterOperatorController
              filter={filter}
              column={column}
              actions={actions}
              closeController={close}
              locale={locale}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface FilterOperatorDisplayProps<TType extends ColumnDataType> {
  filter: FilterModel<TType>
  columnType: TType
  locale?: Locale
}

export function FilterOperatorDisplay<TType extends ColumnDataType>({
  filter,
  columnType,
  locale = 'en',
}: FilterOperatorDisplayProps<TType>) {
  const operator = filterTypeOperatorDetails[columnType][filter.operator]
  const label = t(operator.key, locale)

  return <span className="text-muted-foreground">{label}</span>
}

interface FilterOperatorControllerProps<TData, TType extends ColumnDataType> {
  filter: FilterModel<TType>
  column: Column<TData, TType>
  actions: DataTableFilterActions
  closeController: () => void
  locale?: Locale
}

/*
 *
 * TODO: Reduce into a single component. Each data type does not need it's own controller.
 *
 */
export function FilterOperatorController<TData, TType extends ColumnDataType>({
  filter,
  column,
  actions,
  closeController,
  locale = 'en',
}: FilterOperatorControllerProps<TData, TType>) {
  switch (column.type) {
    case 'option':
      return (
        <FilterOperatorOptionController
          filter={filter as FilterModel<'option'>}
          column={column as Column<TData, 'option'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
        />
      )

    case 'multiOption':
      return (
        <FilterOperatorMultiOptionController
          filter={filter as FilterModel<'multiOption'>}
          column={column as Column<TData, 'multiOption'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
        />
      )

    case 'date':
      return (
        <FilterOperatorDateController
          filter={filter as FilterModel<'date'>}
          column={column as Column<TData, 'date'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
        />
      )

    case 'text':
      return (
        <FilterOperatorTextController
          filter={filter as FilterModel<'text'>}
          column={column as Column<TData, 'text'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
        />
      )

    case 'number':
      return (
        <FilterOperatorNumberController
          filter={filter as FilterModel<'number'>}
          column={column as Column<TData, 'number'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
        />
      )

    case 'boolean':
      return (
        <FilterOperatorBooleanController
          filter={filter as FilterModel<'boolean'>}
          column={column as Column<TData, 'boolean'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
        />
      )

    case 'uuid':
      return (
        <FilterOperatorUuidController
          filter={filter as FilterModel<'uuid'>}
          column={column as Column<TData, 'uuid'>}
          actions={actions}
          closeController={closeController}
          locale={locale}
        />
      )

    default:
      return null
  }
}

function FilterOperatorUuidController<TData>({
  filter,
  column,
  actions,
  closeController,
  locale = 'en',
}: FilterOperatorControllerProps<TData, 'uuid'>) {
  const filterDetails = uuidFilterOperators[filter.operator]

  const relatedFilters = Object.values(uuidFilterOperators).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['uuid'])
    closeController()
  }

  return (
    <CommandGroup heading={t('operators', locale)}>
      {relatedFilters.map((r) => {
        return (
          <CommandItem onSelect={changeOperator} value={r.value} key={r.value}>
            {t(r.key, locale)}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function FilterOperatorBooleanController<TData>({
  filter,
  column,
  actions,
  closeController,
  locale = 'en',
}: FilterOperatorControllerProps<TData, 'boolean'>) {
  const filterDetails = booleanFilterOperators[filter.operator]

  const relatedFilters = Object.values(booleanFilterOperators).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['boolean'])
    closeController()
  }

  return (
    <CommandGroup heading={t('operators', locale)}>
      {relatedFilters.map((r) => {
        return (
          <CommandItem
            onSelect={changeOperator}
            value={r.value}
            keywords={[t(r.key, locale)]}
            key={r.value}
          >
            {t(r.key, locale)}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function FilterOperatorOptionController<TData>({
  filter,
  column,
  actions,
  closeController,
  locale = 'en',
}: FilterOperatorControllerProps<TData, 'option'>) {
  const filterDetails = optionFilterOperators[filter.operator]

  const relatedFilters = Object.values(optionFilterOperators).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['option'])
    closeController()
  }

  return (
    <CommandGroup heading={t('operators', locale)}>
      {relatedFilters.map((r) => {
        return (
          <CommandItem
            onSelect={changeOperator}
            value={r.value}
            keywords={[t(r.key, locale)]}
            key={r.value}
          >
            {t(r.key, locale)}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function FilterOperatorMultiOptionController<TData>({
  filter,
  column,
  actions,
  closeController,
  locale = 'en',
}: FilterOperatorControllerProps<TData, 'multiOption'>) {
  const filterDetails = multiOptionFilterOperators[filter.operator]

  const relatedFilters = Object.values(multiOptionFilterOperators).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(
      column.id,
      value as FilterOperators['multiOption'],
    )
    closeController()
  }

  return (
    <CommandGroup heading={t('operators', locale)}>
      {relatedFilters.map((r) => {
        return (
          <CommandItem
            onSelect={changeOperator}
            value={r.value}
            keywords={[t(r.key, locale)]}
            key={r.value}
          >
            {t(r.key, locale)}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function FilterOperatorDateController<TData>({
  filter: _filter,
  column,
  actions,
  closeController,
  locale = 'en',
}: FilterOperatorControllerProps<TData, 'date'>) {
  /*
   * For date columns we show every operator regardless of `target` —
   * users need to be able to switch between single-date (`is`),
   * range (`is between`), and relative (`today`) operators without the
   * dropdown silently hiding half the options based on which operator
   * is currently selected.
   */
  const allFilters = Object.values(dateFilterOperators)

  /*
   * Split into "calendar" (user picks a date) vs "relative" (resolved
   * against today on the backend) so the dropdown stays scannable —
   * with all relative operators inlined, the calendar comparators
   * would scroll off-screen otherwise.
   */
  const calendarFilters = allFilters.filter(
    (r) => !isRelativeDateOperator(r.value as FilterOperators['date']),
  )
  const relativeFilters = allFilters.filter((r) =>
    isRelativeDateOperator(r.value as FilterOperators['date']),
  )

  const changeOperator = (value: string) => {
    const op = value as FilterOperators['date']

    actions?.setFilterOperator(column.id, op)
    /*
     * X-days operators need a numeric N. Commit the default `0` immediately so
     * the filter is valid the moment the operator is picked — without it the
     * chip looked applied but the rule was dropped at serialization until N was
     * typed (issue #102, bug 2), and filtering for exactly 0 was impossible
     * (the panel's default 0 was never "changed"). This also overwrites any
     * stale calendar Date left over from the previous operator.
     */
    if (isXDaysRelativeOperator(op)) {
      actions?.setFilterValue(column, [0] as never)
    }
    closeController()
  }

  return (
    <>
      {calendarFilters.length > 0 && (
        <CommandGroup heading={t('filters.date.groupCalendar', locale)}>
          {calendarFilters.map((r) => (
            <CommandItem
              onSelect={changeOperator}
              value={r.value}
              keywords={[t(r.key, locale)]}
              key={r.value}
            >
              {t(r.key, locale)}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {relativeFilters.length > 0 && (
        <CommandGroup heading={t('filters.date.groupRelative', locale)}>
          {relativeFilters.map((r) => (
            <CommandItem
              onSelect={changeOperator}
              value={r.value}
              keywords={[t(r.key, locale)]}
              key={r.value}
            >
              {t(r.key, locale)}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </>
  )
}

export function FilterOperatorTextController<TData>({
  filter,
  column,
  actions,
  closeController,
  locale = 'en',
}: FilterOperatorControllerProps<TData, 'text'>) {
  const filterDetails = textFilterOperators[filter.operator]

  const relatedFilters = Object.values(textFilterOperators).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['text'])
    closeController()
  }

  return (
    <CommandGroup heading={t('operators', locale)}>
      {relatedFilters.map((r) => {
        return (
          <CommandItem
            onSelect={changeOperator}
            value={r.value}
            keywords={[t(r.key, locale)]}
            key={r.value}
          >
            {t(r.key, locale)}
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}

function FilterOperatorNumberController<TData>({
  filter,
  column,
  actions,
  closeController,
  locale = 'en',
}: FilterOperatorControllerProps<TData, 'number'>) {
  const filterDetails = numberFilterOperators[filter.operator]

  const relatedFilters = Object.values(numberFilterOperators).filter(
    (o) => o.target === filterDetails.target,
  )

  const changeOperator = (value: string) => {
    actions?.setFilterOperator(column.id, value as FilterOperators['number'])
    closeController()
  }

  return (
    <div>
      <CommandGroup heading={t('operators', locale)}>
        {relatedFilters.map((r) => (
          <CommandItem
            onSelect={() => changeOperator(r.value)}
            value={r.value}
            keywords={[t(r.key, locale)]}
            key={r.value}
          >
            {t(r.key, locale)}
          </CommandItem>
        ))}
      </CommandGroup>
    </div>
  )
}
