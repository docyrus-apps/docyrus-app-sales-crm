'use client';

import { createContext, useContext } from 'react';

import { type UiI18nLocale } from '@/lib/ui-i18n';

import { type MonthDayMeta } from './lib/time-slot-utils';
import {
  type DaySlots,
  type SchedulerEvent,
  type SchedulerUser,
  type SlotSelectPayload,
  type TimeSlotSchedulerMode,
  type TimezoneOption
} from './types';

export interface TimeSlotSchedulerContextValue {
  days: Array<DaySlots>;
  currentDate: Date;
  mode: TimeSlotSchedulerMode;
  dateRangeLabel: string;

  selectedSlot: SlotSelectPayload | null;
  onSelectSlot: (payload: SlotSelectPayload) => void;

  selectedDay: Date | null;
  onSelectDay: (date: Date) => void;
  selectedDaySlots: DaySlots | null;

  monthDayMeta: Array<MonthDayMeta>;

  onNavigate: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
  onModeChange: (mode: TimeSlotSchedulerMode) => void;

  timezone: string;
  timezones: Array<TimezoneOption>;
  onTimezoneChange: (tz: string) => void;

  user?: SchedulerUser;
  event?: SchedulerEvent;
  showReservationDetail: boolean;
  slotCapacity: number;

  locale: UiI18nLocale;
}

const TimeSlotSchedulerContext = createContext<TimeSlotSchedulerContextValue | null>(null);

export const TimeSlotSchedulerProvider = TimeSlotSchedulerContext.Provider;

export function useTimeSlotSchedulerContext(): TimeSlotSchedulerContextValue {
  const ctx = useContext(TimeSlotSchedulerContext);

  if (!ctx) {
    throw new Error('useTimeSlotSchedulerContext must be used within a TimeSlotSchedulerProvider');
  }

  return ctx;
}