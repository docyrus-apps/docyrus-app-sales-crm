'use client'

import { type ReactNode } from 'react'

import { type ColumnDef } from '@tanstack/react-table'

export type TimeUnit = 'hour' | 'day' | 'week' | 'month' | 'year'

export interface TimelinePresetConfig {
  unitWidth: number
  interval: { unit: TimeUnit; format: string }
  groups: Array<{ unit: TimeUnit; format: string }>
}

export interface TimelinePreset {
  id: string
  name: string
  config: TimelinePresetConfig
}

export interface SchedulerEvent {
  id: string
  resourceId: string
  title: string
  startDate: Date
  endDate: Date
  color?: string
  variant?: 'solid' | 'outlined' | 'subtle'
  icon?: ReactNode
  description?: string
  location?: string
  metadata?: Record<string, unknown>
}

export interface SchedulerResource {
  id: string
  name: string
  avatar?: string
  subtitle?: string
  group?: string
  [key: string]: unknown
}

export interface TimelineColumn {
  start: Date
  end: Date
  label: string
  index: number
}

export interface TimelineGroupHeader {
  start: Date
  end: Date
  label: string
  spanCount: number
}

export interface ResourceSchedulerPanelProps {
  resources: Array<SchedulerResource>
  events: Array<SchedulerEvent>
  presets?: Array<TimelinePreset>
  defaultPresetId?: string
  startDate?: Date
  endDate?: Date
  resourceColumns?: Array<ColumnDef<SchedulerResource>>
  onEventClick?: (event: SchedulerEvent) => void
  onEventMove?: (
    event: SchedulerEvent,
    newStart: Date,
    newEnd: Date,
    newResourceId?: string,
  ) => void
  onEventResize?: (event: SchedulerEvent, newStart: Date, newEnd: Date) => void
  onSlotClick?: (resourceId: string, date: Date) => void
  onDateRangeChange?: (start: Date, end: Date) => void
  onPresetChange?: (presetId: string) => void
  isLoading?: boolean
  readOnly?: boolean
  showTodayIndicator?: boolean
  showResourceCount?: boolean
  height?: number | 'auto'
  resourcePanelWidth?: number
  rowHeight?: number
  className?: string
  locale?: string
}
