'use client'

import {
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

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

interface SideFilterAsyncOptionsProps<
  TData,
  TType extends OptionBasedColumnDataType,
> {
  column: Column<TData, TType>
  filter?: FilterModel<TType>
  actions: DataTableFilterActions
  locale?: Locale
  placeholder?: string
}

export function SideFilterAsyncOptions<
  TData,
  TType extends OptionBasedColumnDataType,
>({
  column,
  filter,
  actions,
  locale = 'en',
  placeholder,
}: SideFilterAsyncOptionsProps<TData, TType>) {
  const cfg = column.asyncOptions
  const pageSize = cfg?.pageSize ?? 25
  const debounceMs = cfg?.debounceMs ?? 300
  const isMulti = column.type === 'multiOption'

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [items, setItems] = useState<Array<ColumnOption>>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  /**
   * Cache options we've ever loaded so previously-selected chips stay
   * labeled even after the search query filters them out of `items`.
   */
  const [seenOptions, setSeenOptions] = useState<Map<string, ColumnOption>>(
    () => new Map(),
  )

  const loadRef = useRef(cfg?.load)

  loadRef.current = cfg?.load

  const selectedValues = useMemo(
    () => new Set((filter?.values as Array<string>) ?? []),
    [filter?.values],
  )

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), debounceMs)

    return () => clearTimeout(timeout)
  }, [search, debounceMs])

  useEffect(() => {
    if (!open) return undefined
    const load = loadRef.current

    if (!load) return undefined
    const controller = new AbortController()

    setIsLoading(true)
    setPage(0)
    load({
      search: debouncedSearch,
      page: 0,
      pageSize,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return
        setItems(result.items)
        setHasMore(result.hasMore ?? false)
        setSeenOptions((prev) => {
          const next = new Map(prev)

          for (const o of result.items) next.set(o.value, o)

          return next
        })
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return
        throw error
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [debouncedSearch, pageSize, open])

  const onLoadMore = useCallback(() => {
    const load = loadRef.current

    if (!load) return
    const nextPage = page + 1

    setIsLoading(true)
    load({ search: debouncedSearch, page: nextPage, pageSize })
      .then((result) => {
        setItems((prev) => [...prev, ...result.items])
        setSeenOptions((prev) => {
          const next = new Map(prev)

          for (const o of result.items) next.set(o.value, o)

          return next
        })
        setPage(nextPage)
        setHasMore(result.hasMore ?? false)
      })
      .finally(() => setIsLoading(false))
  }, [page, debouncedSearch, pageSize])

  const handleToggle = useCallback(
    (option: ColumnOption, checked: boolean) => {
      setSeenOptions((prev) => {
        if (prev.has(option.value)) return prev
        const next = new Map(prev)

        next.set(option.value, option)

        return next
      })
      if (isMulti) {
        if (checked) {
          actions.addFilterValue(column as Column<TData, 'multiOption'>, [
            option.value,
          ])
        } else {
          actions.removeFilterValue(column as Column<TData, 'multiOption'>, [
            option.value,
          ])
        }

        return
      }
      if (checked) {
        actions.setFilterValue(column, [
          option.value,
        ] as FilterModel<TType>['values'])
        setOpen(false)
      } else {
        actions.setFilterValue(column, [] as FilterModel<TType>['values'])
      }
    },
    [actions, column, isMulti],
  )

  const removeChip = useCallback(
    (value: string) => {
      if (isMulti) {
        actions.removeFilterValue(column as Column<TData, 'multiOption'>, [
          value,
        ])
      } else {
        actions.setFilterValue(column, [] as FilterModel<TType>['values'])
      }
    },
    [actions, column, isMulti],
  )

  const selectedChips = useMemo(() => {
    return Array.from(selectedValues).map((value) => {
      const known = seenOptions.get(value)

      return known ?? { label: value, value }
    })
  }, [selectedValues, seenOptions])

  const triggerLabel =
    selectedChips.length === 0
      ? (placeholder ?? `${t('search', locale)}...`)
      : selectedChips.length === 1
        ? selectedChips[0]?.label
        : `${selectedChips.length} selected`

  if (!cfg) {
    return (
      <p className="px-1 py-2 text-xs text-muted-foreground">
        Async loader not configured
      </p>
    )
  }

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
              selectedChips.length === 0 && 'text-muted-foreground',
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
          <Command shouldFilter={false}>
            <CommandInput
              autoFocus
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
                      onSelect={() => handleToggle(option, !isSelected)}
                      className="flex items-center gap-2"
                    >
                      <Checkbox checked={isSelected} />
                      {option.imageUrl ? (
                        <Avatar className="size-6">
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
                          <Icon className="size-5 text-muted-foreground" />
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
                  <CommandItem
                    disabled
                    className="text-xs text-muted-foreground"
                  >
                    {t('loading', locale)}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedChips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedChips.map((option) => {
            const Icon = (option as ColumnOption).icon
            const fallback = option.label.slice(0, 2).toUpperCase()
            const { imageUrl } = option as ColumnOption

            return (
              <Badge
                key={option.value}
                variant="secondary"
                className="gap-1 pr-1 pl-1.5 text-xs font-normal"
              >
                {imageUrl ? (
                  <Avatar className="size-3.5">
                    <AvatarImage src={imageUrl} alt={option.label} />
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
