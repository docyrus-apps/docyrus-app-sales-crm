'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { type IEvent, type IUser } from '../interfaces'
import { type TCalendarView, type TEventColor } from '../types'

import { useLocalStorage } from '../hooks'

interface ICalendarContext {
  readOnly: boolean
  showUserFilter: boolean
  selectedDate: Date
  view: TCalendarView
  setView: (view: TCalendarView) => void
  agendaModeGroupBy: 'date' | 'color'
  setAgendaModeGroupBy: (groupBy: 'date' | 'color') => void
  use24HourFormat: boolean
  toggleTimeFormat: () => void
  setSelectedDate: (date: Date | undefined) => void
  selectedUserId: IUser['id'] | 'all'
  setSelectedUserId: (userId: IUser['id'] | 'all') => void
  badgeVariant: 'dot' | 'colored'
  setBadgeVariant: (variant: 'dot' | 'colored') => void
  selectedColors: Array<TEventColor>
  filterEventsBySelectedColors: (colors: TEventColor) => void
  filterEventsBySelectedUser: (userId: IUser['id'] | 'all') => void
  users: Array<IUser>
  events: Array<IEvent>
  addEvent: (event: IEvent) => void
  updateEvent: (event: IEvent) => void
  removeEvent: (eventId: number) => void
  clearFilter: () => void
}

interface CalendarSettings {
  badgeVariant: 'dot' | 'colored'
  view: TCalendarView
  use24HourFormat: boolean
  agendaModeGroupBy: 'date' | 'color'
}

const DEFAULT_SETTINGS: CalendarSettings = {
  badgeVariant: 'colored',
  view: 'day',
  use24HourFormat: true,
  agendaModeGroupBy: 'date',
}

const CalendarContext = createContext({} as ICalendarContext)

export function CalendarProvider({
  children,
  users,
  events,
  badge = 'colored',
  defaultView = 'day',
  readOnly = false,
  showUserFilter = true,
}: {
  children: ReactNode
  users: Array<IUser>
  events: Array<IEvent>
  defaultView?: TCalendarView
  badge?: 'dot' | 'colored'
  readOnly?: boolean
  showUserFilter?: boolean
}) {
  const [settings, setSettings] = useLocalStorage<CalendarSettings>(
    'calendar-settings',
    {
      ...DEFAULT_SETTINGS,
      badgeVariant: badge,
      view: defaultView,
    },
  )

  const [badgeVariant, setBadgeVariantState] = useState<'dot' | 'colored'>(
    settings.badgeVariant,
  )
  const [currentView, setCurrentViewState] = useState<TCalendarView>(
    settings.view,
  )
  const [use24HourFormat, setUse24HourFormatState] = useState<boolean>(
    settings.use24HourFormat,
  )
  const [agendaModeGroupBy, setAgendaModeGroupByState] = useState<
    'date' | 'color'
  >(settings.agendaModeGroupBy)

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedUserId, setSelectedUserId] = useState<IUser['id'] | 'all'>(
    'all',
  )
  const [selectedColors, setSelectedColors] = useState<Array<TEventColor>>([])
  const [addedEvents, setAddedEvents] = useState<Array<IEvent>>([])
  const [updatedEvents, setUpdatedEvents] = useState<Record<number, IEvent>>({})
  const [removedEventIds, setRemovedEventIds] = useState<Array<number>>([])

  const allEvents = useMemo(() => {
    const removedIds = new Set(removedEventIds)
    const mergedEvents = events
      .filter((event) => !removedIds.has(event.id))
      .map((event) => updatedEvents[event.id] ?? event)

    return mergedEvents.concat(
      addedEvents.filter((event) => !removedIds.has(event.id)),
    )
  }, [addedEvents, events, removedEventIds, updatedEvents])

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      if (selectedUserId !== 'all' && event.user.id !== selectedUserId) {
        return false
      }

      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) {
        return false
      }

      return true
    })
  }, [allEvents, selectedColors, selectedUserId])

  const updateSettings = useCallback(
    (newPartialSettings: Partial<CalendarSettings>) => {
      setSettings({ ...settings, ...newPartialSettings })
    },
    [setSettings, settings],
  )

  const setBadgeVariant = useCallback(
    (variant: 'dot' | 'colored') => {
      setBadgeVariantState(variant)
      updateSettings({ badgeVariant: variant })
    },
    [updateSettings],
  )

  const setView = useCallback(
    (newView: TCalendarView) => {
      setCurrentViewState(newView)
      updateSettings({ view: newView })
    },
    [updateSettings],
  )

  const toggleTimeFormat = useCallback(() => {
    setUse24HourFormatState((prev) => {
      const next = !prev

      updateSettings({ use24HourFormat: next })

      return next
    })
  }, [updateSettings])

  const setAgendaModeGroupBy = useCallback(
    (groupBy: 'date' | 'color') => {
      setAgendaModeGroupByState(groupBy)
      updateSettings({ agendaModeGroupBy: groupBy })
    },
    [updateSettings],
  )

  const filterEventsBySelectedColors = useCallback(
    (color: TEventColor) => {
      const isColorSelected = selectedColors.includes(color)
      const newColors = isColorSelected
        ? selectedColors.filter((c) => c !== color)
        : [...selectedColors, color]

      setSelectedColors(newColors)
    },
    [selectedColors],
  )

  const filterEventsBySelectedUser = useCallback(
    (userId: IUser['id'] | 'all') => {
      setSelectedUserId(userId)
    },
    [],
  )

  const handleSelectDate = useCallback((date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
  }, [])

  const addEvent = useCallback(
    (event: IEvent) => {
      if (readOnly) {
        return
      }

      setRemovedEventIds((prev) => prev.filter((id) => id !== event.id))
      setAddedEvents((prev) => [
        ...prev.filter((item) => item.id !== event.id),
        event,
      ])
    },
    [readOnly],
  )

  const updateEvent = useCallback(
    (event: IEvent) => {
      if (readOnly) {
        return
      }

      const updated = {
        ...event,
        startDate: new Date(event.startDate).toISOString(),
        endDate: new Date(event.endDate).toISOString(),
      }

      setAddedEvents((prev) =>
        prev.map((item) => (item.id === event.id ? updated : item)),
      )
      setUpdatedEvents((prev) => ({ ...prev, [event.id]: updated }))
    },
    [readOnly],
  )

  const removeEvent = useCallback(
    (eventId: number) => {
      if (readOnly) {
        return
      }

      setAddedEvents((prev) => prev.filter((event) => event.id !== eventId))
      setUpdatedEvents((prev) => {
        const next = { ...prev }

        delete next[eventId]

        return next
      })
      setRemovedEventIds((prev) =>
        prev.includes(eventId) ? prev : [...prev, eventId],
      )
    },
    [readOnly],
  )

  const clearFilter = useCallback(() => {
    setSelectedColors([])
    setSelectedUserId('all')
  }, [])

  const value = useMemo(
    () => ({
      readOnly,
      showUserFilter,
      selectedDate,
      setSelectedDate: handleSelectDate,
      selectedUserId,
      setSelectedUserId,
      badgeVariant,
      setBadgeVariant,
      users,
      selectedColors,
      filterEventsBySelectedColors,
      filterEventsBySelectedUser,
      events: filteredEvents,
      view: currentView,
      use24HourFormat,
      toggleTimeFormat,
      setView,
      agendaModeGroupBy,
      setAgendaModeGroupBy,
      addEvent,
      updateEvent,
      removeEvent,
      clearFilter,
    }),
    [
      addEvent,
      agendaModeGroupBy,
      badgeVariant,
      clearFilter,
      currentView,
      filterEventsBySelectedColors,
      filterEventsBySelectedUser,
      filteredEvents,
      handleSelectDate,
      readOnly,
      removeEvent,
      selectedColors,
      selectedDate,
      selectedUserId,
      setAgendaModeGroupBy,
      setBadgeVariant,
      setView,
      setSelectedUserId,
      showUserFilter,
      toggleTimeFormat,
      updateEvent,
      use24HourFormat,
      users,
    ],
  )

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext)

  if (!context)
    throw new Error('useCalendar must be used within a CalendarProvider.')

  return context
}
