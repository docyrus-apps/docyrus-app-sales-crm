import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const activityCollection = useBaseActivityCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ActivityFormData) => activityCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('activities.createdSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('activities.createError'))
  })
}

export function useUpdateActivity() {
  const { t } = useTranslation()
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
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('activities.updatedSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('activities.updateError'))
  })
}

export function useDeleteActivity() {
  const { t } = useTranslation()
  const activityCollection = useBaseActivityCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (activityId: string) => activityCollection.delete(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('activities.deletedSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('activities.deleteError'))
  })
}
