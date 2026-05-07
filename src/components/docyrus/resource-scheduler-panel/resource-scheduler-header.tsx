'use client'

import { format } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { tUi, type UiI18nLocale } from '@/lib/ui-i18n'

import { useResourceSchedulerContext } from './resource-scheduler-context'

interface ResourceSchedulerHeaderProps {
  showResourceCount?: boolean
  resourceCount: number
}

export function ResourceSchedulerHeader({
  showResourceCount,
  resourceCount,
}: ResourceSchedulerHeaderProps) {
  const {
    viewStart,
    viewEnd,
    activePreset,
    presets,
    onNavigate,
    onGoToToday,
    onPresetChange,
    locale,
  } = useResourceSchedulerContext()

  const dateLabel = `${format(viewStart, 'MMM d, yyyy')} — ${format(viewEnd, 'MMM d, yyyy')}`

  return (
    <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onGoToToday}>
          <CalendarDays className="mr-1.5 size-3.5" />
          {tUi(locale as UiI18nLocale, 'schedulerToday')}
        </Button>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <span className="text-sm font-medium">{dateLabel}</span>
        {showResourceCount && (
          <Badge variant="secondary" className="ml-1 text-xs">
            {resourceCount} {tUi(locale as UiI18nLocale, 'schedulerResources')}
          </Badge>
        )}
      </div>
      <Select value={activePreset.id} onValueChange={onPresetChange}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
