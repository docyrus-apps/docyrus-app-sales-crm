import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { EventFormData } from '@/schemas/event-schema'
import { baseEventCollection } from '@/collections/base-event.collection'

export function useEvents(filters?: any) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () =>
      baseEventCollection.list({
        columns: [
          'id',
          'subject',
          'description',
          'start_date',
          'end_date',
          'calendar',
          'event_notes',
          'created_on',
        ],
        filters,
      }),
  })
}

export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', eventId],
    queryFn: () => {
      if (!eventId) throw new Error('Event ID is required')
      return baseEventCollection.get({
        recordId: eventId,
        columns: [
          'id',
          'subject',
          'description',
          'start_date',
          'end_date',
          'calendar',
          'event_notes',
          'created_on',
        ],
      })
    },
    enabled: !!eventId,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EventFormData) => baseEventCollection.create({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event created successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to create event'),
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: EventFormData }) =>
      baseEventCollection.update({ recordId: eventId, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event updated successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to update event'),
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) => baseEventCollection.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event deleted successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to delete event'),
  })
}
