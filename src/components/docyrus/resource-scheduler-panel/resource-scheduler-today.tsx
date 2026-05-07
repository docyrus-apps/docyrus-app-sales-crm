'use client'

import { useMemo } from 'react'

import { cn } from '@/lib/utils'

import { tUi, type UiI18nLocale } from '@/lib/ui-i18n'

import { dateToPixel, format } from './lib/timeline-utils'
import { useResourceSchedulerContext } from './resource-scheduler-context'

export function ResourceSchedulerToday({ className }: { className?: string }) {
  const { viewStart, activeConfig, showTodayIndicator, locale } =
    useResourceSchedulerContext()

  const now = useMemo(() => new Date(), [])
  const offset = useMemo(
    () => dateToPixel(now, viewStart, activeConfig),
    [now, viewStart, activeConfig],
  )

  if (!showTodayIndicator || offset < 0) return null

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 flex h-full flex-col items-center"
      style={{ width: 0, transform: `translateX(${offset}px)` }}
    >
      <div
        className={cn(
          'group pointer-events-auto sticky top-0 z-30 flex flex-col items-center whitespace-nowrap rounded-b-md bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground',
          className,
        )}
      >
        {tUi(locale as UiI18nLocale, 'schedulerToday')}
        <span className="max-h-0 overflow-hidden opacity-80 transition-all group-hover:max-h-6">
          {format(now, 'HH:mm')}
        </span>
      </div>
      <div className="h-full w-px bg-primary" />
    </div>
  )
}
