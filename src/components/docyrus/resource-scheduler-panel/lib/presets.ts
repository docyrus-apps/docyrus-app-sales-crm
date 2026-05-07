import { type TimelinePreset } from '../types'

export const SCHEDULER_PRESETS: Array<TimelinePreset> = [
  {
    id: 'day-hours',
    name: 'Day / Hours',
    config: {
      unitWidth: 60,
      interval: { unit: 'hour', format: 'HH:mm' },
      groups: [{ unit: 'day', format: 'EEEE, MMM d' }],
    },
  },
  {
    id: 'weeks-days',
    name: 'Weeks / Days',
    config: {
      unitWidth: 48,
      interval: { unit: 'day', format: 'EEE d' },
      groups: [{ unit: 'week', format: "'W'w — MMM yyyy" }],
    },
  },
  {
    id: 'months-days',
    name: 'Months / Days',
    config: {
      unitWidth: 32,
      interval: { unit: 'day', format: 'd' },
      groups: [{ unit: 'month', format: 'MMMM yyyy' }],
    },
  },
  {
    id: 'months-weeks',
    name: 'Months / Weeks',
    config: {
      unitWidth: 64,
      interval: { unit: 'week', format: "'W'w" },
      groups: [{ unit: 'month', format: 'MMMM yyyy' }],
    },
  },
  {
    id: 'months',
    name: 'Year / Months',
    config: {
      unitWidth: 80,
      interval: { unit: 'month', format: 'MMM' },
      groups: [{ unit: 'year', format: 'yyyy' }],
    },
  },
]

export function getPresetById(
  presets: Array<TimelinePreset>,
  id: string,
): TimelinePreset {
  return presets.find((p) => p.id === id) ?? (presets[0] as TimelinePreset)
}
