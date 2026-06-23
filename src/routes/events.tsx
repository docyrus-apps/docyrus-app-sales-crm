import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CalendarDays as CalendarIcon } from 'lucide-react'
import type { IEvent, IUser, TEventColor } from '@/components/docyrus/calendar'
import { useBaseEventCollection } from '@/collections/base-event.collection'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Calendar } from '@/components/docyrus/calendar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const EVENT_COLORS: Array<TEventColor> = [
  'blue',
  'green',
  'red',
  'yellow',
  'purple',
  'orange',
]

function getHashValue(input: string): number {
  return input.split('').reduce((hash, character) => {
    return ((hash << 5) - hash + character.charCodeAt(0)) | 0
  }, 0)
}

function getEventColor(seed: string): TEventColor {
  const hash = Math.abs(getHashValue(seed))

  return EVENT_COLORS[hash % EVENT_COLORS.length] ?? EVENT_COLORS[0]
}

function getEventId(rawId: string | undefined, index: number): number {
  if (!rawId) {
    return index + 1
  }

  const numericValue = Number(rawId)

  if (Number.isInteger(numericValue) && numericValue > 0) {
    return numericValue
  }

  return Math.abs(getHashValue(rawId)) || index + 1
}

function getCalendarLabel(
  calendar: { id: string; name: string } | string | undefined,
  t: (key: string) => string,
) {
  if (!calendar) {
    return t('events.defaultCalendarName')
  }

  return typeof calendar === 'string' ? calendar : calendar.name
}

export function CalendarPage() {
  const { t } = useTranslation()
  const { list } = useBaseEventCollection()

  const {
    data: records = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ['events', 'calendar'],
    queryFn: () =>
      list({
        columns: [
          'id',
          'subject',
          'description',
          'start_date',
          'end_date',
          'calendar(name)',
        ],
        orderBy: 'start_date ASC',
      }),
  })

  const users = useMemo<Array<IUser>>(() => {
    const userMap = new Map<string, IUser>()

    for (const record of records) {
      const label = getCalendarLabel(record.calendar, t)
      const userId = `calendar-${label.toLowerCase().replace(/\s+/g, '-')}`

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          id: userId,
          name: label,
          picturePath: null,
        })
      }
    }

    if (userMap.size === 0) {
      userMap.set('calendar-general', {
        id: 'calendar-general',
        name: t('events.defaultCalendarName'),
        picturePath: null,
      })
    }

    return Array.from(userMap.values())
  }, [records, t])

  const calendarEvents = useMemo<Array<IEvent>>(() => {
    const defaultUser = users[0] ?? {
      id: 'calendar-general',
      name: t('events.defaultCalendarName'),
      picturePath: null,
    }
    const userLookup = new Map(users.map((user) => [user.name, user]))

    return records
      .filter((record) => Boolean(record.start_date))
      .map((record, index) => {
        const calendarLabel = getCalendarLabel(record.calendar, t)
        const assignedUser = userLookup.get(calendarLabel) ?? defaultUser
        const startDate = record.start_date ?? new Date().toISOString()
        const endDate =
          record.end_date ??
          new Date(new Date(startDate).getTime() + 60 * 60 * 1000).toISOString()

        return {
          id: getEventId(record.id, index),
          startDate,
          endDate,
          title: record.subject,
          color: getEventColor(
            record.id ?? `${record.subject}-${calendarLabel}`,
          ),
          description: record.description ?? '',
          user: assignedUser,
        }
      })
  }, [records, users, t])

  return (
    <>
      <PageHeader
        title={t('calendar.title')}
        icon={<CalendarIcon className="h-4 w-4 text-cyan-500" />}
        titleSuffix={<Badge variant="secondary">{calendarEvents.length}</Badge>}
      />
      <PageContainer>
        {error ? (
          <Card>
            <CardContent className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">
              {error instanceof Error ? error.message : t('common.error')}
            </CardContent>
          </Card>
        ) : (
          <Calendar
            events={calendarEvents}
            users={users}
            isLoading={isLoading}
            defaultView="month"
            size="lg"
            readOnly
            showUserFilter={false}
          />
        )}
      </PageContainer>
    </>
  )
}
