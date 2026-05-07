'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import { tUi } from '@/lib/ui-i18n'

import { useTimeSlotSchedulerContext } from './time-slot-scheduler-context'

function TimeSlotSchedulerHeader() {
  const {
    mode,
    onModeChange,
    onNavigate,
    onGoToToday,
    dateRangeLabel,
    locale,
  } = useTimeSlotSchedulerContext()

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onNavigate('prev')}
          aria-label={tUi(
            locale,
            mode === 'columns' ? 'tssPreviousWeek' : 'tssPreviousMonth',
          )}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onGoToToday}>
          {tUi(locale, 'today')}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onNavigate('next')}
          aria-label={tUi(
            locale,
            mode === 'columns' ? 'tssNextWeek' : 'tssNextMonth',
          )}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <h2 className="text-sm font-semibold">{dateRangeLabel}</h2>

      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => {
          if (v) onModeChange(v as 'columns' | 'month')
        }}
      >
        <ToggleGroupItem
          value="columns"
          size="sm"
          aria-label={tUi(locale, 'tssColumnsView')}
        >
          {tUi(locale, 'tssColumnsView')}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="month"
          size="sm"
          aria-label={tUi(locale, 'tssMonthView')}
        >
          {tUi(locale, 'tssMonthView')}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

export { TimeSlotSchedulerHeader }
