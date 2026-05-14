import {
  addDays,
  addMinutes,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
  isSameDay,
  isWeekend,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

export const FIELD_SALES_APP_ID = '019c4b95-bd68-768f-b0d9-b5f9ad0a91d7'
export const FIELD_SALES_APP_SLUG = 'base_crm'

export type FieldSalesPlanningEntity = 'organization' | 'contact'
export type FieldSalesApprovalMode = 'weekly' | 'monthly'

export interface FieldSalesConfig {
  approvalMode: FieldSalesApprovalMode
  planningEntity: FieldSalesPlanningEntity
  slotMinutes: 30 | 60
  locationCheckEnabled: boolean
  allowedDistanceMeters: number
  showWeekends: boolean
  dayStartTime: string
  dayEndTime: string
}

export interface SlotDefinition {
  key: string
  start: string
  end: string
  label: string
}

export const DEFAULT_FIELD_SALES_CONFIG: FieldSalesConfig = {
  approvalMode: 'weekly',
  planningEntity: 'organization',
  slotMinutes: 30,
  locationCheckEnabled: true,
  allowedDistanceMeters: 250,
  showWeekends: false,
  dayStartTime: '09:00',
  dayEndTime: '18:00',
}

export const FIELD_SALES_PLAN_STATUS_IDS = {
  waiting: '019e206f-8bbb-776d-a4e0-555d7223b37f',
  postponed: '019e206f-8bbf-770a-be89-13f4288ba964',
  completed: '019e206f-8bbf-7b48-aa8d-d965aa224e84',
  checkedIn: '019e206f-8bbf-7e04-ae6e-322768c55d45',
  cancelled: '019e206f-8bc0-711b-a2e4-61a2cb38d028',
} as const

export const FIELD_SALES_APPROVAL_STATUS_IDS = {
  waitingForApproval: '019e17ac-0b23-7a19-8899-8d02db14fb62',
  approved: '019e17ac-0b24-7887-ac2c-87e2407d85c4',
  revisionRequested: '019e17ac-0b25-7d37-b718-994cd6503e47',
} as const

export const FIELD_SALES_EVENT_TYPE_IDS = {
  plannedVisit: '019e206f-9213-76d5-b4c1-cc5c0884afb3',
  task: '019e206f-9214-7ce1-a619-c55ebae6f1d2',
  unplannedVisit: '019e206f-9215-70e1-a720-fabf2d782d32',
} as const

export function getFieldSalesConfig(
  value: Partial<FieldSalesConfig> | null | undefined,
): FieldSalesConfig {
  return {
    ...DEFAULT_FIELD_SALES_CONFIG,
    ...(value ?? {}),
  }
}

export function parseTimeToMinutes(value: string) {
  const [hours = '0', minutes = '0'] = value.split(':')
  return Number(hours) * 60 + Number(minutes)
}

export function formatMinutesAsTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function generateSlotDefinitions(config: FieldSalesConfig) {
  const start = parseTimeToMinutes(config.dayStartTime)
  const end = parseTimeToMinutes(config.dayEndTime)
  const slots: Array<SlotDefinition> = []

  for (let minutes = start; minutes < end; minutes += config.slotMinutes) {
    const slotStart = formatMinutesAsTime(minutes)
    const slotEnd = formatMinutesAsTime(minutes + config.slotMinutes)
    slots.push({
      key: slotStart,
      start: slotStart,
      end: slotEnd,
      label: slotStart,
    })
  }

  return slots
}

export function getFieldSalesWeekDays(
  anchorDate: Date,
  showWeekends: boolean,
): Array<Date> {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 })
  const days = showWeekends ? 7 : 5

  return Array.from({ length: days }, (_, index) => addDays(weekStart, index))
}

export function getFieldSalesPlanningDays(
  anchorDate: Date,
  approvalMode: FieldSalesApprovalMode,
  showWeekends: boolean,
): Array<Date> {
  if (approvalMode === 'weekly') {
    return getFieldSalesWeekDays(anchorDate, showWeekends)
  }

  const monthRange = getMonthRange(anchorDate)
  const days = eachDayOfInterval(monthRange)

  return showWeekends ? days : days.filter((day) => !isWeekend(day))
}

export function getWeekRange(anchorDate: Date, showWeekends: boolean) {
  const start = startOfWeek(anchorDate, { weekStartsOn: 1 })
  const end = showWeekends
    ? endOfWeek(anchorDate, { weekStartsOn: 1 })
    : addDays(start, 4)

  return { start, end }
}

export function getMonthRange(anchorDate: Date) {
  return {
    start: startOfMonth(anchorDate),
    end: endOfMonth(anchorDate),
  }
}

export function getApprovalRange(
  anchorDate: Date,
  approvalMode: FieldSalesApprovalMode,
  showWeekends: boolean,
) {
  return approvalMode === 'monthly'
    ? getMonthRange(anchorDate)
    : getWeekRange(anchorDate, showWeekends)
}

export function buildIsoDateTime(date: Date, time: string) {
  const [hours = '0', minutes = '0'] = time.split(':')
  const value = new Date(date)
  value.setHours(Number(hours), Number(minutes), 0, 0)
  return value.toISOString()
}

export function buildSlotEndIso(date: Date, time: string, slotMinutes: number) {
  const start = new Date(buildIsoDateTime(date, time))
  return addMinutes(start, slotMinutes).toISOString()
}

export function getDateKey(value: string | Date) {
  return format(value instanceof Date ? value : parseISO(value), 'yyyy-MM-dd')
}

export function getTimeKey(value: string | Date) {
  return format(value instanceof Date ? value : parseISO(value), 'HH:mm')
}

export function getSlotKeyFromIso(value: string | undefined) {
  if (!value) return null
  return `${getDateKey(value)}|${getTimeKey(value)}`
}

export function getStatusMeta(status: any) {
  if (!status) {
    return { id: '', name: '', slug: '' }
  }

  if (typeof status === 'string') {
    return { id: status, name: status, slug: status }
  }

  return {
    id: status.id ?? '',
    name: status.name ?? status.label ?? status.slug ?? '',
    slug: status.slug ?? status.name ?? status.id ?? '',
  }
}

function normalizeStatusToken(value: string) {
  return value.trim().toLocaleLowerCase('tr')
}

function matchesStatusTokens(
  value: any,
  tokens: Array<string>,
  ids: Array<string>,
) {
  const meta = getStatusMeta(value)
  const normalized = [meta.id, meta.slug, meta.name]
    .filter(Boolean)
    .map((token) => normalizeStatusToken(String(token)))

  return normalized.some(
    (token) => ids.includes(token) || tokens.includes(token),
  )
}

export function getFieldSalesPlanStatusCode(value: any) {
  if (
    matchesStatusTokens(
      value,
      ['waiting', 'beklemede'],
      [FIELD_SALES_PLAN_STATUS_IDS.waiting],
    )
  ) {
    return 'waiting'
  }

  if (
    matchesStatusTokens(
      value,
      ['postponed', 'ertelendi'],
      [FIELD_SALES_PLAN_STATUS_IDS.postponed],
    )
  ) {
    return 'postponed'
  }

  if (
    matchesStatusTokens(
      value,
      ['completed', 'gerçekleşti'],
      [FIELD_SALES_PLAN_STATUS_IDS.completed],
    )
  ) {
    return 'completed'
  }

  if (
    matchesStatusTokens(
      value,
      ['checked_in', 'ziyarette'],
      [FIELD_SALES_PLAN_STATUS_IDS.checkedIn],
    )
  ) {
    return 'checked_in'
  }

  if (
    matchesStatusTokens(
      value,
      ['cancelled', 'iptal'],
      [FIELD_SALES_PLAN_STATUS_IDS.cancelled],
    )
  ) {
    return 'cancelled'
  }

  return ''
}

export function getFieldSalesApprovalStatusCode(value: any) {
  if (
    matchesStatusTokens(
      value,
      ['waiting_for_approval', 'onay bekliyor'],
      [FIELD_SALES_APPROVAL_STATUS_IDS.waitingForApproval],
    )
  ) {
    return 'waiting_for_approval'
  }

  if (
    matchesStatusTokens(
      value,
      ['approved', 'onaylandı'],
      [FIELD_SALES_APPROVAL_STATUS_IDS.approved],
    )
  ) {
    return 'approved'
  }

  if (
    matchesStatusTokens(
      value,
      ['revision_requested', 'revizyon'],
      [FIELD_SALES_APPROVAL_STATUS_IDS.revisionRequested],
    )
  ) {
    return 'revision_requested'
  }

  return ''
}

export function getFieldSalesEventTypeCode(value: any) {
  if (
    matchesStatusTokens(
      value,
      ['planned_visit', 'planned visit'],
      [FIELD_SALES_EVENT_TYPE_IDS.plannedVisit],
    )
  ) {
    return 'planned_visit'
  }

  if (matchesStatusTokens(value, ['task'], [FIELD_SALES_EVENT_TYPE_IDS.task])) {
    return 'task'
  }

  if (
    matchesStatusTokens(
      value,
      ['unplanned_visit', 'unplanned visit'],
      [FIELD_SALES_EVENT_TYPE_IDS.unplannedVisit],
    )
  ) {
    return 'unplanned_visit'
  }

  return ''
}

export function getRelationName(value: any) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.name ?? value.label ?? ''
}

export function getUserDisplayName(value: any) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return (
    [value.firstname, value.lastname].filter(Boolean).join(' ').trim() ||
    value.name ||
    value.email ||
    ''
  )
}

export function getWeekApprovalLabel(date: Date, owner: any) {
  return `Week:${getISOWeek(date)} – ${format(date, 'yyyy')} – ${getUserDisplayName(owner)}`
}

export function getMonthApprovalLabel(date: Date, owner: any) {
  return `Month:${format(date, 'MM')} – ${format(date, 'yyyy')} – ${getUserDisplayName(owner)}`
}

export function getApprovalLabel(
  date: Date,
  owner: any,
  approvalMode: FieldSalesApprovalMode,
) {
  return approvalMode === 'monthly'
    ? getMonthApprovalLabel(date, owner)
    : getWeekApprovalLabel(date, owner)
}

export function parseMapLocation(value: any) {
  if (!value) return null

  const latitude = Number(
    value.latitude ??
      value.lat ??
      value.coords?.latitude ??
      value.location?.lat,
  )
  const longitude = Number(
    value.longitude ??
      value.lng ??
      value.lon ??
      value.coords?.longitude ??
      value.location?.lng,
  )

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  return {
    latitude,
    longitude,
    label: value.address ?? value.label ?? value.name ?? '',
  }
}

export function haversineDistanceMeters(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const earthRadius = 6371000
  const dLat = toRadians(second.latitude - first.latitude)
  const dLng = toRadians(second.longitude - first.longitude)
  const lat1 = toRadians(first.latitude)
  const lat2 = toRadians(second.latitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function isDateWithinRange(
  value: string | undefined,
  start: Date,
  end: Date,
) {
  if (!value) return false
  const parsed = parseISO(value)
  return parsed >= start && parsed <= end
}

export function isSameCalendarDay(value: string | undefined, day: Date) {
  if (!value) return false
  return isSameDay(parseISO(value), day)
}
