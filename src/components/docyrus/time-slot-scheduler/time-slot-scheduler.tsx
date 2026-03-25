'use client';

import { useCallback, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import {
  generateDaySlotsForSelectedDay,
  generateMonthDayMeta,
  generateWeekSlots,
  getMonthDateRangeLabel,
  getWeekDateRangeLabel,
  navigateMonth,
  navigateWeek
} from './lib/time-slot-utils';
import { TimeSlotSchedulerColumnsView } from './time-slot-scheduler-columns-view';
import {
  type TimeSlotSchedulerContextValue,
  TimeSlotSchedulerProvider
} from './time-slot-scheduler-context';
import { TimeSlotSchedulerHeader } from './time-slot-scheduler-header';
import { TimeSlotSchedulerMonthView } from './time-slot-scheduler-month-view';
import { TimeSlotSchedulerSidebar } from './time-slot-scheduler-sidebar';
import {
  type SlotSelectPayload,
  type TimeSlotSchedulerMode,
  type TimeSlotSchedulerProps
} from './types';

function TimeSlotScheduler({
  startTime = '09:00',
  endTime = '17:00',
  slotSize = 30,
  slotCapacity = 1,
  reservations = [],
  unavailableSlots = [],
  user,
  event,
  mode: controlledMode,
  defaultMode = 'columns',
  onModeChange,
  defaultDate,
  minDate,
  maxDate,
  showSaturday = false,
  showSunday = false,
  timezone: controlledTimezone,
  defaultTimezone = '',
  timezones = [],
  onTimezoneChange,
  showReservationDetail = false,
  selectedSlot: controlledSelectedSlot,
  defaultSelectedSlot = null,
  onSelect,
  className,
  locale = 'en'
}: TimeSlotSchedulerProps) {
  const [internalMode, setInternalMode] = useState<TimeSlotSchedulerMode>(defaultMode);
  const mode = controlledMode ?? internalMode;

  const [currentDate, setCurrentDate] = useState(() => defaultDate ?? new Date());

  const [internalSelectedSlot, setInternalSelectedSlot] = useState<SlotSelectPayload | null>(
    defaultSelectedSlot
  );
  const selectedSlot = controlledSelectedSlot !== undefined ? controlledSelectedSlot : internalSelectedSlot;

  const [internalTimezone, setInternalTimezone] = useState(defaultTimezone);
  const timezone = controlledTimezone ?? internalTimezone;

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const slotConfig = useMemo(
    () => ({
      startTime,
      endTime,
      slotSize,
      slotCapacity,
      reservations,
      unavailableSlots,
      minDate,
      maxDate,
      showSaturday,
      showSunday
    }),
    [
      startTime,
      endTime,
      slotSize,
      slotCapacity,
      reservations,
      unavailableSlots,
      minDate,
      maxDate,
      showSaturday,
      showSunday
    ]
  );

  const days = useMemo(
    () => (mode === 'columns' ? generateWeekSlots(currentDate, slotConfig) : []),
    [mode, currentDate, slotConfig]
  );

  const monthDayMeta = useMemo(
    () => (mode === 'month' ? generateMonthDayMeta(currentDate, slotConfig) : []),
    [mode, currentDate, slotConfig]
  );

  const selectedDaySlots = useMemo(
    () => (selectedDay && mode === 'month' ? generateDaySlotsForSelectedDay(selectedDay, slotConfig) : null),
    [selectedDay, mode, slotConfig]
  );

  const dateRangeLabel = useMemo(
    () => (mode === 'columns' ? getWeekDateRangeLabel(currentDate) : getMonthDateRangeLabel(currentDate)),
    [mode, currentDate]
  );

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      setCurrentDate(prev => mode === 'columns' ? navigateWeek(prev, direction) : navigateMonth(prev, direction));
      setSelectedDay(null);
    },
    [mode]
  );

  const handleGoToToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  }, []);

  const handleModeChange = useCallback(
    (newMode: TimeSlotSchedulerMode) => {
      if (controlledMode === undefined) {
        setInternalMode(newMode);
      }
      onModeChange?.(newMode);
      setSelectedDay(null);
    },
    [controlledMode, onModeChange]
  );

  const handleSelectSlot = useCallback(
    (payload: SlotSelectPayload) => {
      if (controlledSelectedSlot === undefined) {
        setInternalSelectedSlot(payload);
      }
      onSelect?.(payload);
    },
    [controlledSelectedSlot, onSelect]
  );

  const handleTimezoneChange = useCallback(
    (tz: string) => {
      if (controlledTimezone === undefined) {
        setInternalTimezone(tz);
      }
      onTimezoneChange?.(tz);
    },
    [controlledTimezone, onTimezoneChange]
  );

  const handleSelectDay = useCallback((date: Date) => {
    setSelectedDay(date);
  }, []);

  const contextValue = useMemo<TimeSlotSchedulerContextValue>(
    () => ({
      days,
      currentDate,
      mode,
      dateRangeLabel,
      selectedSlot,
      onSelectSlot: handleSelectSlot,
      selectedDay,
      onSelectDay: handleSelectDay,
      selectedDaySlots,
      monthDayMeta,
      onNavigate: handleNavigate,
      onGoToToday: handleGoToToday,
      onModeChange: handleModeChange,
      timezone,
      timezones,
      onTimezoneChange: handleTimezoneChange,
      user,
      event,
      showReservationDetail,
      slotCapacity,
      locale
    }),
    [
      days,
      currentDate,
      mode,
      dateRangeLabel,
      selectedSlot,
      handleSelectSlot,
      selectedDay,
      handleSelectDay,
      selectedDaySlots,
      monthDayMeta,
      handleNavigate,
      handleGoToToday,
      handleModeChange,
      timezone,
      timezones,
      handleTimezoneChange,
      user,
      event,
      showReservationDetail,
      slotCapacity,
      locale
    ]
  );

  return (
    <TimeSlotSchedulerProvider value={contextValue}>
      <div className={cn('flex flex-col overflow-hidden rounded-lg border bg-background lg:flex-row', className)}>
        <TimeSlotSchedulerSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TimeSlotSchedulerHeader />
          {mode === 'columns' ? <TimeSlotSchedulerColumnsView /> : <TimeSlotSchedulerMonthView />}
        </div>
      </div>
    </TimeSlotSchedulerProvider>
  );
}

export { TimeSlotScheduler };
export type { TimeSlotSchedulerProps };