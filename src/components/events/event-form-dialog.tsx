/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { EventFormData } from '@/schemas/event-schema'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { eventFormSchema } from '@/schemas/event-schema'
import { useCreateEvent, useUpdateEvent } from '@/hooks/use-events'
import { cn } from '@/lib/utils'

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: any
  mode: 'create' | 'edit'
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  mode,
}: EventFormDialogProps) {
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()

  const [startDate, setStartDate] = useState<Date | undefined>(
    event?.start_date ? new Date(event.start_date) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    event?.end_date ? new Date(event.end_date) : undefined,
  )

  const form = useForm({
    defaultValues: {
      subject: event?.subject || '',
      description: event?.description || '',
      start_date: event?.start_date || '',
      end_date: event?.end_date || '',
      calendar: event?.calendar || '',
      event_notes: event?.event_notes || undefined,
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: eventFormSchema,
    },
    onSubmit: async ({ value }) => {
      // Clean up empty strings (convert to undefined for UUID fields)
      const cleanedData = Object.fromEntries(
        Object.entries(value).map(([key, val]) => [
          key,
          val === '' ? undefined : val,
        ]),
      )

      try {
        if (mode === 'create') {
          await createEvent.mutateAsync(cleanedData)
        } else if (event?.id) {
          await updateEvent.mutateAsync({
            eventId: event.id,
            data: cleanedData,
          })
        }
        onOpenChange(false)
        form.reset()
      } catch (error) {
        console.error('Form submission error:', error)
      }
    },
  })

  // Sync date state with form
  useEffect(() => {
    if (startDate) {
      form.setFieldValue('start_date', startDate.toISOString())
    }
  }, [startDate, form])

  useEffect(() => {
    if (endDate) {
      form.setFieldValue('end_date', endDate.toISOString())
    }
  }, [endDate, form])

  const isSubmitting = form.state.isSubmitting

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {mode === 'create' ? 'Create Event' : 'Edit Event'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {mode === 'create'
              ? 'Add a new event to your calendar'
              : 'Update event details'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {/* Subject */}
            <form.Field name="subject">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Enter event subject"
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-red-500">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          'Validation error'}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Description */}
            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Enter event description"
                    rows={3}
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-red-500">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          'Validation error'}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Start Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="start_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Start Date & Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !startDate && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? (
                            format(startDate, 'PPP p')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                        <div className="p-3 border-t">
                          <Label htmlFor="start-time" className="text-xs">
                            Time
                          </Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={
                              startDate ? format(startDate, 'HH:mm') : '09:00'
                            }
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':')
                              const newDate = startDate || new Date()
                              newDate.setHours(
                                parseInt(hours),
                                parseInt(minutes),
                              )
                              setStartDate(new Date(newDate))
                            }}
                            className="mt-1"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* End Date & Time */}
              <form.Field name="end_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label>End Date & Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !endDate && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? (
                            format(endDate, 'PPP p')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                        <div className="p-3 border-t">
                          <Label htmlFor="end-time" className="text-xs">
                            Time
                          </Label>
                          <Input
                            id="end-time"
                            type="time"
                            value={endDate ? format(endDate, 'HH:mm') : '10:00'}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':')
                              const newDate = endDate || new Date()
                              newDate.setHours(
                                parseInt(hours),
                                parseInt(minutes),
                              )
                              setEndDate(new Date(newDate))
                            }}
                            className="mt-1"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            'Validation error'}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {/* Calendar */}
            <form.Field name="calendar">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="calendar">Calendar</Label>
                  <Input
                    id="calendar"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g., Work, Personal"
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-red-500">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          'Validation error'}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Event Notes */}
            <form.Field name="event_notes">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="event_notes">Event Notes</Label>
                  <Textarea
                    id="event_notes"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Additional notes about the event"
                    rows={2}
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-red-500">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          'Validation error'}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === 'create' ? 'Create Event' : 'Update Event'}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
