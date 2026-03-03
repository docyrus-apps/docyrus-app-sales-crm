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
}: {
  children: ReactNode
  users: Array<IUser>
  events: Array<IEvent>
  defaultView?: TCalendarView
  badge?: 'dot' | 'colored'
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

  const [allEvents, setAllEvents] = useState<Array<IEvent>>(events)
  const [filteredEvents, setFilteredEvents] = useState<Array<IEvent>>(events)

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

      if (newColors.length > 0) {
        const filtered = allEvents.filter((event) =>
          newColors.includes(event.color),
        )

        setFilteredEvents(filtered)
      } else {
        setFilteredEvents(allEvents)
      }

      setSelectedColors(newColors)
    },
    [allEvents, selectedColors],
  )

  const filterEventsBySelectedUser = useCallback(
    (userId: IUser['id'] | 'all') => {
      setSelectedUserId(userId)
      if (userId === 'all') {
        setFilteredEvents(allEvents)
      } else {
        const filtered = allEvents.filter((event) => event.user.id === userId)

        setFilteredEvents(filtered)
      }
    },
    [allEvents],
  )

  const handleSelectDate = useCallback((date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
  }, [])

  const addEvent = useCallback((event: IEvent) => {
    setAllEvents((prev) => [...prev, event])
    setFilteredEvents((prev) => [...prev, event])
  }, [])

  const updateEvent = useCallback((event: IEvent) => {
    const updated = {
      ...event,
      startDate: new Date(event.startDate).toISOString(),
      endDate: new Date(event.endDate).toISOString(),
    }

    setAllEvents((prev) => prev.map((e) => (e.id === event.id ? updated : e)))
    setFilteredEvents((prev) =>
      prev.map((e) => (e.id === event.id ? updated : e)),
    )
  }, [])

  const removeEvent = useCallback((eventId: number) => {
    setAllEvents((prev) => prev.filter((e) => e.id !== eventId))
    setFilteredEvents((prev) => prev.filter((e) => e.id !== eventId))
  }, [])

  const clearFilter = useCallback(() => {
    setFilteredEvents(allEvents)
    setSelectedColors([])
    setSelectedUserId('all')
  }, [allEvents])

  const value = useMemo(
    () => ({
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
      removeEvent,
      selectedColors,
      selectedDate,
      selectedUserId,
      setAgendaModeGroupBy,
      setBadgeVariant,
      setView,
      setSelectedUserId,
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
