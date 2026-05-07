'use client'

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  type Column,
  type DataTableFilterActions,
  type FilterModel,
} from '@/components/docyrus/data-table-filter/core/types'
import { useDebounceCallback } from '@/components/docyrus/data-table-filter/hooks/use-debounce-callback'
import { type Locale, t } from '@/components/docyrus/data-table-filter/lib/i18n'

interface SideFilterNumericRangeProps<TData> {
  column: Column<TData, 'number'>
  filter?: FilterModel<'number'>
  actions: DataTableFilterActions
  locale?: Locale
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function SideFilterNumericRange<TData>({
  column,
  filter,
  actions,
  locale = 'en',
}: SideFilterNumericRangeProps<TData>) {
  const minMax = useMemo(() => column.getFacetedMinMaxValues(), [column])
  const sliderMin = minMax?.[0] ?? column.min ?? 0
  const sliderMax = minMax?.[1] ?? column.max ?? 100
  const hasBounds = sliderMax > sliderMin

  const initialFrom = filter?.values[0] ?? sliderMin
  const initialTo = filter?.values[1] ?? sliderMax

  const [draft, setDraft] = useState<[number, number]>([initialFrom, initialTo])
  const [error, setError] = useState<'order' | null>(null)

  useEffect(() => {
    if (!filter || filter.values.length === 0) {
      setDraft([sliderMin, sliderMax])
      setError(null)

      return
    }
    const from = filter.values[0] ?? sliderMin
    const to = filter.values[1] ?? sliderMax

    setDraft([from, to])
  }, [filter, sliderMin, sliderMax])

  const commit = useDebounceCallback((values: [number, number]) => {
    actions.setFilterOperator(column.id, 'is between')
    actions.setFilterValue(column, [...values])
  }, 300)

  const handleSlider = useCallback(
    (next: Array<number>) => {
      const [a, b] = [next[0] ?? sliderMin, next[1] ?? sliderMax]
      const ordered: [number, number] = a <= b ? [a, b] : [b, a]

      setDraft(ordered)
      setError(null)
      commit(ordered)
    },
    [commit, sliderMin, sliderMax],
  )

  const handleInput = useCallback(
    (which: 'from' | 'to') => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      const parsed = raw === '' ? NaN : Number(raw)

      if (Number.isNaN(parsed)) {
        const next: [number, number] =
          which === 'from' ? [sliderMin, draft[1]] : [draft[0], sliderMax]

        setDraft(next)
        setError(null)

        return
      }

      const clamped = hasBounds
        ? clampNumber(parsed, sliderMin, sliderMax)
        : parsed
      const next: [number, number] =
        which === 'from' ? [clamped, draft[1]] : [draft[0], clamped]

      setDraft(next)

      if (next[0] > next[1]) {
        setError('order')

        return
      }
      setError(null)
      commit(next)
    },
    [commit, draft, hasBounds, sliderMin, sliderMax],
  )

  return (
    <div className="flex flex-col gap-3">
      {hasBounds && (
        <Slider
          value={draft}
          onValueChange={handleSlider}
          min={sliderMin}
          max={sliderMax}
          step={1}
          className="mt-1"
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t('min', locale)}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            value={draft[0]}
            onChange={handleInput('from')}
            min={hasBounds ? sliderMin : undefined}
            max={hasBounds ? sliderMax : undefined}
            className={cn('h-9', error === 'order' && 'border-destructive')}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t('max', locale)}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            value={draft[1]}
            onChange={handleInput('to')}
            min={hasBounds ? sliderMin : undefined}
            max={hasBounds ? sliderMax : undefined}
            className={cn('h-9', error === 'order' && 'border-destructive')}
          />
        </label>
      </div>
      {error === 'order' && (
        <p className="text-xs text-destructive">
          Min must be less than or equal to max
        </p>
      )}
    </div>
  )
}
