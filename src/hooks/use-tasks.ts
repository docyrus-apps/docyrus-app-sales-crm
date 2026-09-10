import { useTranslation } from 'react-i18next'
import type { ICollectionListParams } from '@/collections/types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useBaseTaskCollection } from '@/collections'

interface UseTasksOptions {
  enabled?: boolean;
}

export function useTasks(
  params?: ICollectionListParams,
  options: UseTasksOptions = {}
) {
  const taskCollection = useBaseTaskCollection()

  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const response = await taskCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'subject',
          'description',
          'start_date',
          'end_date',
          'status',
          'priority',
          'organization(id,name)',
          'deal',
          'record_owner(id,email,firstname,lastname)',
          'section',
          'project',
          'parent',
          'created_on'
        ],
        orderBy: params?.orderBy || 'created_on DESC'
      })

      return response
    },
    enabled: options.enabled
  })
}

export function useTask(taskId: string | undefined) {
  const taskCollection = useBaseTaskCollection()

  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required')

      return await taskCollection.get(taskId, {
        columns: [
          'id',
          'subject',
          'description',
          'start_date',
          'end_date',
          'status',
          'priority',
          'organization(id,name)',
          'deal',
          'record_owner',
          'section',
          'project',
          'parent',
          'followers',
          'created_on'
        ]
      })
    },
    enabled: !!taskId
  })
}

export function useCreateTask() {
  const { t } = useTranslation()
  const taskCollection = useBaseTaskCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => await taskCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('tasks.createdSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('tasks.createError'))
  })
}

export function useUpdateTask() {
  const { t } = useTranslation()
  const taskCollection = useBaseTaskCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => await taskCollection.update(taskId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('tasks.updatedSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('tasks.updateError'))
  })
}

export function useDeleteTask() {
  const { t } = useTranslation()
  const taskCollection = useBaseTaskCollection()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => await taskCollection.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      /*
       * The per-record audit timeline lives under its own query key, so a
       * successful write left the Activity tab showing stale history until a
       * full page reload. Refresh it alongside the entity caches.
       */
      queryClient.invalidateQueries({ queryKey: ['record-activities'] })
      toast.success(t('tasks.deletedSuccess'))
    },
    onError: (error: any) => toast.error(error?.message || t('tasks.deleteError'))
  })
}
