import { type ReactNode } from 'react'

import { type UiI18nLocale } from '@/lib/ui-i18n'

export type TimeSlotSchedulerMode = 'columns' | 'month'

export type SlotStatus =
  | 'available'
  | 'partial'
  | 'full'
  | 'unavailable'
  | 'past'
  | 'disabled'

export type DisabledReason =
  | 'past'
  | 'full'
  | 'unavailable'
  | 'before-min-date'
  | 'after-max-date'

export interface TimeSlotReservation {
  id: string
  name: string
  email?: string
  avatarUrl?: string
  startTime: string
  endTime: string
}

export interface UnavailableRange {
  day: string
  startTime: string
  endTime: string
}

export interface TimeSlot {
  id: string
  day: Date
  startTime: string
  endTime: string
  startISO: string
  endISO: string
  status: SlotStatus
  disabledReason?: DisabledReason
  capacity: number
  reservationCount: number
  remainingCapacity: number
  reservations: Array<TimeSlotReservation>
}

export interface DaySlots {
  date: Date
  dayLabel: string
  dateLabel: string
  fullLabel: string
  isToday: boolean
  isWeekend: boolean
  slots: Array<TimeSlot>
  hasAvailability: boolean
}

export interface TimezoneOption {
  value: string
  label: string
  offset: string
}

export interface SchedulerUser {
  fullName: string
  email?: string
  avatarUrl?: string
}

export interface SchedulerEvent {
  subject: string
  duration: string
  location?: string
  description?: string
  icon?: ReactNode
}

export interface SlotSelectPayload {
  day: Date
  startTime: string
  endTime: string
  startISO: string
  endISO: string
  capacity: number
  reservationCount: number
  remainingCapacity: number
  reservations: Array<TimeSlotReservation>
}

export interface TimeSlotSchedulerProps {
  startTime?: string
  endTime?: string
  slotSize?: number
  slotCapacity?: number

  reservations?: Array<TimeSlotReservation>
  unavailableSlots?: Array<UnavailableRange>

  user?: SchedulerUser
  event?: SchedulerEvent

  mode?: TimeSlotSchedulerMode
  defaultMode?: TimeSlotSchedulerMode
  onModeChange?: (mode: TimeSlotSchedulerMode) => void

  defaultDate?: Date
  minDate?: Date
  maxDate?: Date

  showSaturday?: boolean
  showSunday?: boolean

  timezone?: string
  defaultTimezone?: string
  timezones?: Array<TimezoneOption>
  onTimezoneChange?: (tz: string) => void

  showReservationDetail?: boolean

  selectedSlot?: SlotSelectPayload | null
  defaultSelectedSlot?: SlotSelectPayload | null
  onSelect?: (payload: SlotSelectPayload) => void

  className?: string
  locale?: UiI18nLocale
}
