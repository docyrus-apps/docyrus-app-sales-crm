import {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  format,
  getDay,
  isBefore,
  isSameDay,
  isWeekend as dateFnsIsWeekend,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks
} from 'date-fns';

import {
  type DaySlots,
  type DisabledReason,
  type SlotStatus,
  type TimeSlot,
  type TimeSlotReservation,
  type UnavailableRange
} from '../types';

interface SlotGenerationConfig {
  startTime: string;
  endTime: string;
  slotSize: number;
  slotCapacity: number;
  reservations: Array<TimeSlotReservation>;
  unavailableSlots: Array<UnavailableRange>;
  minDate?: Date;
  maxDate?: Date;
  showSaturday: boolean;
  showSunday: boolean;
}

function parseHHmm(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);

  return { hours: h ?? 0, minutes: m ?? 0 };
}

function setTimeOnDate(date: Date, time: string): Date {
  const { hours, minutes } = parseHHmm(time);
  const d = new Date(date);

  d.setHours(hours, minutes, 0, 0);

  return d;
}

function timeToMinutes(time: string): number {
  const { hours, minutes } = parseHHmm(time);

  return hours * 60 + minutes;
}

function minutesToHHmm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && startB < endA;
}

function isUnavailable(
  day: Date,
  slotStartMinutes: number,
  slotEndMinutes: number,
  unavailableSlots: Array<UnavailableRange>
): boolean {
  const dayStr = format(day, 'yyyy-MM-dd');
  const dayOfWeek = String(getDay(day));

  return unavailableSlots.some((range) => {
    const matchesDay = range.day === dayStr || range.day === dayOfWeek;

    if (!matchesDay) return false;

    const rangeStart = timeToMinutes(range.startTime);
    const rangeEnd = timeToMinutes(range.endTime);

    return slotStartMinutes < rangeEnd && rangeStart < slotEndMinutes;
  });
}

function deriveSlotStatus(
  slotStart: Date,
  slotEnd: Date,
  day: Date,
  slotStartMinutes: number,
  slotEndMinutes: number,
  reservationCount: number,
  capacity: number,
  config: SlotGenerationConfig
): { status: SlotStatus; disabledReason?: DisabledReason } {
  const now = new Date();

  if (isBefore(slotEnd, now)) {
    return { status: 'past', disabledReason: 'past' };
  }

  if (config.minDate && isBefore(slotStart, config.minDate)) {
    return { status: 'disabled', disabledReason: 'before-min-date' };
  }

  if (config.maxDate && isBefore(config.maxDate, slotStart)) {
    return { status: 'disabled', disabledReason: 'after-max-date' };
  }

  if (isUnavailable(day, slotStartMinutes, slotEndMinutes, config.unavailableSlots)) {
    return { status: 'unavailable', disabledReason: 'unavailable' };
  }

  if (reservationCount >= capacity) {
    return { status: 'full', disabledReason: 'full' };
  }

  if (reservationCount > 0) {
    return { status: 'partial' };
  }

  return { status: 'available' };
}

export function generateTimeSlotsForDay(
  day: Date,
  config: SlotGenerationConfig
): Array<TimeSlot> {
  const slots: Array<TimeSlot> = [];
  const startMinutes = timeToMinutes(config.startTime);
  const endMinutes = timeToMinutes(config.endTime);

  for (let m = startMinutes; m < endMinutes; m += config.slotSize) {
    const slotEndMinutes = Math.min(m + config.slotSize, endMinutes);
    const slotStartTime = minutesToHHmm(m);
    const slotEndTime = minutesToHHmm(slotEndMinutes);

    const slotStart = setTimeOnDate(day, slotStartTime);
    const slotEnd = setTimeOnDate(day, slotEndTime);

    const matchingReservations = config.reservations.filter((r) => {
      const rStart = new Date(r.startTime);
      const rEnd = new Date(r.endTime);

      return rangesOverlap(slotStart, slotEnd, rStart, rEnd);
    });

    const reservationCount = matchingReservations.length;
    const remainingCapacity = Math.max(0, config.slotCapacity - reservationCount);

    const { status, disabledReason } = deriveSlotStatus(
      slotStart,
      slotEnd,
      day,
      m,
      slotEndMinutes,
      reservationCount,
      config.slotCapacity,
      config
    );

    slots.push({
      id: `${format(day, 'yyyy-MM-dd')}-${slotStartTime}`,
      day,
      startTime: slotStartTime,
      endTime: slotEndTime,
      startISO: slotStart.toISOString(),
      endISO: slotEnd.toISOString(),
      status,
      disabledReason,
      capacity: config.slotCapacity,
      reservationCount,
      remainingCapacity,
      reservations: matchingReservations
    });
  }

  return slots;
}

function isDayIncluded(day: Date, config: SlotGenerationConfig): boolean {
  const dow = getDay(day);

  if (dow === 6 && !config.showSaturday) return false;
  if (dow === 0 && !config.showSunday) return false;

  return true;
}

function buildDaySlots(day: Date, slots: Array<TimeSlot>): DaySlots {
  return {
    date: day,
    dayLabel: format(day, 'EEE'),
    dateLabel: format(day, 'd'),
    fullLabel: format(day, 'EEEE, MMMM d'),
    isToday: isSameDay(day, new Date()),
    isWeekend: dateFnsIsWeekend(day),
    slots,
    hasAvailability: slots.some(s => s.status === 'available' || s.status === 'partial')
  };
}

export function generateWeekSlots(
  currentDate: Date,
  config: SlotGenerationConfig
): Array<DaySlots> {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days: Array<DaySlots> = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);

    if (!isDayIncluded(day, config)) continue;

    const slots = generateTimeSlotsForDay(day, config);

    days.push(buildDaySlots(day, slots));
  }

  return days;
}

export interface MonthDayMeta {
  date: Date;
  dayLabel: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  hasAvailability: boolean;
  isIncluded: boolean;
}

export function generateMonthDayMeta(
  currentDate: Date,
  config: SlotGenerationConfig
): Array<MonthDayMeta> {
  const monthStart = startOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  const days: Array<MonthDayMeta> = [];
  let cursor = calendarStart;

  while (days.length < 42) {
    const isCurrentMonth = cursor.getMonth() === currentDate.getMonth();
    const included = isDayIncluded(cursor, config);

    let hasAvailability = false;

    if (included && isCurrentMonth) {
      const startMinutes = timeToMinutes(config.startTime);
      const endMinutes = timeToMinutes(config.endTime);

      for (let m = startMinutes; m < endMinutes; m += config.slotSize) {
        const slotEndMinutes = Math.min(m + config.slotSize, endMinutes);
        const slotStart = setTimeOnDate(cursor, minutesToHHmm(m));
        const slotEnd = setTimeOnDate(cursor, minutesToHHmm(slotEndMinutes));

        const reservationCount = config.reservations.filter(r => rangesOverlap(slotStart, slotEnd, new Date(r.startTime), new Date(r.endTime))).length;

        const { status } = deriveSlotStatus(
          slotStart,
          slotEnd,
          cursor,
          m,
          slotEndMinutes,
          reservationCount,
          config.slotCapacity,
          config
        );

        if (status === 'available' || status === 'partial') {
          hasAvailability = true;
          break;
        }
      }
    }

    days.push({
      date: new Date(cursor),
      dayLabel: format(cursor, 'd'),
      isToday: isSameDay(cursor, new Date()),
      isCurrentMonth,
      isWeekend: dateFnsIsWeekend(cursor),
      hasAvailability,
      isIncluded: included && isCurrentMonth
    });

    cursor = addDays(cursor, 1);
  }

  return days;
}

export function generateDaySlotsForSelectedDay(
  selectedDay: Date,
  config: SlotGenerationConfig
): DaySlots {
  const slots = generateTimeSlotsForDay(selectedDay, config);

  return buildDaySlots(selectedDay, slots);
}

export function navigateWeek(date: Date, direction: 'prev' | 'next'): Date {
  return direction === 'next' ? addWeeks(date, 1) : subWeeks(date, 1);
}

export function navigateMonth(date: Date, direction: 'prev' | 'next'): Date {
  return direction === 'next' ? addMonths(date, 1) : subMonths(date, 1);
}

export function getWeekDateRangeLabel(date: Date): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${format(weekStart, 'MMMM d')} – ${format(weekEnd, 'd, yyyy')}`;
  }

  if (weekStart.getFullYear() === weekEnd.getFullYear()) {
    return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
  }

  return `${format(weekStart, 'MMM d, yyyy')} – ${format(weekEnd, 'MMM d, yyyy')}`;
}

export function getMonthDateRangeLabel(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function formatSlotTime(time: string, _timezone?: string): string {
  const { hours, minutes } = parseHHmm(time);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, '0');

  return `${displayHour}:${displayMinutes} ${period}`;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const base = new Date(2000, 0, 1);
  const start = setTimeOnDate(base, time);
  const end = addMinutes(start, minutes);

  return format(end, 'HH:mm');
}