'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { type DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  type Column,
  type DataTableFilterActions,
  type FilterModel,
} from '@/components/docyrus/data-table-filter/core/types'
import { type Locale, t } from '@/components/docyrus/data-table-filter/lib/i18n'
import { useDateFormat } from '@/lib/use-date-format'

interface SideFilterDateRangeProps<TData> {
  column: Column<TData, 'date'>
  filter?: FilterModel<'date'>
  actions: DataTableFilterActions
  locale?: Locale
  /** When true, render presets above the from/to row. Default true. */
  withPresets?: boolean
}

interface DatePreset {
  key: string
  label: string
  range: () => DateRange
}

function buildPresets(locale: Locale): Array<DatePreset> {
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

export function SideFilterDateRange<TData>({
  column,
  filter,
  actions,
  locale = 'en',
  withPresets = true,
}: SideFilterDateRangeProps<TData>) {
  const { formatDate } = useDateFormat()
  const [open, setOpen] = useState(false)

  const range = useMemo<DateRange | undefined>(() => {
    const from = filter?.values[0] as Date | undefined
    const to = filter?.values[1] as Date | undefined

    if (!from) return undefined

    return { from, to }
  }, [filter?.values])

  const presets = useMemo(() => buildPresets(locale), [locale])

  const applyRange = useCallback(
    (next: DateRange | undefined) => {
      if (!next?.from) {
        actions.removeFilter(column.id)

        return
      }
      const start = next.from
      const end = next.to ?? undefined
      const values: Array<Date> =
        end && !isSameDay(start, end) ? [start, end] : [start]

      actions.setFilterValue(column, values)
    },
    [actions, column],
  )

  const triggerLabel = (() => {
    if (!range?.from) return t('search', locale)
    const fromStr = formatDate(range.from)

    if (!range.to || isSameDay(range.from, range.to)) return fromStr

    return `${fromStr} – ${formatDate(range.to)}`
  })()

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
              !range && 'text-muted-foreground',
            )}
          >
            <span className="truncate">{triggerLabel}</span>
            <CalendarIcon className="size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <div className="flex items-stretch gap-2">
            {withPresets && (
              <div className="flex w-32 flex-col gap-1">
                {presets.map((preset) => {
                  const presetRange = preset.range()
                  const isActive = rangesEqual(range, presetRange)

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
            )}
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={range?.from}
              selected={range}
              onSelect={applyRange}
              numberOfMonths={1}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
