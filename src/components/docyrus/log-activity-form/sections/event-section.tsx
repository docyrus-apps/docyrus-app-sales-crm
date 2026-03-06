'use client'

import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'

import { CalendarIcon, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import {
  type EventOption,
  type LogActivityPayload,
  type SectionHandle,
} from '../types'

const DEFAULT_DURATION = 30 // minutes

function applyDuration(start: Date): Date {
  return new Date(start.getTime() + DEFAULT_DURATION * 60_000)
}

/*
 * ─── Inline DateTimeRangePicker ─────────────────────────────────
 * Mirrors the pattern from @ui/components/date-time-range-picker
 * (single popover: Calendar + side-by-side Start/End time columns,
 *  defaultDuration auto-adjust, end-hour/minute filtering)
 * but uses local state instead of react-hook-form.
 */

interface InlineDateTimeRangePickerProps {
  startValue: Date
  endValue: Date
  onStartChange: (date: Date) => void
  onEndChange: (date: Date) => void
  disabled: boolean
}

function InlineDateTimeRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  disabled,
}: InlineDateTimeRangePickerProps) {
  const hasValue = startValue || endValue
  const calendarDate = startValue ?? endValue

  const startHour = startValue.getHours()
  const startMinute = startValue.getMinutes()
  const endSelectedHour = endValue.getHours()

  function handleDateSelect(date: Date | undefined) {
    if (!date) return

    const newStart = new Date(startValue)

    newStart.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
    onStartChange(newStart)

    onEndChange(applyDuration(newStart))
  }

  function handleTimeChange(
    target: 'start' | 'end',
    type: 'hour' | 'minute',
    value: number,
  ) {
    const current = target === 'start' ? startValue : endValue
    const newDate = new Date(current)

    if (type === 'hour') {
      newDate.setHours(value)
    } else {
      newDate.setMinutes(value)
    }

    if (target === 'start') {
      onStartChange(newDate)
      onEndChange(applyDuration(newDate))
    } else {
      onEndChange(newDate)
    }
  }

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left text-xs font-normal',
            !hasValue && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-1.5 size-3" />
          {hasValue ? (
            <>
              {calendarDate && format(calendarDate, 'MM/dd/yyyy')}{' '}
              {format(startValue, 'HH:mm')}
              {' \u2013 '}
              {format(endValue, 'HH:mm')}
            </>
          ) : (
            <span>Pick a date & time range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={calendarDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">
            {/* Start time */}
            <div className="flex flex-col">
              <div className="border-b px-3 py-1.5 text-center text-xs font-medium text-muted-foreground">
                Start
              </div>
              <div className="flex sm:h-[268px] sm:flex-row">
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex p-2 sm:flex-col">
                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                      <Button
                        key={hour}
                        size="icon"
                        variant={
                          startValue.getHours() === hour ? 'default' : 'ghost'
                        }
                        className="aspect-square shrink-0 sm:w-full"
                        onClick={() => handleTimeChange('start', 'hour', hour)}
                      >
                        {hour.toString().padStart(2, '0')}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex p-2 sm:flex-col">
                    {Array.from({ length: 12 }, (_, i) => i * 5).map(
                      (minute) => (
                        <Button
                          key={minute}
                          size="icon"
                          variant={
                            startValue.getMinutes() === minute
                              ? 'default'
                              : 'ghost'
                          }
                          className="aspect-square shrink-0 sm:w-full"
                          onClick={() =>
                            handleTimeChange('start', 'minute', minute)
                          }
                        >
                          {minute.toString().padStart(2, '0')}
                        </Button>
                      ),
                    )}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
              </div>
            </div>
            {/* End time */}
            <div className="flex flex-col">
              <div className="border-b px-3 py-1.5 text-center text-xs font-medium text-muted-foreground">
                End
              </div>
              <div className="flex sm:h-[268px] sm:flex-row">
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex p-2 sm:flex-col">
                    {Array.from({ length: 24 }, (_, i) => i)
                      .filter((hour) => hour >= startHour)
                      .map((hour) => (
                        <Button
                          key={hour}
                          size="icon"
                          variant={
                            endValue.getHours() === hour ? 'default' : 'ghost'
                          }
                          className="aspect-square shrink-0 sm:w-full"
                          onClick={() => handleTimeChange('end', 'hour', hour)}
                        >
                          {hour.toString().padStart(2, '0')}
                        </Button>
                      ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex p-2 sm:flex-col">
                    {Array.from({ length: 12 }, (_, i) => i * 5)
                      .filter(
                        (minute) =>
                          endSelectedHour !== startHour ||
                          minute >= startMinute,
                      )
                      .map((minute) => (
                        <Button
                          key={minute}
                          size="icon"
                          variant={
                            endValue.getMinutes() === minute
                              ? 'default'
                              : 'ghost'
                          }
                          className="aspect-square shrink-0 sm:w-full"
                          onClick={() =>
                            handleTimeChange('end', 'minute', minute)
                          }
                        >
                          {minute.toString().padStart(2, '0')}
                        </Button>
                      ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

type EventMode = 'select' | 'create'

interface EventSectionProps {
  events?: Array<EventOption>
  disabled: boolean
}

export const EventSection = forwardRef<SectionHandle, EventSectionProps>(
  ({ events = [], disabled }, ref) => {
    const hasEvents = events.length > 0
    const [mode, setMode] = useState<EventMode>(hasEvents ? 'select' : 'create')

    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
    const [eventSearchOpen, setEventSearchOpen] = useState(false)

    const [newSubject, setNewSubject] = useState('')
    const now = useMemo(() => new Date(), [])
    const [startDateTime, setStartDateTime] = useState<Date>(now)
    const [endDateTime, setEndDateTime] = useState<Date>(applyDuration(now))

    const selectedEvent = useMemo(
      () => events.find((e) => e.id === selectedEventId) ?? null,
      [events, selectedEventId],
    )

    useImperativeHandle(ref, () => ({
      getData: (): Partial<LogActivityPayload> => {
        if (mode === 'select' && selectedEventId) {
          return { eventId: selectedEventId }
        }

        if (mode === 'create') {
          return {
            eventSubject: newSubject || undefined,
            startDate: startDateTime,
            endDate: endDateTime,
          }
        }

        return {}
      },
      reset: () => {
        setMode(hasEvents ? 'select' : 'create')
        setSelectedEventId(null)
        setNewSubject('')
        const resetNow = new Date()

        setStartDateTime(resetNow)
        setEndDateTime(applyDuration(resetNow))
      },
      isEmpty: () => {
        if (mode === 'select') return !selectedEventId

        return !newSubject.trim()
      },
    }))

    return (
      <div className="flex flex-col gap-2">
        {/* Mode toggle */}
        {hasEvents && (
          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setMode('select')}
              className={cn(
                'flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors',
                mode === 'select'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Select existing
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setMode('create')}
              className={cn(
                'flex-1 rounded-md px-3 py-1 text-xs font-medium transition-colors',
                mode === 'create'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Plus className="mr-1 inline size-3" />
              Create new
            </button>
          </div>
        )}

        {/* Select existing */}
        {mode === 'select' && (
          <Popover open={eventSearchOpen} onOpenChange={setEventSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={eventSearchOpen}
                disabled={disabled}
                className="h-auto min-h-8 w-full justify-between py-1.5 text-sm"
              >
                {selectedEvent ? (
                  <span className="flex items-center gap-2 truncate">
                    <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{selectedEvent.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(selectedEvent.startDate, 'HH:mm')}–
                      {format(selectedEvent.endDate, 'HH:mm')}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Search events...
                  </span>
                )}
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-(--radix-popover-trigger-width) p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Search events..." />
                <CommandList>
                  <CommandEmpty>No events found.</CommandEmpty>
                  <CommandGroup>
                    {events.map((event) => (
                      <CommandItem
                        key={event.id}
                        value={event.label}
                        onSelect={() => {
                          setSelectedEventId(event.id)
                          setEventSearchOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 size-4',
                            selectedEventId === event.id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        <CalendarIcon className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{event.label}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {format(event.startDate, 'HH:mm')}–
                          {format(event.endDate, 'HH:mm')}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Create new */}
        {mode === 'create' && (
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              disabled={disabled}
              className="h-8 text-sm"
            />

            <InlineDateTimeRangePicker
              startValue={startDateTime}
              endValue={endDateTime}
              onStartChange={setStartDateTime}
              onEndChange={setEndDateTime}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    )
  },
)

EventSection.displayName = 'EventSection'
