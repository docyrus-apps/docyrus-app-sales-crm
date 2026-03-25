'use client';

export { ResourceSchedulerPanel } from './resource-scheduler-panel';
export type {
  ResourceSchedulerPanelProps,
  SchedulerEvent,
  SchedulerResource,
  TimelinePreset,
  TimelinePresetConfig,
  TimeUnit,
  TimelineColumn,
  TimelineGroupHeader
} from './types';
export { SCHEDULER_PRESETS, getPresetById } from './lib/presets';
export { eventBarVariants } from './resource-scheduler-event-bar';