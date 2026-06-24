import type { ICollectionListParams } from '@/collections/types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { type ActivityFormData } from '@/schemas/activity-schema'

import { useBaseActivityCollection } from '@/collections'

export function useActivities(params?: ICollectionListParams) {
  const activityCollection = useBaseActivityCollection()

  return useQuery({
    queryKey: ['activities', params],
    queryFn: async () => activityCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'subject',
          'description',
          'start_date',
          'end_date',
          'record_owner(id,email,firstname,lastname)',
          'created_on'
        ],
        orderBy: params?.orderBy || 'created_on DESC'
      })
  })
}

export function useActivity(activityId: string | undefined) {
  const activityCollection = useBaseActivityCollection()

  return useQuery({
    queryKey: ['activities', activityId],
    queryFn: async () => {
      if (!activityId) throw new Error('Activity ID is required')

      return activityCollection.get(activityId, {
        columns: [
          'id',
          'subject',
          'description',
          'start_date',
          'end_date',
          'record_owner(id,email,firstname,lastname)',
          'created_on'
        ]
      })
    },
    enabled: !!activityId
  })
}

export function useCreateActivity() {
  const activityCollection = useBaseActivityCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ActivityFormData) => activityCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('Activity created successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to create activity')
  })
}

export function useUpdateActivity() {
  const activityCollection = useBaseActivityCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      activityId,
      data
    }: {
      activityId: string;
      data: ActivityFormData;
    }) => activityCollection.update(activityId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({
        queryKey: ['activities', variables.activityId]
      })
      toast.success('Activity updated successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to update activity')
  })
}

export function useDeleteActivity() {
  const activityCollection = useBaseActivityCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (activityId: string) => activityCollection.delete(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('Activity deleted successfully')
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to delete activity')
  })
}
