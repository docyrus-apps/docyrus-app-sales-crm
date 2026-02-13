import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ICollectionListParams } from '@/collections/types'
import { userTodoCollection } from '@/collections/user-todo.collection'

export function useNotes(params?: ICollectionListParams) {
  return useQuery({
    queryKey: ['notes', params],
    queryFn: async () => {
      const response = await userTodoCollection.list({
        ...params,
        columns: params?.columns || [
          'id',
          'title',
          'done',
          'due_date',
          'priority',
          'sort_order',
          'type',
          'archived',
          'created_by',
        ],
        filters: {
          rules: [{ field: 'archived', operator: 'eq', value: false }],
          combinator: 'and',
        },
        orderBy: [{ field: 'sort_order', direction: 'asc' }],
      })
      return response
    },
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => await userTodoCollection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Note created successfully')
    },
    onError: (error: any) =>
      toast.error(error?.message || 'Failed to create note'),
  })
}
