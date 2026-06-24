import type { ICollectionListParams } from '@/collections/types'

export interface DateRange {
  from: Date;
  to: Date;
}

export type DateRangePreset =
  | '7d'
  | '30d'
  | '90d'
  | 'this_quarter'
  | 'this_year'
  | '12mo'

export function getDateRange(preset: DateRangePreset): DateRange {
  const now = new Date()
  const to = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59
  )

  switch (preset) {
    case '7d':
      return { from: new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000), to }

    case '30d':
      return { from: new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000), to }

    case '90d':
      return { from: new Date(to.getTime() - 89 * 24 * 60 * 60 * 1000), to }

    case 'this_quarter': {
      const quarter = Math.floor(now.getMonth() / 3)

      return { from: new Date(now.getFullYear(), quarter * 3, 1), to }
    }

    case 'this_year':
      return { from: new Date(now.getFullYear(), 0, 1), to }

    case '12mo':
      return {
        from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
        to
      }
  }
}

export function buildDateFilter(
  range: DateRange,
  dateField: string = 'created_on'
): ICollectionListParams['filters'] {
  return {
    rules: [
      {
        field: dateField,
        operator: 'gte',
        value: range.from.toISOString(),
        filterType: 'DATETIME'
      },
      {
        field: dateField,
        operator: 'lte',
        value: range.to.toISOString(),
        filterType: 'DATETIME'
      }
    ],
    combinator: 'and'
  }
}

export function getMonthLabels(range: DateRange): Array<string> {
  const labels: Array<string> = []
  const current = new Date(range.from.getFullYear(), range.from.getMonth(), 1)
  const end = new Date(range.to.getFullYear(), range.to.getMonth(), 1)

  while (current <= end) {
    labels.push(
      current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    )
    current.setMonth(current.getMonth() + 1)
  }

  return labels
}

export function getMonthIndex(date: Date | string, rangeFrom: Date): number {
  const d = typeof date === 'string' ? new Date(date) : date

  return (
    (d.getFullYear() - rangeFrom.getFullYear()) * 12 +
    (d.getMonth() - rangeFrom.getMonth())
  )
}
