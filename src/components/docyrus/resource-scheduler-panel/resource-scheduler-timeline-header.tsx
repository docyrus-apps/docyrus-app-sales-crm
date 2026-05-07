'use client'

import { cn } from '@/lib/utils'

import { isWeekend } from './lib/timeline-utils'
import { useResourceSchedulerContext } from './resource-scheduler-context'

export function ResourceSchedulerTimelineHeader() {
  const { columns, groupHeaders, activeConfig } = useResourceSchedulerContext()

  return (
    <div className="sticky top-0 z-20 border-b bg-background">
      {/* Group header row */}
      <div className="flex border-b">
        {groupHeaders.map((group, i) => (
          <div
            key={i}
            className="flex items-center justify-center border-r px-2 py-1 text-xs font-medium"
            style={{ width: group.spanCount * activeConfig.unitWidth }}
          >
            {group.label}
          </div>
        ))}
      </div>
      {/* Interval column headers */}
      <div className="flex">
        {columns.map((col) => (
          <div
            key={col.index}
            className={cn(
              'flex shrink-0 items-center justify-center border-r py-1 text-[11px] text-muted-foreground',
              activeConfig.interval.unit === 'day' &&
                isWeekend(col.start) &&
                'bg-muted/50',
            )}
            style={{ width: activeConfig.unitWidth }}
          >
            {col.label}
          </div>
        ))}
      </div>
    </div>
  )
}
