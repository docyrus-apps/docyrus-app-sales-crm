import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ICollectionListParams } from '@/collections/types'
import { baseTaskCollection } from '@/collections'

export function useTasks(params?: ICollectionListParams) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const response = await baseTaskCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'subject',
          'description',
          'start_date',
          'end_date',
          'status',
          'organization(id,name)',
          'record_owner',
          'section',
          'project',
          'parent',
          'created_on',
        ],
      })
      return response
    },
  })
}

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required')
      return await baseTaskCollection.get(taskId, {
        columns: [
          'id',
          'subject',
          'description',
          'start_date',
          'end_date',
          'status',
          'organization(id,name)',
          'record_owner',
          'section',
          'project',
          'parent',
          'followers',
          'created_on',
          'modified_on',
        ],
      })
    },
    enabled: !!taskId,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await baseTaskCollection.create({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to create task'),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) =>
      await baseTaskCollection.update(taskId, { data }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] })
      toast.success('Task updated successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to update task'),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) =>
      await baseTaskCollection.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to delete task'),
  })
}
