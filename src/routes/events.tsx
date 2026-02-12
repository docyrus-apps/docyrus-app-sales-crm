import { useMemo, useState } from 'react'
import { Calendar as CalendarIcon, List, Plus } from 'lucide-react'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEvents } from '@/hooks/use-events'
import { EventFormDialog } from '@/components/events/event-form-dialog'
import { formatDate } from '@/lib/formatters'

export function Events() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  // Fetch events
  const { data: events, isLoading } = useEvents()

  // Filter events by selected date
  const eventsOnSelectedDate = useMemo(() => {
    if (!events || !selectedDate) return []

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')

    return events.filter((event: any) => {
      if (!event.start_date) return false
      const eventDateStr = format(new Date(event.start_date), 'yyyy-MM-dd')
      return eventDateStr === selectedDateStr
    })
  }, [events, selectedDate])

  // Get dates that have events for calendar highlighting
  const eventDates = useMemo(() => {
    if (!events) return []

    return events
      .filter((event: any) => event.start_date)
      .map((event: any) => new Date(event.start_date))
  }, [events])

  // Upcoming events (next 30 days)
  const upcomingEvents = useMemo(() => {
    if (!events) return []

    const now = new Date()
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return events
      .filter((event: any) => {
        if (!event.start_date) return false
        const eventDate = new Date(event.start_date)
        return eventDate >= now && eventDate <= monthFromNow
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
      )
  }, [events])

  return (
    <>
      <PageHeader
        title="Events"
        icon={CalendarIcon}
        actions={
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList>
                <TabsTrigger value="calendar">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-1" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </div>
        }
      />
      <PageContainer>
        <EventFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          mode="create"
        />

        {viewMode === 'calendar' ? (
          <div className="grid gap-4 md:grid-cols-[350px_1fr]">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Select a date to view events</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiers={{
                      hasEvent: eventDates,
                    }}
                    modifiersStyles={{
                      hasEvent: {
                        fontWeight: 'bold',
                        textDecoration: 'underline',
                      },
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Events for selected date */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Events on {selectedDate && format(selectedDate, 'PPP')}
                </CardTitle>
                <CardDescription>
                  {eventsOnSelectedDate.length} event(s) scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : eventsOnSelectedDate.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No events scheduled</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create an event to get started
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setIsFormOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {eventsOnSelectedDate.map((event: any) => (
                      <Card
                        key={event.id}
                        className="hover:shadow-md transition-all"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">
                                {event.subject}
                              </CardTitle>
                              {event.description && (
                                <CardDescription className="mt-1">
                                  {event.description}
                                </CardDescription>
                              )}
                            </div>
                            {event.calendar && (
                              <Badge variant="outline">{event.calendar}</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span>
                                {event.start_date &&
                                  format(new Date(event.start_date), 'p')}
                                {event.end_date &&
                                  ` - ${format(new Date(event.end_date), 'p')}`}
                              </span>
                            </div>
                          </div>
                          {event.event_notes && (
                            <p className="text-sm mt-2">{event.event_notes}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* List View */
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>
                Events in the next 30 days ({upcomingEvents.length} events)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No upcoming events</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Schedule your first event
                  </p>
                  <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event: any) => (
                    <Card
                      key={event.id}
                      className="hover:shadow-md transition-all"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{event.subject}</h4>
                              {event.calendar && (
                                <Badge variant="outline" className="text-xs">
                                  {event.calendar}
                                </Badge>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                <span>
                                  {event.start_date &&
                                    format(new Date(event.start_date), 'PPP p')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </>
  )
}
