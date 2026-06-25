import { useEffect, useState } from 'react'

import { useTranslation } from 'react-i18next'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  AwesomeDialog,
  AwesomeDialogBody,
  AwesomeDialogFooter,
  AwesomeDialogHeader
} from '@/components/docyrus/awesome-dialog'
import { FormSubmitAlert } from '@/components/crm/form-submit-alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { eventFormSchema } from '@/schemas/event-schema'
import { useCreateEvent, useUpdateEvent } from '@/hooks/use-events'
import { cn } from '@/lib/utils'
import {
  getSubmitFailureMessage,
  validateSubmitValues
} from '@/lib/form-submit-feedback'

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: any;
  mode: 'create' | 'edit';
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  mode
}: EventFormDialogProps) {
  const { t } = useTranslation()
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()

  const [startDate, setStartDate] = useState<Date | undefined>(
    event?.start_date ? new Date(event.start_date) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    event?.end_date ? new Date(event.end_date) : undefined
  )
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      subject: event?.subject || '',
      description: event?.description || '',
      start_date: event?.start_date || '',
      end_date: event?.end_date || '',
      calendar: event?.calendar || '',
      event_notes: event?.event_notes || undefined
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: eventFormSchema,
      onSubmit: eventFormSchema
    },
    onSubmit: async ({ value }) => {
      // Clean up empty strings (convert to undefined for UUID fields)
      const cleanedData = Object.fromEntries(
        Object.entries(value).map(([key, val]) => [key, val === '' ? undefined : val])
      )

      try {
        setSubmitError(null)
        if (mode === 'create') {
          await createEvent.mutateAsync(cleanedData)
        } else if (event?.id) {
          await updateEvent.mutateAsync({
            eventId: event.id,
            data: cleanedData
          })
        }
        onOpenChange(false)
        form.reset()
      } catch (error) {
        console.error('Form submission error:', error)
        setSubmitError(getSubmitFailureMessage(error, t))
      }
    }
  })

  useEffect(() => {
    if (open) setSubmitError(null)
  }, [open, mode, event?.id])

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

  const { isSubmitting } = form.state
  const fieldLabels = {
    subject: t('events.form.subjectLabel')
  }
  const handleFormSubmit = () => {
    const validationMessage = validateSubmitValues(
      eventFormSchema,
      form.state.values,
      fieldLabels,
      t
    )

    if (validationMessage) {
      setSubmitError(validationMessage)
      toast.error(validationMessage)

      return
    }

    setSubmitError(null)
    void form.handleSubmit()
  }

  return (
    <AwesomeDialog
      open={open}
      onOpenChange={onOpenChange}
      container="modal"
      size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleFormSubmit()
        }}
        className="flex flex-col flex-1 overflow-hidden">
        <AwesomeDialogHeader
          title={
            mode === 'create'
              ? t('events.form.createTitle')
              : t('events.form.editTitle')
          }
          description={
            mode === 'create'
              ? t('events.form.createDescription')
              : t('events.form.editDescription')
          } />

        <AwesomeDialogBody>
          <div className="space-y-4">
            <FormSubmitAlert
              title={t('common.validationError')}
              message={submitError} />
            {/* Subject */}
            <form.Field name="subject">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    {t('events.form.subjectLabel')}{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t('events.form.subjectPlaceholder')} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-red-500">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Description */}
            <form.Field name="description">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('events.form.descriptionLabel')}
                  </Label>
                  <Textarea
                    id="description"
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t('events.form.descriptionPlaceholder')}
                    rows={3} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-red-500">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Start Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="start_date">
                {field => (
                  <div className="space-y-2">
                    <Label>{t('events.form.startDateTimeLabel')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !startDate && 'text-muted-foreground'
                          )}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? (
                            format(startDate, 'PPP p')
                          ) : (
                            <span>{t('common.pickADate')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus />
                        <div className="p-3 border-t">
                          <Label htmlFor="start-time" className="text-xs">
                            {t('common.time')}
                          </Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={startDate ? format(startDate, 'HH:mm') : '09:00'}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':')
                              const newDate = startDate || new Date()

                              newDate.setHours(
                                parseInt(hours),
                                parseInt(minutes)
                              )
                              setStartDate(new Date(newDate))
                            }}
                            className="mt-1" />
                        </div>
                      </PopoverContent>
                    </Popover>
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            t('common.validationError')}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* End Date & Time */}
              <form.Field name="end_date">
                {field => (
                  <div className="space-y-2">
                    <Label>{t('events.form.endDateTimeLabel')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !endDate && 'text-muted-foreground'
                          )}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? (
                            format(endDate, 'PPP p')
                          ) : (
                            <span>{t('common.pickADate')}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus />
                        <div className="p-3 border-t">
                          <Label htmlFor="end-time" className="text-xs">
                            {t('common.time')}
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
                                parseInt(minutes)
                              )
                              setEndDate(new Date(newDate))
                            }}
                            className="mt-1" />
                        </div>
                      </PopoverContent>
                    </Popover>
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {typeof field.state.meta.errors[0] === 'string'
                          ? field.state.meta.errors[0]
                          : field.state.meta.errors[0]?.message ||
                            t('common.validationError')}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {/* Calendar */}
            <form.Field name="calendar">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor="calendar">
                    {t('events.form.calendarLabel')}
                  </Label>
                  <Input
                    id="calendar"
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t('events.form.calendarPlaceholder')} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-red-500">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Event Notes */}
            <form.Field name="event_notes">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor="event_notes">
                    {t('events.form.eventNotesLabel')}
                  </Label>
                  <Textarea
                    id="event_notes"
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t('events.form.eventNotesPlaceholder')}
                    rows={2} />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-red-500">
                      {typeof field.state.meta.errors[0] === 'string'
                        ? field.state.meta.errors[0]
                        : field.state.meta.errors[0]?.message ||
                          t('common.validationError')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>
        </AwesomeDialogBody>

        <AwesomeDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create'
              ? t('events.form.createButton')
              : t('events.form.updateButton')}
          </Button>
        </AwesomeDialogFooter>
      </form>
    </AwesomeDialog>
  )
}
