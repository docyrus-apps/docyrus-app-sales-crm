'use client'

import { createContext, useContext, type RefObject } from 'react'

import {
  type ResourceSchedulerPanelProps,
  type SchedulerEvent,
  type SchedulerResource,
  type TimelineColumn,
  type TimelineGroupHeader,
  type TimelinePreset,
  type TimelinePresetConfig,
} from './types'

export interface ResourceSchedulerContextValue {
  resources: Array<SchedulerResource>
  events: Array<SchedulerEvent>
  eventsByResource: Map<string, Array<SchedulerEvent>>
  activePreset: TimelinePreset
  activeConfig: TimelinePresetConfig
  viewStart: Date
  viewEnd: Date
  columns: Array<TimelineColumn>
  groupHeaders: Array<TimelineGroupHeader>
  totalTimelineWidth: number
  rowHeight: number
  resourcePanelWidth: number
  isLoading: boolean
  readOnly: boolean
  showTodayIndicator: boolean
  onEventClick?: ResourceSchedulerPanelProps['onEventClick']
  onEventMove?: ResourceSchedulerPanelProps['onEventMove']
  onEventResize?: ResourceSchedulerPanelProps['onEventResize']
  onSlotClick?: ResourceSchedulerPanelProps['onSlotClick']
  onNavigate: (direction: 'prev' | 'next') => void
  onGoToToday: () => void
  onPresetChange: (presetId: string) => void
  presets: Array<TimelinePreset>
  locale?: string
  timelineBodyRef: RefObject<HTMLDivElement | null>
  isDragging: boolean
  setIsDragging: (dragging: boolean) => void
}

const ResourceSchedulerContext =
  createContext<ResourceSchedulerContextValue | null>(null)

export const ResourceSchedulerProvider = ResourceSchedulerContext.Provider

export function useResourceSchedulerContext(): ResourceSchedulerContextValue {
  const ctx = useContext(ResourceSchedulerContext)

  if (!ctx) {
    throw new Error(
      'useResourceSchedulerContext must be used within a ResourceSchedulerProvider',
    )
  }

  return ctx
}
