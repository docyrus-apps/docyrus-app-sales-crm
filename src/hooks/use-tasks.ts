import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ICollectionListParams } from '@/collections/types'
import { useBaseTaskCollection } from '@/collections'

export function useTasks(params?: ICollectionListParams) {
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
          'organization(id,name)',
          'record_owner(id,email,firstname,lastname)',
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
          'organization(id,name)',
          'record_owner',
          'section',
          'project',
          'parent',
          'followers',
          'created_on',
        ],
      })
    },
    enabled: !!taskId,
  })
}

export function useCreateTask() {
  const taskCollection = useBaseTaskCollection()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await taskCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to create task'),
  })
}

export function useUpdateTask() {
  const taskCollection = useBaseTaskCollection()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) =>
      await taskCollection.update(taskId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] })
      toast.success('Task updated successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to update task'),
  })
}

export function useDeleteTask() {
  const taskCollection = useBaseTaskCollection()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => await taskCollection.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to delete task'),
  })
}
