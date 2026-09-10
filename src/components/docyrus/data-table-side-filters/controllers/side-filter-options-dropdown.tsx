'use client'

// @ts-nocheck
/* eslint-disable */
import { isValidElement, useCallback, useMemo, useState } from 'react'

import { ChevronDown, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  type ColumnOption,
  type DataTableFilterActions,
  type FilterModel,
  type OptionBasedColumnDataType,
} from '@/components/docyrus/data-table-filter/core/types'
import { type Locale, t } from '@/components/docyrus/data-table-filter/lib/i18n'

interface SideFilterOptionsDropdownProps<
  TData,
  TType extends OptionBasedColumnDataType,
> {
  column: Column<TData, TType>
  filter?: FilterModel<TType>
  actions: DataTableFilterActions
  locale?: Locale
  /** Override the trigger placeholder when nothing is selected. */
  placeholder?: string
}

export function SideFilterOptionsDropdown<
  TData,
  TType extends OptionBasedColumnDataType,
>({
  column,
  filter,
  actions,
  locale = 'en',
  placeholder,
}: SideFilterOptionsDropdownProps<TData, TType>) {
  const [open, setOpen] = useState(false)
  const options = useMemo(() => column.getOptions(), [column])
  const counts = useMemo(() => column.getFacetedUniqueValues(), [column])
  const selectedValues = useMemo(
    () => new Set((filter?.values as Array<string>) ?? []),
    [filter?.values],
  )
  const selectedOptions = useMemo<Array<ColumnOption>>(
    () => options.filter((o) => selectedValues.has(o.value)),
    [options, selectedValues],
  )

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

  const removeChip = useCallback(
    (value: string) => {
      actions.removeFilterValue(column, [value] as FilterModel<TType>['values'])
    },
    [actions, column],
  )

  const triggerLabel =
    selectedOptions.length === 0
      ? (placeholder ?? `${t('search', locale)}...`)
      : selectedOptions.length === 1
        ? selectedOptions[0]?.label
        : `${selectedOptions.length} selected`

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-9 w-full justify-between px-3 font-normal',
              selectedOptions.length === 0 && 'text-muted-foreground',
            )}
          >
            <span className="truncate">{triggerLabel}</span>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <Command>
            <CommandInput placeholder={t('search', locale)} />
            <CommandList>
              <CommandEmpty>{t('noresults', locale)}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.has(option.value)
                  const Icon = option.icon
                  const count = counts?.get(option.value) ?? 0
                  const fallback = option.label.slice(0, 2).toUpperCase()

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleToggle(option.value, !isSelected)}
                      className="flex items-center gap-2"
                    >
                      <Checkbox checked={isSelected} />
                      {option.imageUrl ? (
                        <Avatar className="size-5">
                          <AvatarImage
                            src={option.imageUrl}
                            alt={option.label}
                          />
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
                      {count > 0 && (
                        <span className="tabular-nums text-xs text-muted-foreground">
                          {count < 100 ? count : '100+'}
                        </span>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => {
            const Icon = option.icon
            const fallback = option.label.slice(0, 2).toUpperCase()

            return (
              <Badge
                key={option.value}
                variant="secondary"
                className="gap-1 pr-1 pl-1.5 text-xs font-normal"
              >
                {option.imageUrl ? (
                  <Avatar className="size-3.5">
                    <AvatarImage src={option.imageUrl} alt={option.label} />
                    <AvatarFallback className="text-[8px]">
                      {fallback}
                    </AvatarFallback>
                  </Avatar>
                ) : Icon ? (
                  isValidElement(Icon) ? (
                    Icon
                  ) : (
                    <Icon className="size-3" />
                  )
                ) : option.color ? (
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                ) : null}
                <span className="truncate max-w-32">{option.label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${option.label}`}
                  onClick={() => removeChip(option.value)}
                  className="ml-0.5 rounded-sm p-0.5 transition-colors hover:bg-foreground/10"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
