import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  addYears,
  differenceInDays,
  differenceInHours,
  differenceInMilliseconds,
  differenceInMonths,
  differenceInWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isWeekend,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'

import {
  type TimeUnit,
  type TimelineColumn,
  type TimelineGroupHeader,
  type TimelinePreset,
  type TimelinePresetConfig,
} from '../types'

/*
 * ---------------------------------------------------------------------------
 * Unit helpers
 * ---------------------------------------------------------------------------
 */

function getStartOfUnit(unit: TimeUnit, date: Date): Date {
  switch (unit) {
    case 'hour':
      return startOfHour(date)

    case 'day':
      return startOfDay(date)

    case 'week':
      return startOfWeek(date, { weekStartsOn: 1 })

    case 'month':
      return startOfMonth(date)

    case 'year':
      return startOfYear(date)
  }
}

function getEndOfUnit(unit: TimeUnit, date: Date): Date {
  switch (unit) {
    case 'hour':
      return new Date(startOfHour(date).getTime() + 3_600_000 - 1)

    case 'day':
      return endOfDay(date)

    case 'week':
      return endOfWeek(date, { weekStartsOn: 1 })

    case 'month':
      return endOfMonth(date)

    case 'year':
      return endOfYear(date)
  }
}

function addUnit(date: Date, unit: TimeUnit, amount: number): Date {
  switch (unit) {
    case 'hour':
      return addHours(date, amount)

    case 'day':
      return addDays(date, amount)

    case 'week':
      return addWeeks(date, amount)

    case 'month':
      return addMonths(date, amount)

    case 'year':
      return addYears(date, amount)
  }
}

function diffInUnit(unit: TimeUnit, a: Date, b: Date): number {
  switch (unit) {
    case 'hour':
      return differenceInHours(a, b)

    case 'day':
      return differenceInDays(a, b)

    case 'week':
      return differenceInWeeks(a, b)

    case 'month':
      return differenceInMonths(a, b)

    case 'year':
      return differenceInMonths(a, b) / 12
  }
}

function getUnitDurationMs(unit: TimeUnit, date: Date): number {
  const start = getStartOfUnit(unit, date)
  const end = addUnit(start, unit, 1)

  return end.getTime() - start.getTime()
}

/*
 * ---------------------------------------------------------------------------
 * Column & header generation
 * ---------------------------------------------------------------------------
 */

export function generateTimelineColumns(
  start: Date,
  end: Date,
  config: TimelinePresetConfig,
): Array<TimelineColumn> {
  const columns: Array<TimelineColumn> = []
  const { unit, format: fmt } = config.interval
  let cursor = getStartOfUnit(unit, start)
  let index = 0

  while (cursor < end) {
    const colEnd = getEndOfUnit(unit, cursor)

    columns.push({
      start: cursor,
      end: colEnd,
      label: format(cursor, fmt),
      index,
    })
    cursor = addUnit(cursor, unit, 1)
    index++
  }

  return columns
}

export function generateGroupHeaders(
  columns: Array<TimelineColumn>,
  config: TimelinePresetConfig,
): Array<TimelineGroupHeader> {
  if (columns.length === 0 || config.groups.length === 0) return []

  const firstGroup = config.groups[0] as { unit: TimeUnit; format: string }
  const { unit, format: fmt } = firstGroup
  const headers: Array<TimelineGroupHeader> = []
  let groupStart = getStartOfUnit(unit, (columns[0] as TimelineColumn).start)
  let spanCount = 0

  for (const col of columns) {
    const colGroup = getStartOfUnit(unit, col.start)

    if (colGroup.getTime() !== groupStart.getTime()) {
      if (spanCount > 0) {
        headers.push({
          start: groupStart,
          end: getEndOfUnit(unit, groupStart),
          label: format(groupStart, fmt),
          spanCount,
        })
      }
      groupStart = colGroup
      spanCount = 1
    } else {
      spanCount++
    }
  }

  if (spanCount > 0) {
    headers.push({
      start: groupStart,
      end: getEndOfUnit(unit, groupStart),
      label: format(groupStart, fmt),
      spanCount,
    })
  }

  return headers
}

/*
 * ---------------------------------------------------------------------------
 * Position calculations
 * ---------------------------------------------------------------------------
 */

export function dateToPixel(
  date: Date,
  timelineStart: Date,
  config: TimelinePresetConfig,
): number {
  const { unit } = config.interval
  const unitStart = getStartOfUnit(unit, timelineStart)
  const totalMs = differenceInMilliseconds(date, unitStart)
  const unitMs = getUnitDurationMs(unit, timelineStart)

  return (totalMs / unitMs) * config.unitWidth
}

export function dateRangeToWidth(
  start: Date,
  end: Date,
  config: TimelinePresetConfig,
): number {
  const origin = getStartOfUnit(config.interval.unit, start)
  const pxStart = dateToPixel(start, origin, config)
  const pxEnd = dateToPixel(end, origin, config)

  return Math.max(4, Math.abs(pxEnd - pxStart))
}

export function pixelToDate(
  pixel: number,
  timelineStart: Date,
  config: TimelinePresetConfig,
): Date {
  const { unit } = config.interval
  const unitMs = getUnitDurationMs(unit, timelineStart)
  const totalMs = (pixel / config.unitWidth) * unitMs

  return new Date(getStartOfUnit(unit, timelineStart).getTime() + totalMs)
}

/*
 * ---------------------------------------------------------------------------
 * Default date range per preset
 * ---------------------------------------------------------------------------
 */

export function getDefaultDateRange(preset: TimelinePreset): {
  start: Date
  end: Date
} {
  const now = new Date()

  switch (preset.id) {
    case 'day-hours':
      return { start: startOfDay(now), end: addDays(startOfDay(now), 3) }

    case 'weeks-days':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: addWeeks(startOfWeek(now, { weekStartsOn: 1 }), 2),
      }

    case 'months-days':
      return { start: startOfMonth(now), end: addMonths(startOfMonth(now), 1) }

    case 'months-weeks':
      return { start: startOfMonth(now), end: addMonths(startOfMonth(now), 3) }

    case 'months':
      return { start: startOfYear(now), end: addYears(startOfYear(now), 1) }

    default:
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: addWeeks(startOfWeek(now, { weekStartsOn: 1 }), 2),
      }
  }
}

/*
 * ---------------------------------------------------------------------------
 * Navigation
 * ---------------------------------------------------------------------------
 */

export function navigateRange(
  currentStart: Date,
  currentEnd: Date,
  direction: 'prev' | 'next',
  config: TimelinePresetConfig,
): { start: Date; end: Date } {
  const groupUnit = config.groups[0]?.unit ?? config.interval.unit
  const amount = direction === 'next' ? 1 : -1

  return {
    start: addUnit(currentStart, groupUnit, amount),
    end: addUnit(currentEnd, groupUnit, amount),
  }
}

/*
 * ---------------------------------------------------------------------------
 * Stacking algorithm for overlapping events
 * ---------------------------------------------------------------------------
 */

export interface StackedEvent<T> {
  event: T
  subRow: number
}

export function stackEvents<T extends { startDate: Date; endDate: Date }>(
  events: Array<T>,
): { stacked: Array<StackedEvent<T>>; maxSubRows: number } {
  const sorted = [...events].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  )
  const subRowEndTimes: Array<number> = []
  const stacked: Array<StackedEvent<T>> = []

  for (const event of sorted) {
    let subRow = 0

    while (
      subRow < subRowEndTimes.length &&
      (subRowEndTimes[subRow] ?? 0) > event.startDate.getTime()
    ) {
      subRow++
    }
    if (subRow === subRowEndTimes.length) {
      subRowEndTimes.push(event.endDate.getTime())
    } else {
      subRowEndTimes[subRow] = event.endDate.getTime()
    }
    stacked.push({ event, subRow })
  }

  return { stacked, maxSubRows: Math.max(1, subRowEndTimes.length) }
}

/*
 * ---------------------------------------------------------------------------
 * Weekend check
 * ---------------------------------------------------------------------------
 */

export { isWeekend }

export { format, diffInUnit, getStartOfUnit, getEndOfUnit, addUnit }
