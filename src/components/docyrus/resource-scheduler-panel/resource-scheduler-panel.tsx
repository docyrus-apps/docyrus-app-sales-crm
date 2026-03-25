'use client';

import {
  type CSSProperties, useCallback, useMemo, useRef, useState
} from 'react';

import { cn } from '@/lib/utils';

import { type ResourceSchedulerPanelProps, type SchedulerEvent } from './types';

import { getPresetById, SCHEDULER_PRESETS } from './lib/presets';
import {
  generateGroupHeaders,
  generateTimelineColumns,
  getDefaultDateRange,
  navigateRange
} from './lib/timeline-utils';
import { ResourceSchedulerProvider, type ResourceSchedulerContextValue } from './resource-scheduler-context';
import { ResourceSchedulerHeader } from './resource-scheduler-header';
import { ResourceSchedulerResourceList } from './resource-scheduler-resource-list';
import { ResourceSchedulerTimeline } from './resource-scheduler-timeline';

export function ResourceSchedulerPanel({
  resources,
  events,
  presets: presetsProp,
  defaultPresetId,
  startDate: startDateProp,
  endDate: endDateProp,
  resourceColumns,
  onEventClick,
  onEventMove,
  onEventResize,
  onSlotClick,
  onDateRangeChange,
  onPresetChange,
  isLoading = false,
  readOnly = false,
  showTodayIndicator = true,
  showResourceCount = true,
  height = 600,
  resourcePanelWidth = 280,
  rowHeight = 48,
  className,
  locale
}: ResourceSchedulerPanelProps) {
  const presets = presetsProp ?? SCHEDULER_PRESETS;
  const [activePresetId, setActivePresetId] = useState(defaultPresetId ?? presets[0]?.id ?? '');
  const activePreset = useMemo(() => getPresetById(presets, activePresetId), [presets, activePresetId]);

  const defaultRange = useMemo(() => getDefaultDateRange(activePreset), [activePreset]);
  const [viewStart, setViewStart] = useState<Date>(startDateProp ?? defaultRange.start);
  const [viewEnd, setViewEnd] = useState<Date>(endDateProp ?? defaultRange.end);
  const [isDragging, setIsDragging] = useState(false);

  const timelineBodyRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(
    () => generateTimelineColumns(viewStart, viewEnd, activePreset.config),
    [viewStart, viewEnd, activePreset.config]
  );

  const groupHeaders = useMemo(
    () => generateGroupHeaders(columns, activePreset.config),
    [columns, activePreset.config]
  );

  const totalTimelineWidth = columns.length * activePreset.config.unitWidth;

  const eventsByResource = useMemo(() => {
    const map = new Map<string, Array<SchedulerEvent>>();

    for (const event of events) {
      const list = map.get(event.resourceId);

      if (list) {
        list.push(event);
      } else {
        map.set(event.resourceId, [event]);
      }
    }

    return map;
  }, [events]);

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    const { start, end } = navigateRange(viewStart, viewEnd, direction, activePreset.config);

    setViewStart(start);
    setViewEnd(end);
    onDateRangeChange?.(start, end);
  }, [
    viewStart,
    viewEnd,
    activePreset.config,
    onDateRangeChange
  ]);

  const handleGoToToday = useCallback(() => {
    const range = getDefaultDateRange(activePreset);

    setViewStart(range.start);
    setViewEnd(range.end);
    onDateRangeChange?.(range.start, range.end);
  }, [activePreset, onDateRangeChange]);

  const handlePresetChange = useCallback((presetId: string) => {
    setActivePresetId(presetId);
    const preset = getPresetById(presets, presetId);
    const range = getDefaultDateRange(preset);

    setViewStart(range.start);
    setViewEnd(range.end);
    onPresetChange?.(presetId);
    onDateRangeChange?.(range.start, range.end);
  }, [presets, onPresetChange, onDateRangeChange]);

  const contextValue = useMemo<ResourceSchedulerContextValue>(() => ({
    resources,
    events,
    eventsByResource,
    activePreset,
    activeConfig: activePreset.config,
    viewStart,
    viewEnd,
    columns,
    groupHeaders,
    totalTimelineWidth,
    rowHeight,
    resourcePanelWidth,
    isLoading,
    readOnly,
    showTodayIndicator,
    onEventClick,
    onEventMove,
    onEventResize,
    onSlotClick,
    onNavigate: handleNavigate,
    onGoToToday: handleGoToToday,
    onPresetChange: handlePresetChange,
    presets,
    locale,
    timelineBodyRef,
    isDragging,
    setIsDragging
  }), [
    resources,
    events,
    eventsByResource,
    activePreset,
    viewStart,
    viewEnd,
    columns,
    groupHeaders,
    totalTimelineWidth,
    rowHeight,
    resourcePanelWidth,
    isLoading,
    readOnly,
    showTodayIndicator,
    onEventClick,
    onEventMove,
    onEventResize,
    onSlotClick,
    handleNavigate,
    handleGoToToday,
    handlePresetChange,
    presets,
    locale,
    isDragging
  ]);

  const cssVariables = useMemo<CSSProperties>(() => ({
    '--scheduler-row-height': `${rowHeight}px`,
    '--scheduler-resource-width': `${resourcePanelWidth}px`,
    '--scheduler-column-width': `${activePreset.config.unitWidth}px`
  } as CSSProperties), [rowHeight, resourcePanelWidth, activePreset.config.unitWidth]);

  return (
    <ResourceSchedulerProvider value={contextValue}>
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-lg border bg-background',
          className
        )}
        style={{
          height: height === 'auto' ? 'auto' : `${height}px`
        }}>
        <ResourceSchedulerHeader
          showResourceCount={showResourceCount}
          resourceCount={resources.length} />
        <div
          ref={timelineBodyRef}
          className="relative isolate grid flex-1 select-none overflow-auto"
          style={{
            ...cssVariables,
            gridTemplateColumns: 'var(--scheduler-resource-width) 1fr'
          }}>
          <ResourceSchedulerResourceList
            resources={resources}
            resourceColumns={resourceColumns} />
          <ResourceSchedulerTimeline />
        </div>
      </div>
    </ResourceSchedulerProvider>
  );
}