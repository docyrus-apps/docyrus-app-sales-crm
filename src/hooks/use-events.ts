import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { EventFormData } from '@/schemas/event-schema'
import { useBaseEventCollection } from '@/collections/base-event.collection'

export function useEvents(filters?: any) {
  const eventCollection = useBaseEventCollection()

  return useQuery({
    queryKey: ['events', filters],
    queryFn: () =>
      eventCollection.list({
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
  const eventCollection = useBaseEventCollection()

  return useQuery({
    queryKey: ['events', eventId],
    queryFn: () => {
      if (!eventId) throw new Error('Event ID is required')
      return eventCollection.get(eventId, {
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
  const eventCollection = useBaseEventCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EventFormData) => eventCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event created successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to create event'),
  })
}

export function useUpdateEvent() {
  const eventCollection = useBaseEventCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: EventFormData }) =>
      eventCollection.update(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event updated successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to update event'),
  })
}

export function useDeleteEvent() {
  const eventCollection = useBaseEventCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) => eventCollection.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Event deleted successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to delete event'),
  })
}
